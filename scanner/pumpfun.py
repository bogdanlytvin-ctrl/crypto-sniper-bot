"""
Pump.fun new token scanner.
Polls the pump.fun API for newest token launches every PUMPFUN_INTERVAL seconds.
"""

import asyncio
import logging
import os
from collections import deque

import aiohttp

logger = logging.getLogger(__name__)

PUMPFUN_API   = "https://frontend-api.pump.fun/coins"
PUMPFUN_INTERVAL = int(os.getenv("PUMPFUN_INTERVAL_SEC", "30"))

_SEEN_MAX = 2_000
_seen_mints: deque[str] = deque(maxlen=_SEEN_MAX)
_seen_set:   set[str]   = set()


async def get_new_tokens(session: aiohttp.ClientSession, limit: int = 30) -> list[dict]:
    """Fetch latest pump.fun token launches."""
    params = {
        "offset": 0,
        "limit":  limit,
        "sort":   "created_timestamp",
        "order":  "DESC",
        "includeNsfw": "true",
    }
    try:
        async with session.get(PUMPFUN_API, params=params,
                               timeout=aiohttp.ClientTimeout(total=10)) as r:
            if r.status == 200:
                data = await r.json()
                return data if isinstance(data, list) else []
            logger.warning("pump.fun API → %s", r.status)
    except asyncio.TimeoutError:
        logger.warning("pump.fun timeout")
    except Exception as e:
        logger.error("pump.fun error: %s", e)
    return []


def is_new(mint: str) -> bool:
    """Returns True if this token hasn't been seen yet."""
    if mint in _seen_set:
        return False
    if len(_seen_mints) == _SEEN_MAX:
        evicted = _seen_mints[0]
        _seen_set.discard(evicted)
    _seen_mints.append(mint)
    _seen_set.add(mint)
    return True


def format_token_message(token: dict, lang: str = "ua") -> str:
    """Format pump.fun new token as a Telegram message."""
    name        = token.get("name",        "?")
    symbol      = token.get("symbol",      "?")
    mint        = token.get("mint",        "")
    description = (token.get("description") or "")[:120]
    mcap        = token.get("usd_market_cap") or token.get("market_cap") or 0
    complete    = token.get("complete", False)
    king        = token.get("king_of_the_hill_timestamp")
    creator     = token.get("creator", "")
    reply_count = token.get("reply_count", 0)
    image_uri   = token.get("image_uri", "")

    status = "🎓 Raydium" if complete else ("👑 King of Hill" if king else "🟣 Bonding Curve")

    lines = [
        f"🆕 <b>НОВИЙ ТОКЕН</b> | pump.fun\n",
        f"🪙 <b>{name}</b> (${symbol})",
        f"📊 Статус: {status}",
        f"💰 Market Cap: ${mcap:,.0f}",
    ]
    if description:
        lines.append(f"📝 {description}")
    if reply_count > 0:
        lines.append(f"💬 Replies: {reply_count}")
    if mint:
        lines.append(f"\n<code>{mint}</code>")
        lines.append(f'🔗 <a href="https://pump.fun/{mint}">pump.fun</a>')
    lines.append("\n⚠️ <i>Ранній токен — DYOR, високий ризик!</i>")

    return "\n".join(lines)
