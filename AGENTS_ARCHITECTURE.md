# Multi-Agent Architecture v2.0

## Схема агентів

```
┌─────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR                          │
│  Читає пам'ять → Будує план → Делегує → Збирає звіт    │
└──────────────┬──────────────────────────────────────────┘
               │
    ┌──────────┼──────────┐──────────┐──────────┐
    ▼          ▼          ▼          ▼          ▼
┌──────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│Code  │  │  Bug   │  │Security│  │Reviewer│  │Memory  │
│Agent │  │Hunter  │  │ Agent  │  │ Agent  │  │Keeper  │
│      │  │        │  │        │  │        │  │        │
│Пише  │  │Шукає   │  │XSS/SQLi│  │Якість  │  │Пам'ять │
│код   │  │баги    │  │/Auth   │  │/DRY    │  │Уроки   │
└──────┘  └────────┘  └────────┘  └────────┘  └────────┘
    │          │          │            │           │
    └──────────┴──────────┴────────────┴───────────┘
                              │
                    ┌─────────▼─────────┐
                    │  .claude/agent-   │
                    │  memory/          │
                    │  ├ MEMORY.md      │
                    │  ├ BUG_REGISTRY   │
                    │  └ LESSONS.md     │
                    └───────────────────┘
```

## Lifecycle задачі

```
User: "Додай нову фічу X"
         │
         ▼
Orchestrator:
  1. Read MEMORY.md      ← чи була схожа задача?
  2. Read LESSONS.md     ← які помилки вже були?
  3. Read BUG_REGISTRY   ← чи є відкриті баги тут?
  4. Glob + Grep         ← які файли торкнемось?
  5. BUILD PLAN          ← numbered list кроків
         │
    ┌────┼────┐
    ▼    ▼    ▼  (паралельно якщо незалежні)
  Code  Bug  Security
  Agent Hunt  Check
    │    │    │
    └────┴────┘
         │
         ▼
    Reviewer Agent
    (pre-commit чеклист)
         │
         ▼
    Memory Keeper
    (записує в MEMORY.md + генерує звіт)
```

## Файли системи

```
.claude/
├── agent-memory/
│   ├── MEMORY.md          ← хронологія сесій + рішення
│   ├── BUG_REGISTRY.md    ← всі баги (OPEN/FIXED)
│   └── LESSONS.md         ← уроки щоб не повторювати
└── reports/
    ├── REPORT_TEMPLATE.md ← шаблон
    └── [дата]_[задача].md ← звіти сесій

CLAUDE.md                  ← головний файл агентів (читати!)
crypto-sniper-bot-master/CLAUDE.md
admin/CLAUDE.md
pekar/CLAUDE.md
```

## Правила анти-галюцинацій

| НЕ робити | Робити замість |
|-----------|---------------|
| Вигадувати ім'я функції | `Grep "def func"` спочатку |
| Писати Edit без Read | `Read file` → потім `Edit` |
| Стверджувати без перевірки | "Перевірю:" → `Grep/Read` |
| Читати весь файл | `Grep -n` → `Read offset+limit` |
| Повторювати минулі помилки | `Read LESSONS.md` спочатку |

## Токен-бюджет (орієнтовно)

| Дія | Токени |
|-----|--------|
| Read MEMORY.md | ~500 |
| Read LESSONS.md | ~400 |
| Grep pattern | ~100 |
| Read file partial (30 рядків) | ~300 |
| Edit (small) | ~200 |
| Звіт | ~300 |
| **Типова задача** | **~3-5k** |
| **Без системи (хаотично)** | **~15-30k** |
