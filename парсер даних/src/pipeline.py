"""Post-extraction cleanup: barcode normalisation and de-duplication."""
from __future__ import annotations

import re

from .models import Product

_DIGITS = re.compile(r"\d+")


def clean_barcodes(raw: list[str]) -> list[str]:
    """Keep only digit-strings of a valid GTIN length (EAN-8/12/13/14)."""
    cleaned: list[str] = []
    for value in raw:
        digits = "".join(_DIGITS.findall(value))
        if len(digits) in (8, 12, 13, 14):
            cleaned.append(digits)
    return list(dict.fromkeys(cleaned))


def normalize(products: list[Product]) -> list[Product]:
    for p in products:
        p.barcodes = clean_barcodes(p.barcodes)
        p.name = re.sub(r"\s+", " ", p.name).strip()
    return products


def deduplicate(products: list[Product]) -> list[Product]:
    """One record per (supplier, product_id); fall back to source_url."""
    seen: dict[tuple[str, str], Product] = {}
    for p in products:
        key = (p.supplier, p.product_id or p.source_url)
        if key not in seen:
            seen[key] = p
    return list(seen.values())
