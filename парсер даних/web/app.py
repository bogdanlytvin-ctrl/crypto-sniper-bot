"""FastAPI web wrapper around the supplier-catalogue parser.

One page: paste or upload supplier YAML config(s), pick options, run.
The parse runs as a background job; the page polls status and shows the
live log, then offers XLSX / CSV / images-zip downloads.

Run locally:   uvicorn web.app:app --reload
In Docker:     uvicorn web.app:app --host 0.0.0.0 --port 7860
"""
from __future__ import annotations

import asyncio
import contextlib
import io
import ipaddress
import os
import re
import socket
import uuid
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlparse

import yaml
from fastapi import FastAPI, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from pydantic import ValidationError

from src.crawler import crawl
from src.exporter import download_images, write_csv, write_xlsx
from src.models import Product, SupplierConfig
from src.pipeline import deduplicate, normalize

app = FastAPI(title="Парсер даних")

JOBS_DIR = Path("/tmp/parser_jobs")
JOBS_DIR.mkdir(parents=True, exist_ok=True)

# Only one crawl runs at a time: keeps captured stdout logs un-interleaved
# and avoids hammering a single free host's CPU/network.
_run_lock = asyncio.Lock()
_jobs: dict[str, "Job"] = {}

# On a public deployment (PUBLIC_DEPLOY=1, set in the Dockerfile) we lock the
# app down: block SSRF to internal hosts and cap crawl size so anonymous users
# can't abuse the free host. Locally these limits are off (full CLI power).
PUBLIC = os.environ.get("PUBLIC_DEPLOY") == "1"
MAX_PAGES = 30
MAX_CONCURRENCY = 6
MAX_PRODUCTS = 300


def _host_is_blocked(host: str) -> bool:
    """True if a hostname resolves to a private/loopback/reserved address."""
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return True  # unresolvable → refuse
    for info in infos:
        addr = ipaddress.ip_address(info[4][0])
        if (
            addr.is_private or addr.is_loopback or addr.is_link_local
            or addr.is_reserved or addr.is_multicast or addr.is_unspecified
        ):
            return True
    return False


def _harden_for_public(configs: list[SupplierConfig]) -> None:
    """SSRF guard + size caps applied only when PUBLIC. Raises ValueError."""
    if not PUBLIC:
        return
    for cfg in configs:
        cfg.render_js = False  # Playwright isn't in the hosted image
        cfg.pagination.max_pages = min(cfg.pagination.max_pages, MAX_PAGES)
        cfg.concurrency = min(cfg.concurrency, MAX_CONCURRENCY)
        cfg.max_products = min(cfg.max_products or MAX_PRODUCTS, MAX_PRODUCTS)
        for url in [cfg.base_url, *cfg.start_urls]:
            parsed = urlparse(url)
            if parsed.scheme not in ("http", "https"):
                raise ValueError(f"Дозволені лише http/https адреси: {url}")
            if not parsed.hostname or _host_is_blocked(parsed.hostname):
                raise ValueError(f"Заблокований або недоступний хост: {url}")


@dataclass
class Job:
    id: str
    state: str = "queued"            # queued | running | done | error
    log: list[str] = field(default_factory=list)
    error: str | None = None
    files: list[str] = field(default_factory=list)  # downloadable file names
    products: int = 0


class _LogWriter(io.TextIOBase):
    """Funnels the parser's print() output into a job's log list."""

    def __init__(self, job: Job) -> None:
        self._job = job
        self._buf = ""

    def write(self, s: str) -> int:
        self._buf += s
        while "\n" in self._buf:
            line, self._buf = self._buf.split("\n", 1)
            if line:
                self._job.log.append(line)
        return len(s)


def _safe(text: str) -> str:
    return re.sub(r"[^\w.-]+", "_", text).strip("_")[:60] or "supplier"


def _parse_configs(raw_texts: list[str]) -> list[SupplierConfig]:
    configs: list[SupplierConfig] = []
    for raw in raw_texts:
        data = yaml.safe_load(raw)
        if not isinstance(data, dict):
            raise ValueError("YAML має описувати один конфіг постачальника (об'єкт).")
        configs.append(SupplierConfig(**data))
    return configs


async def _run_job(job: Job, configs: list[SupplierConfig], force_images: bool, limit: int | None) -> None:
    async with _run_lock:
        job.state = "running"
        out = JOBS_DIR / job.id
        out.mkdir(parents=True, exist_ok=True)
        writer = _LogWriter(job)
        try:
            with contextlib.redirect_stdout(writer):
                everything: list[Product] = []
                for cfg in configs:
                    if limit:
                        cfg.max_products = limit
                    products = deduplicate(normalize(await crawl(cfg)))
                    if cfg.download_images or force_images:
                        print(f"[{cfg.name}] downloading images…")
                        await download_images(products, out / "images")
                    stem = _safe(cfg.name)
                    write_xlsx(products, out / f"{stem}.xlsx")
                    write_csv(products, out / f"{stem}.csv")
                    everything.extend(products)

                if len(configs) > 1:
                    merged = deduplicate(everything)
                    write_xlsx(merged, out / "all_products.xlsx")
                    write_csv(merged, out / "all_products.csv")
                    job.products = len(merged)
                else:
                    job.products = len(everything)

            images_dir = out / "images"
            if images_dir.is_dir() and any(images_dir.rglob("*")):
                zip_path = out / "images.zip"
                with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                    for f in images_dir.rglob("*"):
                        if f.is_file():
                            zf.write(f, f.relative_to(out))

            job.files = sorted(
                f.name for f in out.iterdir() if f.is_file() and f.suffix in {".xlsx", ".csv", ".zip"}
            )
            job.state = "done"
            job.log.append(f"[done] {job.products} товарів, файлів: {len(job.files)}")
        except Exception as exc:  # noqa: BLE001
            job.state = "error"
            job.error = str(exc)
            job.log.append(f"[error] {exc}")


@app.post("/run")
async def run(
    config_text: str = Form(""),
    files: list[UploadFile] | None = None,
    download_images_opt: str = Form(""),
    limit: str = Form(""),
) -> JSONResponse:
    raw_texts: list[str] = []
    if config_text.strip():
        raw_texts.append(config_text)
    for f in files or []:
        content = (await f.read()).decode("utf-8", errors="replace")
        if content.strip():
            raw_texts.append(content)
    if not raw_texts:
        raise HTTPException(400, "Додай хоча б один YAML-конфіг (вставкою або файлом).")

    try:
        configs = _parse_configs(raw_texts)
        await asyncio.to_thread(_harden_for_public, configs)
    except (ValidationError, ValueError, yaml.YAMLError) as exc:
        raise HTTPException(400, f"Помилка в конфізі: {exc}")

    limit_val = int(limit) if limit.strip().isdigit() else None
    if PUBLIC and (limit_val is None or limit_val > MAX_PRODUCTS):
        limit_val = MAX_PRODUCTS
    force_images = download_images_opt == "on"

    job = Job(id=uuid.uuid4().hex[:12])
    _jobs[job.id] = job
    asyncio.create_task(_run_job(job, configs, force_images, limit_val))
    return JSONResponse({"job_id": job.id})


@app.get("/status/{job_id}")
async def status(job_id: str) -> JSONResponse:
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Завдання не знайдено")
    return JSONResponse(
        {
            "state": job.state,
            "log": job.log,
            "error": job.error,
            "products": job.products,
            "files": job.files,
        }
    )


@app.get("/download/{job_id}/{name}")
async def download(job_id: str, name: str) -> FileResponse:
    out = (JOBS_DIR / job_id).resolve()
    target = (out / name).resolve()
    if out not in target.parents or not target.is_file():
        raise HTTPException(404, "Файл не знайдено")
    return FileResponse(target, filename=name)


@app.get("/", response_class=HTMLResponse)
async def index() -> str:
    return _PAGE


_PAGE = """<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Парсер даних — збір каталогу товарів</title>
<style>
  :root { --bg:#0f1115; --card:#1a1d24; --line:#2a2f3a; --fg:#e6e8eb; --mut:#9aa3b2; --acc:#4f8cff; --ok:#3fb950; --err:#f85149; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.5 system-ui,Segoe UI,Roboto,sans-serif; }
  .wrap { max-width:860px; margin:0 auto; padding:32px 20px 64px; }
  h1 { font-size:26px; margin:0 0 4px; }
  p.sub { color:var(--mut); margin:0 0 28px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:20px; margin-bottom:20px; }
  label { display:block; font-weight:600; margin-bottom:8px; }
  textarea { width:100%; min-height:220px; background:#0c0e12; color:var(--fg); border:1px solid var(--line); border-radius:8px; padding:12px; font:13px/1.45 ui-monospace,Consolas,monospace; resize:vertical; }
  input[type=file], input[type=number] { color:var(--fg); }
  .row { display:flex; gap:24px; flex-wrap:wrap; align-items:center; margin-top:16px; }
  .row > div { display:flex; align-items:center; gap:8px; }
  input[type=number] { width:90px; background:#0c0e12; border:1px solid var(--line); border-radius:6px; padding:6px 8px; }
  button { background:var(--acc); color:#fff; border:0; border-radius:8px; padding:12px 22px; font-size:15px; font-weight:600; cursor:pointer; margin-top:18px; }
  button:disabled { opacity:.55; cursor:default; }
  .log { background:#0c0e12; border:1px solid var(--line); border-radius:8px; padding:12px; font:12.5px/1.5 ui-monospace,Consolas,monospace; white-space:pre-wrap; max-height:320px; overflow:auto; color:var(--mut); }
  .badge { display:inline-block; padding:2px 10px; border-radius:99px; font-size:12px; font-weight:600; }
  .b-run { background:#1f2b45; color:var(--acc); } .b-done { background:#16331f; color:var(--ok); } .b-err { background:#3a1a1a; color:var(--err); }
  .files a { display:inline-block; margin:6px 10px 0 0; padding:8px 14px; background:#16331f; color:var(--ok); border-radius:8px; text-decoration:none; font-weight:600; }
  .hint { color:var(--mut); font-size:13px; margin-top:8px; }
  a.tmpl { color:var(--acc); cursor:pointer; }
  details.help { margin-top:14px; background:#0c0e12; border:1px solid var(--line); border-radius:8px; padding:0 14px; }
  details.help summary { cursor:pointer; padding:12px 0; font-weight:600; color:var(--acc); list-style:none; }
  details.help[open] summary { border-bottom:1px solid var(--line); }
  details.help ol { margin:12px 0 16px; padding-left:20px; color:var(--mut); font-size:13.5px; line-height:1.7; }
  details.help li { margin-bottom:6px; }
  details.help code, details.help kbd { background:#1a1d24; border:1px solid var(--line); border-radius:4px; padding:1px 5px; font-size:12px; color:#cdd3dd; }
  details.help b { color:var(--fg); }
  .card h2 { font-size:17px; margin:0 0 4px; }
  .card .sub2 { color:var(--mut); font-size:13px; margin:0 0 16px; }
  .fld { margin-bottom:13px; }
  .fld > label { font-weight:600; font-size:13.5px; margin-bottom:5px; }
  .fld .tip { color:var(--mut); font-weight:400; font-size:12px; }
  .fld input[type=text], .fld textarea, .fld select { width:100%; background:#0c0e12; color:var(--fg); border:1px solid var(--line); border-radius:6px; padding:8px 10px; font:13px/1.4 ui-monospace,Consolas,monospace; }
  .fld textarea { min-height:54px; resize:vertical; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:13px; }
  .grid2 .fld { margin-bottom:0; }
  @media (max-width:560px){ .grid2 { grid-template-columns:1fr; } }
  .tpl-bar { display:flex; gap:8px; flex-wrap:wrap; align-items:center; background:#0c0e12; border:1px solid var(--line); border-radius:8px; padding:10px 12px; margin-bottom:16px; }
  .tpl-bar select, .tpl-bar input { background:#1a1d24; color:var(--fg); border:1px solid var(--line); border-radius:6px; padding:6px 8px; font-size:13px; }
  .tpl-bar button, .btn-sm { margin:0; padding:7px 12px; font-size:13px; background:#243049; }
  .btn-ghost { background:transparent; border:1px solid var(--line); color:var(--fg); }
  .row-btns { display:flex; gap:10px; flex-wrap:wrap; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Парсер даних</h1>
  <p class="sub">Збір бази товарів із сайтів постачальників → Excel (XLSX) + CSV</p>

  <div class="card">
    <h2>🔧 Конструктор конфігу</h2>
    <p class="sub2">Встав посилання на сайт і CSS-селектори полів — згенерую YAML. Збережи як шаблон, щоб не вводити вдруге.</p>

    <div class="tpl-bar">
      <span style="font-weight:600;font-size:13px">Шаблони:</span>
      <select id="tpl-list"><option value="">— збережені —</option></select>
      <button class="btn-sm" id="tpl-load">Завантажити</button>
      <button class="btn-sm btn-ghost" id="tpl-del">Видалити</button>
      <span style="flex:1"></span>
      <input type="text" id="tpl-name" placeholder="назва шаблону" style="width:150px">
      <button class="btn-sm" id="tpl-save">💾 Зберегти</button>
    </div>

    <div class="tpl-bar" style="margin-top:6px">
      <span style="font-weight:600;font-size:13px">Готові приклади:</span>
      <button class="btn-sm" id="ex-books" type="button">📚 books.toscrape</button>
      <button class="btn-sm" id="ex-off" type="button">🍫 Open Food Facts</button>
      <span class="tip" style="font-size:12px">— перевірені конфіги, підставлять YAML у поле нижче</span>
    </div>

    <div class="fld">
      <label>Назва постачальника <span class="tip">(будь-яка — піде в назву файлів)</span></label>
      <input type="text" id="b-name" placeholder="my-supplier">
    </div>
    <div class="fld">
      <label>Посилання на каталог <span class="tip">(по одному в рядку — звідки починати обхід)</span></label>
      <textarea id="b-urls" placeholder="https://site.com/catalog"></textarea>
    </div>
    <div class="fld">
      <label>Селектор посилань на товар <span class="tip">(CSS до &lt;a&gt; картки товару в каталозі)</span></label>
      <input type="text" id="b-link" placeholder="a.product-card">
    </div>

    <div class="grid2">
      <div class="fld">
        <label>Пагінація</label>
        <select id="b-pgtype">
          <option value="query">query — ?page=2</option>
          <option value="next_link">next_link — кнопка «далі»</option>
          <option value="none">none — одна сторінка</option>
        </select>
      </div>
      <div class="fld" id="b-pg-extra">
        <label id="b-pg-lbl">Параметр сторінки</label>
        <input type="text" id="b-pgval" placeholder="page">
      </div>
    </div>

    <p class="sub2" style="margin:18px 0 8px;font-weight:600;color:var(--fg)">Поля товару (CSS-селектори):</p>
    <div class="grid2">
      <div class="fld"><label>Назва товару <span class="tip">*обов'язково</span></label><input type="text" id="b-f-name" placeholder="h1.product-title"></div>
      <div class="fld"><label>Артикул / ID</label><input type="text" id="b-f-id" placeholder=".sku"></div>
      <div class="fld"><label>Regex для артикулу <span class="tip">(необов'язково)</span></label><input type="text" id="b-f-id-re" placeholder="([A-Z0-9-]+)"></div>
      <div class="fld"><label>Штрихкод(и) <span class="tip">(бере всі)</span></label><input type="text" id="b-f-bc" placeholder=".barcode"></div>
      <div class="fld"><label>Фото <span class="tip">(img у галереї)</span></label><input type="text" id="b-f-img" placeholder=".gallery img"></div>
      <div class="fld"><label>Атрибут фото</label><input type="text" id="b-f-img-attr" placeholder="src" value="src"></div>
    </div>

    <p class="sub2" style="margin:18px 0 8px;font-weight:600;color:var(--fg)">Додаткові параметри (1–2):</p>
    <div class="grid2">
      <div class="fld"><label>Параметр 1 — назва / селектор</label><div style="display:flex;gap:8px"><input type="text" id="b-p1k" placeholder="brand" style="width:40%"><input type="text" id="b-p1s" placeholder=".brand"></div></div>
      <div class="fld"><label>Параметр 2 — назва / селектор</label><div style="display:flex;gap:8px"><input type="text" id="b-p2k" placeholder="weight" style="width:40%"><input type="text" id="b-p2s" placeholder=".weight"></div></div>
    </div>

    <div class="row" style="margin-top:14px">
      <div><input type="checkbox" id="b-img-dl"><label style="margin:0">завантажувати самі фото</label></div>
      <div><label style="margin:0">пауза, c</label><input type="number" id="b-delay" min="0" step="0.5" value="1" style="width:70px"></div>
      <div><label style="margin:0">паралельність</label><input type="number" id="b-conc" min="1" max="20" value="5" style="width:70px"></div>
    </div>

    <div class="row-btns">
      <button id="b-gen">Згенерувати конфіг ↓</button>
      <button id="b-dl" class="btn-ghost" style="margin-top:18px">⬇ Завантажити .yaml</button>
    </div>
  </div>

  <div class="card">
    <label for="cfg">YAML-конфіг постачальника <a class="tmpl" id="tmpl">↳ вставити шаблон</a></label>
    <textarea id="cfg" placeholder="Натисни «вставити шаблон» вгорі — потім заміни селектори під свій сайт. Або завантаж готовий .yaml файл нижче."></textarea>
    <div class="hint">Один конфіг = один постачальник. Кілька постачальників — завантаж кілька .yaml файлів (буде ще зведений all_products).</div>

    <details class="help">
      <summary>📋 Як заповнити — рекомендації</summary>
      <ol>
        <li><b>Натисни «вставити шаблон»</b> — це готовий каркас, треба лише підмінити селектори під свій сайт.</li>
        <li><b><code>name:</code> вгорі — це назва ПОСТАЧАЛЬНИКА</b> (для назв файлів), а не товару. Назву товару бере селектор <code>fields → name</code>.</li>
        <li><b>Де взяти CSS-селектор:</b> на сайті натисни <kbd>F12</kbd> → стрілка вгорі панелі → клікни по елементу (назві, ціні…) → правою → <i>Copy → Copy selector</i>. Або візьми клас елемента (напр. <code>.product-title</code>).</li>
        <li><b><code>product_link_selector</code></b> має вказувати на посилання <code>&lt;a&gt;</code> картки товару в каталозі.</li>
        <li><b>Спочатку тест:</b> постав «ліміт товарів» = <b>20</b>, перевір результат у файлі, і лише потім прибери ліміт на повний обсяг.</li>
        <li><b>Великий обсяг (2000–3000):</b> краще ганяти локально через CLI — безкоштовний хостинг для повної бази не призначений.</li>
        <li><b>Сайт на JS</b> (товари підвантажуються після відкриття) тут не побачить вміст — напиши, додам режим рендеру (Playwright).</li>
        <li><b>Фото:</b> прямі посилання збираються завжди; галочка «завантажувати фото» — щоб отримати ще й самі файли в <code>images.zip</code>.</li>
      </ol>
    </details>
    <div class="row">
      <div><input type="file" id="files" accept=".yaml,.yml" multiple></div>
      <div><input type="checkbox" id="imgs"><label style="margin:0">завантажувати фото</label></div>
      <div><label style="margin:0">ліміт товарів</label><input type="number" id="limit" min="1" placeholder="всі"></div>
    </div>
    <button id="go">Запустити</button>
  </div>

  <div class="card" id="result" style="display:none">
    <div style="margin-bottom:10px"><span id="badge" class="badge b-run">running</span> <span id="count" class="hint"></span></div>
    <div class="files" id="files-out"></div>
    <div class="log" id="log"></div>
  </div>
</div>

<script>
const TEMPLATE = `name: my-supplier          # назва ПОСТАЧАЛЬНИКА (будь-яка) — піде в назву файлів
base_url: https://example.com      # головний домен сайту
start_urls:                        # сторінка каталогу, звідки почати обхід
  - https://example.com/catalog
product_link_selector: a.product-card   # CSS-селектор посилань на картки товарів

pagination:                        # як гортати сторінки каталогу
  type: query        # query (?page=2) | next_link (кнопка «далі») | none (одна сторінка)
  param: page
  max_pages: 50

fields:                            # ЩО брати з картки товару (CSS-селектори)
  name:        { selector: "h1.product-title" }            # назва товару
  product_id:  { selector: ".sku", regex: "([A-Z0-9-]+)" } # артикул (regex необов'язково)
  barcode:     { selector: ".barcode", multiple: true }    # штрихкод(и) — бере всі
  images:      { selector: ".gallery img", attr: src, multiple: true }  # фото

params:                            # 1-2 додаткові поля (на вибір)
  brand:  { selector: ".brand" }
  weight: { selector: ".weight" }

download_images: false   # true — ще й завантажити самі фото (у images.zip)
delay_seconds: 1.0       # пауза між запитами (щоб не навантажувати сайт)
concurrency: 5           # скільки сторінок тягнути паралельно`;

const $ = id => document.getElementById(id);
let timer = null;

document.getElementById('tmpl').onclick = () => { $('cfg').value = TEMPLATE; };

// ---------- Готові приклади (перевірені на реальних сайтах) ----------
const PRESETS = {
books: `name: 'books_toscrape'
base_url: 'https://books.toscrape.com/catalogue/'
start_urls:
  - 'https://books.toscrape.com/catalogue/page-1.html'
product_link_selector: 'article.product_pod h3 a'

pagination:
  type: 'none'

fields:
  name:        { selector: 'div.product_main h1' }
  product_id:  { selector: 'table.table.table-striped td' }
  images:      { selector: '#product_gallery img', attr: src }

params:
  price:        { selector: 'div.product_main p.price_color' }
  availability: { selector: 'p.instock.availability' }

render_js: false
download_images: false
delay_seconds: 0.3
concurrency: 4`,
off: `name: 'openfoodfacts'
base_url: 'https://world.openfoodfacts.org/'
start_urls:
  - 'https://world.openfoodfacts.org/product/3017620422003'
  - 'https://world.openfoodfacts.org/product/5449000000996'
  - 'https://world.openfoodfacts.org/product/7622210449283'
  - 'https://world.openfoodfacts.org/product/3046920029759'
  - 'https://world.openfoodfacts.org/product/8000500037560'
product_link_selector: 'link[rel="canonical"]'

pagination:
  type: 'none'

fields:
  name:        { selector: 'h1' }
  product_id:  { selector: '#barcode' }
  barcode:     { selector: '#barcode', multiple: true }
  images:      { selector: '#og_image', attr: src }

params:
  brand:    { selector: '#field_brands_value' }
  category: { selector: '#field_categories_value' }

render_js: false
download_images: false
delay_seconds: 1.0
concurrency: 2`
};
function loadPreset(k) { $('cfg').value = PRESETS[k]; $('cfg').scrollIntoView({behavior:'smooth', block:'center'}); }
$('ex-books').onclick = () => loadPreset('books');
$('ex-off').onclick = () => loadPreset('off');

// ---------- Конструктор конфігу ----------
const FIELD_IDS = ['b-name','b-urls','b-link','b-pgtype','b-pgval','b-f-name','b-f-id','b-f-id-re','b-f-bc','b-f-img','b-f-img-attr','b-p1k','b-p1s','b-p2k','b-p2s','b-img-dl','b-delay','b-conc'];

function pgLabelUpdate() {
  const t = $('b-pgtype').value, extra = $('b-pg-extra'), lbl = $('b-pg-lbl'), val = $('b-pgval');
  if (t === 'query') { extra.style.display=''; lbl.textContent='Параметр сторінки'; val.placeholder='page'; }
  else if (t === 'next_link') { extra.style.display=''; lbl.textContent='Селектор кнопки «далі»'; val.placeholder='a.next'; }
  else { extra.style.display='none'; }
}
$('b-pgtype').onchange = pgLabelUpdate; pgLabelUpdate();

function formToObj() {
  const o = {};
  for (const id of FIELD_IDS) { const el = $(id); o[id] = el.type === 'checkbox' ? el.checked : el.value; }
  return o;
}
function objToForm(o) {
  for (const id of FIELD_IDS) { if (!(id in o)) continue; const el = $(id);
    if (el.type === 'checkbox') el.checked = !!o[id]; else el.value = o[id]; }
  pgLabelUpdate();
}

// YAML single-quoted scalar (doubles any embedded single quote — no backslashes needed)
const q = s => "'" + String(s).split("'").join("''") + "'";

function buildYaml(o) {
  const urls = (o['b-urls']||'').split('\\n').map(s=>s.trim()).filter(Boolean);
  if (!o['b-name'] || !urls.length || !o['b-link'] || !o['b-f-name']) {
    alert('Заповни: назву постачальника, хоча б одне посилання, селектор посилань на товар і селектор назви товару.');
    return null;
  }
  let base; try { base = new URL(urls[0]).origin; } catch(e) { base = urls[0]; }
  const L = [];
  L.push('name: ' + o['b-name']);
  L.push('base_url: ' + base);
  L.push('start_urls:');
  urls.forEach(u => L.push('  - ' + u));
  L.push('product_link_selector: ' + q(o['b-link']));
  L.push('');
  L.push('pagination:');
  const pt = o['b-pgtype'];
  L.push('  type: ' + pt);
  if (pt === 'query') { L.push('  param: ' + (o['b-pgval']||'page')); L.push('  max_pages: 50'); }
  else if (pt === 'next_link') { L.push('  next_link_selector: ' + q(o['b-pgval']||'a.next')); L.push('  max_pages: 200'); }
  L.push('');
  L.push('fields:');
  L.push('  name: { selector: ' + q(o['b-f-name']) + ' }');
  if (o['b-f-id']) { let ln = '  product_id: { selector: ' + q(o['b-f-id']);
    if (o['b-f-id-re']) ln += ', regex: ' + q(o['b-f-id-re']); L.push(ln + ' }'); }
  if (o['b-f-bc']) L.push('  barcode: { selector: ' + q(o['b-f-bc']) + ', multiple: true }');
  if (o['b-f-img']) L.push('  images: { selector: ' + q(o['b-f-img']) + ', attr: ' + (o['b-f-img-attr']||'src') + ', multiple: true }');
  const ps = [];
  if (o['b-p1k'] && o['b-p1s']) ps.push('  ' + o['b-p1k'] + ': { selector: ' + q(o['b-p1s']) + ' }');
  if (o['b-p2k'] && o['b-p2s']) ps.push('  ' + o['b-p2k'] + ': { selector: ' + q(o['b-p2s']) + ' }');
  if (ps.length) { L.push(''); L.push('params:'); ps.forEach(x=>L.push(x)); }
  L.push('');
  L.push('download_images: ' + (o['b-img-dl'] ? 'true' : 'false'));
  L.push('delay_seconds: ' + (o['b-delay']||'1'));
  L.push('concurrency: ' + (o['b-conc']||'5'));
  return L.join('\\n');
}

$('b-gen').onclick = () => { const y = buildYaml(formToObj());
  if (y) { $('cfg').value = y; $('cfg').scrollIntoView({behavior:'smooth', block:'center'}); } };
$('b-dl').onclick = () => { const y = buildYaml(formToObj()); if (!y) return;
  const fn = (formToObj()['b-name'] || 'supplier').replace(/[^A-Za-z0-9_.-]+/g,'_');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([y], {type:'text/yaml'})); a.download = fn + '.yaml'; a.click();
  URL.revokeObjectURL(a.href); };

// ---------- Шаблони (localStorage) ----------
const TPL_KEY = 'parser_templates';
const tplAll = () => JSON.parse(localStorage.getItem(TPL_KEY) || '{}');
function tplRefresh() {
  const all = tplAll(), sel = $('tpl-list');
  sel.innerHTML = '<option value="">— збережені —</option>';
  Object.keys(all).forEach(n => { const op=document.createElement('option'); op.value=n; op.textContent=n; sel.appendChild(op); });
}
$('tpl-save').onclick = () => {
  const name = ($('tpl-name').value || $('b-name').value || '').trim();
  if (!name) { alert('Введи назву шаблону.'); return; }
  const all = tplAll(); all[name] = formToObj();
  localStorage.setItem(TPL_KEY, JSON.stringify(all));
  $('tpl-name').value=''; tplRefresh(); $('tpl-list').value = name;
};
$('tpl-load').onclick = () => { const n = $('tpl-list').value; if (!n) return;
  const all = tplAll(); if (all[n]) objToForm(all[n]); };
$('tpl-del').onclick = () => { const n = $('tpl-list').value; if (!n) return;
  if (!confirm('Видалити шаблон «'+n+'»?')) return;
  const all = tplAll(); delete all[n]; localStorage.setItem(TPL_KEY, JSON.stringify(all)); tplRefresh(); };
tplRefresh();

$('go').onclick = async () => {
  const fd = new FormData();
  fd.append('config_text', $('cfg').value);
  for (const f of $('files').files) fd.append('files', f);
  if ($('imgs').checked) fd.append('download_images_opt', 'on');
  if ($('limit').value) fd.append('limit', $('limit').value);

  $('go').disabled = true;
  $('result').style.display = 'block';
  $('files-out').innerHTML = '';
  $('log').textContent = 'Запуск…';
  setBadge('running');

  const r = await fetch('/run', { method:'POST', body: fd });
  if (!r.ok) { const e = await r.json(); $('log').textContent = e.detail || 'Помилка'; setBadge('error'); $('go').disabled = false; return; }
  const { job_id } = await r.json();
  poll(job_id);
};

function setBadge(state) {
  const b = $('badge');
  b.textContent = state;
  b.className = 'badge ' + (state==='done' ? 'b-done' : state==='error' ? 'b-err' : 'b-run');
}

function poll(id) {
  clearInterval(timer);
  timer = setInterval(async () => {
    const r = await fetch('/status/' + id);
    if (!r.ok) return;
    const s = await r.json();
    $('log').textContent = s.log.join('\\n');
    $('log').scrollTop = $('log').scrollHeight;
    setBadge(s.state);
    if (s.state === 'done' || s.state === 'error') {
      clearInterval(timer);
      $('go').disabled = false;
      if (s.state === 'done') {
        $('count').textContent = s.products + ' товарів';
        $('files-out').innerHTML = s.files.map(f =>
          `<a href="/download/${id}/${encodeURIComponent(f)}">⬇ ${f}</a>`).join('');
      }
    }
  }, 1200);
}
</script>
</body>
</html>"""
