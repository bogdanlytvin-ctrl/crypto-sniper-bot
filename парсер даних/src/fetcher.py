"""HTTP/JS fetching with retries, a politeness delay and bounded concurrency.

Static pages go through httpx. When a supplier sets ``render_js: true`` we
render with Playwright (imported lazily so the dependency stays optional).
"""
from __future__ import annotations

import asyncio
import random

import httpx

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)
RETRIES = 3
TIMEOUT = 25.0


class Fetcher:
    def __init__(self, *, render_js: bool, concurrency: int, delay: float):
        self.render_js = render_js
        self.delay = delay
        self._sem = asyncio.Semaphore(max(1, concurrency))
        self._client: httpx.AsyncClient | None = None
        self._browser = None
        self._pw = None

    async def __aenter__(self) -> "Fetcher":
        self._client = httpx.AsyncClient(
            headers={"User-Agent": USER_AGENT, "Accept-Language": "uk,ru,en"},
            follow_redirects=True,
            timeout=TIMEOUT,
        )
        if self.render_js:
            from playwright.async_api import async_playwright

            self._pw = await async_playwright().start()
            self._browser = await self._pw.chromium.launch(headless=True)
        return self

    async def __aexit__(self, *exc) -> None:
        if self._client:
            await self._client.aclose()
        if self._browser:
            await self._browser.close()
        if self._pw:
            await self._pw.stop()

    async def get(self, url: str) -> str | None:
        """Return page HTML, or None after exhausting retries."""
        for attempt in range(1, RETRIES + 1):
            try:
                # Hold a concurrency slot only for the actual fetch …
                async with self._sem:
                    html = (
                        await self._render(url)
                        if self.render_js
                        else await self._http(url)
                    )
            except Exception as exc:  # noqa: BLE001 - retry on any transport error
                if attempt == RETRIES:
                    print(f"  [fetch] giving up on {url}: {exc}")
                    return None
                await asyncio.sleep(2 ** attempt)  # backoff, slot released
                continue
            # … then space out requests without blocking other workers.
            await asyncio.sleep(self.delay + random.uniform(0, 0.4))
            return html
        return None

    async def _http(self, url: str) -> str:
        assert self._client is not None
        resp = await self._client.get(url)
        resp.raise_for_status()
        return resp.text

    async def _render(self, url: str) -> str:
        assert self._browser is not None
        page = await self._browser.new_page(user_agent=USER_AGENT)
        try:
            await page.goto(url, wait_until="networkidle", timeout=TIMEOUT * 1000)
            return await page.content()
        finally:
            await page.close()
