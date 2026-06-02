"""Pydantic models: the product record and the per-supplier scrape config."""
from __future__ import annotations

from pydantic import BaseModel, Field


class FieldRule(BaseModel):
    """How to extract one field from a product page."""

    selector: str | list[str]         # CSS selector, or several tried in order (fallback)
    attr: str | None = None            # read this attribute instead of text (e.g. "src")
    regex: str | None = None           # keep only the first regex group of the value
    multiple: bool = False             # collect every match, not just the first

    @property
    def selectors(self) -> list[str]:
        return self.selector if isinstance(self.selector, list) else [self.selector]


class Pagination(BaseModel):
    type: str = "none"                 # "query" | "next_link" | "none"
    param: str = "page"                # for type=query: ?<param>=N
    start: int = 1
    max_pages: int = 200
    next_link_selector: str | None = None  # for type=next_link


class SupplierConfig(BaseModel):
    name: str
    base_url: str
    start_urls: list[str]
    product_link_selector: str
    pagination: Pagination = Field(default_factory=Pagination)
    fields: dict[str, FieldRule] = Field(default_factory=dict)
    params: dict[str, FieldRule] = Field(default_factory=dict)

    render_js: bool = False            # use Playwright instead of httpx
    download_images: bool = False      # save image files locally
    delay_seconds: float = 1.0         # politeness delay between requests
    concurrency: int = 5
    max_products: int | None = None    # cap (handy for a test run)


class Product(BaseModel):
    supplier: str
    name: str
    product_id: str | None = None
    barcodes: list[str] = Field(default_factory=list)
    image_urls: list[str] = Field(default_factory=list)
    image_files: list[str] = Field(default_factory=list)
    params: dict[str, str] = Field(default_factory=dict)
    source_url: str

    def export_row(self, param_keys: list[str]) -> dict[str, str]:
        """Flatten into a single spreadsheet row with stable columns."""
        row = {
            "supplier": self.supplier,
            "name": self.name,
            "product_id": self.product_id or "",
            "barcodes": " | ".join(self.barcodes),
            "image_urls": " | ".join(self.image_urls),
            "image_files": " | ".join(self.image_files),
            "source_url": self.source_url,
        }
        for key in param_keys:
            row[key] = self.params.get(key, "")
        return row
