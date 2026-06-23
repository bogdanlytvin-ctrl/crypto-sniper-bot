// Shared data store using localStorage — used by both variations AND admin
// Admin changes are reflected in the portfolio site in real time

const STORAGE_KEY = "portfolio_v1";

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
    {
      id: "p1",
      title: "Пекар B2B",
      cat: "web",
      year: "2026",
      tag: { ua: "Система замовлень для пекарні", en: "Bakery B2B ordering system", ru: "Система заказов для пекарни" },
      desc: { ua: "Веб-платформа для оптових замовлень хліба. Клієнти оформляють замовлення онлайн, адмін бачить їх у dashboard. Next.js + Neon PostgreSQL + Vercel.", en: "Web platform for wholesale bread orders. Clients order online, admin sees orders in dashboard. Next.js + Neon PostgreSQL + Vercel.", ru: "Веб-платформа для оптовых заказов хлеба. Клиенты оформляют заказы онлайн, админ видит их в dashboard. Next.js + Neon PostgreSQL + Vercel." },
      stack: "Next.js · TypeScript · Tailwind · Neon PostgreSQL · Vercel",
      metric: "vpekar.vercel.app",
      url: "https://vpekar.vercel.app",
    },
    {
      id: "p2",
      title: "Сканер сайтів",
      cat: "automation",
      year: "2026",
      tag: { ua: "Платформа лід-генерації", en: "Lead generation platform", ru: "Платформа лид-генерации" },
      desc: { ua: "Знаходить бізнеси без сайту в будь-якому місті, аналізує їх, генерує шаблони для першого контакту. Мультімісто, фільтри, експорт у Excel.", en: "Finds businesses without a website in any city, analyses them, generates outreach templates. Multi-city, filters, Excel export.", ru: "Находит бизнесы без сайта в любом городе, анализирует их, генерирует шаблоны для первого контакта. Мультигород, фильтры, экспорт в Excel." },
      stack: "Next.js · TypeScript · Prisma · PostgreSQL · Railway",
      metric: "В роботі",
    },
    {
      id: "p3",
      title: "Крипто-снайпер-бот",
      cat: "telegram",
      year: "2026",
      tag: { ua: "Telegram-бот для трейдингу", en: "Telegram trading bot", ru: "Telegram-бот для трейдинга" },
      desc: { ua: "Telegram-бот для відстеження і торгівлі криптовалютами. Сповіщення по сигналах, управління гаманцем, оплата підписки прямо в боті.", en: "Telegram bot for crypto tracking and trading. Signal alerts, wallet management, subscription payments inside the bot.", ru: "Telegram-бот для отслеживания и торговли крипто. Уведомления по сигналам, управление кошельком, оплата подписки прямо в боте." },
      stack: "Python · aiogram · PostgreSQL · Railway",
      metric: "В роботі",
    },
    {
      id: "p4",
      title: "Парсер даних",
      cat: "automation",
      year: "2026",
      tag: { ua: "Парсер каталогів постачальників", en: "Supplier catalog parser", ru: "Парсер каталогов поставщиков" },
      desc: { ua: "Збирає каталог товарів (2000–3000 позицій) з сайтів постачальників за YAML-конфігом. Вивантажує в Excel/CSV + фото. Веб-інтерфейс на FastAPI, деплой у Docker.", en: "Collects product catalog (2000–3000 items) from supplier sites via YAML config. Exports to Excel/CSV + photos. FastAPI web UI, deployed on Docker.", ru: "Собирает каталог товаров (2000–3000 позиций) с сайтов поставщиков по YAML-конфигу. Выгружает в Excel/CSV + фото. Веб-интерфейс на FastAPI, деплой в Docker." },
      stack: "Python · FastAPI · Docker · Hugging Face Spaces",
      metric: "Онлайн",
    },
    {
      id: "p5",
      title: "Парсер-бот",
      cat: "telegram",
      year: "2026",
      tag: { ua: "Мультимовний Telegram-бот для парсингу", en: "Multilingual Telegram parsing bot", ru: "Мультиязычный Telegram-бот для парсинга" },
      desc: { ua: "Telegram-бот для парсингу оголошень по нішах, країнах і джерелах. Вибираєш країну → нішу → джерело → ключові слова → інтервал → канал. Планувальник надсилає нові пости автоматично.", en: "Telegram bot for parsing ads by niche, country, and source. Choose country → niche → source → keywords → interval → channel. Scheduler posts new results automatically.", ru: "Telegram-бот для парсинга объявлений по нишам, странам и источникам. Выбираешь страну → нишу → источник → ключевые слова → интервал → канал. Планировщик постит новые результаты автоматически." },
      stack: "Python · aiogram · SQLite · Railway",
      metric: "В роботі",
    },
    {
      id: "p6",
      title: "FTOS — FPV-довідник",
      cat: "web",
      year: "2026",
      tag: { ua: "Офлайн PWA для FPV-техніків", en: "Offline PWA for FPV technicians", ru: "Офлайн PWA для FPV-техников" },
      desc: { ua: "Офлайн-довідник техніка FPV-бригади. Вводиш симптом — отримуєш ймовірну причину і крок фіксу. Працює в полі без інтернету, mobile-first.", en: "Offline field guide for FPV brigade technicians. Enter a symptom — get the likely cause and fix steps. Works in the field without internet, mobile-first.", ru: "Офлайн-справочник техника FPV-бригады. Вводишь симптом — получаешь вероятную причину и шаг фикса. Работает в поле без интернета, mobile-first." },
      stack: "Next.js · TypeScript · PWA · Vercel",
      url: "https://ftos-rho.vercel.app",
      metric: "Онлайн",
    },
    {
      id: "p7",
      title: "Сайт-візитка (цей сайт)",
      cat: "card",
      year: "2026",
      tag: { ua: "Особистий портфоліо-сайт", en: "Personal portfolio site", ru: "Личный сайт-портфолио" },
      desc: { ua: "Сайт-портфоліо з адмінкою, двома темами, мультимовністю та формою заявок. Зроблений для себе як перший серйозний проект з нуля.", en: "Portfolio site with admin panel, two themes, multilanguage and lead form. Built for myself as my first serious project from scratch.", ru: "Сайт-портфолио с админкой, двумя темами, мультиязычностью и формой заявок. Сделан для себя как первый серьёзный проект с нуля." },
      stack: "HTML · JavaScript · React · Supabase · Vercel",
      metric: "Онлайн",
      url: "https://saitvizitka-v2.vercel.app",
    },
  ],

  // categories (filters)
  categories: [
    { id: "all", label: { ua: "Все", en: "All", ru: "Все" } },
    { id: "telegram", label: { ua: "Боти", en: "Bots", ru: "Боты" } },
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
      { id: "bot",     label: { ua: "Telegram-бот",  en: "Telegram bot",   ru: "Telegram-бот"    }, base: 50,  days: 4,  icon: "✈" },
      { id: "landing", label: { ua: "Лендинг",        en: "Landing page",   ru: "Лендинг"          }, base: 80,  days: 5,  icon: "▤" },
      { id: "site",    label: { ua: "Сайт-візитка",   en: "Business site",  ru: "Сайт-визитка"    }, base: 100, days: 7,  icon: "▣" },
      { id: "app",     label: { ua: "Веб-додаток",    en: "Web app",        ru: "Веб-приложение"  }, base: 200, days: 14, icon: "◈" },
      { id: "auto",    label: { ua: "Автоматизація",  en: "Automation",     ru: "Автоматизация"   }, base: 40,  days: 5,  icon: "⟳" },
    ],
    features: [
      { id: "admin",    price: 50,  days: 3, label: { ua: "Адмінка",            en: "Admin panel",      ru: "Админка"           } },
      { id: "i18n",     price: 30,  days: 2, label: { ua: "Мультимовність",      en: "Multi-language",   ru: "Мультиязычность"   } },
      { id: "payments", price: 80,  days: 3, label: { ua: "Платежі",             en: "Payments",         ru: "Платежи"           } },
      { id: "auth",     price: 40,  days: 2, label: { ua: "Авторизація",         en: "Auth",             ru: "Авторизация"       } },
      { id: "ai",       price: 80,  days: 4, label: { ua: "AI / GPT-інтеграція", en: "AI / GPT",         ru: "AI / GPT"          } },
      { id: "crm",      price: 50,  days: 2, label: { ua: "CRM-інтеграція",      en: "CRM integration",  ru: "CRM-интеграция"    } },
      { id: "design",   price: 60,  days: 3, label: { ua: "Унікальний дизайн",   en: "Custom design",    ru: "Уникальный дизайн" } },
      { id: "seo",      price: 30,  days: 1, label: { ua: "SEO",                 en: "SEO",              ru: "SEO"               } },
    ],
    urgency: [
      { id: "normal", mult: 1,   label: { ua: "Звичайно",         en: "Normal",       ru: "Обычно"  } },
      { id: "fast",   mult: 1.3, label: { ua: "Швидко (×1.3)",   en: "Fast (×1.3)",  ru: "Быстро (×1.3)" } },
      { id: "urgent", mult: 1.7, label: { ua: "Терміново (×1.7)", en: "Urgent (×1.7)",ru: "Срочно (×1.7)" } },
    ],
  },

  // FAQ
  faq: [
    { id: "f1", q: { ua: "Скільки триває розробка?", en: "How long does it take?", ru: "Сколько длится разработка?" }, a: { ua: "Бот або лендинг — 3–7 днів. Веб-додаток — 2–4 тижні. Все залежить від обсягу.", en: "Bot or landing — 3–7 days. Web app — 2–4 weeks. Depends on scope.", ru: "Бот или лендинг — 3–7 дней. Веб-приложение — 2–4 недели. Всё зависит от объёма." } },
    { id: "f2", q: { ua: "Як відбувається оплата?", en: "How does payment work?", ru: "Как происходит оплата?" }, a: { ua: "50% передоплата, 50% після запуску. Картка, IBAN, USDT.", en: "50% upfront, 50% on delivery. Card, IBAN, USDT.", ru: "50% предоплата, 50% после запуска. Карта, IBAN, USDT." } },
    { id: "f3", q: { ua: "Що з підтримкою після запуску?", en: "What about post-launch support?", ru: "Что с поддержкой после запуска?" }, a: { ua: "30 днів безкоштовних правок у межах ТЗ. Далі — погодинно або підписка.", en: "30 days of free fixes within spec. After — hourly or subscription.", ru: "30 дней бесплатных правок в ТЗ. Далее — почасово или подписка." } },
    { id: "f4", q: { ua: "Ти досвідчений розробник?", en: "Are you an experienced developer?", ru: "Ты опытный разработчик?" }, a: { ua: "Чесно — на старті шляху. Самоучка, вивчаю Python і JavaScript, роблю перші реальні проекти. Саме тому ціни адекватні, а підхід — відповідальний.", en: "Honestly — just getting started. Self-taught, learning Python and JavaScript, doing first real projects. That's why prices are fair and approach is responsible.", ru: "Честно — в начале пути. Самоучка, изучаю Python и JavaScript, делаю первые реальные проекты. Именно поэтому цены адекватные, а подход — ответственный." } },
    { id: "f5", q: { ua: "Чи є гарантія?", en: "Is there a warranty?", ru: "Есть ли гарантия?" }, a: { ua: "Так — виправлю всі баги після здачі. Не зникаю після оплати.", en: "Yes — I fix all bugs after delivery. I don't disappear after payment.", ru: "Да — исправлю все баги после сдачи. Не исчезаю после оплаты." } },
  ],

  // blog
  blog: [
    {
      id: "b1",
      title: { ua: "Чому я почав з Python і ботів", en: "Why I started with Python and bots", ru: "Почему я начал с Python и ботов" },
      excerpt: {
        ua: "Мій шлях у розробку: з чого починав, що допомогло, і чому Telegram-боти — ідеальний старт для самоучки.",
        en: "My path into dev: where I started, what helped, and why Telegram bots are the perfect start for a self-learner.",
        ru: "Мой путь в разработку: с чего начинал, что помогло, и почему Telegram-боты — идеальный старт для самоучки."
      },
      body: {
        ua: "Я починав без IT-освіти і без чіткого плану. Просто хотів автоматизувати дрібниці в житті — нагадування, збір інформації, щось корисне для знайомих.\n\nПочав з Python, бо він читається майже як звичайний текст. Перша програма — калькулятор. Потім скрипти для парсингу. Потім перший бот у Telegram — простий, на одну команду. Але він працював, і це було важливо.\n\nЧому боти?\nТелеграм-бот — це ідеальний перший проект. Є чітке API, зрозумілий результат, і можна показати другу вже через тиждень навчання. Не потрібен складний сервер — достатньо безкоштовного Render або Railway. І одразу є реальна задача: зробити щось корисне, а не черговий to-do list з туторіалу.\n\nЩо вивчаю зараз?\nPython + aiogram для ботів. JavaScript для фронту — React, базовий HTML/CSS. n8n для автоматизацій без зайвого коду. Трохи SQL — щоб розуміти бази даних.\n\nПорада собі на старті.\nНе намагайся вивчити все одразу. Обери одну технологію, зроби на ній щось реальне, покажи комусь. Це дає набагато більше мотивації, ніж проходити курс за курсом без результату.",
        en: "I started without an IT degree and without a clear plan. Just wanted to automate small things in life — reminders, gathering info, something useful for friends.\n\nI started with Python because it reads almost like plain text. First program — a calculator. Then scraping scripts. Then the first Telegram bot — simple, one command. But it worked, and that mattered.\n\nWhy bots?\nA Telegram bot is the perfect first project. There's a clear API, an obvious result, and you can show a friend something in a week. No complicated server setup — a free Render or Railway account is enough. And you immediately have a real task: make something useful, not another to-do list from a tutorial.\n\nWhat am I learning now?\nPython + aiogram for bots. JavaScript for frontend — React, basic HTML/CSS. n8n for automations without excessive code. A bit of SQL to understand databases.\n\nAdvice to myself at the start.\nDon't try to learn everything at once. Pick one technology, build something real with it, show it to someone. That gives far more motivation than going through course after course with nothing to show.",
        ru: "Я начинал без IT-образования и без чёткого плана. Просто хотел автоматизировать мелочи в жизни — напоминания, сбор информации, что-то полезное для знакомых.\n\nНачал с Python, потому что он читается почти как обычный текст. Первая программа — калькулятор. Потом скрипты для парсинга. Потом первый бот в Telegram — простой, на одну команду. Но он работал, и это было важно.\n\nПочему боты?\nTelegram-бот — идеальный первый проект. Есть чёткое API, понятный результат, и можно показать другу уже через неделю учёбы. Не нужен сложный сервер — хватает бесплатного Render или Railway. И сразу есть реальная задача: сделать что-то полезное, а не очередной to-do list из туториала.\n\nЧто изучаю сейчас?\nPython + aiogram для ботов. JavaScript для фронта — React, базовый HTML/CSS. n8n для автоматизаций без лишнего кода. Немного SQL — чтобы понимать базы данных.\n\nСовет себе на старте.\nНе пытайся выучить всё сразу. Выбери одну технологию, сделай на ней что-то реальное, покажи кому-нибудь. Это даёт гораздо больше мотивации, чем проходить курс за курсом без результата."
      },
      date: "01.06.2026", readMin: 4
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
      { name: "Python",     cat: { ua: "боти · скрипти", en: "bots · scripts", ru: "боты · скрипты" } },
      { name: "JavaScript", cat: { ua: "фронтенд · логіка", en: "frontend · logic", ru: "фронтенд · логика" } },
      { name: "aiogram",    cat: { ua: "Telegram-боти", en: "Telegram bots", ru: "Telegram-боты" } },
      { name: "React",      cat: { ua: "інтерфейси (вчу)", en: "interfaces (learning)", ru: "интерфейсы (учу)" } },
      { name: "n8n",        cat: { ua: "автоматизації", en: "automations", ru: "автоматизации" } },
      { name: "SQLite",     cat: { ua: "бази даних", en: "databases", ru: "базы данных" } },
    ],
    groups: [
      { id: "lang",       label: { ua: "Мови", en: "Languages", ru: "Языки" }, items: ["Python", "JavaScript", "HTML", "CSS", "SQL"] },
      { id: "frontend",   label: { ua: "Фронтенд", en: "Frontend", ru: "Фронтенд" }, items: ["React", "Vite", "Tailwind CSS"] },
      { id: "bots",       label: { ua: "Telegram-боти", en: "Telegram bots", ru: "Telegram-боты" }, items: ["aiogram", "Telegram Bot API"] },
      { id: "db",         label: { ua: "Бази даних", en: "Databases", ru: "Базы данных" }, items: ["SQLite", "Supabase", "PostgreSQL"] },
      { id: "automation", label: { ua: "Автоматизація", en: "Automation", ru: "Автоматизация" }, items: ["n8n", "Make", "Webhooks"] },
      { id: "tools",      label: { ua: "Інструменти", en: "Tools", ru: "Инструменты" }, items: ["Git", "GitHub", "Vercel", "Railway", "Figma"] },
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
