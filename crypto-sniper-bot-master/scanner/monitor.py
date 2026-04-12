"""
Background monitoring loop.
Sources:
  - DexScreener:    scans every 60s (latest token profiles + boosted)
  - GeckoTerminal:  scans every 45s (new pools + trending) — main new-token source
  - Pump.fun:       polls every 30s (new Solana launches)
"""

import asyncio
import logging
import os
from collections import deque
from typing import Callable, Awaitable

import aiohttp

import database as db
from scanner.dexscreener import search_new_pairs, extract_pair_data, CHAINS
from scanner.geckoterminal import get_new_pools, get_trending_pools
from scanner.rugcheck  import check_solana_token
from scanner.honeypot  import check_bnb_token
from scanner.signals   import (
    score_token, format_signal_message,
    SIGNAL_STRONG_BUY, SIGNAL_BUY, SIGNAL_WATCH,
)
from scanner.pumpfun import get_new_tokens, is_new as pumpfun_is_new, format_token_message
from scanner.price_cache import (
    get_cached_safety, set_cached_safety, evict_expired as _cache_evict,
)

logger = logging.getLogger(__name__)

SCAN_INTERVAL        = int(os.getenv("SCAN_INTERVAL_SEC",        "60"))
GECKO_INTERVAL       = int(os.getenv("GECKO_INTERVAL_SEC",       "45"))
GECKO_INTERVAL_BSC   = int(os.getenv("GECKO_INTERVAL_BSC_SEC",  "120"))  # BSC needs slower rate
PUMPFUN_INTERVAL     = int(os.getenv("PUMPFUN_INTERVAL_SEC",     "30"))
MIN_SIGNAL_SCORE     = int(os.getenv("MIN_SIGNAL_SCORE",          "40"))

# pump.fun circuit breaker — suspend after this many consecutive all-endpoint failures
_PUMP_MAX_FAILS   = 5
_PUMP_SUSPEND_SEC = 3_600  # 1 hour

# 4-arg callback: (telegram_id, message, pair_data, signal_meta)
# signal_meta carries pre-loaded user context so send callback needs 0 extra DB queries
SendCallback = Callable[[int, str, dict | None, dict | None], Awaitable[None]]

_SEEN_MAX = 10_000
_seen_pairs:     deque[str] = deque(maxlen=_SEEN_MAX)
_seen_pairs_set: set[str]   = set()


def _mark_seen(addr: str) -> bool:
    """Returns True if NEW (not seen before), marks as seen."""
    if not addr or addr in _seen_pairs_set:
        return False
    if len(_seen_pairs) == _SEEN_MAX:
        evicted = _seen_pairs[0]
        _seen_pairs_set.discard(evicted)
    _seen_pairs.append(addr)
    _seen_pairs_set.add(addr)
    return True


async def run_monitor(send_fn: SendCallback) -> None:
    logger.info(
        "Monitor started. DexScreener: %ds, Gecko SOL: %ds, Gecko BSC: %ds, pump.fun: %ds",
        SCAN_INTERVAL, GECKO_INTERVAL, GECKO_INTERVAL_BSC, PUMPFUN_INTERVAL,
    )
    async with aiohttp.ClientSession() as session:
        await asyncio.gather(
            _dex_loop(session, send_fn),
            _gecko_loop_solana(session, send_fn),
            _gecko_loop_bsc(session, send_fn),
            _pump_loop(session, send_fn),
        )


# ── helpers ───────────────────────────────────────────────────────────────────

async def _process_pair(
    session: aiohttp.ClientSession,
    pair_data: dict,
    new_signals: list,
) -> None:
    """Score one pair, append to new_signals if good enough."""
    chain   = pair_data.get("chain", "")
    address = pair_data.get("token_address", "")

    # Use cached safety result if fresh (< 5 min) to avoid redundant API calls
    safety = get_cached_safety(chain, address)
    if safety is None:
        if chain == "solana":
            safety = await check_solana_token(session, address)
        else:
            safety = await check_bnb_token(session, address)
        set_cached_safety(chain, address, safety)

    result = score_token(pair_data, safety)

    if result["blocked"]:
        logger.info("Blocked %s: %s", pair_data.get("token_symbol"), result["block_reason"])
        return
    if result["score"] < MIN_SIGNAL_SCORE:
        logger.info(
            "Score too low %s: %d (min=%d)",
            pair_data.get("token_symbol"), result["score"], MIN_SIGNAL_SCORE,
        )
        return

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
        "pair_created_at":    pair_data.get("pair_created_at"),
        "pair_url":           pair_data.get("pair_url"),
    }
    signal_id = db.save_signal(signal_data)
    if signal_id is None:
        return  # duplicate for today

    new_signals.append((signal_id, result["signal_type"], result["score"], pair_data, result))
    logger.info(
        "Signal %s | %s | %s | score=%d",
        chain.upper(), result["signal_type"],
        pair_data.get("token_symbol", "?"), result["score"],
    )


def _daily_limit(tier: str) -> int:
    """Returns daily signal limit for tier. 0 = unlimited."""
    key = f"{tier}_daily_signals"
    val = db.get_bot_setting(key, "0")
    try:
        return int(val)
    except ValueError:
        return 0


def _tier_min_score(tier: str) -> int:
    """
    Min score to dispatch a signal to a user of this tier.
    Reads from bot_settings so admin can tune live without redeploying.
    """
    defaults = {"free": 40, "basic": 40, "pro": 40}
    fallback = defaults.get(tier, 40)
    key = f"{tier}_min_score"
    try:
        val = db.get_bot_setting(key)
        return int(val) if val is not None else fallback
    except (ValueError, TypeError):
        return fallback


async def _dispatch_signals(
    signals: list[tuple[int, str, int, dict, dict]],
    send_fn: SendCallback,
) -> None:
    if db.get_bot_setting("maintenance_mode", "0") == "1":
        logger.info("Maintenance mode — signals not dispatched.")
        return

    users = db.get_all_active_users_with_tier()
    logger.info("Dispatching %d signal(s) to %d active user(s)", len(signals), len(users))

    for signal_id, signal_type, score, pair_data, signal_result in signals:
        symbol     = pair_data.get("token_symbol", "?")
        sent_count = 0

        for user in users:
            user_id     = user["id"]
            telegram_id = user["telegram_id"]
            user_lang   = user["lang"] or "ua"
            tier        = user["tier"] or "free"
            min_score   = _tier_min_score(tier)

            if score < min_score:
                logger.debug(
                    "Signal %d (%s score=%d) skipped uid=%d tier=%s (need %d)",
                    signal_id, symbol, score, user_id, tier, min_score,
                )
                continue

            if db.was_signal_sent(user_id, signal_id):
                continue

            limit = _daily_limit(tier)
            if limit > 0 and db.count_signals_sent_today(user_id) >= limit:
                logger.debug(
                    "Signal %d skipped uid=%d: daily limit %d reached",
                    signal_id, user_id, limit,
                )
                continue

            message = format_signal_message(pair_data, signal_result, lang=user_lang)

            # Embed user context so send_fn needs zero extra DB queries per user
            signal_meta = {
                "signal_id":   signal_id,
                "score":       score,
                "signal_type": signal_type,
                "price_usd":   pair_data.get("price_usd", 0),
                "user_id":     user_id,
                "lang":        user_lang,
                "user_tier":   tier,
                "auto_mode":   user.get("auto_mode", 0),
                "user_settings": {
                    "auto_mode":        user.get("auto_mode", 0),
                    "auto_min_score":   user.get("auto_min_score", 80),
                    "auto_max_buy_sol": user.get("auto_max_buy_sol", 0.1),
                    "auto_max_buy_bnb": user.get("auto_max_buy_bnb", 0.01),
                    "auto_stop_loss":   user.get("auto_stop_loss", 20),
                    "auto_take_profit": user.get("auto_take_profit", 0),
                },
            }

            try:
                await send_fn(telegram_id, message, pair_data, signal_meta)
                db.mark_signal_sent(user_id, signal_id)
                sent_count += 1
                await asyncio.sleep(0.04)  # ~25 msg/sec Telegram limit
            except Exception as e:
                logger.warning("Failed to send signal to %d: %s", telegram_id, e)

        if sent_count > 0:
            logger.info(
                "Signal %d (%s score=%d) sent to %d user(s)",
                signal_id, symbol, score, sent_count,
            )
        else:
            logger.warning(
                "Signal %d (%s score=%d) — sent to 0 users "
                "(check tier score thresholds and user count)",
                signal_id, symbol, score,
            )


# ── DexScreener loop ──────────────────────────────────────────────────────────

async def _dex_loop(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    while True:
        try:
            await _dex_cycle(session, send_fn)
            _cache_evict()  # prune stale price/safety cache entries each cycle
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("DexScreener cycle error: %s", e, exc_info=True)
        await asyncio.sleep(SCAN_INTERVAL)


async def _dex_cycle(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    new_signals: list = []
    for chain in CHAINS.values():
        pairs = await search_new_pairs(session, chain)
        new_pairs = [p for p in pairs if _mark_seen(p.get("pairAddress", ""))]
        logger.info("DexScreener %s: %d pairs (%d new)", chain, len(pairs), len(new_pairs))
        for pair in new_pairs:
            pair_data = extract_pair_data(pair)
            await _process_pair(session, pair_data, new_signals)

    if new_signals:
        await _dispatch_signals(new_signals, send_fn)


# ── GeckoTerminal loops (solana and BSC run at different intervals) ────────────

async def _gecko_loop_solana(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    await asyncio.sleep(15)  # offset from DexScreener start
    while True:
        try:
            await _gecko_cycle(session, send_fn, "solana")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("GeckoTerminal SOL cycle error: %s", e, exc_info=True)
        await asyncio.sleep(GECKO_INTERVAL)


async def _gecko_loop_bsc(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    # BSC gets a longer interval: free tier 429s are common on bsc endpoint
    await asyncio.sleep(45)  # offset further to avoid burst at startup
    while True:
        try:
            await _gecko_cycle(session, send_fn, "bsc")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("GeckoTerminal BSC cycle error: %s", e, exc_info=True)
        await asyncio.sleep(GECKO_INTERVAL_BSC)


async def _gecko_cycle(
    session: aiohttp.ClientSession,
    send_fn: SendCallback,
    chain: str,
) -> None:
    new_signals: list = []

    new_pool_pairs = await get_new_pools(session, chain)
    new_pairs = [p for p in new_pool_pairs if _mark_seen(p.get("pair_address", ""))]
    logger.info("GeckoTerminal %s new_pools: %d (%d new)", chain, len(new_pool_pairs), len(new_pairs))
    for pair_data in new_pairs:
        await _process_pair(session, pair_data, new_signals)

    await asyncio.sleep(4)  # gap between new_pools and trending to stay within rate limit

    trending = await get_trending_pools(session, chain)
    new_trending = [p for p in trending if _mark_seen(p.get("pair_address", ""))]
    logger.info("GeckoTerminal %s trending: %d (%d new)", chain, len(trending), len(new_trending))
    for pair_data in new_trending:
        await _process_pair(session, pair_data, new_signals)

    if new_signals:
        await _dispatch_signals(new_signals, send_fn)


# ── Pump.fun loop ─────────────────────────────────────────────────────────────

async def _pump_loop(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    # Seed seen set on startup (skip initial failure — not critical)
    tokens = await get_new_tokens(session, limit=50)
    for tok in tokens:
        pumpfun_is_new(tok.get("mint", ""))
    if tokens:
        logger.info("pump.fun: seeded %d existing tokens", len(tokens))
    else:
        logger.warning("pump.fun: seed failed (endpoint may be blocked)")

    consecutive_empty = 0  # circuit breaker counter

    while True:
        await asyncio.sleep(PUMPFUN_INTERVAL)
        try:
            result = await _pump_cycle(session, send_fn)
            if result is False:
                # get_new_tokens returned empty — all endpoints failed
                consecutive_empty += 1
                if consecutive_empty >= _PUMP_MAX_FAILS:
                    logger.warning(
                        "pump.fun: %d consecutive failures — suspending for %ds. "
                        "Set PUMPFUN_INTERVAL_SEC env var to re-enable after endpoint recovers.",
                        consecutive_empty, _PUMP_SUSPEND_SEC,
                    )
                    await asyncio.sleep(_PUMP_SUSPEND_SEC)
                    consecutive_empty = 0
            else:
                consecutive_empty = 0
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("pump.fun cycle error: %s", e, exc_info=True)


async def _pump_cycle(session: aiohttp.ClientSession, send_fn: SendCallback) -> bool | None:
    """Returns False if all pump.fun endpoints failed (for circuit breaker)."""
    tokens = await get_new_tokens(session, limit=20)
    if not tokens:
        return False  # all endpoints returned empty — signal circuit breaker
    new_tokens = [t for t in tokens if pumpfun_is_new(t.get("mint", "")) and t.get("mint")]
    if not new_tokens:
        return None  # got data, just no new tokens — normal

    logger.info("pump.fun: %d new tokens", len(new_tokens))
    users = db.get_all_active_users_with_tier()
    pump_users = [u for u in users if u.get("auto_mode") or u.get("notify_all_tokens")]
    if not pump_users:
        return

    for token in new_tokens:
        mint = token.get("mint", "")
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
                await send_fn(user["telegram_id"], msg, pair_data, None)
            except Exception as e:
                logger.warning("pump.fun send error %d: %s", user["telegram_id"], e)
