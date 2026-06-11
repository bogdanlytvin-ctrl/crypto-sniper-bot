# Lessons Learned — Уроки з помилок
# Memory Keeper записує сюди після кожної помилки
# Читати на початку сесії щоб НЕ повторювати

---

## Урок 1: aiogram версія
- **Що:** Написав код для aiogram 2.x (старий синтаксис `Dispatcher(bot)`)
- **Чому:** Не перевірив версію в requirements.txt перед написанням
- **Рішення:** Завжди перевіряти `Grep "aiogram" requirements.txt` спочатку
- **Правило:** Цей проєкт використовує **aiogram 3.x** — Router, не dp.register_*

## Урок 2: Prisma vs SQLAlchemy
- **Що:** Написав SQLAlchemy код для pekar/ проєкту
- **Чому:** Забув що pekar — Next.js, не Python
- **Рішення:** pekar/ → Prisma ORM. Всі Python проєкти → SQLAlchemy
- **Правило:** Перед написанням коду перевірити CLAUDE.md субдиректорії

## Урок 3: Railway env vars
- **Що:** Додав нову змінну середовища в код але не в railway.json
- **Чому:** Думав що .env автоматично синхронізується
- **Рішення:** Вручну додати в Railway Dashboard або railway.json
- **Правило:** Нова .env змінна → завжди документувати де її треба налаштувати

## Урок 4: Flask debug mode
- **Що:** Залишив `debug=True` в app.py при деплої
- **Чому:** Копіював з локального dev конфігу
- **Рішення:** `debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'`
- **Правило:** Debug mode завжди через env var, ніколи хардкодом

## Урок 5: Async without await
- **Що:** Викликав async функцію без await — отримав coroutine object замість результату
- **Чому:** Не помітив що функція async
- **Рішення:** Grep "^async def" перед викликом, перевірити чи є await
- **Правило:** Bug Hunter перевіряє на missing await після кожного Code Agent pass

## Урок 6: N+1 в адмін-панелі
- **Що:** Сторінка users завантажувалась 30+ секунд через N+1 запити
- **Чому:** Jinja2 шаблон звертався до user.subscription в циклі
- **Рішення:** Eager loading: `selectinload(User.subscription)` в запиті
- **Правило:** Reviewer Agent перевіряє N+1 в кожному циклі над ORM об'єктами

## Урок 7: Не читати файл перед Edit
- **Що:** Edit провалився бо шуканий рядок не співпав з реальним
- **Чому:** Написав old_string по пам'яті без Read
- **Рішення:** Завжди Read → копіювати точний текст → Edit
- **Правило:** Read є ОБОВ'ЯЗКОВИМ перед кожним Edit

---
<!-- Memory Keeper додає нові уроки знизу -->
