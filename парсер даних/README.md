---
title: Парсер даних
emoji: 📦
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Парсер даних — збір бази товарів з сайтів постачальників

> **Веб-версія (FastAPI):** локально — `uvicorn web.app:app --reload` →
> http://127.0.0.1:8000 . У Docker / на Hugging Face Spaces слухає порт `7860`.
> Завантаж/встав YAML-конфіг постачальника, натисни «Запустити» — отримаєш
> XLSX + CSV (+ zip фото). Деплой — див. кінець файлу.


Конфіг-кероване ядро для збору каталогу товарів з кількох сайтів
постачальників і вивантаження у **Excel (XLSX)** та **CSV**.

Для кожного товару збирається:
- **Наименование** (name)
- **ID / артикул** (product_id)
- **Штрихкоди** EAN/Barcode — кілька значень підтримується (barcodes)
- **Фото** — прямі посилання та/або завантажені файли (image_urls / image_files)
- **1–2 додаткові параметри** (params: бренд, вага, … — налаштовується)

Розрахований на обсяг **2 000–3 000 товарів** з кількох сайтів.

---

## Як це працює

Кожен постачальник описується одним YAML-файлом у `config/`. Ядро не
потребує правок при додаванні нового сайту — лише новий конфіг із
CSS-селекторами.

```
config/<supplier>.yaml  →  crawl (каталог + пагінація)  →  парс сторінок
        →  нормалізація + дедуплікація  →  output/<supplier>.xlsx + .csv
                                          (+ images/ якщо ввімкнено)
```

| Модуль | Призначення |
|--------|-------------|
| `src/models.py`   | моделі `Product` і `SupplierConfig` (Pydantic) |
| `src/fetcher.py`  | завантаження (httpx або Playwright), ретраї, ввічливість |
| `src/parser.py`   | витяг полів зі сторінки за селекторами з конфігу |
| `src/crawler.py`  | обхід каталогу + пагінація → збір товарів |
| `src/pipeline.py` | нормалізація штрихкодів (EAN-8/12/13/14), дедуп |
| `src/exporter.py` | XLSX + CSV + завантаження фото |
| `src/cli.py`      | точка входу (CLI) |

---

## Встановлення

```bash
cd "парсер даних"
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt

# лише якщо є JS/SPA-сайти (render_js: true):
pip install playwright && playwright install chromium
```

## Запуск

```bash
# один постачальник
python main.py config/example_supplier.yaml

# кілька постачальників одразу → ще й зведений output/all_products.xlsx
python main.py config/*.yaml

# тестовий прогін на 20 товарах + завантаження фото
python main.py config/example_supplier.yaml --limit 20 --download-images
```

Результат — у `output/` (по файлу на постачальника + зведений), фото — у
`images/<supplier>/`.

---

## Налаштування нового сайту (після надання доступу)

1. Скопіюйте `config/example_supplier.yaml` → `config/<назва>.yaml`.
2. Вкажіть `start_urls` (сторінки каталогу) і `product_link_selector`
   (селектор посилань на картки товарів).
3. Налаштуйте `pagination` (`query` / `next_link` / `none`).
4. Пропишіть селектори у `fields` (name, product_id, barcode, images) і
   1–2 додаткові у `params`.
5. Для JS-сайтів — `render_js: true`. Для збереження фото — `download_images: true`.
6. Перевірте на малому обсязі: `--limit 20`, потім запускайте повністю.

> Селектори підбираються через DevTools (Inspect) на кожному сайті
> окремо — структура у постачальників різна.

---

## Технічні рішення

- **Async + bounded concurrency** — швидко на тисячах сторінок, але з
  лімітом одночасних запитів і затримкою (`delay_seconds`), щоб не
  навантажувати сайт постачальника.
- **Ретраї з backoff** на мережеві збої.
- **Дедуплікація** за `(supplier, product_id)` — без дублів у базі.
- **Валідація штрихкодів** — лишаються лише коректні GTIN-довжини.
- **utf-8-sig** у CSV — коректно відкривається в Excel з кирилицею.

---

## Веб-версія та деплой

`web/app.py` — FastAPI-обгортка над ядром. Одна сторінка: вставити/завантажити
YAML-конфіг(и) → опції (ліміт, фото) → «Запустити». Парс іде фоновою задачею,
сторінка показує лог у реальному часі, у кінці — кнопки завантаження
`XLSX / CSV / images.zip`.

```bash
# локально
pip install -r requirements.txt -r web/requirements.txt
uvicorn web.app:app --reload         # http://127.0.0.1:8000
```

### Хостинг (безкоштовно)

Vercel **не підходить** (serverless: ліміт часу, ефемерна ФС, немає довгих
задач). Підходять платформи з Docker і довгими процесами:

**Hugging Face Spaces (рекомендовано — без картки):**
1. huggingface.co → **New Space** → SDK = **Docker**, Blank.
2. У створений Space-репозиторій залити вміст цієї папки:
   ```bash
   git clone https://huggingface.co/spaces/<user>/<space> hf-space
   # скопіювати сюди файли проєкту (web/, src/, Dockerfile, README.md, requirements.txt, config/)
   cd hf-space && git add . && git commit -m "deploy parser web" && git push
   ```
   HF підхопить `Dockerfile` і `app_port: 7860` із заголовка README і збере образ.
3. Через ~2-3 хв застосунок живий на `https://<user>-<space>.hf.space`.

**Render / Railway / Fly.io** — той самий `Dockerfile`: New → Web Service →
Docker, Root Directory = `парсер даних`, порт `7860`. На free-тарифах сервіс
засинає в простої (перший запит після паузи — повільніший).

> Вихідні файли на безкоштовних хостах **ефемерні** (живуть до перезапуску
> контейнера) — завантажуй результат одразу після прогону.
