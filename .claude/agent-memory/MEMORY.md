# Agent Memory — Пам'ять сесій
# Читати на початку КОЖНОЇ сесії

---

## Активні проєкти

| Проєкт | Статус | Останнє оновлення |
|--------|--------|-------------------|
| crypto-sniper-bot | Активний, Railway | 2026-05-27 |
| admin panel | Активний, Flask | 2026-05-27 |
| pekar | Активний, Vercel | 2026-05-27 |
| SITESCACER | Завершений аудит | 2026-04-22 |

---

## Важливі технічні рішення

### crypto-sniper-bot
- БД: SQLite (локально) → PostgreSQL (Railway prod)
- Сканер: окремий asyncio task, не blocking
- Сигнали: дедуплікація через seen_tokens (TTL 1 година)
- AI аналіз: OpenAI API, тільки для non-SKIP сигналів
- Тири: FREE / BASIC / PRO — перевірка в middleware

### admin panel
- Flask + Jinja2, Bootstrap 5
- Auth: сесійна (Flask session), не JWT
- Маршрути: /users, /signals, /trades, /payments, /subscriptions, /settings, /audit, /logs, /blacklist, /broadcast

### pekar
- Next.js App Router (не Pages Router)
- ORM: Prisma (не SQLAlchemy — це Next.js проєкт!)
- БД: Neon PostgreSQL
- Деплой: git push → Vercel auto-deploy

---

## Сесія 2026-05-27
- Задача: Побудова Multi-Agent системи
- Створено: CLAUDE.md (v2.0), agent-memory/, BUG_REGISTRY.md, LESSONS.md
- Субагенти: Orchestrator, Code, Bug Hunter, Security, Reviewer, Memory Keeper
- Незавершено: —

---

## Сесія 2026-05-29
- Модель оновлено: claude-opus-4-8 (вийшов 2026-05-28)
- Текстові ролі агентів → РЕАЛЬНІ субагенти `.claude/agents/`:
  bug-hunter (haiku), security/code-agent/reviewer/design-critic (opus 4.8)
- Створено workflow-команди `.claude/commands/`:
  /fix-bug, /fix-perf, /build-bot, /build-site (повний цикл + звіт)
- CLAUDE.md → v3.2, додано секцію про субагенти/команди
- ВАЖЛИВО: субагенти/команди активуються лише ПІСЛЯ перезапуску Claude Code
- Незавершено: реальний прогін субагентів (чекає на рестарт)

---
<!-- Нові сесії додавати знизу -->
