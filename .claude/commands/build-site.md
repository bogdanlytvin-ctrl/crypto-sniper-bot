---
description: Побудова лендінга / SaaS-сайту — структура → дизайн → код → критика → звіт
argument-hint: [ідея сайту або сторінки]
---

# /build-site — Пайплайн побудови сайту / лендінга / SaaS

Завдання: **$ARGUMENTS**

Стек: Next.js 15 (App Router) + Tailwind v4 + shadcn/ui + Framer Motion.
ЗАВЖДИ дотримуйся `DESIGN_RULES.md` — тільки design tokens, без магічних чисел.

## Етапи

### 1. ВИЗНАЧЕННЯ + СТРУКТУРА СЕКЦІЙ (разом з користувачем)
ЗУПИНИСЬ і узгодь:
- Тип: лендінг / SaaS-дашборд / marketing?
- Цільова дія (CTA)? Аудиторія?
- Для лендінга — запропонуй структуру секцій:
  `Hero → Social Proof → Problem → Solution → Features → Demo → Pricing → FAQ → Final CTA`
Покажи структуру → дочекайся "ок" або правок.

### 2. ПЛАН
Файли/компоненти, маршрути, які токени/кольори, мобільна поведінка. Дочекайся підтвердження.

### 3. КОД
Запусти **code-agent**:
- Server Components за замовчуванням
- Тільки токени з DESIGN_RULES (без inline styles, без hex поза токенами)
- Hero: h1 ≥ 48px, 1 primary + 1 ghost CTA
- Pricing: макс 3 тири, середній "popular"
- Features: макс 6, з іконками
- Адаптив + великі tap zones

### 4. DESIGN CRITIC + REVIEW (паралельно)
- **design-critic** — hierarchy, CTA, spacing, кольори (≤3), типографіка (≤2 шрифти), mobile, motion
- **reviewer** — performance (bundle, Server vs Client), якість коду

### 5. ТЕСТ
- `next build` — без помилок?
- Запусти dev-сервер, перевір ключові сторінки/CTA у браузері якщо можливо
- Якщо не можеш перевірити в браузері — скажи прямо

### 6. ЗВІТ
```
## Звіт: build-site | [дата]
### Тип + структура секцій: [узгоджено]
### Файли: [створені]
### Design Critic ✅/⚠️ | Review ✅/⚠️ | Build ✅/⚠️
### +10%: [пропозиція]
```
