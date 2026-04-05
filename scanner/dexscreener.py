"""
DexScreener API client.
Docs: https://docs.dexscreener.com/api/reference
Free tier: 300 req/min, no API key needed.
"""

import asyncio
import logging
import time

import aiohttp

logger = logging.getLogger(__name__)

BASE = "https://api.dexscreener.com"

CHAINS = {
    "solana": "solana",
    "bsc":    "bsc",
}

MIN_LIQUIDITY_USD = 3_000
MIN_VOLUME_1H     = 500
MAX_TOKEN_AGE_H   = 48
MIN_TOKEN_AGE_MIN = 3


async def _get(session: aiohttp.ClientSession, url: str,
               params: dict | None = None) -> dict | list | None:
    try:
        async with session.get(url, params=params,
                               timeout=aiohttp.ClientTimeout(total=10)) as r:
            if r.status == 200:
                return await r.json()
            logger.warning("DexScreener %s → %s", url, r.status)
    except asyncio.TimeoutError:
        logger.warning("DexScreener timeout: %s", url)
    except Exception as e:
        logger.error("DexScreener error: %s", e)
    return None


async def get_latest_token_profiles(session: aiohttp.ClientSession) -> list[dict]:
    data = await _get(session, f"{BASE}/token-profiles/latest/v1")
    if not data:
        return []
    return data if isinstance(data, list) else []


async def get_latest_boosted_tokens(session: aiohttp.ClientSession) -> list[dict]:
    data = await _get(session, f"{BASE}/token-boosts/latest/v1")
    if not data:
        return []
    return data if isinstance(data, list) else []


async def get_pairs_by_token(session: aiohttp.ClientSession,
                              chain: str, token_address: str) -> list[dict]:
    """Get trading pairs for a token. Uses /latest/dex/tokens/ endpoint."""
    data = await _get(session, f"{BASE}/latest/dex/tokens/{token_address}")
    if not data or "pairs" not in data:
        return []
    pairs = data["pairs"] or []
    # Filter by chain since the endpoint returns all chains
    return [p for p in pairs if p.get("chainId") == chain]


async def search_new_pairs(session: aiohttp.ClientSession, chain: str) -> list[dict]:
    all_pairs: list[dict] = []

    # Strategy 1: Latest token profiles
    profiles = await get_latest_token_profiles(session)
    token_addresses = [
        p.get("tokenAddress", "")
        for p in profiles
        if p.get("chainId") == chain and p.get("tokenAddress")
    ]
    for addr in token_addresses[:20]:
        pairs = await get_pairs_by_token(session, chain, addr)
        all_pairs.extend(pairs)
        if len(all_pairs) >= 100:
            break

    # Strategy 2: Boosted tokens
    boosted = await get_latest_boosted_tokens(session)
    boosted_addresses = [
        b.get("tokenAddress", "")
        for b in boosted
        if b.get("chainId") == chain and b.get("tokenAddress")
    ]
    for addr in boosted_addresses[:10]:
        pairs = await get_pairs_by_token(session, chain, addr)
        all_pairs.extend(pairs)

    # Deduplicate
    seen: set[str] = set()
    unique: list[dict] = []
    for p in all_pairs:
        pa = p.get("pairAddress", "")
        if pa and pa not in seen:
            seen.add(pa)
            unique.append(p)

    return _prefilter(unique, chain)


def _prefilter(pairs: list[dict], chain: str) -> list[dict]:
    now_ms = int(time.time() * 1000)
    result = []
    for pair in pairs:
        if pair.get("chainId") != chain:
            continue
        liquidity = (pair.get("liquidity") or {}).get("usd", 0) or 0
        if liquidity < MIN_LIQUIDITY_USD:
            continue
        volume = (pair.get("volume") or {}).get("h1", 0) or 0
        if volume < MIN_VOLUME_1H:
            continue
        pair_created = pair.get("pairCreatedAt")
        if pair_created:
            age_min = (now_ms - pair_created) / 60_000
            if age_min < MIN_TOKEN_AGE_MIN:
                continue
            if age_min > MAX_TOKEN_AGE_H * 60:
                continue
        result.append(pair)
    return result


def extract_pair_data(pair: dict) -> dict:
    base_token = pair.get("baseToken") or {}
    liquidity  = pair.get("liquidity") or {}
    volume     = pair.get("volume") or {}
    price_chg  = pair.get("priceChange") or {}
    return {
        "chain":            pair.get("chainId", ""),
        "pair_address":     pair.get("pairAddress", ""),
        "dex":              pair.get("dexId", ""),
        "token_address":    base_token.get("address", ""),
        "token_name":       base_token.get("name", ""),
        "token_symbol":     base_token.get("symbol", ""),
        "price_usd":        float(pair.get("priceUsd") or 0),
        "liquidity_usd":    float(liquidity.get("usd") or 0),
        "volume_1h":        float(volume.get("h1") or 0),
        "volume_6h":        float(volume.get("h6") or 0),
        "volume_24h":       float(volume.get("h24") or 0),
        "price_change_1h":  float(price_chg.get("h1") or 0),
        "price_change_6h":  float(price_chg.get("h6") or 0),
        "price_change_24h": float(price_chg.get("h24") or 0),
        "market_cap":       float(pair.get("marketCap") or 0),
        "pair_created_at":  pair.get("pairCreatedAt"),
        "pair_url":         pair.get("url", ""),
        "txns_1h_buys":     ((pair.get("txns") or {}).get("h1") or {}).get("buys", 0),
        "txns_1h_sells":    ((pair.get("txns") or {}).get("h1") or {}).get("sells", 0),
    }
