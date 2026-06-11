# Web Agent + SaaS Agent — Admin Panel

## Проєкт
Flask адмін-панель для Crypto Sniper Bot.
Маршрути: /users, /signals, /trades, /payments, /subscriptions, /settings, /audit, /logs.

## Архітектура
```
admin/
├── app.py              ← Flask app, всі routes
└── templates/
    ├── base.html       ← головний layout (navbar, sidebar)
    ├── dashboard.html  ← статистика
    ├── users.html      ← список юзерів
    ├── user_detail.html← деталі юзера
    ├── signals.html    ← сигнали
    ├── trades.html     ← трейди
    ├── payments.html   ← платежі
    ├── subscriptions.html ← підписки
    ├── positions.html  ← позиції
    ├── settings.html   ← налаштування
    ├── audit.html      ← аудит лог
    ├── broadcast.html  ← розсилка
    ├── blacklist.html  ← чорний список
    └── logs.html       ← системні логи
```

## Стандарти шаблонів
- Bootstrap 5 для UI
- Jinja2 для рендерингу даних
- AJAX/fetch для live оновлень там де потрібно
- Пагінація на сторінках з великими даними

## Web Agent тут відповідає за
- HTML/CSS/JS у templates/
- Новий UI компоненти, таблиці, форми
- JavaScript логіка у шаблонах

## SaaS Agent тут відповідає за
- Flask routes в app.py
- Бізнес-логіка (фільтри, пагінація, агрегати)
- Auth middleware та permissions
