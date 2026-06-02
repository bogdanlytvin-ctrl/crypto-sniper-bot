"""Orchestrates one supplier: discover product URLs, then scrape each page."""
from __future__ import annotations

import asyncio
from urllib.parse import urlencode, urlparse, urlunparse, parse_qs

from .fetcher import Fetcher
from .models import Product, SupplierConfig
from .parser import extract_links, parse_product


def _with_page(url: str, param: str, page: int) -> str:
    parts = urlparse(url)
    query = parse_qs(parts.query)
    query[param] = [str(page)]
    flat = urlencode({k: v[0] for k, v in query.items()})
    return urlunparse(parts._replace(query=flat))


async def _discover(fetcher: Fetcher, cfg: SupplierConfig) -> list[str]:
    """Walk listing pages (via pagination) and collect product links."""
    # Direct mode: blank product_link_selector means start_urls ARE the
    # product pages (paste individual item links instead of a catalogue).
    if not cfg.product_link_selector.strip():
        urls = list(dict.fromkeys(cfg.start_urls))
        return urls[: cfg.max_products] if cfg.max_products else urls

    found: list[str] = []
    pg = cfg.pagination
    for start in cfg.start_urls:
        if pg.type == "query":
            empty_streak = 0
            for page in range(pg.start, pg.start + pg.max_pages):
                html = await fetcher.get(_with_page(start, pg.param, page))
                if html is None:
                    # fetch failure (timeout / 5xx) — could be transient, not
                    # the end of the catalogue; tolerate a couple in a row.
                    empty_streak += 1
                    if empty_streak >= 3:
                        break
                    continue
                links = extract_links(html, cfg.product_link_selector, cfg.base_url)
                if not links:
                    empty_streak += 1
                    if empty_streak >= 2:
                        break  # two genuinely empty pages → end of catalogue
                    continue
                empty_streak = 0
                found.extend(links)
        elif pg.type == "next_link":
            url: str | None = start
            for _ in range(pg.max_pages):
                html = await fetcher.get(url) if url else None
                if not html:
                    break
                found.extend(extract_links(html, cfg.product_link_selector, cfg.base_url))
                nxt = extract_links(html, pg.next_link_selector or "", cfg.base_url)
                url = nxt[0] if nxt else None
                if not url:
                    break
        else:  # no pagination
            html = await fetcher.get(start)
            if html:
                found.extend(extract_links(html, cfg.product_link_selector, cfg.base_url))

    urls = list(dict.fromkeys(found))
    if cfg.max_products:
        urls = urls[: cfg.max_products]
    return urls


async def _scrape_one(fetcher: Fetcher, url: str, cfg: SupplierConfig) -> Product | None:
    html = await fetcher.get(url)
    return parse_product(html, url, cfg) if html else None


async def crawl(cfg: SupplierConfig) -> list[Product]:
    async with Fetcher(
        render_js=cfg.render_js, concurrency=cfg.concurrency, delay=cfg.delay_seconds
    ) as fetcher:
        product_urls = await _discover(fetcher, cfg)
        print(f"[{cfg.name}] found {len(product_urls)} product URLs")

        tasks = [_scrape_one(fetcher, u, cfg) for u in product_urls]
        results: list[Product] = []
        for i, coro in enumerate(asyncio.as_completed(tasks), 1):
            product = await coro
            if product:
                results.append(product)
            if i % 50 == 0:
                print(f"[{cfg.name}] scraped {i}/{len(product_urls)}")
        print(f"[{cfg.name}] extracted {len(results)} products")
        return results
