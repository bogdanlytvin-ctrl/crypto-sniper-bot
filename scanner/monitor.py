"""
Background monitoring loop.
Sources (priority order):
  - Raydium:        all Solana AMM pools every 45s  [PRIMARY, no key, official Raydium API]
  - PancakeSwap:    new BSC pools every 90s         [PRIMARY, no key, subgraph GraphQL]
  - GeckoTerminal:  Solana trending every 60s       [SECONDARY, rate-limited]
  - DexScreener:    boosted tokens every 90s        [TERTIARY]
  - Pump.fun:       polls every 30s                 [circuit-breaker if blocked]
"""

import asyncio
import logging
import os
import time as _time
from typing import Callable, Awaitable

import aiohttp

import database as db
from scanner.dexscreener import search_new_pairs, extract_pair_data, CHAINS
from scanner.geckoterminal import get_new_pools, get_trending_pools
from scanner.rugcheck  import check_solana_token
from scanner.honeypot  import check_bnb_token
from scanner.signals   import score_token, format_signal_message
from scanner.pumpfun     import get_new_tokens, is_new as pumpfun_is_new, format_token_message
from scanner.pancakeswap import get_new_pairs as pcs_new_pairs
from scanner.price_cache import (
    get_cached_safety, set_cached_safety, evict_expired as _cache_evict,
)

logger = logging.getLogger(__name__)

SCAN_INTERVAL        = int(os.getenv("SCAN_INTERVAL_SEC",        "90"))   # DexScreener
GECKO_INTERVAL       = int(os.getenv("GECKO_INTERVAL_SEC",       "60"))   # GeckoTerminal Solana
GECKO_INTERVAL_BSC   = int(os.getenv("GECKO_INTERVAL_BSC_SEC",  "180"))  # GeckoTerminal BSC
PANCAKE_INTERVAL     = int(os.getenv("PANCAKE_INTERVAL_SEC",     "90"))   # PancakeSwap BSC (PRIMARY)
PUMPFUN_INTERVAL     = int(os.getenv("PUMPFUN_INTERVAL_SEC",     "30"))
MIN_SIGNAL_SCORE     = int(os.getenv("MIN_SIGNAL_SCORE",         "35"))

# pump.fun circuit breaker — suspend after this many consecutive all-endpoint failures
_PUMP_MAX_FAILS   = 5
_PUMP_SUSPEND_SEC = 3_600  # 1 hour

# seen-pairs TTL: allow re-evaluation after 4 hours (DexScreener promoted tokens
# stay live for 24h, so without TTL DexScreener becomes useless after cycle 1)
_SEEN_TTL = 4 * 3600  # 4 hours

SendCallback = Callable[[int, str, dict | None, dict | None], Awaitable[None]]

_seen_pairs: dict[str, float] = {}  # addr → timestamp first seen


def _mark_seen(addr: str) -> bool:
    """Returns True if NEW or TTL expired (re-evaluate). Updates seen timestamp."""
    if not addr:
        return False
    now = _time.time()
    last = _seen_pairs.get(addr)
    if last is not None and now - last < _SEEN_TTL:
        return False  # seen recently
    _seen_pairs[addr] = now
    return True


def _seed_seen(addr: str) -> None:
    """Mark address as seen right now (startup seeding — no dispatch)."""
    if addr:
        _seen_pairs[addr] = _time.time()


def _cleanup_seen() -> None:
    """Remove expired entries to prevent unbounded memory growth."""
    cutoff = _time.time() - _SEEN_TTL
    expired = [k for k, v in _seen_pairs.items() if v < cutoff]
    for k in expired:
        del _seen_pairs[k]


async def run_monitor(send_fn: SendCallback) -> None:
    logger.info(
        "Monitor started. PancakeSwap: %ds | Gecko SOL: %ds | Gecko BSC: %ds | DexScreener: %ds | pump.fun: %ds",
        PANCAKE_INTERVAL, GECKO_INTERVAL, GECKO_INTERVAL_BSC, SCAN_INTERVAL, PUMPFUN_INTERVAL,
    )
    async with aiohttp.ClientSession() as session:
        # ── Startup seeding: mark all current tokens as seen WITHOUT dispatching ──
        logger.info("Startup: seeding existing pairs (no dispatch)...")
        await _seed_all(session)
        logger.info("Startup seeding complete.")

        tasks = [
            _pancake_loop(session, send_fn),       # PRIMARY BSC: PancakeSwap subgraph
            _gecko_loop_solana(session, send_fn),  # PRIMARY SOL: GeckoTerminal new+trending
            _gecko_loop_bsc(session, send_fn),     # SECONDARY BSC: GeckoTerminal trending
            _dex_loop(session, send_fn),           # DexScreener boosted (both chains)
            _pump_loop(session, send_fn),          # Pump.fun (circuit-breaker)
        ]
        await asyncio.gather(*tasks)


async def _seed_all(session: aiohttp.ClientSession) -> None:
    """Seed all current tokens as seen at startup to prevent dispatch flood on restart."""
    # DexScreener
    for chain in CHAINS.values():
        try:
            pairs = await search_new_pairs(session, chain)
            for p in pairs:
                _seed_seen(p.get("pairAddress", ""))
            logger.info("Seed DexScreener %s: %d pairs", chain, len(pairs))
        except Exception as e:
            logger.warning("Seed DexScreener error (%s): %s", chain, e)
        await asyncio.sleep(1)

    # GeckoTerminal
    for chain in CHAINS.values():
        try:
            pools = await get_new_pools(session, chain)
            for p in pools:
                _seed_seen(p.get("pair_address", ""))
            await asyncio.sleep(2)
            trending = await get_trending_pools(session, chain)
            for p in trending:
                _seed_seen(p.get("pair_address", ""))
            logger.info("Seed GeckoTerminal %s: %d+%d", chain, len(pools), len(trending))
        except Exception as e:
            logger.warning("Seed GeckoTerminal error (%s): %s", chain, e)
        await asyncio.sleep(2)

    # Note: Raydium and PancakeSwap are NOT seeded on startup.
    # Their DB UNIQUE(chain, token_address, signal_date) constraint prevents
    # duplicate signals, and _mark_seen TTL handles repeated processing.


# ── helpers ───────────────────────────────────────────────────────────────────

async def _process_pair(
    session: aiohttp.ClientSession,
    pair_data: dict,
    new_signals: list,
) -> None:
    """Score one pair, append to new_signals if good enough."""
    chain   = pair_data.get("chain", "")
    address = pair_data.get("token_address", "")
    symbol  = pair_data.get("token_symbol", "?")

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
        logger.info(
            "BLOCKED  %s [%s] — %s",
            symbol, chain.upper(), result["block_reason"],
        )
        return

    liq = pair_data.get("liquidity_usd", 0) or 0
    vol = pair_data.get("volume_1h", 0) or 0
    chg = pair_data.get("price_change_1h", 0) or 0
    logger.info(
        "SCORED   %s [%s] score=%d/%d  liq=$%s  vol1h=$%s  chg=%+.1f%%  src=%s",
        symbol, chain.upper(), result["score"], MIN_SIGNAL_SCORE,
        f"{liq:,.0f}", f"{vol:,.0f}", chg,
        pair_data.get("dex", "?"),
    )

    if result["score"] < MIN_SIGNAL_SCORE:
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
    """Min score to dispatch a signal to a user of this tier.
    Reads from bot_settings so admin can tune live without redeploying."""
    defaults = {"free": 35, "basic": 35, "pro": 35}
    fallback = defaults.get(tier, 35)
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


# ── PancakeSwap Subgraph loop (PRIMARY BSC) ───────────────────────────────────

async def _pancake_loop(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    logger.info("PancakeSwap subgraph scanner active (new BSC pools every %ds)", PANCAKE_INTERVAL)
    await asyncio.sleep(10)  # offset from startup
    while True:
        try:
            await _pancake_cycle(session, send_fn)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("PancakeSwap cycle error: %s", e, exc_info=True)
        await asyncio.sleep(PANCAKE_INTERVAL)


async def _pancake_cycle(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    new_signals: list = []

    pairs = await pcs_new_pairs(session)
    new_pairs = [p for p in pairs if _mark_seen(p.get("pair_address", ""))]
    logger.info("PancakeSwap new_pairs: %d (%d new)", len(pairs), len(new_pairs))

    for i in range(0, len(new_pairs), 10):
        batch = new_pairs[i:i+10]
        await asyncio.gather(*[_process_pair(session, p, new_signals) for p in batch])
        if i + 10 < len(new_pairs):
            await asyncio.sleep(1)

    if new_signals:
        await _dispatch_signals(new_signals, send_fn)


# ── DexScreener loop (TERTIARY) ───────────────────────────────────────────────

async def _dex_loop(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    await asyncio.sleep(20)  # offset from startup
    while True:
        try:
            await _dex_cycle(session, send_fn)
            _cache_evict()    # prune stale price/safety cache entries
            _cleanup_seen()   # prune expired seen-pairs entries
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


# ── GeckoTerminal loops ────────────────────────────────────────────────────────

async def _gecko_loop_solana(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    # Wait 90s before first SOL cycle — seeding already hit gecko SOL, avoid 429
    await asyncio.sleep(90)
    while True:
        try:
            await _gecko_cycle(session, send_fn, "solana")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("GeckoTerminal SOL cycle error: %s", e, exc_info=True)
        await asyncio.sleep(GECKO_INTERVAL)


async def _gecko_loop_bsc(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
    # Wait 120s — seeding already hit gecko BSC, longer offset avoids 429
    await asyncio.sleep(120)
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

    await asyncio.sleep(4)  # gap between new_pools and trending

    trending = await get_trending_pools(session, chain)
    new_trending = [p for p in trending if _mark_seen(p.get("pair_address", ""))]
    logger.info("GeckoTerminal %s trending: %d (%d new)", chain, len(trending), len(new_trending))
    for pair_data in new_trending:
        await _process_pair(session, pair_data, new_signals)

    if new_signals:
        await _dispatch_signals(new_signals, send_fn)


# ── Pump.fun loop ─────────────────────────────────────────────────────────────

async def _pump_loop(session: aiohttp.ClientSession, send_fn: SendCallback) -> None:
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
                consecutive_empty += 1
                if consecutive_empty >= _PUMP_MAX_FAILS:
                    logger.warning(
                        "pump.fun: %d consecutive failures — suspending for %ds.",
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
        return False
    new_tokens = [t for t in tokens if pumpfun_is_new(t.get("mint", "")) and t.get("mint")]
    if not new_tokens:
        return None

    logger.info("pump.fun: %d new tokens", len(new_tokens))
    users = db.get_all_active_users_with_tier()
    pump_users = [u for u in users if u.get("auto_mode") or u.get("notify_all_tokens")]
    if not pump_users:
        return None

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
