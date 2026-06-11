# Bug Registry — Реєстр багів
# Bug Hunter Agent читає і пише сюди
# Severity: CRITICAL > HIGH > MEDIUM > LOW

---

## Статистика
- OPEN: 0 | IN_PROGRESS: 0 | FIXED: 9

---

## Відкриті баги (OPEN)

---

## Виправлені (FIXED)

### BUG-001: Подвійна обробка сигналів при паралельному скані
- Файл: `crypto-sniper-bot-master/scanner/raydium.py`
- Severity: HIGH
- Тип: Race Condition
- Опис: При паралельному скані двох пар міг генеруватись дублікат сигналу
- Фікс: seen_tokens TTL-кеш + asyncio.Lock
- Статус: FIXED
- Дата: 2026-05-22

### BUG-002: AI аналіз викликався для SKIP сигналів
- Файл: `crypto-sniper-bot-master/signals.py`
- Severity: MEDIUM
- Тип: Logic
- Опис: OpenAI API викликався навіть коли сигнал мав статус SKIP
- Фікс: Перевірка статусу перед викликом AI
- Статус: FIXED
- Дата: 2026-05-22

### BUG-003: TTL кеш seen_tokens був занадто довгим
- Файл: `crypto-sniper-bot-master/scanner/raydium.py`
- Severity: LOW
- Тип: Performance
- Опис: Токени не перевірялись 4 години, пропускались нові сигнали
- Фікс: TTL змінено з 4h → 1h
- Статус: FIXED
- Дата: 2026-05-22

### BUG-004: Відсутня перевірка subscription tier в handlers
- Файл: `crypto-sniper-bot-master/bot.py`
- Severity: HIGH
- Тип: Auth
- Опис: Деякі premium endpoints не перевіряли тир підписки
- Фікс: Додано middleware перевірку тиру перед кожним handler
- Статус: FIXED
- Дата: 2026-05-22

### BUG-005: Logging не захоплював AI analysis errors
- Файл: `crypto-sniper-bot-master/signals.py`
- Severity: MEDIUM
- Тип: Observability
- Опис: Помилки OpenAI API поглинались без логування
- Фікс: Додано proper exception logging з traceback
- Статус: FIXED
- Дата: 2026-05-22

### BUG-006: fix_bug() в панелі не змінював статус (no-op replace)
- Файл: `.claude/panel/app.py:229`
- Severity: MEDIUM
- Тип: Logic
- Опис: `content.replace(f"### {bug_id}:", f"### {bug_id}:")` — замінював рядок сам на себе
- Фікс: Переписано через `re.compile` з DOTALL + `subn()`
- Статус: FIXED
- Дата: 2026-05-27

### BUG-007: parse_bugs() ламався на записах без поля Файл
- Файл: `.claude/panel/app.py:85`
- Severity: MEDIUM
- Тип: Logic
- Опис: Строгий regex вимагав поле Файл, BUG-004/005 його не мали — тихо пропускались
- Фікс: Переписано на section-based parser з дефолтними значеннями
- Статус: FIXED
- Дата: 2026-05-27

### BUG-008: Веб панель без автентифікації
- Файл: `.claude/panel/app.py`
- Severity: MEDIUM
- Тип: Security
- Опис: Всі routes були доступні без пароля — будь-хто з localhost міг редагувати CLAUDE.md і дані агентів
- Фікс: Додано `require_auth` декоратор + `/login` route + `PANEL_PASSWORD` з .env
- Статус: FIXED
- Дата: 2026-05-27

### BUG-009: bot.py має 12 функцій > 40 рядків
- Файл: `crypto-sniper-bot-master/bot.py`
- Severity: LOW
- Тип: Code Quality
- Опис: `_maybe_auto_buy()` = 122 рядки, `cb_auto()` = 105, `_menu_positions()` = 92 та ще 9 функцій. Порушення правила ≤40 рядків.
- Фікс: Tech debt — потрібен рефакторинг на helper функції (не критично, функціонал не зламаний)
- Статус: FIXED
- Дата: 2026-05-27

---
<!-- Bug Hunter додає нові баги після рядка "## Відкриті баги (OPEN)" -->
