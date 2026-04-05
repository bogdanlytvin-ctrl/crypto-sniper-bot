"""
Background monitoring loop.
- DexScreener: scans every SCAN_INTERVAL seconds, scores pairs, sends scored signals.
- Pump.fun:    polls every PUMPFUN_INTERVAL seconds, sends new token alerts.
"""

import asyncio
import logging
import os
from collections import deque
from typing import Callable, Awaitable

import aiohttp

import database as db
from scanner.dexscreener import search_new_pairs, extract_pair_data, CHAINS
from scanner.rugcheck     import check_solana_token
from scanner.honeypot     import check_bnb_token
from scanner.signals      import (
    score_token, format_signal_message,
    SIGNAL_STRONG_BUY, SIGNAL_BUY, SIGNAL_WATCH,
)
from scanner.pumpfun import get_new_tokens, is_new as pumpfun_is_new, format_token_message

logger = logging.getLogger(__name__)

SCAN_INTERVAL    = int(os.getenv("SCAN_INTERVAL_SEC",   "60"))
PUMPFUN_INTERVAL = int(os.getenv("PUMPFUN_INTERVAL_SEC","30"))
MIN_SIGNAL_SCORE = int(os.getenv("MIN_SIGNAL_SCORE",    "55"))

# Callback: (telegram_id, message_text, pair_data_or_None) -> None
SendCallback = Callable[[int, str, dict | None], Awaitable[None]]

_SEEN_MAX = 5_000
_seen_pairs:     deque[str] = deque(maxlen=_SEEN_MAX)
_seen_pairs_set: set[str]   = set()


async def run_monitor(send_fn: SendCallback) -> None:
    logger.info("Monitor started. DexScreener: %ds, pump.fun: %ds",
                SCAN_INTERVAL, PUMPFUN_INTERVAL)
    async with aiohttp.ClientSession() as session:
        # Run both loops concurrently
        await asyncio.gather(
            _dex_loop(session, send_fn),
            _pump_loop(session, send_fn),
        )


# ── DexScreener loop ───────────────────────────────────────────────────────────

async def _dex_loop(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    while True:
        try:
            await _dex_cycle(session, send_fn)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("DexScreener cycle error: %s", e, exc_info=True)
        await asyncio.sleep(SCAN_INTERVAL)


async def _dex_cycle(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    new_signals: list[tuple[int, str, int, dict, dict]] = []

    for chain in CHAINS.values():
        pairs = await search_new_pairs(session, chain)
        logger.info("DexScreener %s: %d pairs", chain, len(pairs))

        for pair in pairs:
            pair_addr = pair.get("pairAddress", "")
            if not pair_addr or pair_addr in _seen_pairs_set:
                continue

            if len(_seen_pairs) == _SEEN_MAX:
                evicted = _seen_pairs[0]
                _seen_pairs_set.discard(evicted)
            _seen_pairs.append(pair_addr)
            _seen_pairs_set.add(pair_addr)

            pair_data = extract_pair_data(pair)

            if chain == "solana":
                safety = await check_solana_token(session, pair_data["token_address"])
            else:
                safety = await check_bnb_token(session, pair_data["token_address"])

            result = score_token(pair_data, safety)

            if result["blocked"]:
                continue
            if result["score"] < MIN_SIGNAL_SCORE:
                continue

            signal_data = {
                **pair_data,
                "score":              result["score"],
                "signal_type":        result["signal_type"],
                "liq_locked":         bool(safety.get("lp_locked") or safety.get("liq_locked")),
                "contract_renounced": safety.get("contract_renounced", False),
                "honeypot":           safety.get("is_honeypot", False),
                "rugcheck_score":     safety.get("rugcheck_score"),
                "top10_holders_pct":  safety.get("top10_holders_pct"),
                "holders":            safety.get("holders"),
            }
            signal_id = db.save_signal(signal_data)
            if signal_id is None:
                continue

            new_signals.append((signal_id, result["signal_type"], result["score"],
                                 pair_data, result))
            logger.info("Signal %s | %s | %s | score=%d",
                        chain.upper(), result["signal_type"],
                        pair_data.get("token_symbol", "?"), result["score"])

    if new_signals:
        await _dispatch_dex_signals(new_signals, send_fn)


async def _dispatch_dex_signals(
    signals: list[tuple[int, str, int, dict, dict]],
    send_fn: SendCallback,
) -> None:
    users = db.get_all_active_users_with_tier()

    for signal_id, signal_type, score, pair_data, signal_result in signals:
        for user in users:
            tier        = user["tier"]
            user_id     = user["id"]
            telegram_id = user["telegram_id"]
            user_lang   = user["lang"] or "ua"

            if tier == "free"  and score < 85: continue
            if tier == "basic" and score < 70: continue
            if tier == "free"  and db.count_signals_sent_today(user_id) >= 3:  continue
            if tier == "basic" and db.count_signals_sent_today(user_id) >= 20: continue
            if db.was_signal_sent(user_id, signal_id): continue

            message = format_signal_message(pair_data, signal_result, lang=user_lang)
            try:
                await send_fn(telegram_id, message, pair_data)
                db.mark_signal_sent(user_id, signal_id)
            except Exception as e:
                logger.warning("Failed to send dex signal to %d: %s", telegram_id, e)


# ── Pump.fun loop ──────────────────────────────────────────────────────────────

async def _pump_loop(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    # Skip first batch (pre-existing tokens on start)
    tokens = await get_new_tokens(session, limit=50)
    for tok in tokens:
        pumpfun_is_new(tok.get("mint", ""))
    logger.info("pump.fun: seeded %d existing tokens", len(tokens))

    while True:
        await asyncio.sleep(PUMPFUN_INTERVAL)
        try:
            await _pump_cycle(session, send_fn)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("pump.fun cycle error: %s", e, exc_info=True)


async def _pump_cycle(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    tokens = await get_new_tokens(session, limit=20)
    new_tokens = [t for t in tokens if pumpfun_is_new(t.get("mint", "")) and t.get("mint")]

    if not new_tokens:
        return

    logger.info("pump.fun: %d new tokens", len(new_tokens))

    # Get users who want pump.fun alerts
    users = db.get_all_active_users_with_tier()
    pump_users = [u for u in users if u["auto_mode"] or u.get("notify_all_tokens")]

    if not pump_users:
        return

    for token in new_tokens:
        mint    = token.get("mint", "")
        # Build pair_data-like dict for buy buttons
        pair_data = {
            "chain":         "solana",
            "token_address": mint,
            "token_name":    token.get("name", "?"),
            "token_symbol":  token.get("symbol", "?"),
        }
        for user in pump_users:
            lang = user["lang"] or "ua"
            msg  = format_token_message(token, lang)
            try:
                await send_fn(user["telegram_id"], msg, pair_data)
            except Exception as e:
                logger.warning("pump.fun send error %d: %s", user["telegram_id"], e)
