"""Turn a product page's HTML into a Product, driven entirely by the config.

Every supplier-specific detail (which selector holds the name, the barcode,
the images, …) lives in the YAML config, so this module never needs editing
when a new supplier is added.
"""
from __future__ import annotations

import re
from urllib.parse import urljoin

from selectolax.parser import HTMLParser

from .models import FieldRule, Product, SupplierConfig


def _extract(tree: HTMLParser, rule: FieldRule, base_url: str) -> list[str]:
    """Apply one FieldRule and return every cleaned value it matched."""
    out: list[str] = []
    for node in tree.css(rule.selector):
        raw = node.attributes.get(rule.attr, "") if rule.attr else node.text()
        value = (raw or "").strip()
        if rule.attr in {"src", "href", "data-src"} and value:
            value = urljoin(base_url, value)
        if rule.regex and value:
            m = re.search(rule.regex, value)
            value = m.group(1) if m else ""
        if value:
            out.append(value)
        if not rule.multiple and out:
            break
    # de-dup while preserving order
    return list(dict.fromkeys(out))


def parse_product(html: str, url: str, cfg: SupplierConfig) -> Product | None:
    tree = HTMLParser(html)

    def first(field: str) -> str | None:
        rule = cfg.fields.get(field)
        if not rule:
            return None
        vals = _extract(tree, rule, cfg.base_url)
        return vals[0] if vals else None

    name = first("name")
    if not name:
        return None  # no name → not a real product page, skip

    barcodes = (
        _extract(tree, cfg.fields["barcode"], cfg.base_url)
        if "barcode" in cfg.fields
        else []
    )
    images = (
        _extract(tree, cfg.fields["images"], cfg.base_url)
        if "images" in cfg.fields
        else []
    )
    params: dict[str, str] = {}
    for key, rule in cfg.params.items():
        vals = _extract(tree, rule, cfg.base_url)
        if vals:
            params[key] = " | ".join(vals) if rule.multiple else vals[0]

    return Product(
        supplier=cfg.name,
        name=name,
        product_id=first("product_id"),
        barcodes=barcodes,
        image_urls=images,
        params=params,
        source_url=url,
    )


def extract_links(html: str, selector: str, base_url: str) -> list[str]:
    """Collect absolute hrefs for product (or next-page) links on a listing."""
    tree = HTMLParser(html)
    links = []
    for node in tree.css(selector):
        href = node.attributes.get("href")
        if href:
            links.append(urljoin(base_url, href.strip()))
    return list(dict.fromkeys(links))
