// Shared data store using localStorage — used by both variations AND admin
// Admin changes are reflected in the portfolio site in real time

const DEFAULT_DATA = {
  // site content
  name: "Богдан",
  tagline: {
    ua: "Telegram-боти · сайти · автоматизації",
    en: "Telegram bots · websites · automations",
    ru: "Telegram-боты · сайты · автоматизации",
  },
  bio: {
    ua: "Самоучка. Починаю шлях у розробці — вивчаю Python і JavaScript, роблю Telegram-боти та сайти для знайомих і перших клієнтів на фрілансі. Беруся за реальні задачі і роблю їх чесно.",
    en: "Self-taught. Starting my dev journey — learning Python and JavaScript, building Telegram bots and websites for friends and first freelance clients. I take on real tasks and do them honestly.",
    ru: "Самоучка. Начинаю путь в разработке — изучаю Python и JavaScript, делаю Telegram-боты и сайты для знакомых и первых клиентов на фрилансе. Берусь за реальные задачи и делаю их честно.",
  },
  heroTitle: {
    ua: "Роблю боти\nта сайти —\nчесно і в строк",
    en: "I build bots\nand websites —\nhonestly, on time",
    ru: "Делаю ботов\nи сайты —\nчестно и в срок",
  },
  heroSub: {
    ua: "Самоучка на старті. Беруся за Telegram-ботів, лендинги та сайти-візитки. Ціни адекватні, результат реальний.",
    en: "Self-taught, just getting started. I build Telegram bots, landings and business-card sites. Fair prices, real results.",
    ru: "Самоучка в начале пути. Делаю Telegram-ботов, лендинги и сайты-визитки. Цены адекватные, результат реальный.",
  },
  // accent color
  accent: "#E89B3C", // amber/бурштин

  // services
  services: [
    { id: "s1", icon: "◆", title: { ua: "Telegram-боти", en: "Telegram bots", ru: "Telegram-боты" }, desc: { ua: "Прості боти для бізнесу: запис, нагадування, FAQ, прийом заявок", en: "Simple bots: booking, reminders, FAQ, lead collection", ru: "Простые боты: запись, напоминания, FAQ, приём заявок" }, price: "від $50" },
    { id: "s2", icon: "▲", title: { ua: "Лендинги", en: "Landing pages", ru: "Лендинги" }, desc: { ua: "Односторінковий сайт для продукту або послуги з формою заявки", en: "One-page site for product or service with a lead form", ru: "Одностраничный сайт для продукта или услуги с формой заявки" }, price: "від $80" },
    { id: "s3", icon: "●", title: { ua: "Сайти-візитки", en: "Business-card sites", ru: "Сайты-визитки" }, desc: { ua: "Особиста сторінка або сторінка бізнесу — портфоліо, контакти, послуги", en: "Personal or business page — portfolio, contacts, services", ru: "Личная страница или бизнеса — портфолио, контакты, услуги" }, price: "від $100" },
    { id: "s4", icon: "◈", title: { ua: "Автоматизації", en: "Automations", ru: "Автоматизации" }, desc: { ua: "Прості інтеграції через n8n або API: форма → Telegram, таблиця → бот", en: "Simple integrations via n8n or API: form → Telegram, sheet → bot", ru: "Простые интеграции через n8n или API: форма → Telegram, таблица → бот" }, price: "від $40" },
  ],

  // portfolio projects
  projects: [
    { id: "p1", title: "Сайт-візитка (цей сайт)", cat: "card", year: "2026", tag: { ua: "Особистий портфоліо-сайт", en: "Personal portfolio site", ru: "Личный сайт-портфолио" }, desc: { ua: "Повноцінний сайт-портфоліо з адмінкою, темами, мультимовністю та формою заявок. Зроблений для себе як перший серйозний проект.", en: "Full portfolio site with admin panel, themes, multilanguage and lead form. Built for myself as first serious project.", ru: "Полноценный сайт-портфолио с админкой, темами, мультиязычностью и формой заявок. Сделан для себя как первый серьёзный проект." }, stack: "HTML · JavaScript · React · Supabase · Vercel", metric: "Онлайн" },
  ],

  // categories (filters)
  categories: [
    { id: "all", label: { ua: "Все", en: "All", ru: "Все" } },
    { id: "telegram", label: { ua: "Боти", en: "Bots", ru: "Боты" } },
    { id: "landing", label: { ua: "Лендинги", en: "Landings", ru: "Лендинги" } },
    { id: "card", label: { ua: "Візитки", en: "Cards", ru: "Визитки" } },
    { id: "web", label: { ua: "Веб-додатки", en: "Web apps", ru: "Веб-приложения" } },
    { id: "automation", label: { ua: "Автоматизації", en: "Automations", ru: "Автоматизации" } },
  ],

  // process steps
  process: [
    { n: "01", title: { ua: "Повідомлення", en: "Message", ru: "Сообщение" }, desc: { ua: "Напишіть у Telegram або на email — відповідаю в той же день. Розбираємо задачу, цілі, бюджет текстом.", en: "Drop me a Telegram or email — I reply the same day. We clarify task, goals, budget in text.", ru: "Напишите в Telegram или на email — отвечаю в тот же день. Разбираем задачу, цели, бюджет текстом." } },
    { n: "02", title: { ua: "ТЗ + макет", en: "Spec + mockup", ru: "ТЗ + макет" }, desc: { ua: "Пишу ТЗ, показую макет, фіксуємо обсяг.", en: "Write spec, show mockup, lock scope.", ru: "Пишу ТЗ, показываю макет, фиксируем объём." } },
    { n: "03", title: { ua: "Розробка", en: "Build", ru: "Разработка" }, desc: { ua: "3–10 днів. Показую прогрес кожні 2 дні.", en: "3–10 days. Progress updates every 2 days.", ru: "3–10 дней. Прогресс каждые 2 дня." } },
    { n: "04", title: { ua: "Запуск", en: "Launch", ru: "Запуск" }, desc: { ua: "Тести, деплой, навчання. Гарантія 30 днів.", en: "Tests, deploy, training. 30-day warranty.", ru: "Тесты, деплой, обучение. Гарантия 30 дней." } },
  ],

  // testimonials
  testimonials: [],

  // plans
  plans: [
    { id: "pl1", name: { ua: "Мінімум", en: "Minimum", ru: "Минимум" }, price: "$50", per: { ua: "разово", en: "one-time", ru: "разово" }, features: { ua: ["Простий Telegram-бот або лендинг", "до 7 днів", "Правки після здачі", "Без прихованих доплат"], en: ["Simple Telegram bot or landing", "up to 7 days", "Fixes after delivery", "No hidden fees"], ru: ["Простой Telegram-бот или лендинг", "до 7 дней", "Правки после сдачи", "Без скрытых доплат"] }, featured: false },
    { id: "pl2", name: { ua: "Стандарт", en: "Standard", ru: "Стандарт" }, price: "$100–150", per: { ua: "разово", en: "one-time", ru: "разово" }, features: { ua: ["Сайт-візитка або бот зі сценаріями", "до 10 днів", "Адаптив + форма заявки", "Деплой і налаштування"], en: ["Business-card site or bot with flows", "up to 10 days", "Responsive + lead form", "Deploy and setup"], ru: ["Сайт-визитка или бот со сценариями", "до 10 дней", "Адаптив + форма заявки", "Деплой и настройка"] }, featured: true },
    { id: "pl3", name: { ua: "Індивідуально", en: "Custom", ru: "Индивидуально" }, price: "Домовимось", per: { ua: "проект", en: "project", ru: "проект" }, features: { ua: ["Нестандартне завдання", "Обговорюємо деталі", "Ціна після уточнення ТЗ", "Пишіть — відповім того ж дня"], en: ["Custom task", "Discuss the details", "Price after spec clarification", "Write me — reply same day"], ru: ["Нестандартная задача", "Обсуждаем детали", "Цена после уточнения ТЗ", "Пишите — отвечу в тот же день"] }, featured: false },
  ],

  // price calculator
  calculator: {
    uahRate: 40,
    types: [
      { id: "bot",     label: { ua: "Telegram-бот",  en: "Telegram bot",   ru: "Telegram-бот"    }, base: 250, days: 4,  icon: "✈" },
      { id: "landing", label: { ua: "Лендинг",        en: "Landing page",   ru: "Лендинг"          }, base: 350, days: 5,  icon: "▤" },
      { id: "site",    label: { ua: "Сайт-візитка",   en: "Business site",  ru: "Сайт-визитка"    }, base: 500, days: 7,  icon: "▣" },
      { id: "app",     label: { ua: "Веб-додаток",    en: "Web app",        ru: "Веб-приложение"  }, base: 900, days: 14, icon: "◈" },
      { id: "auto",    label: { ua: "Автоматизація",  en: "Automation",     ru: "Автоматизация"   }, base: 300, days: 5,  icon: "⟳" },
    ],
    features: [
      { id: "admin",    price: 200, days: 3, label: { ua: "Адмінка",            en: "Admin panel",      ru: "Админка"           } },
      { id: "i18n",     price: 120, days: 2, label: { ua: "Мультимовність",      en: "Multi-language",   ru: "Мультиязычность"   } },
      { id: "payments", price: 250, days: 3, label: { ua: "Платежі",             en: "Payments",         ru: "Платежи"           } },
      { id: "auth",     price: 150, days: 2, label: { ua: "Авторизація",         en: "Auth",             ru: "Авторизация"       } },
      { id: "ai",       price: 300, days: 4, label: { ua: "AI / GPT-інтеграція", en: "AI / GPT",         ru: "AI / GPT"          } },
      { id: "crm",      price: 180, days: 2, label: { ua: "CRM-інтеграція",      en: "CRM integration",  ru: "CRM-интеграция"    } },
      { id: "design",   price: 220, days: 3, label: { ua: "Унікальний дизайн",   en: "Custom design",    ru: "Уникальный дизайн" } },
      { id: "seo",      price: 100, days: 1, label: { ua: "SEO",                 en: "SEO",              ru: "SEO"               } },
    ],
    urgency: [
      { id: "normal", mult: 1,   label: { ua: "Звичайно",         en: "Normal",       ru: "Обычно"  } },
      { id: "fast",   mult: 1.3, label: { ua: "Швидко (×1.3)",   en: "Fast (×1.3)",  ru: "Быстро (×1.3)" } },
      { id: "urgent", mult: 1.7, label: { ua: "Терміново (×1.7)", en: "Urgent (×1.7)",ru: "Срочно (×1.7)" } },
    ],
  },

  // FAQ
  faq: [
    { id: "f1", q: { ua: "Скільки триває розробка?", en: "How long does it take?", ru: "Сколько длится разработка?" }, a: { ua: "Бот або лендинг — 3–7 днів. Веб-додаток — 2–4 тижні. Все залежить від обсягу.", en: "Bot or landing — 3–7 days. Web app — 2–4 weeks. Depends on scope.", ru: "Бот или лендинг — 3–7 дней. Веб-приложение — 2–4 недели." } },
    { id: "f2", q: { ua: "Як відбувається оплата?", en: "How does payment work?", ru: "Как происходит оплата?" }, a: { ua: "50% передоплата, 50% після запуску. Картка, IBAN, USDT.", en: "50% upfront, 50% on delivery. Card, IBAN, USDT.", ru: "50% предоплата, 50% после запуска. Карта, IBAN, USDT." } },
    { id: "f3", q: { ua: "Що з підтримкою після запуску?", en: "What about post-launch support?", ru: "Что с поддержкой после запуска?" }, a: { ua: "30 днів безкоштовних правок у межах ТЗ. Далі — погодинно або підписка.", en: "30 days of free fixes within spec. After — hourly or subscription.", ru: "30 дней бесплатных правок в ТЗ. Далее — почасово или подписка." } },
    { id: "f4", q: { ua: "Ти досвідчений розробник?", en: "Are you an experienced developer?", ru: "Ты опытный разработчик?" }, a: { ua: "Чесно — на старті шляху. Самоучка, вивчаю Python і JavaScript, роблю перші реальні проекти. Саме тому ціни адекватні, а підхід — відповідальний.", en: "Honestly — just getting started. Self-taught, learning Python and JavaScript, doing first real projects. That's why prices are fair and approach is responsible.", ru: "Честно — в начале пути. Самоучка, изучаю Python и JavaScript, делаю первые реальные проекты. Именно поэтому цены адекватные, а подход — ответственный." } },
    { id: "f5", q: { ua: "Чи є гарантія?", en: "Is there a warranty?", ru: "Есть ли гарантия?" }, a: { ua: "Так — виправлю всі баги після здачі. Не зникаю після оплати.", en: "Yes — I fix all bugs after delivery. I don't disappear after payment.", ru: "Да — исправлю все баги после сдачи. Не исчезаю после оплаты." } },
  ],

  // blog
  blog: [
    {
      id: "b1",
      title: { ua: "5 помилок у Telegram-ботах", en: "5 mistakes in Telegram bots", ru: "5 ошибок в Telegram-ботах" },
      excerpt: {
        ua: "Що найчастіше ламає конверсію і UX. Розбір на основі 30+ ботів, які я запускав.",
        en: "What kills conversion and UX. Breakdown from 30+ bots I've shipped.",
        ru: "Что чаще всего ломает конверсию и UX. Разбор по 30+ ботам, которые я запускал."
      },
      body: {
        ua: "1. Long polling замість webhook у проді.\nLong polling постійно опитує сервери Telegram і жере ресурси. Webhook працює навпаки — Telegram сам стукає до вас, коли є подія. На webhook бот витримує тисячі користувачів на дешевому VPS, на long polling починає тупити вже на сотнях.\n\n2. Відсутність ReplyKeyboard / InlineKeyboard.\nКористувачі не повинні набирати команди руками. Кнопки — це різниця між ботом, де треба пам'ятати /start /menu /help, і ботом, де ти просто тицяєш. Конверсія в дію зростає в 2–4 рази.\n\n3. Зберігання стану в RAM.\nТипова помилка новачка: dict у пам'яті процесу. Перезапустив — все втратив. Користуйтесь Redis, SQLite або Postgres з самого початку. Це 15 хвилин додаткової роботи і нуль головного болю.\n\n4. Ігнорування FSM (state machine).\nКоли в боті більше ніж 2 кроки діалогу, без скінченного автомата буде хаос: користувач відповідає на питання, яке ви вже забули, що задавали. aiogram, telegraf і grammy дають FSM з коробки — вмикайте одразу.\n\n5. Немає логів і моніторингу.\nБот мовчить — і ти не знаєш: він впав, чи Telegram заблокував токен, чи просто немає трафіку. Мінімум: лог кожного апдейту в файл + sentry на ексепшени + healthcheck-пінг раз на хвилину. Без цього ти дізнаєшся про проблему від клієнта — а це найгірший варіант.",
        en: "1. Long polling instead of webhook in production.\nLong polling constantly hits Telegram servers and wastes resources. Webhook works the other way — Telegram pushes events to you. On webhook a bot handles thousands of users on a cheap VPS; on long polling it starts choking at hundreds.\n\n2. No ReplyKeyboard / InlineKeyboard.\nUsers should never type commands. Buttons are the difference between a bot where you have to remember /start /menu /help and one you just tap. Conversion goes up 2–4×.\n\n3. Storing state in RAM.\nClassic beginner mistake: a dict inside the process. Restart — everything's gone. Use Redis, SQLite or Postgres from day one. 15 extra minutes of setup, zero pain later.\n\n4. Ignoring FSM (finite state machine).\nWith more than 2 conversation steps, no FSM means chaos: the user answers a question you've already forgotten asking. aiogram, telegraf, grammy ship FSM out of the box — turn it on immediately.\n\n5. No logs, no monitoring.\nThe bot is silent — and you don't know: did it crash, did Telegram revoke the token, or is there just no traffic? Minimum: log every update to a file + sentry on exceptions + a healthcheck ping every minute. Without it the client tells you it's broken — worst case scenario.",
        ru: "1. Long polling вместо webhook на проде.\nLong polling постоянно дёргает серверы Telegram и жрёт ресурсы. Webhook работает наоборот — Telegram сам шлёт события вам. На webhook бот держит тысячи пользователей на дешёвой VPS, на long polling начинает тупить уже на сотнях.\n\n2. Нет ReplyKeyboard / InlineKeyboard.\nПользователь не должен набирать команды руками. Кнопки — это разница между ботом, где нужно помнить /start /menu /help, и ботом, где ты просто тыкаешь. Конверсия растёт в 2–4 раза.\n\n3. Хранение стейта в RAM.\nКлассика новичка: dict в памяти процесса. Перезапустил — всё потерял. Redis, SQLite или Postgres с первого дня. 15 минут лишней работы, ноль головной боли потом.\n\n4. Игнор FSM (стейт-машины).\nКогда в диалоге больше 2 шагов — без FSM будет хаос: юзер отвечает на вопрос, который ты уже забыл, что задавал. aiogram, telegraf и grammy дают FSM из коробки — включайте сразу.\n\n5. Нет логов и мониторинга.\nБот молчит — и ты не знаешь: упал, токен отозвали или просто трафика нет. Минимум: лог каждого апдейта в файл + sentry на эксепшены + healthcheck-пинг раз в минуту. Без этого о поломке расскажет клиент — худший сценарий."
      },
      date: "12.04.2026", readMin: 6
    },
    {
      id: "b2",
      title: { ua: "Як я збираю лендинг за 3 дні", en: "How I ship a landing in 3 days", ru: "Как я собираю лендинг за 3 дня" },
      excerpt: {
        ua: "Конкретний процес: від брифу до деплою. Стек, інструменти, чекліст.",
        en: "Concrete process: from brief to deploy. Stack, tools, checklist.",
        ru: "Конкретный процесс: от брифа до деплоя. Стек, инструменты, чеклист."
      },
      body: {
        ua: "День 1 — структура і копірайт.\nБриф у Notion: ЦА, оффер, біль клієнта, USP, дії. Збираю прототип у Figma — wireframe, без графіки. Текст пишу одразу в макеті, не в окремому файлі: так одразу видно, де переборщив. Структура майже завжди: hero (оффер + CTA), proof (логотипи/цифри), benefits, як це працює, тарифи, FAQ, фінальний CTA.\n\nДень 2 — верстка і компоненти.\nVite + React + TailwindCSS. Компоненти зі shadcn/ui — кнопки, акордеон, форма. Анімації — Framer Motion (тільки на hero і scroll-reveal, без перебору). Іконки — Lucide. Адаптив пишу одразу mobile-first, не «потім поправлю». Картинки — стискаю через Squoosh у WebP, lazy-load обовʼязково.\n\nДень 3 — інтеграції, тести, деплой.\nФорма — на свій бекенд або прямо в Telegram через bot API. Аналітика — Plausible або GA4. Pixel Meta/TikTok якщо потрібен платний трафік. Деплой на Vercel — пуш в Git, готово. Перевіряю Lighthouse: ціль 95+ на perf і a11y. Тестую на реальному телефоні (не в DevTools — там брешуть про швидкість). Передача клієнту: коротке відео-walkthrough в Loom + доступи в Notion.\n\nЩо НЕ роблю.\nНе пишу свою CMS — клієнту віддаю Sanity або Strapi. Не роблю «креативний дизайн з нуля» — використовую перевірені паттерни. Не верстаю в Webflow для лендингів складніше за one-pager — швидше написати руками.",
        en: "Day 1 — structure and copy.\nBrief in Notion: audience, offer, pain, USP, actions. Wireframe in Figma — no graphics yet. I write copy directly inside the mockup, not in a separate doc — instantly shows where I'm overdoing it. The structure is almost always: hero (offer + CTA), proof (logos/numbers), benefits, how it works, pricing, FAQ, final CTA.\n\nDay 2 — markup and components.\nVite + React + TailwindCSS. Components from shadcn/ui — buttons, accordion, form. Animations — Framer Motion (only hero and scroll-reveal, never overdone). Icons — Lucide. Mobile-first from the start, never «I'll fix it later». Images — compressed through Squoosh into WebP, lazy-load mandatory.\n\nDay 3 — integrations, tests, deploy.\nForm — to my backend or straight to Telegram via bot API. Analytics — Plausible or GA4. Meta/TikTok pixel if there's paid traffic. Deploy on Vercel — push to Git, done. Check Lighthouse: target 95+ on perf and a11y. Test on a real phone (not DevTools — DevTools lies about speed). Handoff to client: quick Loom walkthrough + access docs in Notion.\n\nWhat I DON'T do.\nNo custom CMS — give the client Sanity or Strapi. No «creative design from scratch» — proven patterns only. No Webflow for anything beyond a one-pager — faster to hand-code.",
        ru: "День 1 — структура и копирайт.\nБриф в Notion: ЦА, оффер, боль, USP, действия. Прототип в Figma — wireframe, без графики. Текст пишу сразу в макете, не в отдельном файле: так сразу видно, где переборщил. Структура почти всегда: hero (оффер + CTA), proof (логотипы/цифры), benefits, как это работает, тарифы, FAQ, финальный CTA.\n\nДень 2 — вёрстка и компоненты.\nVite + React + TailwindCSS. Компоненты из shadcn/ui — кнопки, аккордеон, форма. Анимации — Framer Motion (только на hero и scroll-reveal, без перебора). Иконки — Lucide. Адаптив пишу сразу mobile-first, не «потом поправлю». Картинки — Squoosh в WebP, lazy-load обязательно.\n\nДень 3 — интеграции, тесты, деплой.\nФорма — на свой бэкенд или прямо в Telegram через bot API. Аналитика — Plausible или GA4. Meta/TikTok pixel при платном трафике. Деплой на Vercel — пуш в Git, готово. Проверяю Lighthouse: цель 95+ на perf и a11y. Тестирую на реальном телефоне (не в DevTools — там врут про скорость). Передача клиенту: короткий Loom + доступы в Notion.\n\nЧто НЕ делаю.\nНе пишу свою CMS — отдаю Sanity или Strapi. Не делаю «креативный дизайн с нуля» — проверенные паттерны. Не верстаю в Webflow сложнее one-pager — быстрее руками."
      },
      date: "28.03.2026", readMin: 8
    },
    {
      id: "b3",
      title: { ua: "n8n vs Make: коли що брати", en: "n8n vs Make: when to pick which", ru: "n8n vs Make: что брать" },
      excerpt: {
        ua: "Об'єктивне порівняння на трьох реальних кейсах. Без маркетингу.",
        en: "Honest comparison on three real cases. No marketing fluff.",
        ru: "Честное сравнение на трёх реальных кейсах. Без маркетинга."
      },
      body: {
        ua: "Коротко.\nMake (раніше Integromat) — хмарний сервіс з оплатою за operations. Гарний візуальний редактор, 1500+ готових інтеграцій. n8n — open-source, можна селф-хостити безкоштовно, оплата тільки за хмарну версію. Більш гнучкий: підтримує JavaScript code-ноди, бранчі, кастомні HTTP-запити.\n\nКоли беру Make.\nКлієнт не має DevOps і не хоче його. Простий сценарій: «з типформи в гугл-таблицю + у телеграм». 1000–5000 операцій на місяць. Готові інтеграції з нішевими SaaS, яких немає в n8n. Платіж $10–30/міс — клієнт сам тримає підписку.\n\nКоли беру n8n.\nКлієнт хоче контроль над даними (юристи, медицина, фінанси) — селф-хостимо на VPS за $5/міс. Великі обʼєми (10k+ операцій/міс) — на Make це вже сотні доларів, на n8n — те саме фіксоване $5. Складна логіка з умовами, циклами, обробкою помилок — n8n гнучкіший. Потрібен код всередині workflow — n8n дозволяє писати JS прямо в нодах.\n\nРеальні цифри з моїх кейсів.\nМагазин на Shopify, синхронізація з 1С (5k операцій/місяць): Make = $29, n8n self-hosted = $5. Зекономили $288/рік.\nCRM-автоматизація для агенції (300 операцій/місяць): Make = $0 на free плані, n8n cloud = $20. Тут Make дешевше.\nWebhook-роутер з кастомною логікою для боту (40k операцій): Make = $99, n8n = $5. Рiзниця х20.\n\nВисновок без води.\nДо 10k операцій + прості інтеграції → Make.\nВід 10k або потрібен контроль/код → n8n self-hosted.\nКлієнт без техніків → Make (нікому не потрібен ще один сервер для підтримки).",
        en: "Short version.\nMake (formerly Integromat) — cloud service, pay per operation. Solid visual editor, 1500+ pre-built integrations. n8n — open-source, can self-host for free, you only pay for cloud. More flexible: JavaScript code nodes, branches, custom HTTP. \n\nWhen I pick Make.\nClient has no DevOps and doesn't want any. Simple flow: «typeform → Google Sheet → Telegram». 1000–5000 operations/month. Niche SaaS integrations that n8n lacks. $10–30/mo — the client keeps the subscription.\n\nWhen I pick n8n.\nClient wants data control (legal, medical, finance) — self-host on a $5 VPS. Heavy volume (10k+ ops/mo) — that's hundreds of dollars on Make, still flat $5 on n8n. Complex logic with conditions, loops, error handling — n8n is more flexible. Need code inside the workflow — n8n lets you write JS right in the node.\n\nReal numbers from my cases.\nShopify store ↔ 1С sync (5k ops/mo): Make = $29, n8n self-hosted = $5. Saved $288/year.\nAgency CRM automation (300 ops/mo): Make = free, n8n cloud = $20. Make wins.\nWebhook router with custom logic for a bot (40k ops): Make = $99, n8n = $5. 20× difference.\n\nBottom line.\nUnder 10k ops + simple integrations → Make.\nOver 10k or need control/code → n8n self-hosted.\nClient without technical staff → Make (nobody wants another server to maintain).",
        ru: "Коротко.\nMake (бывший Integromat) — облачный сервис, оплата за operations. Хороший визуальный редактор, 1500+ готовых интеграций. n8n — open-source, можно селфхостить бесплатно, платишь только за облако. Гибче: JS code-ноды, ветки, кастомные HTTP.\n\nКогда беру Make.\nУ клиента нет DevOps и не хочется. Простой сценарий: «из тайпформы в гугл-таблицу + в телеграм». 1000–5000 операций в месяц. Готовые интеграции с нишевым SaaS, которых нет в n8n. Платёж $10–30/мес — клиент сам держит подписку.\n\nКогда беру n8n.\nКлиент хочет контроль над данными (юристы, медицина, финансы) — селфхост на VPS за $5/мес. Большие объёмы (10k+ операций/мес) — на Make это сотни долларов, на n8n те же фиксированные $5. Сложная логика с условиями, циклами, обработкой ошибок — n8n гибче. Нужен код внутри workflow — n8n позволяет писать JS прямо в нодах.\n\nРеальные цифры из кейсов.\nShopify ↔ 1С синхронизация (5k операций/мес): Make = $29, n8n self-hosted = $5. Сэкономили $288/год.\nCRM-автоматизация для агентства (300 операций/мес): Make = бесплатно, n8n cloud = $20. Здесь Make дешевле.\nWebhook-роутер с кастомной логикой для бота (40k операций): Make = $99, n8n = $5. Разница х20.\n\nВывод без воды.\nДо 10k операций + простые интеграции → Make.\nОт 10k или нужен контроль/код → n8n self-hosted.\nКлиент без техников → Make (никому не нужен ещё один сервер на поддержке)."
      },
      date: "15.03.2026", readMin: 5
    },
  ],

  // stats (about)
  stats: [
    { n: "2024", label: { ua: "рік старту в IT", en: "year I started", ru: "год старта в IT" } },
    { n: "1+",   label: { ua: "рік самонавчання", en: "year self-learning", ru: "год самообучения" } },
    { n: "10+",  label: { ua: "технологій у стеку", en: "technologies", ru: "технологий в стеке" } },
    { n: "0→1",  label: { ua: "перші проекти в роботі", en: "first real projects", ru: "первые проекты в работе" } },
  ],

  // tech stack
  techStack: {
    featured: [
      { name: "Python",     cat: { ua: "боти · бекенд", en: "bots · backend", ru: "боты · бэкенд" } },
      { name: "TypeScript", cat: { ua: "типобезпечний фронт", en: "typed frontend", ru: "типобезопасный фронт" } },
      { name: "React",      cat: { ua: "інтерфейси", en: "interfaces", ru: "интерфейсы" } },
      { name: "Next.js",    cat: { ua: "SSR-сайти · SaaS", en: "SSR sites · SaaS", ru: "SSR-сайты · SaaS" } },
      { name: "Node.js",    cat: { ua: "API · сервери", en: "API · servers", ru: "API · серверы" } },
      { name: "aiogram",    cat: { ua: "Telegram-боти", en: "Telegram bots", ru: "Telegram-боты" } },
      { name: "n8n",        cat: { ua: "автоматизації", en: "automations", ru: "автоматизации" } },
      { name: "PostgreSQL", cat: { ua: "продакшн БД", en: "production DB", ru: "продакшн БД" } },
    ],
    groups: [
      { id: "lang",         label: { ua: "Мови", en: "Languages", ru: "Языки" }, items: ["Python", "JavaScript", "TypeScript", "SQL", "HTML", "CSS"] },
      { id: "frontend",     label: { ua: "Фронтенд", en: "Frontend", ru: "Фронтенд" }, items: ["React", "Next.js", "Tailwind CSS", "Framer Motion", "shadcn/ui", "Astro", "Vite"] },
      { id: "backend",      label: { ua: "Бекенд", en: "Backend", ru: "Бэкенд" }, items: ["Node.js", "Flask", "Express"] },
      { id: "bots",         label: { ua: "Telegram-боти", en: "Telegram bots", ru: "Telegram-боты" }, items: ["aiogram", "Telegraf", "grammY", "python-telegram-bot"] },
      { id: "db",           label: { ua: "Бази даних", en: "Databases", ru: "Базы данных" }, items: ["PostgreSQL", "SQLite", "MongoDB", "Supabase", "Neon", "Redis", "Prisma"] },
      { id: "automation",   label: { ua: "Автоматизація", en: "Automation", ru: "Автоматизация" }, items: ["n8n", "Make", "REST API", "Webhooks"] },
      { id: "integrations", label: { ua: "Інтеграції", en: "Integrations", ru: "Интеграции" }, items: ["Stripe", "Telegram Bot API", "OpenAI / GPT"] },
      { id: "devops",       label: { ua: "DevOps · інструменти", en: "DevOps · tools", ru: "DevOps · инструменты" }, items: ["Git", "GitHub", "Vercel", "Railway", "Docker", "GA4", "Figma"] },
    ],
  },

  // contacts
  contacts: {
    email: "b.litvin2023@gmail.com",
    telegram: "@LytvinB",
    whatsapp: "",
    location: { ua: "Україна, віддалено", en: "Ukraine, remote", ru: "Украина, удалённо" },
  },

  // runtime state
  leads: [],       // contact form submissions
  visits: [],      // visit stats — {ts, page, variant}

  // telegram bot integration — set these in admin to forward form submissions
  telegram: {
    enabled: false,
    botToken: "",
    chatId: "",
    lastTest: null, // { ok, msg, ts }
  },
};

// send a lead to Telegram via bot API. Returns {ok, msg}.
async function sendToTelegram(lead, tgConfig) {
  try {
    let tg = tgConfig;
    if (!tg?.botToken) {
      // fallback: read from localStorage (always up-to-date with latest edits)
      const raw = localStorage.getItem(STORAGE_KEY);
      const stored = raw ? JSON.parse(raw) : DEFAULT_DATA;
      tg = stored.telegram || {};
    }
    if (!tg.enabled || !tg.botToken || !tg.chatId) return { ok: false, msg: "not configured" };
    const text = [
      "\uD83D\uDD14 *Нова заявка з сайту*",
      "",
      `\u{1F464} *Ім'я:* ${lead.name}`,
      `\u{1F4DE} *Контакт:* ${lead.contact}`,
      lead.msg ? `\u{1F4AC} *Повідомлення:*\n${lead.msg}` : "",
      "",
      `\u{1F552} ${new Date(lead.ts).toLocaleString("uk-UA")}`,
    ].filter(Boolean).join("\n");
    const url = `https://api.telegram.org/bot${tg.botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: tg.chatId, text, parse_mode: "Markdown" }),
    });
    const j = await res.json();
    if (!j.ok) return { ok: false, msg: j.description || "telegram error" };
    return { ok: true, msg: "sent" };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

// fire-and-forget: send lead to telegram AND mark it in store with delivery status
function deliverLead(leadId) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const data = JSON.parse(raw);
  const lead = (data.leads || []).find(l => l.id === leadId);
  if (!lead) return;
  sendToTelegram(lead).then(r => {
    const raw2 = localStorage.getItem(STORAGE_KEY);
    if (!raw2) return;
    const d = JSON.parse(raw2);
    const l = d.leads.find(x => x.id === leadId);
    if (l) { l.delivery = { ok: r.ok, msg: r.msg, ts: Date.now() }; }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    window.dispatchEvent(new CustomEvent("portfolio_store_update"));
  });
}

const STORAGE_KEY = "portfolio_v1";

function deepMerge(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) return b ?? a;
  if (typeof a !== "object" || a === null) return b ?? a;
  const out = { ...a };
  for (const k of Object.keys(b || {})) {
    out[k] = k in a ? deepMerge(a[k], b[k]) : b[k];
  }
  return out;
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    return deepMerge(structuredClone(DEFAULT_DATA), parsed);
  } catch (e) {
    return structuredClone(DEFAULT_DATA);
  }
}

function saveStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (window.PortfolioDB && window.PortfolioDB.mode === "remote") {
      window.PortfolioDB.saveContent(data).catch(e => {
        console.error("[saveStore] remote save failed:", e.message || e);
      });
    }
    window.dispatchEvent(new CustomEvent("portfolio_store_update"));
  } catch (e) {
    console.error("[saveStore] failed:", e);
  }
}

function resetStore() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("portfolio_store_update"));
}

// async hydration from remote on first paint
async function hydrateFromRemote() {
  if (!window.PortfolioDB || window.PortfolioDB.mode !== "remote") return null;
  try {
    const data = await window.PortfolioDB.loadContent(DEFAULT_DATA);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("portfolio_store_update"));
    return data;
  } catch (e) { return null; }
}

function useStore() {
  const [data, setData] = React.useState(() => loadStore());
  React.useEffect(() => {
    const reload = () => setData(loadStore());
    window.addEventListener("portfolio_store_update", reload);
    window.addEventListener("storage", reload);
    hydrateFromRemote();
    return () => {
      window.removeEventListener("portfolio_store_update", reload);
      window.removeEventListener("storage", reload);
    };
  }, []);
  const update = React.useCallback((mutator) => {
    setData((prev) => {
      const next = typeof mutator === "function" ? mutator(structuredClone(prev)) : mutator;
      saveStore(next);
      return next;
    });
  }, []);
  return [data, update];
}

function logVisit(variant) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : structuredClone(DEFAULT_DATA);
    data.visits = data.visits || [];
    data.visits.push({ ts: Date.now(), variant });
    if (data.visits.length > 1000) data.visits = data.visits.slice(-1000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (window.PortfolioDB && window.PortfolioDB.mode === "remote") {
      window.PortfolioDB.logVisit(variant).catch(()=>{});
    }
  } catch (e) {}
}

Object.assign(window, { useStore, loadStore, saveStore, resetStore, logVisit, sendToTelegram, deliverLead, DEFAULT_DATA });
