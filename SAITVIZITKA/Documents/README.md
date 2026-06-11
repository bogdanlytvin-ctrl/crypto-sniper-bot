# Bohdan — Portfolio + Admin

Багатомовне портфоліо (UA / EN / RU) з адмін-панеллю. Працює у двох режимах:

| Режим | Коли | Дані живуть |
|---|---|---|
| **Local** | `config.js` пустий | у `localStorage` браузера — лише на вашому пристрої |
| **Remote** | `SUPABASE_URL` + `SUPABASE_ANON_KEY` заповнені | у Supabase — синхронізуються між пристроями, доступні з будь-якого браузера |

---

## 🚀 Швидкий старт (локально, без бекенда)

1. Відкрий `index.html` у браузері — працює одразу.
2. Адмінка — `admin.html`, ваш пароль: `Winjester93` (можна змінити в адмінці → Тема → Пароль).
3. Зміни зберігаються в `localStorage`. Сайт і адмінка синхронізовані в реальному часі.

---

## ☁️ Production-режим: Supabase + Cloudflare Pages

### 1. Створи проєкт у Supabase
1. Іди на [supabase.com](https://supabase.com) → New project.
2. Збережи: **Project URL** і **anon public key** (Settings → API).

### 2. Створи таблиці й RLS — встав у SQL Editor:

```sql
-- site content (один рядок із id='main')
create table site_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table site_content enable row level security;
create policy "anyone reads" on site_content for select using (true);
create policy "authed updates" on site_content for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  name text, contact text, msg text,
  ts bigint, new boolean default true,
  source text default 'site'
);
alter table leads enable row level security;
create policy "anon insert" on leads for insert with check (true);
create policy "authed read"  on leads for select using (auth.role() = 'authenticated');
create policy "authed write" on leads for update using (auth.role() = 'authenticated');
create policy "authed del"   on leads for delete using (auth.role() = 'authenticated');

-- visits
create table visits (
  id bigserial primary key,
  ts bigint, variant text, ua text
);
alter table visits enable row level security;
create policy "anon insert" on visits for insert with check (true);
create policy "authed read" on visits for select using (auth.role() = 'authenticated');
```

### 3. Створи себе як адміна
Authentication → Users → **Add user** → email + password. Підтверди email.

### 4. Storage bucket для зображень

В адмінці можна завантажувати картинки до проектів. Щоб у remote-режимі вони збереглись у Supabase Storage:

1. Storage → **New bucket** → name: `portfolio` → toggle **Public** → Save.
2. SQL Editor:
   ```sql
   create policy "anon read portfolio" on storage.objects for select using (bucket_id = 'portfolio');
   create policy "authed upload portfolio" on storage.objects for insert with check (bucket_id = 'portfolio' and auth.role() = 'authenticated');
   create policy "authed update portfolio" on storage.objects for update using (bucket_id = 'portfolio' and auth.role() = 'authenticated');
   create policy "authed delete portfolio" on storage.objects for delete using (bucket_id = 'portfolio' and auth.role() = 'authenticated');
   ```

У local-режимі картинки зберігаються як base64 у `localStorage` (автоматично стискаються до ≤1600px).

### 5. Заповни `config.js`

```js
window.PORTFOLIO_CONFIG = {
  SUPABASE_URL: "https://xxxxx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGc...",
  ADMIN_EMAIL: "you@example.com",
};
```

> **Anon key безпечно коммітити** — це публічний ключ, RLS захищає дані. **Service-role key НІКОЛИ не клади у фронт.**

### 6. Деплой на Cloudflare Pages

**Варіант А — через GitHub:**
1. Запушити репо на GitHub.
2. Cloudflare Dashboard → Pages → Create → Connect GitHub.
3. Build command: *залишити пустим*. Output dir: `/` (корінь).
4. Deploy.

**Варіант Б — Wrangler CLI:**
```bash
npm i -g wrangler
wrangler pages deploy . --project-name=bohdan-portfolio
```

`_redirects` і `_headers` уже налаштовані.

### 7. Налаштуй CORS у Supabase
Authentication → URL Configuration → додай свій домен Cloudflare (наприклад `https://bohdan-portfolio.pages.dev`) у **Site URL** і **Redirect URLs**.

---

## 🤖 Telegram-бот для заявок (опційно)

В адмінці → секція **Telegram-бот**:
1. Створи бота через [@BotFather](https://t.me/BotFather) → отримай **Bot Token**.
2. Напиши боту будь-яке повідомлення → відкрий `https://api.telegram.org/bot<TOKEN>/getUpdates` → знайди `chat.id`.
3. Встав у адмінку, увімкни — нові заявки приходитимуть у Telegram.

---

## 📂 Структура

```
/
├── index.html              ← головна
├── admin.html              ← /admin
├── config.js               ← Supabase ключі (заповни сам)
├── config.example.js       ← шаблон
├── _redirects, _headers    ← Cloudflare Pages
├── src/
│   ├── db.js               ← Supabase ↔ localStorage абстракція
│   ├── store.jsx           ← дані + i18n + хуки
│   ├── variants/dark.jsx   ← головний дизайн
│   └── admin/admin.jsx     ← адмін-панель
```

---

## ❓ FAQ

**Q: Чи можу зайти в адмінку з телефону?**
A: У remote-режимі — так, через email+пароль із Supabase. У local-режимі — ні, дані живуть у твоєму браузері.

**Q: Як зробити бекап?**
A: Адмінка → Дашборд → **Експорт JSON**. Файл містить весь контент.

**Q: Як змінити пароль адміна?**
A: У remote — Supabase → Authentication → User → Reset password. У local — у `store.jsx` поле `adminPassHash`.
