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
import re
import uuid
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

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
    except (ValidationError, ValueError, yaml.YAMLError) as exc:
        raise HTTPException(400, f"Помилка в конфізі: {exc}")

    limit_val = int(limit) if limit.strip().isdigit() else None
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
</style>
</head>
<body>
<div class="wrap">
  <h1>Парсер даних</h1>
  <p class="sub">Збір бази товарів із сайтів постачальників → Excel (XLSX) + CSV</p>

  <div class="card">
    <label for="cfg">YAML-конфіг постачальника <a class="tmpl" id="tmpl">↳ вставити шаблон</a></label>
    <textarea id="cfg" placeholder="Встав сюди YAML-конфіг (один постачальник) або завантаж файл нижче"></textarea>
    <div class="hint">Один конфіг = один постачальник. Кілька постачальників — завантаж кілька .yaml файлів (буде ще зведений all_products).</div>
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
const TEMPLATE = `name: example
base_url: https://example.com
start_urls:
  - https://example.com/catalog
product_link_selector: a.product-card
pagination:
  type: query        # query | next_link | none
  param: page
  max_pages: 50
fields:
  name:        { selector: "h1.product-title" }
  product_id:  { selector: ".sku", regex: "([A-Z0-9-]+)" }
  barcode:     { selector: ".barcode", multiple: true }
  images:      { selector: ".gallery img", attr: src, multiple: true }
params:
  brand:  { selector: ".brand" }
  weight: { selector: ".weight" }
download_images: false
delay_seconds: 1.0
concurrency: 5`;

document.getElementById('tmpl').onclick = () => { document.getElementById('cfg').value = TEMPLATE; };

const $ = id => document.getElementById(id);
let timer = null;

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
