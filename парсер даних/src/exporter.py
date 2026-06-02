"""Write products to XLSX + CSV and (optionally) download their images."""
from __future__ import annotations

import asyncio
import csv
import re
from pathlib import Path

import httpx
from openpyxl import Workbook

from .fetcher import USER_AGENT
from .models import Product

_BASE_COLS = [
    "supplier", "name", "product_id", "barcodes",
    "image_urls", "image_files", "source_url",
]


def _param_columns(products: list[Product]) -> list[str]:
    keys: list[str] = []
    for p in products:
        for k in p.params:
            if k not in keys:
                keys.append(k)
    return keys


def _safe(text: str) -> str:
    return re.sub(r"[^\w.-]+", "_", text)[:60] or "img"


def _ext_from_content(data: bytes, content_type: str, url: str) -> str:
    """Pick a file extension from the real bytes, not the URL."""
    if data[:3] == b"\xff\xd8\xff":
        return "jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "gif"
    if data[:2] == b"BM":
        return "bmp"
    if data.lstrip()[:5].lower() == b"<?xml" or b"<svg" in data[:200].lower():
        return "svg"
    ct = (content_type or "").split(";")[0].strip().lower()
    ct_map = {
        "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
        "image/webp": "webp", "image/gif": "gif", "image/bmp": "bmp",
        "image/svg+xml": "svg",
    }
    if ct in ct_map:
        return ct_map[ct]
    url_ext = url.rsplit(".", 1)[-1].split("?")[0].lower()
    if url_ext == "jpeg":
        return "jpg"
    if url_ext in {"jpg", "png", "webp", "gif", "bmp", "svg"}:
        return url_ext
    return "jpg"


async def download_images(products: list[Product], out_dir: Path) -> None:
    """Save each product's images to images/<supplier>/<id>_<n>.<ext>."""
    async with httpx.AsyncClient(
        headers={"User-Agent": USER_AGENT}, follow_redirects=True, timeout=30
    ) as client:
        sem = asyncio.Semaphore(8)

        async def fetch(p: Product, idx: int, url: str) -> None:
            folder = out_dir / _safe(p.supplier)
            folder.mkdir(parents=True, exist_ok=True)
            async with sem:
                try:
                    r = await client.get(url)
                    r.raise_for_status()
                    ext = _ext_from_content(
                        r.content, r.headers.get("content-type", ""), url
                    )
                    dest = folder / f"{_safe(p.product_id or p.name)}_{idx}.{ext}"
                    dest.write_bytes(r.content)
                    p.image_files.append(str(dest))
                except Exception as exc:  # noqa: BLE001
                    print(f"  [img] failed {url}: {exc}")

        tasks = [
            fetch(p, i, url)
            for p in products
            for i, url in enumerate(p.image_urls)
        ]
        await asyncio.gather(*tasks)


def write_xlsx(products: list[Product], path: Path) -> None:
    cols = _BASE_COLS + _param_columns(products)
    param_keys = _param_columns(products)
    wb = Workbook()
    ws = wb.active
    ws.title = "products"
    ws.append(cols)
    for p in products:
        row = p.export_row(param_keys)
        ws.append([row.get(c, "") for c in cols])
    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)


def write_csv(products: list[Product], path: Path) -> None:
    cols = _BASE_COLS + _param_columns(products)
    param_keys = _param_columns(products)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.DictWriter(fh, fieldnames=cols)
        writer.writeheader()
        for p in products:
            writer.writerow(p.export_row(param_keys))


def export(products: list[Product], out_dir: Path, stem: str) -> None:
    write_xlsx(products, out_dir / f"{stem}.xlsx")
    write_csv(products, out_dir / f"{stem}.csv")
    print(f"[export] {len(products)} rows → {out_dir / stem}.xlsx / .csv")
