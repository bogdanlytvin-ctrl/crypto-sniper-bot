# DESIGN RULES — Жорсткі правила UI/UX
# Design Critic Agent та UI/UX Agent читають це ЗАВЖДИ перед роботою
# Порушення цих правил = баг рівня HIGH

---

## DESIGN TOKENS (єдине джерело правди)

### Colors
```
background:  #080c14   (основний фон)
surface:     #0d1421   (картки, панелі)
surface-2:   #111927   (вкладені елементи)
border:      #1e2d45   (межі)
border-2:    #253550   (активні межі)

text:        #d4e0f0   (основний текст)
text-2:      #7a92b0   (другорядний)
text-3:      #4a6280   (плейсхолдери, підписи)

primary:     #7c6fff   (фіолетовий акцент)
success:     #00e5b0   (зелений)
danger:      #ff5b5b   (червоний)
warning:     #ffb347   (помаранчевий)
info:        #35d4c7   (тіл)
```

### Spacing (ТІЛЬКИ ці значення)
```
4px / 8px / 12px / 16px / 24px / 32px / 48px / 64px / 96px
```
Tailwind: `p-1 p-2 p-3 p-4 p-6 p-8 p-12 p-16 p-24`

### Border Radius
```
sm:  6px  (кнопки, теги)
md:  10px (інпути, маленькі картки)
lg:  14px (картки)
xl:  20px (модалки, великі секції)
2xl: 28px (hero елементи)
```

### Typography Scale (максимум 4 розміри)
```
h1:    32-48px, weight 800, tracking -0.5px
h2:    22-28px, weight 700, tracking -0.3px
body:  14-15px, weight 400-500, line-height 1.6
small: 11-12px, weight 500-600, uppercase + tracking 0.5px
```

### Motion Tokens
```
fast:   150-200ms  (hover, toggle)
normal: 300-500ms  (transitions, appear)
slow:   600-800ms  (hero animations, page transitions)

easing: cubic-bezier(0.16, 1, 0.3, 1)  -- expo.out
        cubic-bezier(0.4, 0, 0.2, 1)   -- ease-in-out
```

---

## ANTI-UGLY RULES (заборонено абсолютно)

### Кольори
```
❌ більше 3 акцентних кольорів на одному екрані
❌ neon colors (занадто яскраві: #ff00ff, #00ff00)
❌ градієнти на всіх елементах одночасно
❌ random colors без design tokens
❌ чорний border #000000 (використовувати rgba(255,255,255,0.1))
```

### Типографіка
```
❌ більше 2 font-family на сторінці
❌ більше 5 різних font-size
❌ centered long paragraphs (> 3 рядків)
❌ ALL CAPS для довгого тексту
❌ line-height < 1.4 для body text
```

### Layout
```
❌ більше 3 колонок для контенту
❌ cards inside cards inside cards (max 2 рівні)
❌ більше 2 primary CTA кнопок в одній секції
❌ відступи менше 4px між елементами
❌ max-width > 1280px для контент-зони
```

### Тіні та ефекти
```
❌ box-shadow everywhere (тільки де є реальна глибина)
❌ blur > 40px (важко для GPU)
❌ більше 3 анімацій одночасно
❌ animation-duration > 1.2s для UI елементів
❌ спецефекти на mobile без перевірки performance
```

### Код
```
❌ inline styles (тільки design tokens)
❌ !important (завжди)
❌ magic numbers замість токенів (p-[17px] замість p-4)
❌ новий стиль кнопок якщо вже є Button component
❌ custom colors без запису в design tokens
```

---

## SAAS LANDING STRUCTURE (правильний порядок секцій)

```
1. Hero          ← одна головна думка + CTA
2. Social proof  ← логотипи клієнтів / відгуки
3. Problem       ← що болить у користувача
4. Solution      ← як ти вирішуєш
5. Features      ← максимум 6 фіч з іконками
6. Demo          ← screenshot/video
7. Pricing       ← max 3 тири
8. FAQ           ← max 6-8 питань
9. Final CTA     ← одна кнопка
```

### Hero rules
```
- h1 ≥ 48px, bold, центровано або зліва
- підзаголовок ≤ 2 рядки, text-2 color
- 1 primary CTA + 1 secondary (ghost) кнопка
- spacing top: ≥ 80px, bottom: ≥ 64px
- фонова графіка — subtle (opacity 10-20%)
```

---

## DASHBOARD UI RULES

```
- Sidebar ширина: 220-260px
- Main padding: 24-32px
- Card padding: 18-22px
- Card border-radius: lg (14px)
- Таблиці: завжди з header, border-bottom між рядками
- Stats: великі числа (32-40px), маленькі підписи (11px uppercase)
- Порожні стани: icon + текст + action button
```

---

## TELEGRAM WEBAPP RULES

```
- Мінімум тексту: 1 дія = 1 екран
- Tap zones: мінімум 44x44px
- Bottom bar: fixed, z-index 50
- Loading: skeleton (не спінер де можна)
- Анімації: тільки Framer Motion, duration ≤ 300ms
- Темна тема: завжди (відповідати Telegram системній темі)
- Шрифт: system-ui або Inter (не завантажувати Google Fonts)
```

---

## PREMIUM SAAS LOOK (що реально робить "дорого")

```
80% = spacing + typography + hierarchy + rhythm
20% = motion + effects + 3D

Найважливіше:
✅ великий whitespace між секціями (64-96px)
✅ чіткий visual hierarchy (h1 >> h2 >> body, помітна різниця)
✅ один головний акцент на сторінку
✅ consistent border-radius скрізь
✅ muted backgrounds (не чорний чорний)
✅ smooth scroll (Lenis)
✅ subtle grid або noise texture на фоні
```

---

## MOTION SYSTEM (якщо потрібна анімація)

```typescript
// motion.config.ts
export const motionConfig = {
  fast:   { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  normal: { duration: 0.4,  ease: [0.16, 1, 0.3, 1] },
  slow:   { duration: 0.8,  ease: [0.16, 1, 0.3, 1] },
}

// Framer Motion — тільки для UI компонентів
// GSAP — тільки для hero + scroll storytelling
// Lenis — завжди включений (smooth scroll)
// Spline — максимум 1 сцена (hero only)
```

### Заборонено в motion
```
❌ duration > 1.2s для UI
❌ bounce easing на бізнес-елементах
❌ > 3 анімацій одночасно
❌ animation на mobile без `prefers-reduced-motion` перевірки
❌ GSAP де вистачає CSS transition
```

---

## COMPONENT CHECKLIST (перед фіналізацією)

```
Layout:
[ ] max-width 1280px на контент-зоні
[ ] responsive: mobile-first
[ ] немає overflow-x на mobile

Typography:
[ ] max 2 font-family
[ ] ≤ 4 font-size
[ ] ≤ 3 text-color

Colors:
[ ] тільки design tokens
[ ] ≤ 3 акцентних кольори на екрані

Spacing:
[ ] тільки значення з spacing scale
[ ] достатньо whitespace між секціями

Interactive:
[ ] hover стани на всіх кнопках та посиланнях
[ ] focus стани (accessibility)
[ ] loading стани де є async операції

Motion:
[ ] duration в межах токенів
[ ] ≤ 3 анімації одночасно
[ ] перевірено на mobile
```

---

## REFERENSES — найкращі приклади стилю

```
Stripe   — spacing + typography + gradients
Linear   — dark UI + smooth motion + clarity
Vercel   — muted backgrounds + whitespace
Framer   — hero animations + sections rhythm
Raycast  — premium dark UI + icons
Supabase — dashboard UI + developer tone
OpenAI   — large typography + minimal layout
```

Патерни що об'єднують всіх:
- мінімалістичні
- typography-first
- дуже чисті
- controlled motion (не overloaded)
