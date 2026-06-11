'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Shield, Lock, Coins, FileCode, Server,
  ScanSearch, FileJson, FileText, ArrowLeft,
  CheckCircle2, AlertTriangle, Bug, Cpu, Network,
  BookOpen, Layers, Zap, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { Header } from '@/components/dashboard/Header';

// ─── Icon map (separate from text content) ───────────────────────────────────
const MODULE_ICONS: LucideIcon[] = [Server, Lock, FileCode, Bug, Coins, Eye, Cpu, Network];
const MODULE_COLORS = [
  { color: 'text-blue-400',   bg: 'bg-blue-500/10',   ring: 'ring-blue-500/20'   },
  { color: 'text-orange-400', bg: 'bg-orange-500/10', ring: 'ring-orange-500/20' },
  { color: 'text-yellow-400', bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/20' },
  { color: 'text-red-400',    bg: 'bg-red-500/10',    ring: 'ring-red-500/20'    },
  { color: 'text-amber-400',  bg: 'bg-amber-500/10',  ring: 'ring-amber-500/20'  },
  { color: 'text-pink-400',   bg: 'bg-pink-500/10',   ring: 'ring-pink-500/20'   },
  { color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   ring: 'ring-cyan-500/20'   },
  { color: 'text-violet-400', bg: 'bg-violet-500/10', ring: 'ring-violet-500/20' },
];

// ─── All text content by locale (plain strings only) ─────────────────────────
const CONTENT = {
  en: {
    title: 'What SecureScope Can Do',
    subtitle: 'A professional-grade, open security scanner for Web 2.0 and Web 3.0 sites. No signup, no tracking, no limits.',
    backLabel: 'Back to Scanner',
    modulesTitle: 'Analysis Modules',
    modesTitle: 'Scan Modes',
    reportsTitle: 'Report Formats',
    owaspTitle: 'OWASP Top 10 Mapping',
    owaspDesc: 'Every finding is mapped to the relevant OWASP Top 10 (2021) category so you can prioritise remediation by industry standard.',
    riskTitle: 'Smart Risk Engine',
    riskDesc: 'The risk score is not a simple sum. The engine applies combo rules — when multiple related findings are present, severity escalates automatically. Example: missing CSP + detected XSS sink → XSS escalates to CRITICAL. Auth context boosts cookie findings when login forms are detected. Static sites get automatic CSP descalation.',
    ctaTitle: 'Ready to try it?',
    ctaDesc: 'Paste a URL and get a full security report in seconds.',
    ctaBtn: 'Start Scanning',
    modules: [
      {
        title: 'HTTP Security Headers',
        checks: [
          'Content-Security-Policy — presence + weakness (unsafe-inline, unsafe-eval, wildcard)',
          'Strict-Transport-Security (HSTS)',
          'X-Frame-Options (clickjacking protection)',
          'X-Content-Type-Options: nosniff',
          'Referrer-Policy',
          'Permissions-Policy',
          'CORS misconfiguration (Allow-Origin: * + credentials)',
          'Server version disclosure in headers',
          'WAF/CDN challenge detection (CloudFlare, AWS WAF)',
        ],
      },
      {
        title: 'Cookie & Session Security',
        checks: [
          'Missing Secure flag on auth cookies',
          'Missing HttpOnly flag (XSS token theft risk)',
          'Missing SameSite attribute (CSRF risk)',
          'Auth context detection — cookies near login forms scored higher',
          'Smart whitelist: analytics, CDN, GDPR, tracking cookies filtered out',
        ],
      },
      {
        title: 'DOM / HTML Analysis',
        checks: [
          'Forms without CSRF tokens',
          'Password fields without autocomplete attribute',
          'Mixed content — active (script/iframe/object over HTTP) and passive (img/link)',
          'Sensitive meta tags (CMS version, api-key)',
          'Reverse tabnapping: target="_blank" without rel="noopener"',
          'Iframes without sandbox attribute',
          'Forms submitting to external domains',
          'Web3 external CDN scripts from unknown origins',
        ],
      },
      {
        title: 'JavaScript Analysis',
        checks: [
          'Hardcoded API keys — 16 patterns: AWS, Google, Stripe, GitHub, Slack, Twilio, JWT, PEM, Infura, Alchemy…',
          'Shannon entropy filter — removes placeholders and test values',
          'XSS sinks: document.write(), innerHTML, outerHTML with dynamic variables',
          'Exposed API endpoints in inline scripts (/api/admin, /api/auth, /api/token)',
          'localStorage / sessionStorage with sensitive keys (token, password, seed)',
          'postMessage handlers containing auth / payment keywords',
          'External scripts without Subresource Integrity (SRI)',
        ],
      },
      {
        title: 'Web3 / Blockchain Detection',
        checks: [
          'Ethereum addresses — EIP-55 format, zero/example address filtering',
          'Bitcoin addresses: Legacy (1..., 3...) and Bech32 (bc1...)',
          'BIP-39 seed phrase detection — 12/24 word sequences',
          'Clipboard hijacking via navigator.clipboard.writeText',
          'window.ethereum provider override (wallet drainer signature)',
          'Unlimited approve() / setApprovalForAll() calls (wallet drainer)',
          'Address reuse: same address on 3+ pages = centralised collection',
          'Known scam / drainer address blacklist',
        ],
      },
      {
        title: 'Information Leakage',
        checks: [
          'Email addresses in source (public/contact prefixes filtered)',
          'Phone numbers — international formats, SVG coordinate false-positives filtered',
          'Sensitive HTML comments (TODO/password/secret — copyright excluded)',
          'Internal IPs: 10.x, 172.16–31.x, 192.168.x, 169.254.x',
          'Stack traces — PHP Fatal Error, Python Traceback, JS Error at Function',
          'Hidden inputs with API key / secret field names',
          'Open redirects via ?redirect= and ?next= parameters',
        ],
      },
      {
        title: 'Technology Fingerprinting',
        checks: [
          'Web server (nginx, Apache, IIS, Caddy) + version',
          'Frameworks (Next.js, Nuxt, React, Vue, Angular, Laravel, Django)',
          'CMS (WordPress, Drupal, Joomla, Shopify, Ghost)',
          'CDN (Cloudflare, Fastly, Akamai, AWS CloudFront)',
          'Analytics (Google Analytics UA-/G-, Hotjar, Mixpanel, Segment)',
          'Payment providers (Stripe.js, Braintree)',
          'Crypto libraries (web3.js, ethers.js, wagmi)',
        ],
      },
      {
        title: 'Path Probing',
        checks: [
          '/.env, /.env.local, /.env.production — credential exposure',
          '/.git/HEAD, /.git/config — git repository exposed',
          '/backup.sql, /dump.sql, /backup.zip — database dumps',
          '/phpinfo.php, /info.php — PHP config leak',
          '/phpmyadmin — database admin panel',
          '/debug.log, /storage/logs/laravel.log',
          'robots.txt — sensitive Disallow paths (/admin, /backup, /private)',
          'TRACE method enabled check',
          'HTTP → HTTPS redirect check',
          'security.txt presence',
        ],
      },
    ],
    modes: [
      {
        title: 'Single Page Scan',
        desc: 'Scans the exact URL entered. Runs all 8 analysis modules on one page. Fastest option — typically 3–10 seconds.',
      },
      {
        title: 'Multi-Page Crawl',
        desc: 'BFS crawl up to 10 pages, depth 2. Priority paths scanned first: /login, /admin, /wallet, /checkout, /auth, /dashboard. Also reads robots.txt and sitemap.xml. Each finding shows which page it was detected on.',
      },
    ],
    reports: [
      { title: 'HTML Report', desc: 'Full visual report with print-to-PDF button, OWASP classification, tech stack, risk score, all findings with evidence and fix instructions.' },
      { title: 'JSON Report', desc: 'Machine-readable export with full finding data, OWASP mapping, crawl stats, and tech stack. For CI/CD pipelines or custom tooling.' },
      { title: 'TXT Report', desc: 'Plain-text summary with findings, severity, evidence, explanation, and fix instructions. Easy to share via email or ticket.' },
    ],
  },
  uk: {
    title: 'Що вміє SecureScope',
    subtitle: 'Професійний безкоштовний сканер безпеки для сайтів Web 2.0 і Web 3.0. Без реєстрації, без відстеження, без обмежень.',
    backLabel: 'Назад до сканера',
    modulesTitle: 'Модулі аналізу',
    modesTitle: 'Режими сканування',
    reportsTitle: 'Формати звітів',
    owaspTitle: 'Відповідність OWASP Top 10',
    owaspDesc: 'Кожна знахідка відображається на відповідну категорію OWASP Top 10 (2021), щоб ви могли пріоритизувати усунення за галузевим стандартом.',
    riskTitle: 'Розумний рушій ризиків',
    riskDesc: 'Оцінка ризику — не проста сума. Рушій застосовує комбо-правила: коли присутні кілька пов\'язаних знахідок, серйозність ескалює автоматично. Приклад: відсутній CSP + XSS-точка → XSS ескалює до КРИТИЧНОГО. Контекст авторизації підвищує cookie-знахідки якщо виявлено форми входу. Статичні сайти отримують автоматичне зниження CSP.',
    ctaTitle: 'Готові спробувати?',
    ctaDesc: 'Вставте URL і отримайте повний звіт безпеки за секунди.',
    ctaBtn: 'Почати сканування',
    modules: [
      {
        title: 'HTTP Заголовки безпеки',
        checks: [
          'Content-Security-Policy — наявність + слабкість (unsafe-inline, unsafe-eval, wildcard)',
          'Strict-Transport-Security (HSTS)',
          'X-Frame-Options (захист від clickjacking)',
          'X-Content-Type-Options: nosniff',
          'Referrer-Policy',
          'Permissions-Policy',
          'Помилкова конфігурація CORS (Allow-Origin: * + credentials)',
          'Розкриття версії сервера в заголовках',
          'Виявлення WAF/CDN (CloudFlare, AWS WAF)',
        ],
      },
      {
        title: 'Безпека Cookie та сесій',
        checks: [
          'Відсутній прапор Secure на auth-cookie',
          'Відсутній прапор HttpOnly (ризик крадіжки токена через XSS)',
          'Відсутній атрибут SameSite (ризик CSRF)',
          'Виявлення контексту авторизації — cookie біля форм входу оцінюються вище',
          'Розумний білий список: аналітика, CDN, GDPR, tracking-cookie відфільтровані',
        ],
      },
      {
        title: 'DOM / HTML Аналіз',
        checks: [
          'Форми без CSRF-токенів',
          'Поля паролів без атрибута autocomplete',
          'Змішаний контент — активний (script/iframe/object через HTTP) і пасивний (img/link)',
          'Sensitive мета-теги (версія CMS, api-key)',
          'Reverse tabnapping: target="_blank" без rel="noopener"',
          'Iframe без атрибута sandbox',
          'Форми, що відправляють дані на зовнішні домени',
          'Зовнішні Web3 CDN скрипти з невідомих джерел',
        ],
      },
      {
        title: 'Аналіз JavaScript',
        checks: [
          'Hardcoded API ключі — 16 паттернів: AWS, Google, Stripe, GitHub, Slack, Twilio, JWT, PEM, Infura, Alchemy…',
          'Фільтр ентропії Шеннона — видаляє заповнювачі та тестові значення',
          'XSS-точки: document.write(), innerHTML, outerHTML з динамічними змінними',
          'Відкриті API ендпоінти в inline-скриптах (/api/admin, /api/auth, /api/token)',
          'localStorage / sessionStorage з чутливими ключами (token, password, seed)',
          'Обробники postMessage з ключовими словами auth / payment',
          'Зовнішні скрипти без Subresource Integrity (SRI)',
        ],
      },
      {
        title: 'Виявлення Web3 / Блокчейн',
        checks: [
          'Адреси Ethereum — формат EIP-55, фільтрація нульових/прикладних адрес',
          'Адреси Bitcoin: Legacy (1..., 3...) та Bech32 (bc1...)',
          'Виявлення seed-фраз BIP-39 — послідовності 12/24 слів',
          'Перехоплення буфера обміну через navigator.clipboard.writeText',
          'Перевизначення window.ethereum (підпис wallet drainer)',
          'Виклики unlimited approve() / setApprovalForAll() (wallet drainer)',
          'Повторне використання адреси на 3+ сторінках',
          'Чорний список відомих scam/drainer адрес',
        ],
      },
      {
        title: 'Витік інформації',
        checks: [
          'Email-адреси в коді сторінки (публічні/контактні префікси відфільтровані)',
          'Номери телефонів — міжнародні формати, фільтрація SVG-координат',
          'Sensitive HTML-коментарі (TODO/password/secret — copyright виключено)',
          'Внутрішні IP: 10.x, 172.16–31.x, 192.168.x, 169.254.x',
          'Stack traces — PHP Fatal Error, Python Traceback, JS Error at Function',
          'Hidden inputs з іменами API ключів / секретів',
          'Відкриті редиректи через параметри ?redirect= та ?next=',
        ],
      },
      {
        title: 'Фінгерпринт технологій',
        checks: [
          'Веб-сервер (nginx, Apache, IIS, Caddy) + версія',
          'Фреймворки (Next.js, Nuxt, React, Vue, Angular, Laravel, Django)',
          'CMS (WordPress, Drupal, Joomla, Shopify, Ghost)',
          'CDN (Cloudflare, Fastly, Akamai, AWS CloudFront)',
          'Аналітика (Google Analytics UA-/G-, Hotjar, Mixpanel, Segment)',
          'Платіжні провайдери (Stripe.js, Braintree)',
          'Крипто-бібліотеки (web3.js, ethers.js, wagmi)',
        ],
      },
      {
        title: 'Зондування шляхів',
        checks: [
          '/.env, /.env.local, /.env.production — відкриті облікові дані',
          '/.git/HEAD, /.git/config — відкритий git-репозиторій',
          '/backup.sql, /dump.sql, /backup.zip — дампи БД',
          '/phpinfo.php, /info.php — витік конфігурації PHP',
          '/phpmyadmin — панель адмінування БД',
          '/debug.log, /storage/logs/laravel.log',
          'robots.txt — чутливі Disallow-шляхи (/admin, /backup, /private)',
          'Перевірка методу TRACE',
          'Перевірка HTTP → HTTPS редиректу',
          'Наявність security.txt',
        ],
      },
    ],
    modes: [
      {
        title: 'Сканування однієї сторінки',
        desc: 'Сканує точно вказаний URL. Запускає всі 8 модулів аналізу на одній сторінці. Найшвидший варіант — зазвичай 3–10 секунд.',
      },
      {
        title: 'Багатосторінковий обхід',
        desc: 'BFS-обхід до 10 сторінок, глибина 2. Пріоритетні шляхи скануються першими: /login, /admin, /wallet, /checkout, /auth, /dashboard. Також читає robots.txt та sitemap.xml. Кожна знахідка показує сторінку, де її знайдено.',
      },
    ],
    reports: [
      { title: 'HTML Звіт', desc: 'Повний візуальний звіт з кнопкою друку в PDF, класифікацією OWASP, стеком технологій, оцінкою ризику, всіма знахідками з доказами та інструкціями з виправлення.' },
      { title: 'JSON Звіт', desc: 'Машиночитабельний експорт з повними даними знахідок, OWASP-маппінгом, статистикою обходу та стеком технологій. Для CI/CD або власних інструментів.' },
      { title: 'TXT Звіт', desc: 'Текстовий підсумок з усіма знахідками, серйозністю, доказами, поясненням та інструкціями. Зручно надсилати поштою або в тікеті.' },
    ],
  },
  ru: {
    title: 'Что умеет SecureScope',
    subtitle: 'Профессиональный бесплатный сканер безопасности для сайтов Web 2.0 и Web 3.0. Без регистрации, без трекинга, без ограничений.',
    backLabel: 'Вернуться к сканеру',
    modulesTitle: 'Модули анализа',
    modesTitle: 'Режимы сканирования',
    reportsTitle: 'Форматы отчётов',
    owaspTitle: 'Соответствие OWASP Top 10',
    owaspDesc: 'Каждая находка сопоставляется с соответствующей категорией OWASP Top 10 (2021), чтобы вы могли приоритизировать исправление по отраслевому стандарту.',
    riskTitle: 'Умный движок рисков',
    riskDesc: 'Оценка риска — не простая сумма. Движок применяет комбо-правила: когда присутствуют несколько связанных находок, серьёзность эскалируется автоматически. Пример: отсутствует CSP + XSS-точка → XSS эскалирует до КРИТИЧЕСКОГО. Контекст авторизации повышает cookie-находки если обнаружены формы входа. Статические сайты получают автоматическое снижение CSP.',
    ctaTitle: 'Готовы попробовать?',
    ctaDesc: 'Вставьте URL и получите полный отчёт безопасности за секунды.',
    ctaBtn: 'Начать сканирование',
    modules: [
      {
        title: 'HTTP Заголовки безопасности',
        checks: [
          'Content-Security-Policy — наличие + слабость (unsafe-inline, unsafe-eval, wildcard)',
          'Strict-Transport-Security (HSTS)',
          'X-Frame-Options (защита от clickjacking)',
          'X-Content-Type-Options: nosniff',
          'Referrer-Policy',
          'Permissions-Policy',
          'Неверная конфигурация CORS (Allow-Origin: * + credentials)',
          'Раскрытие версии сервера в заголовках',
          'Определение WAF/CDN (CloudFlare, AWS WAF)',
        ],
      },
      {
        title: 'Безопасность Cookie и сессий',
        checks: [
          'Отсутствует флаг Secure на auth-cookie',
          'Отсутствует флаг HttpOnly (риск кражи токена через XSS)',
          'Отсутствует атрибут SameSite (риск CSRF)',
          'Определение контекста авторизации — cookie рядом с формами входа оцениваются выше',
          'Умный белый список: аналитика, CDN, GDPR, tracking cookie отфильтрованы',
        ],
      },
      {
        title: 'DOM / HTML Анализ',
        checks: [
          'Формы без CSRF-токенов',
          'Поля паролей без атрибута autocomplete',
          'Смешанный контент — активный (script/iframe/object через HTTP) и пассивный (img/link)',
          'Чувствительные мета-теги (версия CMS, api-key)',
          'Reverse tabnapping: target="_blank" без rel="noopener"',
          'Iframe без атрибута sandbox',
          'Формы, отправляющие данные на внешние домены',
          'Внешние Web3 CDN скрипты с неизвестных источников',
        ],
      },
      {
        title: 'Анализ JavaScript',
        checks: [
          'Hardcoded API ключи — 16 паттернов: AWS, Google, Stripe, GitHub, Slack, Twilio, JWT, PEM, Infura, Alchemy…',
          'Фильтр энтропии Шеннона — удаляет заглушки и тестовые значения',
          'XSS-точки: document.write(), innerHTML, outerHTML с динамическими переменными',
          'Открытые API эндпоинты в inline-скриптах (/api/admin, /api/auth, /api/token)',
          'localStorage / sessionStorage с чувствительными ключами (token, password, seed)',
          'Обработчики postMessage с ключевыми словами auth / payment',
          'Внешние скрипты без Subresource Integrity (SRI)',
        ],
      },
      {
        title: 'Обнаружение Web3 / Блокчейн',
        checks: [
          'Адреса Ethereum — формат EIP-55, фильтрация нулевых/примерных адресов',
          'Адреса Bitcoin: Legacy (1..., 3...) и Bech32 (bc1...)',
          'Обнаружение seed-фраз BIP-39 — последовательности 12/24 слов',
          'Перехват буфера обмена через navigator.clipboard.writeText',
          'Переопределение window.ethereum (подпись wallet drainer)',
          'Вызовы unlimited approve() / setApprovalForAll() (wallet drainer)',
          'Повторное использование адреса на 3+ страницах',
          'Чёрный список известных scam/drainer адресов',
        ],
      },
      {
        title: 'Утечка информации',
        checks: [
          'Email-адреса в коде страницы (публичные/контактные префиксы отфильтрованы)',
          'Телефонные номера — международные форматы, фильтрация SVG-координат',
          'Чувствительные HTML-комментарии (TODO/password/secret — copyright исключён)',
          'Внутренние IP: 10.x, 172.16–31.x, 192.168.x, 169.254.x',
          'Stack traces — PHP Fatal Error, Python Traceback, JS Error at Function',
          'Hidden inputs с именами API ключей / секретов',
          'Открытые редиректы через параметры ?redirect= и ?next=',
        ],
      },
      {
        title: 'Фингерпринт технологий',
        checks: [
          'Веб-сервер (nginx, Apache, IIS, Caddy) + версия',
          'Фреймворки (Next.js, Nuxt, React, Vue, Angular, Laravel, Django)',
          'CMS (WordPress, Drupal, Joomla, Shopify, Ghost)',
          'CDN (Cloudflare, Fastly, Akamai, AWS CloudFront)',
          'Аналитика (Google Analytics UA-/G-, Hotjar, Mixpanel, Segment)',
          'Платёжные провайдеры (Stripe.js, Braintree)',
          'Крипто-библиотеки (web3.js, ethers.js, wagmi)',
        ],
      },
      {
        title: 'Зондирование путей',
        checks: [
          '/.env, /.env.local, /.env.production — открытые учётные данные',
          '/.git/HEAD, /.git/config — открытый git-репозиторий',
          '/backup.sql, /dump.sql, /backup.zip — дампы БД',
          '/phpinfo.php, /info.php — утечка конфигурации PHP',
          '/phpmyadmin — панель администрирования БД',
          '/debug.log, /storage/logs/laravel.log',
          'robots.txt — чувствительные Disallow-пути (/admin, /backup, /private)',
          'Проверка метода TRACE',
          'Проверка HTTP → HTTPS редиректа',
          'Наличие security.txt',
        ],
      },
    ],
    modes: [
      {
        title: 'Сканирование одной страницы',
        desc: 'Сканирует точно указанный URL. Запускает все 8 модулей анализа на одной странице. Самый быстрый вариант — обычно 3–10 секунд.',
      },
      {
        title: 'Многостраничный обход',
        desc: 'BFS-обход до 10 страниц, глубина 2. Приоритетные пути сканируются первыми: /login, /admin, /wallet, /checkout, /auth, /dashboard. Также читает robots.txt и sitemap.xml. Каждая находка показывает страницу, где она была обнаружена.',
      },
    ],
    reports: [
      { title: 'HTML Отчёт', desc: 'Полный визуальный отчёт с кнопкой печати в PDF, классификацией OWASP, стеком технологий, оценкой риска, всеми находками с доказательствами и инструкциями по исправлению.' },
      { title: 'JSON Отчёт', desc: 'Машиночитаемый экспорт с полными данными находок, OWASP-маппингом, статистикой обхода и стеком технологий. Для CI/CD или собственных инструментов.' },
      { title: 'TXT Отчёт', desc: 'Текстовый итог со всеми находками, серьёзностью, доказательствами, объяснением и инструкциями. Удобно отправлять почтой или в тикете.' },
    ],
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const { locale } = useI18n();
  const c = CONTENT[locale] ?? CONTENT.en;

  return (
    <div className="min-h-screen flex flex-col" translate="no">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 opacity-[0.03]" aria-hidden>
            <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <Shield className="h-8 w-8 text-emerald-500" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3">
                {c.title}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
                {c.subtitle}
              </p>
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {c.backLabel}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-14">

          {/* ── Modules ─────────────────────────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-500" />
              {c.modulesTitle}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {c.modules.map((mod, idx) => {
                const Icon = MODULE_ICONS[idx] ?? Shield;
                const { color, bg, ring } = MODULE_COLORS[idx] ?? MODULE_COLORS[0];
                return (
                  <div key={mod.title}
                    className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm hover:border-border/80 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ring-1 ${ring} shrink-0`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{mod.title}</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {mod.checks.map((check, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60 mt-0.5 shrink-0" />
                          <span>{check}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Risk Engine ─────────────────────────────────────────────── */}
          <section>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-foreground">{c.riskTitle}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.riskDesc}</p>
            </div>
          </section>

          {/* ── OWASP ───────────────────────────────────────────────────── */}
          <section>
            <div className="rounded-xl border border-border/50 bg-card/40 p-6">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="h-5 w-5 text-violet-400" />
                <h2 className="text-lg font-bold text-foreground">{c.owaspTitle}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{c.owaspDesc}</p>
              <div className="flex flex-wrap gap-2">
                {['A01','A02','A03','A04','A05','A06','A07','A08','A09','A10'].map((code) => (
                  <span key={code}
                    className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-400">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── Scan Modes ──────────────────────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-500" />
              {c.modesTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {c.modes.map((mode, idx) => {
                const ModeIcon = idx === 0 ? ScanSearch : Layers;
                return (
                  <div key={mode.title}
                    className="rounded-xl border border-border/50 bg-card/40 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                        <ModeIcon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{mode.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{mode.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Report Formats ──────────────────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              {c.reportsTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {c.reports.map((rep, idx) => {
                const RepIcon = idx === 1 ? FileJson : FileText;
                return (
                  <div key={rep.title}
                    className="rounded-xl border border-border/50 bg-card/40 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 ring-1 ring-sky-500/20">
                        <RepIcon className="h-5 w-5 text-sky-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{rep.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rep.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── CTA ─────────────────────────────────────────────────────── */}
          <section className="pb-8">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
              <Shield className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">{c.ctaTitle}</h2>
              <p className="text-sm text-muted-foreground mb-5">{c.ctaDesc}</p>
              <Link href="/">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-600/20">
                  <Shield className="h-4 w-4" />
                  {c.ctaBtn}
                </Button>
              </Link>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-border/30 bg-background/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 text-emerald-500/60" />
          <span>SecureScope &mdash; Web Security &amp; Web3 Analysis Platform</span>
        </div>
      </footer>
    </div>
  );
}
