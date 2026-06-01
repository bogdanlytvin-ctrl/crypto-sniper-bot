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


async def download_images(products: list[Product], out_dir: Path) -> None:
    """Save each product's images to images/<supplier>/<id>_<n>.<ext>."""
    async with httpx.AsyncClient(
        headers={"User-Agent": USER_AGENT}, follow_redirects=True, timeout=30
    ) as client:
        sem = asyncio.Semaphore(8)

        async def fetch(p: Product, idx: int, url: str) -> None:
            ext = (url.rsplit(".", 1)[-1].split("?")[0] or "jpg")[:4]
            folder = out_dir / _safe(p.supplier)
            folder.mkdir(parents=True, exist_ok=True)
            dest = folder / f"{_safe(p.product_id or p.name)}_{idx}.{ext}"
            async with sem:
                try:
                    r = await client.get(url)
                    r.raise_for_status()
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
