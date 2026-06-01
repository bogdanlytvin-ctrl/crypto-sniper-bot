# Парсер даних — збір бази товарів з сайтів постачальників

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
