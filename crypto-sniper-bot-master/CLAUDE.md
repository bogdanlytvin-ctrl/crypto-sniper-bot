# Bot Agent + SaaS Agent — Crypto Sniper Bot

## Проєкт
Crypto Sniper Bot — моніторинг мем-коїнів SOL/BNB, сигнали, підписка (FREE/BASIC/PRO).
Деплой: Railway. БД: SQLite → PostgreSQL.

## Архітектура
```
crypto-sniper-bot-master/
├── bot.py              ← точка входу, реєстрація handlers
├── scanner/            ← Raydium/BSC сканер
│   ├── raydium.py      ← SOL пари
│   └── bsc.py          ← BNB пари
├── trader/             ← wallet, swap логіка
├── admin/              ← Flask адмін-панель
│   ├── app.py          ← Flask app + routes
│   └── templates/      ← Jinja2 HTML
├── database.py         ← SQLAlchemy models
├── signals.py          ← генерація сигналів
└── config.py           ← env vars
```

## Субагент: Bot Agent тут відповідає за
- `bot.py`, handlers, keyboards, FSM стани
- Команди: /start, /signals, /subscribe, /wallet
- Фільтри по тиру (FREE бачить тільки частину сигналів)

## Субагент: SaaS Agent тут відповідає за
- `admin/app.py` — Flask routes
- `admin/templates/` — Jinja2 UI
- Підписки, тири, платежі
- Аналітика: users, revenue, signals

## Субагент: Deploy Agent тут відповідає за
- `railway.json` — Railway config
- `requirements.txt` — залежності
- `.env` — секрети (TELEGRAM_TOKEN, DB_URL, etc.)

## Важливо
- Сканер запускається як окремий asyncio task
- Сигнали зберігаються в БД, дедуплікація через seen_tokens
- AI аналіз через OpenAI API (якщо є ключ)
- Деплой лише через `railway up` або git push до Railway remote
