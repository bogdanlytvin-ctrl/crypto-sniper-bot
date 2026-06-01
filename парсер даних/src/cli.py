"""Command-line entry point.

Examples:
    python main.py config/example_supplier.yaml
    python main.py config/*.yaml --download-images --limit 20
"""
from __future__ import annotations

import argparse
import asyncio
import glob
from pathlib import Path

import yaml

from .crawler import crawl
from .exporter import download_images, export
from .models import Product, SupplierConfig
from .pipeline import deduplicate, normalize

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "output"
IMAGES_DIR = ROOT / "images"


def load_config(path: str) -> SupplierConfig:
    data = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    return SupplierConfig(**data)


async def run(configs: list[SupplierConfig], force_images: bool, limit: int | None) -> None:
    everything: list[Product] = []
    for cfg in configs:
        if limit:
            cfg.max_products = limit
        products = await crawl(cfg)
        products = deduplicate(normalize(products))

        if cfg.download_images or force_images:
            print(f"[{cfg.name}] downloading images…")
            await download_images(products, IMAGES_DIR)

        export(products, OUTPUT_DIR, cfg.name)
        everything.extend(products)

    if len(configs) > 1:
        export(deduplicate(everything), OUTPUT_DIR, "all_products")


def main() -> None:
    ap = argparse.ArgumentParser(description="Supplier product-catalogue parser → XLSX/CSV")
    ap.add_argument("configs", nargs="+", help="YAML config file(s) or glob(s)")
    ap.add_argument("--download-images", action="store_true", help="force image download")
    ap.add_argument("--limit", type=int, default=None, help="max products per supplier (test run)")
    args = ap.parse_args()

    paths: list[str] = []
    for pattern in args.configs:
        paths.extend(glob.glob(pattern) or [pattern])
    configs = [load_config(p) for p in paths]
    if not configs:
        ap.error("no config files matched")

    asyncio.run(run(configs, args.download_images, args.limit))


if __name__ == "__main__":
    main()
