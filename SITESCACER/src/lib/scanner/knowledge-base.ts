export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Category = 'security' | 'data-exposure' | 'crypto';
export type Confidence = 'low' | 'medium' | 'high' | 'verified';
export type Locale = 'en' | 'uk' | 'ru';

export interface KnowledgeBaseEntry {
  id: string;
  category: Category;
  severity: Severity;
  confidence?: Confidence;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  explanation: Record<Locale, string>;
  howToFix: Record<Locale, string>;
  impact: Record<Locale, string>;
  references: { label: string; url: string }[];
}

// Default confidence per finding — 'high' means we directly verified the condition from HTTP response/DOM.
// 'medium' means heuristic detection. 'verified' means cryptographically or format-validated.
const FINDING_CONFIDENCE: Record<string, Confidence> = {
  'sec-missing-csp': 'high',
  'sec-missing-hsts': 'high',
  'sec-missing-xframe': 'high',
  'sec-missing-xcontent': 'high',
  'sec-missing-referrer': 'high',
  'sec-missing-permissions': 'high',
  'sec-cookie-no-secure': 'high',
  'sec-cookie-no-httponly': 'high',
  'sec-cookie-no-samesite': 'high',
  'sec-cors-misconfigured': 'high',
  'sec-csp-weak': 'high',
  'sec-server-version': 'high',
  'sec-extern-script-no-sri': 'high',
  'sec-inline-script-sensitive': 'medium',
  'sec-potential-xss': 'medium',
  'sec-form-no-csrf': 'medium',
  'data-form-no-csrf': 'medium',
  'data-mixed-content': 'high',
  'data-api-key': 'high',
  'data-localstorage-sensitive': 'medium',
  'data-email-exposed': 'high',
  'data-phone-exposed': 'medium',
  'data-admin-panel': 'medium',
  'data-env-exposed': 'high',
  'data-git-exposed': 'high',
  'data-debug-info': 'high',
  'data-comment-code': 'medium',
  'data-internal-path': 'high',
  'data-sens-data-exposed': 'high',
  'crypto-eth-address': 'verified',
  'crypto-btc-address': 'verified',
  'crypto-seed-phrase': 'high',
  'crypto-address-reuse': 'high',
  'crypto-pattern': 'medium',
  'info-tech-disclosure': 'high',
  'info-email-leakage': 'medium',
  'info-phone-leakage': 'low',
};

// ---- Security Headers ----

export const MISSING_CSP: KnowledgeBaseEntry = {
  id: 'sec-missing-csp',
  category: 'security',
  severity: 'high',
  name: {
    en: 'Content-Security-Policy Header Missing',
    uk: 'Відсутній заголовок Content-Security-Policy',
    ru: 'Отсутствует заголовок Content-Security-Policy',
  },
  description: {
    en: 'Content-Security-Policy (CSP) header is not set',
    uk: 'Заголовок Content-Security-Policy (CSP) не налаштовано',
    ru: 'Заголовок Content-Security-Policy (CSP) не задан',
  },
  explanation: {
    en:
      'Content-Security-Policy (CSP) is an HTTP response header that allows site administrators to declare approved sources of content that the browser may load. Without a CSP header, the browser can load resources from any source, making the site vulnerable to Cross-Site Scripting (XSS) and data injection attacks. CSP acts as a defense-in-depth mechanism that significantly reduces the risk and impact of XSS vulnerabilities by restricting where scripts, images, styles, and other resources can be loaded from.',
    uk:
      'Content-Security-Policy (CSP) — це заголовок HTTP-відповіді, який дозволяє адміністраторам сайту вказати дозволені джерела контенту, що може завантажувати браузер. Без заголовка CSP браузер здатен завантажувати ресурси з будь-якого джерела, що робить сайт вразливим до атак міжсайтового виконання скриптів (XSS) та впровадження даних. CSP діє як механізм багаторівневого захисту, який значно знижує ризик та наслідки вразливостей XSS, обмежуючи джерела, з яких можуть завантажуватися скрипти, зображення, стилі та інші ресурси.',
    ru:
      'Content-Security-Policy (CSP) — это заголовок HTTP-ответа, позволяющий администраторам сайта указать одобренные источники контента, которые браузер может загружать. Без заголовка CSP браузер способен загружать ресурсы из любых источников, что делает сайт уязвимым к атакам межсайтового выполнения скриптов (XSS) и внедрению данных. CSP действует как механизм защиты в глубину, значительно снижающий риск и последствия XSS-уязвимостей за счёт ограничения источников загрузки скриптов, изображений, стилей и других ресурсов.',
  },
  howToFix: {
    en:
      'Implement a Content-Security-Policy header with a restrictive policy. Start with a report-only mode to test before enforcement. For example: Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:. Gradually tighten the policy as you identify which external resources your application legitimately needs. Use nonce-based or hash-based script allowlisting for maximum security.',
    uk:
      'Реалізуйте заголовок Content-Security-Policy із обмежувальною політикою. Почніть із режиму звітності (report-only) для тестування перед примусовим застосуванням. Наприклад: Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:. Поступово посилюйте політику, визначаючи, які зовнішні ресурси реально потрібні вашому додатку. Для максимальної безпеки використовуйте дозвільні списки скриптів на основі nonce або хешів.',
    ru:
      'Реализуйте заголовок Content-Security-Policy с ограничительной политикой. Начните с режима отчётности (report-only) для тестирования перед принудительным применением. Например: Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:. Постепенно ужесточайте политику по мере выявления внешних ресурсов, необходимых вашему приложению. Для максимальной безопасности используйте белые списки скриптов на основе nonce или хешей.',
  },
  impact: {
    en:
      'Without CSP, attackers can inject malicious scripts into your pages, steal session cookies, redirect users to phishing sites, or perform actions on behalf of authenticated users. This is particularly dangerous for applications handling financial transactions, personal data, or sensitive operations. CSP is considered one of the most effective XSS mitigation strategies available.',
    uk:
      'Без CSP зловмисники можуть впроваджувати шкідливі скрипти на ваші сторінки, викрадати сеансові cookie, перенаправляти користувачів на фішингові сайти або виконувати дії від імені авторизованих користувачів. Це особливо небезпечно для додатків, які обробляють фінансові транзакції, особисті дані або конфіденційні операції. CSP вважається однією з найефективніших стратегій пом\'якшення наслідків XSS.',
    ru:
      'Без CSP злоумышленники могут внедрять вредоносные скрипты на ваши страницы, похищать сеансовые cookie, перенаправлять пользователей на фишинговые сайты или выполнять действия от имени аутентифицированных пользователей. Это особенно опасно для приложений, обрабатывающих финансовые транзакции, персональные данные или конфиденциальные операции. CSP считается одной из наиболее эффективных стратегий смягчения последствий XSS.',
  },
  references: [
    { label: 'MDN - CSP', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP' },
    { label: 'OWASP CSP Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html' },
  ],
};

export const MISSING_HSTS: KnowledgeBaseEntry = {
  id: 'sec-missing-hsts',
  category: 'security',
  severity: 'medium',
  name: {
    en: 'Strict-Transport-Security Header Missing',
    uk: 'Відсутній заголовок Strict-Transport-Security',
    ru: 'Отсутствует заголовок Strict-Transport-Security',
  },
  description: {
    en: 'Strict-Transport-Security (HSTS) header is not set',
    uk: 'Заголовок Strict-Transport-Security (HSTS) не налаштовано',
    ru: 'Заголовок Strict-Transport-Security (HSTS) не задан',
  },
  explanation: {
    en:
      'HTTP Strict Transport Security (HSTS) tells the browser to only connect to the site using HTTPS, even if the user types http:// in the address bar. Without HSTS, users are vulnerable to man-in-the-middle attacks through protocol downgrade attacks and SSL stripping. An attacker on the same network could intercept the initial HTTP request and redirect the user to a fake HTTPS version of the site.',
    uk:
      'HTTP Strict Transport Security (HSTS) вказує браузеру підключатися до сайту лише через HTTPS, навіть якщо користувач вводить http:// в адресний рядок. Без HSTS користувачі вразливі до атак «людина посередині» через пониження протоколу та зняття SSL. Зловмисник в тій самій мережі може перехопити початковий HTTP-запит і перенаправити користувача на підроблену HTTPS-версію сайту.',
    ru:
      'HTTP Strict Transport Security (HSTS) указывает браузеру подключаться к сайту только по HTTPS, даже если пользователь вводит http:// в адресную строку. Без HSTS пользователи уязвимы к атакам «человек посередине» через понижение протокола и снятие SSL. Злоумышленник в той же сети может перехватить начальный HTTP-запрос и перенаправить пользователя на поддельную HTTPS-версию сайта.',
  },
  howToFix: {
    en:
      'Add the Strict-Transport-Security header to all responses. Start with: Strict-Transport-Security: max-age=31536000; includeSubDomains. Once you are confident, add preload to submit your domain to the browser HSTS preload list: max-age=31536000; includeSubDomains; preload. This ensures browsers will never attempt an HTTP connection to your domain.',
    uk:
      'Додайте заголовок Strict-Transport-Security до всіх відповідей. Почніть із: Strict-Transport-Security: max-age=31536000; includeSubDomains. Коли будете впевнені, додайте preload, щоб подати ваш домен до попереднього списку HSTS у браузерах: max-age=31536000; includeSubDomains; preload. Це гарантує, що браузери ніколи не намагатимуться встановити HTTP-з\'єднання з вашим доменом.',
    ru:
      'Добавьте заголовок Strict-Transport-Security ко всем ответам. Начните с: Strict-Transport-Security: max-age=31536000; includeSubDomains. Когда будете уверены, добавьте preload для включения вашего домена в предзагрузочный список HSTS браузеров: max-age=31536000; includeSubDomains; preload. Это гарантирует, что браузеры никогда не будут пытаться установить HTTP-соединение с вашим доменом.',
  },
  impact: {
    en:
      'Without HSTS, users can be forced to use unencrypted HTTP connections through man-in-the-middle attacks, potentially exposing sensitive data including login credentials, session tokens, and personal information. This is especially critical for sites that handle authentication, financial data, or healthcare information.',
    uk:
      'Без HSTS користувачів можна змусити використовувати незашифровані HTTP-з\'єднання через атаки «людина посередині», що може призвести до витоку конфіденційних даних, зокрема облікових даних для входу, сеансових токенів та особистої інформації. Це особливо критично для сайтів, які обробляють автентифікацію, фінансові дані чи медичну інформацію.',
    ru:
      'Без HSTS пользователей можно принудить к использованию незашифрованных HTTP-соединений через атаки «человек посередине», что может привести к утечке конфиденциальных данных, включая учётные данные для входа, сеансовые токены и персональную информацию. Это особенно критично для сайтов, обрабатывающих аутентификацию, финансовые данные или медицинскую информацию.',
  },
  references: [
    { label: 'MDN - HSTS', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security' },
    { label: 'OWASP HSTS Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html' },
  ],
};

export const MISSING_XFRAME: KnowledgeBaseEntry = {
  id: 'sec-missing-xframe',
  category: 'security',
  severity: 'medium',
  name: {
    en: 'X-Frame-Options Header Missing',
    uk: 'Відсутній заголовок X-Frame-Options',
    ru: 'Отсутствует заголовок X-Frame-Options',
  },
  description: {
    en: 'X-Frame-Options header is not set',
    uk: 'Заголовок X-Frame-Options не налаштовано',
    ru: 'Заголовок X-Frame-Options не задан',
  },
  explanation: {
    en:
      'The X-Frame-Options header prevents your website from being loaded in an iframe on another domain. Without this header, attackers can perform Clickjacking attacks by embedding your site in a transparent iframe and tricking users into clicking on hidden elements. This could lead to unauthorized actions being performed on your application.',
    uk:
      'Заголовок X-Frame-Options запобігає завантаженню вашого вебсайту в iframe на іншому домені. Без цього заголовка зловмисники можуть здійснювати атаки клікджекінгу, вбудовуючи ваш сайт у прозорий iframe та змушуючи користувачів натискати на приховані елементи. Це може призвести до виконання несанкціонованих дій у вашому додатку.',
    ru:
      'Заголовок X-Frame-Options предотвращает загрузку вашего сайта в iframe на другом домене. Без этого заголовка злоумышленники могут проводить атаки кликджекинга, встраивая ваш сайт в прозрачный iframe и заставляя пользователей нажимать на скрытые элементы. Это может привести к выполнению несанкционированных действий в вашем приложении.',
  },
  howToFix: {
    en:
      'Add the X-Frame-Options header with value DENY or SAMEORIGIN. DENY prevents any domain from framing your content. SAMEORIGIN allows only your own domain to frame the content. Additionally, consider adding the frame-ancestors directive in your CSP for more granular control: Content-Security-Policy: frame-ancestors \'self\'.',
    uk:
      'Додайте заголовок X-Frame-Options зі значенням DENY або SAMEORIGIN. DENY забороняє будь-якому домену розміщувати ваш контент в iframe. SAMEORIGIN дозволяє лише вашому власному домену використовувати фрейм для контенту. Крім того, розгляньте можливість додавання директиви frame-ancestors у вашому CSP для більш гранульованого контролю: Content-Security-Policy: frame-ancestors \'self\'.',
    ru:
      'Добавьте заголовок X-Frame-Options со значением DENY или SAMEORIGIN. DENY запрещает любому домену встраивать ваш контент в iframe. SAMEORIGIN разрешает только вашему домену использовать фрейм для контента. Кроме того, рассмотрите возможность добавления директивы frame-ancestors в CSP для более детального контроля: Content-Security-Policy: frame-ancestors \'self\'.',
  },
  impact: {
    en:
      'Clickjacking attacks can trick users into performing unintended actions such as changing account settings, making purchases, or transferring funds. This is particularly dangerous for banking applications, social media platforms, and any site with sensitive user actions.',
    uk:
      'Атаки клікджекінгу можуть обдурити користувачів, змусивши їх виконати небажані дії, такі як зміна налаштувань облікового запису, здійснення покупок або переказ коштів. Це особливо небезпечно для банківських додатків, соціальних мереж та будь-яких сайтів із чутливими діями користувачів.',
    ru:
      'Атаки кликджекинга могут обмануть пользователей, заставив их выполнить нежелательные действия: изменение настроек учётной записи, совершение покупок или перевод средств. Это особенно опасно для банковских приложений, социальных сетей и любых сайтов с конфиденциальными действиями пользователей.',
  },
  references: [
    { label: 'MDN - X-Frame-Options', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options' },
    { label: 'OWASP Clickjacking', url: 'https://owasp.org/www-community/attacks/Clickjacking' },
  ],
};

export const MISSING_XCONTENT: KnowledgeBaseEntry = {
  id: 'sec-missing-xcontent',
  category: 'security',
  severity: 'low',
  name: {
    en: 'X-Content-Type-Options Header Missing',
    uk: 'Відсутній заголовок X-Content-Type-Options',
    ru: 'Отсутствует заголовок X-Content-Type-Options',
  },
  description: {
    en: 'X-Content-Type-Options header is not set to nosniff',
    uk: 'Заголовок X-Content-Type-Options не має значення nosniff',
    ru: 'Заголовок X-Content-Type-Options не имеет значения nosniff',
  },
  explanation: {
    en:
      'The X-Content-Type-Options: nosniff header prevents browsers from MIME-type sniffing. Without it, browsers may try to guess the content type of a resource, which can lead to security vulnerabilities. For example, a browser might interpret a JSON file containing attacker-controlled data as an HTML page, leading to XSS. This header ensures the browser respects the Content-Type declared by the server.',
    uk:
      'Заголовок X-Content-Type-Options: nosniff запобігає визначенню MIME-типу браузером. Без нього браузер може спробувати вгадати тип контенту ресурсу, що може призвести до вразливостей. Наприклад, браузер може інтерпретувати JSON-файл із даними, контрольованими зловмисником, як HTML-сторінку, що призведе до XSS. Цей заголовок гарантує, що браузер поважає Content-Type, оголошений сервером.',
    ru:
      'Заголовок X-Content-Type-Options: nosniff предотвращает MIME-sniffing в браузере. Без него браузер может попытаться угадать тип контента ресурса, что может привести к уязвимостям. Например, браузер может интерпретировать JSON-файл с контролируемыми злоумышленником данными как HTML-страницу, что приведёт к XSS. Этот заголовок гарантирует, что браузер соблюдает Content-Type, объявленный сервером.',
  },
  howToFix: {
    en:
      'Add the header X-Content-Type-Options: nosniff to all HTTP responses. This is a simple one-line configuration in most web servers and frameworks. For Nginx: add_header X-Content-Type-Options "nosniff" always;. For Apache: Header always set X-Content-Type-Options "nosniff". For Express.js: res.setHeader("X-Content-Type-Options", "nosniff").',
    uk:
      'Додайте заголовок X-Content-Type-Options: nosniff до всіх HTTP-відповідей. Це проста однорядкова конфігурація в більшості вебсерверів та фреймворків. Для Nginx: add_header X-Content-Type-Options "nosniff" always;. Для Apache: Header always set X-Content-Type-Options "nosniff". Для Express.js: res.setHeader("X-Content-Type-Options", "nosniff").',
    ru:
      'Добавьте заголовок X-Content-Type-Options: nosniff ко всем HTTP-ответам. Это простая однострочная конфигурация в большинстве веб-серверов и фреймворков. Для Nginx: add_header X-Content-Type-Options "nosniff" always;. Для Apache: Header always set X-Content-Type-Options "nosniff". Для Express.js: res.setHeader("X-Content-Type-Options", "nosniff").',
  },
  impact: {
    en:
      'Without this header, an attacker could upload a malicious file disguised with a legitimate extension and trick the browser into executing it. For example, uploading an HTML file as an image could result in the browser rendering it as a page, enabling XSS attacks. While the severity is lower than missing CSP or HSTS, it provides an important defense layer.',
    uk:
      'Без цього заголовка зловмисник може завантажити шкідливий файл під виглядом легітимного розширення та обдурити браузер, змусивши його виконати цей файл. Наприклад, завантаження HTML-файлу як зображення може призвести до того, що браузер відобразить його як сторінку, що дозволить XSS-атаки. Хоча рівень небезпеки нижчий, ніж відсутність CSP чи HSTS, цей заголовок забезпечує важливий шар захисту.',
    ru:
      'Без этого заголовка злоумышленник может загрузить вредоносный файл под видом легитимного расширения и обмануть браузер, заставив его выполнить этот файл. Например, загрузка HTML-файла как изображения может привести к тому, что браузер отобразит его как страницу, что позволит XSS-атаки. Хотя уровень опасности ниже, чем отсутствие CSP или HSTS, этот заголовок обеспечивает важный слой защиты.',
  },
  references: [
    { label: 'MDN - X-Content-Type-Options', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options' },
  ],
};

export const MISSING_REFERRER: KnowledgeBaseEntry = {
  id: 'sec-missing-referrer',
  category: 'security',
  severity: 'low',
  name: {
    en: 'Referrer-Policy Header Missing or Lax',
    uk: 'Відсутній або недостатньо суворий заголовок Referrer-Policy',
    ru: 'Отсутствует или недостаточно строгий заголовок Referrer-Policy',
  },
  description: {
    en: 'Referrer-Policy header is not set to strict-origin-when-cross-origin or stricter',
    uk: 'Заголовок Referrer-Policy не має значення strict-origin-when-cross-origin або суворішого',
    ru: 'Заголовок Referrer-Policy не имеет значения strict-origin-when-cross-origin или более строгого',
  },
  explanation: {
    en:
      'The Referrer-Policy header controls how much referrer information is included when navigating away from your site. Without a strict referrer policy, sensitive URL parameters (such as session tokens, API keys, or personal data) may be leaked to third-party sites through the Referer header. This is a common source of data leakage.',
    uk:
      'Заголовок Referrer-Policy контролює обсяг інформації про реферера, що передається під час переходу з вашого сайту. Без суворої політики реферера чутливі URL-параметри (такі як сеансові токени, API-ключі чи особисті дані) можуть витікати на сторонні сайти через заголовок Referer. Це поширене джерело витоку даних.',
    ru:
      'Заголовок Referrer-Policy контролирует объём информации о реферере, передаваемой при переходе с вашего сайта. Без строгой политики реферера конфиденциальные URL-параметры (такие как сеансовые токены, API-ключи или персональные данные) могут утекать на сторонние сайты через заголовок Referer. Это распространённый источник утечки данных.',
  },
  howToFix: {
    en:
      'Set Referrer-Policy: strict-origin-when-cross-origin as a minimum. This sends the full URL for same-origin requests but only the origin for cross-origin requests. For maximum privacy, use no-referrer which strips the Referer header entirely. Add this as an HTTP header and also consider adding the meta tag: <meta name="referrer" content="strict-origin-when-cross-origin">.',
    uk:
      'Встановіть Referrer-Policy: strict-origin-when-cross-origin як мінімум. Це надсилає повний URL для запитів в межах одного домену, але лише origin для міждоменних запитів. Для максимальної конфіденційності використовуйте no-referrer, який повністю прибирає заголовок Referer. Додайте це як HTTP-заголовок, а також розгляньте додавання мета-тегу: <meta name="referrer" content="strict-origin-when-cross-origin">.',
    ru:
      'Установите Referrer-Policy: strict-origin-when-cross-origin как минимум. Это отправляет полный URL для запросов в рамках одного домена, но только origin для междоменных запросов. Для максимальной конфиденциальности используйте no-referrer, который полностью убирает заголовок Referer. Добавьте это как HTTP-заголовок, а также рассмотрите добавление мета-тега: <meta name="referrer" content="strict-origin-when-cross-origin">.',
  },
  impact: {
    en:
      'Sensitive URL parameters including session IDs, access tokens, search queries, and user identifiers can be leaked to external sites. This information can be used for reconnaissance, session hijacking, or building user profiles for targeted attacks. Third-party analytics and advertising scripts routinely collect referrer data.',
    uk:
      'Чутливі URL-параметри, зокрема ідентифікатори сеансів, токени доступу, пошукові запити та ідентифікатори користувачів, можуть витікати на зовнішні сайти. Ця інформація може використовуватися для розвідки, перехоплення сеансу або створення профілів користувачів для цільових атак. Сторонні аналітичні та рекламні скрипти регулярно збирають дані реферера.',
    ru:
      'Конфиденциальные URL-параметры, включая идентификаторы сеансов, токены доступа, поисковые запросы и идентификаторы пользователей, могут утекать на внешние сайты. Эта информация может использоваться для разведки, перехвата сеанса или создания профилей пользователей для целевых атак. Сторонние аналитические и рекламные скрипты регулярно собирают данные реферера.',
  },
  references: [
    { label: 'MDN - Referrer-Policy', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy' },
    { label: 'OWASP Referrer Policy', url: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/01-Conduct_Search_Engine_Discovery_Reconnaissance_for_Ingi' },
  ],
};

export const MISSING_PERMISSIONS: KnowledgeBaseEntry = {
  id: 'sec-missing-permissions',
  category: 'security',
  severity: 'low',
  name: {
    en: 'Permissions-Policy Header Missing',
    uk: 'Відсутній заголовок Permissions-Policy',
    ru: 'Отсутствует заголовок Permissions-Policy',
  },
  description: {
    en: 'Permissions-Policy header is not set',
    uk: 'Заголовок Permissions-Policy не налаштовано',
    ru: 'Заголовок Permissions-Policy не задан',
  },
  explanation: {
    en:
      'The Permissions-Policy header (formerly Feature-Policy) allows you to control which browser features and APIs can be used on your site. Without this header, malicious scripts could access features like the camera, microphone, geolocation, or accelerometer without explicit permission. This header acts as a whitelist for powerful browser APIs.',
    uk:
      'Заголовок Permissions-Policy (раніше Feature-Policy) дозволяє контролювати, які функції та API браузера можуть використовуватися на вашому сайті. Без цього заголовка шкідливі скрипти можуть отримати доступ до камери, мікрофона, геолокації або акселерометра без явного дозволу. Цей заголовок діє як білий список для потужних API браузера.',
    ru:
      'Заголовок Permissions-Policy (ранее Feature-Policy) позволяет контролировать, какие функции и API браузера могут использоваться на вашем сайте. Без этого заголовка вредоносные скрипты могут получить доступ к камере, микрофону, геолокации или акселерометру без явного разрешения. Этот заголовок действует как белый список для мощных API браузера.',
  },
  howToFix: {
    en:
      'Set the Permissions-Policy header to explicitly deny or allow specific features. Example: Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(). This disables camera, microphone, geolocation, and payment APIs. Only enable features that your application actually requires. Consider using a per-page policy to restrict features to pages that need them.',
    uk:
      'Встановіть заголовок Permissions-Policy, щоб явно заборонити або дозволити певні функції. Приклад: Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(). Це вимикає API камери, мікрофона, геолокації та платежів. Увімкніть лише ті функції, які реально потрібні вашому додатку. Розгляньте використання політики для кожної сторінки окремо, щоб обмежити функції лише тими сторінками, де вони необхідні.',
    ru:
      'Установите заголовок Permissions-Policy, чтобы явно запретить или разрешить определённые функции. Пример: Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(). Это отключает API камеры, микрофона, геолокации и платежей. Включайте только те функции, которые действительно нужны вашему приложению. Рассмотрите использование политики для каждой страницы отдельно, чтобы ограничить функции только теми страницами, где они необходимы.',
  },
  impact: {
    en:
      'Without this header, injected scripts can potentially access sensitive device features, leading to privacy violations. An attacker could activate the camera or microphone, track the user location, or trigger payment requests without the user expecting it. This is especially concerning for sites that handle sensitive user interactions.',
    uk:
      'Без цього заголовка впроваджені скрипти можуть потенційно отримати доступ до чутливих функцій пристрою, що призведе до порушення конфіденційності. Зловмисник може активувати камеру або мікрофон, відстежувати місцезнаходження користувача або ініціювати запити на оплату без відома користувача. Це особливо небезпечно для сайтів, що обробляють чутливі взаємодії з користувачами.',
    ru:
      'Без этого заголовка внедрённые скрипты могут потенциально получить доступ к конфиденциальным функциям устройства, что приведёт к нарушению конфиденциальности. Злоумышленник может активировать камеру или микрофон, отслеживать местоположение пользователя или инициировать платёжные запросы без ведома пользователя. Это особенно беспокоит для сайтов, обрабатывающих конфиденциальные взаимодействия с пользователями.',
  },
  references: [
    { label: 'MDN - Permissions-Policy', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy' },
  ],
};

// ---- Cookies ----

export const COOKIE_NO_SECURE: KnowledgeBaseEntry = {
  id: 'sec-cookie-no-secure',
  category: 'security',
  severity: 'high',
  name: {
    en: 'Cookies Without Secure Flag',
    uk: 'Cookie без прапорця Secure',
    ru: 'Cookie без флага Secure',
  },
  description: {
    en: 'One or more cookies are missing the Secure flag',
    uk: 'Один або кілька cookie не мають прапорця Secure',
    ru: 'Один или несколько cookie не имеют флага Secure',
  },
  explanation: {
    en:
      'The Secure flag ensures that cookies are only transmitted over HTTPS connections. Without this flag, cookies can be sent over unencrypted HTTP connections, making them vulnerable to interception by network attackers. This is especially dangerous for session cookies, as they can be captured and used for session hijacking.',
    uk:
      'Прапорець Secure гарантує, що cookie передаються лише через з\'єднання HTTPS. Без цього прапорця cookie можуть надсилатися через незашифровані HTTP-з\'єднання, що робить їх вразливими до перехоплення зловмисниками в мережі. Це особливо небезпечно для сеансових cookie, оскільки їх можна перехопити та використати для захоплення сеансу.',
    ru:
      'Флаг Secure гарантирует, что cookie передаются только через соединения HTTPS. Без этого флага cookie могут отправляться через незашифрованные HTTP-соединения, что делает их уязвимыми к перехвату злоумышленниками в сети. Это особенно опасно для сеансовых cookie, поскольку они могут быть перехвачены и использованы для захвата сеанса.',
  },
  howToFix: {
    en:
      'Set the Secure attribute on all cookies, especially session and authentication cookies. For server-side: Set-Cookie: sessionId=abc123; Secure; HttpOnly; SameSite=Strict. In Express.js: res.cookie("sessionId", token, { secure: true, httpOnly: true, sameSite: "strict" }). Ensure your site is fully accessible over HTTPS before enabling this flag, as it will prevent cookies from being sent over HTTP.',
    uk:
      'Встановіть атрибут Secure для всіх cookie, особливо сеансових та автентифікаційних. На стороні сервера: Set-Cookie: sessionId=abc123; Secure; HttpOnly; SameSite=Strict. У Express.js: res.cookie("sessionId", token, { secure: true, httpOnly: true, sameSite: "strict" }). Переконайтеся, що ваш сайт повністю доступний через HTTPS перед увімкненням цього прапорця, оскільки він заборонить надсилання cookie через HTTP.',
    ru:
      'Установите атрибут Secure для всех cookie, особенно сеансовых и аутентификационных. На стороне сервера: Set-Cookie: sessionId=abc123; Secure; HttpOnly; SameSite=Strict. В Express.js: res.cookie("sessionId", token, { secure: true, httpOnly: true, sameSite: "strict" }). Убедитесь, что ваш сайт полностью доступен по HTTPS перед включением этого флага, так как он запретит отправку cookie по HTTP.',
  },
  impact: {
    en:
      'Session cookies transmitted over HTTP can be intercepted by anyone on the same network, including public Wi-Fi networks. This enables session hijacking where an attacker steals a valid session and gains unauthorized access to the victim account. The impact ranges from unauthorized data access to full account takeover.',
    uk:
      'Сеансові cookie, передані через HTTP, може перехопити будь-хто в тій самій мережі, включно з публічними Wi-Fi. Це дозволяє захоплення сеансу, при якому зловмисник викрадає дійсний сеанс і отримує несанкціонований доступ до облікового запису жертви. Наслідки варіюються від несанкціонованого доступу до даних до повного захоплення облікового запису.',
    ru:
      'Сеансовые cookie, переданные по HTTP, может перехватить любой участник в той же сети, включая публичные Wi-Fi. Это позволяет захват сеанса, при котором злоумышленник похищает действительный сеанс и получает несанкционированный доступ к учётной записи жертвы. Последствия варьируются от несанкционированного доступа к данным до полного захвата учётной записи.',
  },
  references: [
    { label: 'MDN - Set-Cookie', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie' },
    { label: 'OWASP Session Management', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html' },
  ],
};

export const COOKIE_NO_HTTPONLY: KnowledgeBaseEntry = {
  id: 'sec-cookie-no-httponly',
  category: 'security',
  severity: 'medium',
  name: {
    en: 'Cookies Without HttpOnly Flag',
    uk: 'Cookie без прапорця HttpOnly',
    ru: 'Cookie без флага HttpOnly',
  },
  description: {
    en: 'One or more cookies are missing the HttpOnly flag',
    uk: 'Один або кілька cookie не мають прапорця HttpOnly',
    ru: 'Один или несколько cookie не имеют флага HttpOnly',
  },
  explanation: {
    en:
      'The HttpOnly flag prevents client-side JavaScript from accessing cookies. Without this flag, if an XSS vulnerability exists, an attacker can read cookie values using document.cookie, potentially stealing session tokens or other sensitive data stored in cookies. This is a defense-in-depth measure that reduces the impact of XSS vulnerabilities.',
    uk:
      'Прапорець HttpOnly запобігає доступу клієнтського JavaScript до cookie. Без цього прапорця, якщо існує вразливість XSS, зловмисник може зчитувати значення cookie через document.cookie, потенційно викрадаючи сеансові токени або інші конфіденційні дані, збережені в cookie. Це міра багаторівневого захисту, що зменшує наслідки XSS-вразливостей.',
    ru:
      'Флаг HttpOnly предотвращает доступ клиентского JavaScript к cookie. Без этого флага, если существует XSS-уязвимость, злоумышленник может считывать значения cookie через document.cookie, потенциально похищая сеансовые токены или другие конфиденциальные данные, хранящиеся в cookie. Это мера защиты в глубину, снижающая последствия XSS-уязвимостей.',
  },
  howToFix: {
    en:
      'Set the HttpOnly attribute on all cookies that do not need to be accessed by JavaScript. Session and authentication cookies should always have HttpOnly set. Example: Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict. In Express.js: res.cookie("sessionId", token, { httpOnly: true, secure: true, sameSite: "strict" }). Only omit HttpOnly for cookies that JavaScript explicitly needs to read.',
    uk:
      'Встановіть атрибут HttpOnly для всіх cookie, які не потребують доступу з JavaScript. Сеансові та автентифікаційні cookie завжди повинні мати HttpOnly. Приклад: Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict. У Express.js: res.cookie("sessionId", token, { httpOnly: true, secure: true, sameSite: "strict" }). Приберайте HttpOnly лише для тих cookie, які JavaScript явно повинен зчитувати.',
    ru:
      'Установите атрибут HttpOnly для всех cookie, не требующих доступа из JavaScript. Сеансовые и аутентификационные cookie всегда должны иметь HttpOnly. Пример: Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict. В Express.js: res.cookie("sessionId", token, { httpOnly: true, secure: true, sameSite: "strict" }). Убирайте HttpOnly только для тех cookie, которые JavaScript явно должен считывать.',
  },
  impact: {
    en:
      'If an XSS vulnerability exists in the application, an attacker can read all non-HttpOnly cookies via document.cookie. This includes session identifiers, authentication tokens, and any other sensitive data stored in cookies. Combined with XSS, this leads to complete session hijacking and account compromise.',
    uk:
      'Якщо в додатку існує вразливість XSS, зловмисник може зчитувати всі cookie без HttpOnly через document.cookie. Це включає ідентифікатори сеансів, автентифікаційні токени та будь-які інші конфіденційні дані, збережені в cookie. В поєднанні з XSS це призводить до повного захоплення сеансу та компрометації облікового запису.',
    ru:
      'Если в приложении существует XSS-уязвимость, злоумышленник может считывать все cookie без HttpOnly через document.cookie. Это включает идентификаторы сеансов, аутентификационные токены и любые другие конфиденциальные данные, хранящиеся в cookie. В сочетании с XSS это приводит к полному захвату сеанса и компрометации учётной записи.',
  },
  references: [
    { label: 'OWASP HttpOnly', url: 'https://owasp.org/www-community/HttpOnly' },
  ],
};

export const COOKIE_NO_SAMESITE: KnowledgeBaseEntry = {
  id: 'sec-cookie-no-samesite',
  category: 'security',
  severity: 'medium',
  name: {
    en: 'Cookies Without SameSite Attribute',
    uk: 'Cookie без атрибута SameSite',
    ru: 'Cookie без атрибута SameSite',
  },
  description: {
    en: 'One or more cookies are missing the SameSite attribute',
    uk: 'Один або кілька cookie не мають атрибута SameSite',
    ru: 'Один или несколько cookie не имеют атрибута SameSite',
  },
  explanation: {
    en:
      'The SameSite attribute controls whether cookies are sent with cross-site requests. Without this attribute, cookies may be sent with requests initiated by third-party sites, making the application vulnerable to Cross-Site Request Forgery (CSRF) attacks. Modern browsers default to Lax for SameSite, but explicitly setting it ensures consistent behavior.',
    uk:
      'Атрибут SameSite контролює, чи передаються cookie з міжсайтовими запитами. Без цього атрибута cookie можуть надсилатися з запитами, ініційованими сторонніми сайтами, що робить додаток вразливим до атак підробки міжсайтових запитів (CSRF). Сучасні браузери за замовчуванням використовують Lax для SameSite, але явне налаштування гарантує передбачувану поведінку.',
    ru:
      'Атрибут SameSite контролирует, отправляются ли cookie с межсайтовыми запросами. Без этого атрибута cookie могут отправляться с запросами, инициированными сторонними сайтами, что делает приложение уязвимым к атакам подделки межсайтовых запросов (CSRF). Современные браузеры по умолчанию используют Lax для SameSite, но явная установка гарантирует предсказуемое поведение.',
  },
  howToFix: {
    en:
      'Set SameSite=Strict or SameSite=Lax on all cookies. Strict prevents cookies from being sent on any cross-site navigation. Lax allows cookies on top-level navigations (like following links) but blocks them on cross-site POST requests. For maximum CSRF protection, use Strict on sensitive cookies and Lax on general-purpose cookies.',
    uk:
      'Встановіть SameSite=Strict або SameSite=Lax для всіх cookie. Strict забороняє надсилання cookie при будь-яких міжсайтових переходах. Lax дозволяє cookie при навігації верхнього рівня (наприклад, при переході за посиланнями), але блокує їх при міжсайтових POST-запитах. Для максимального захисту від CSRF використовуйте Strict для чутливих cookie та Lax для загальнопризначених.',
    ru:
      'Установите SameSite=Strict или SameSite=Lax для всех cookie. Strict запрещает отправку cookie при любых межсайтовых переходах. Lax разрешает cookie при навигации верхнего уровня (например, при переходе по ссылкам), но блокирует их при межсайтовых POST-запросах. Для максимальной защиты от CSRF используйте Strict для конфиденциальных cookie и Lax для общего назначения.',
  },
  impact: {
    en:
      'Without SameSite protection, attackers can craft malicious pages that submit requests to your application using the victim browser stored cookies. This enables CSRF attacks where users unknowingly perform actions like changing passwords, transferring funds, or modifying account settings without their knowledge or consent.',
    uk:
      'Без захисту SameSite зловмисники можуть створювати шкідливі сторінки, які надсилають запити до вашого додатку, використовуючи cookie, збережені в браузері жертви. Це дозволяє CSRF-атаки, при яких користувачі несвідомо виконують дії, такі як зміна пароля, переказ коштів або зміна налаштувань облікового запису без їхнього відома чи згоди.',
    ru:
      'Без защиты SameSite злоумышленники могут создавать вредоносные страницы, отправляющие запросы к вашему приложению с использованием cookie, сохранённых в браузере жертвы. Это позволяет CSRF-атаки, при которых пользователи неосознанно выполняют действия: изменение пароля, перевод средств или изменение настроек учётной записи без их ведома или согласия.',
  },
  references: [
    { label: 'MDN - SameSite cookies', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies/SameSite' },
    { label: 'OWASP CSRF Prevention', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html' },
  ],
};

// ---- Data Exposure ----

export const FORM_NO_CSRF: KnowledgeBaseEntry = {
  id: 'data-form-no-csrf',
  category: 'data-exposure',
  severity: 'high',
  name: {
    en: 'Form Without CSRF Protection Detected',
    uk: 'Виявлено форму без захисту від CSRF',
    ru: 'Обнаружена форма без защиты от CSRF',
  },
  description: {
    en: 'HTML forms found without visible CSRF token fields',
    uk: 'Знайдено HTML-форми без видимих полів CSRF-токенів',
    ru: 'Найдены HTML-формы без видимых полей CSRF-токенов',
  },
  explanation: {
    en:
      'Cross-Site Request Forgery (CSRF) tokens are unique, unpredictable values required for form submissions that modify state. Without CSRF protection, an attacker can create a malicious page that submits forms on behalf of an authenticated user. The browser automatically includes cookies with cross-site requests, so without a token, the server cannot distinguish between legitimate and forged requests.',
    uk:
      'Токени захисту від підробки міжсайтових запитів (CSRF) — це унікальні, непередбачувані значення, необхідні для відправки форм, що змінюють стан. Без захисту від CSRF зловмисник може створити шкідливу сторінку, яка відправлятиме форми від імені авторизованого користувача. Браузер автоматично включає cookie з міжсайтовими запитами, тому без токена сервер не може розрізнити легітимні та підроблені запити.',
    ru:
      'Токены защиты от подделки межсайтовых запросов (CSRF) — это уникальные, непредсказуемые значения, необходимые для отправки форм, изменяющих состояние. Без защиты от CSRF злоумышленник может создать вредоносную страницу, отправляющую формы от имени аутентифицированного пользователя. Браузер автоматически включает cookie с межсайтовыми запросами, поэтому без токена сервер не может различить легитимные и подделанные запросы.',
  },
  howToFix: {
    en:
      'Implement anti-CSRF tokens in all state-changing forms. Generate a unique token per session and include it as a hidden field: <input type="hidden" name="csrf_token" value="{{token}}">. Validate the token server-side on every POST request. Alternatively, use the SameSite cookie attribute as a defense layer, or implement double-submit cookie patterns. Modern frameworks like Django, Rails, and Laravel have built-in CSRF protection.',
    uk:
      'Реалізуйте анти-CSRF-токени у всіх формах, що змінюють стан. Згенеруйте унікальний токен для кожного сеансу та додайте його як приховане поле: <input type="hidden" name="csrf_token" value="{{token}}">. Валідуйте токен на стороні сервера при кожному POST-запиті. Альтернативно використовуйте атрибут SameSite cookie як шар захисту або реалізуйте шаблон «подвійної відправки cookie». Сучасні фреймворки на кшталт Django, Rails та Laravel мають вбудований захист від CSRF.',
    ru:
      'Реализуйте анти-CSRF-токены во всех формах, изменяющих состояние. Сгенерируйте уникальный токен для каждого сеанса и добавьте его как скрытое поле: <input type="hidden" name="csrf_token" value="{{token}}">. Валидируйте токен на стороне сервера при каждом POST-запросе. Альтернативно используйте атрибут SameSite cookie как слой защиты или реализуйте паттерн «двойной отправки cookie». Современные фреймворки такие как Django, Rails и Laravel имеют встроенную защиту от CSRF.',
  },
  impact: {
    en:
      'Without CSRF protection, attackers can force authenticated users to perform unwanted actions: changing email addresses, transferring money, modifying permissions, or deleting data. This is particularly dangerous for financial applications, administrative panels, and any site where user actions have significant consequences.',
    uk:
      'Без захисту від CSRF зловмисники можуть змусити авторизованих користувачів виконати небажані дії: зміну електронної пошти, переказ коштів, зміну прав доступу або видалення даних. Це особливо небезпечно для фінансових додатків, адміністративних панелей та будь-яких сайтів, де дії користувачів мають значні наслідки.',
    ru:
      'Без защиты от CSRF злоумышленники могут заставить аутентифицированных пользователей выполнить нежелательные действия: изменение электронной почты, перевод денег, изменение прав доступа или удаление данных. Это особенно опасно для финансовых приложений, административных панелей и любых сайтов, где действия пользователей имеют значительные последствия.',
  },
  references: [
    { label: 'OWASP CSRF', url: 'https://owasp.org/www-community/attacks/csrf' },
    { label: 'OWASP CSRF Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html' },
  ],
};

export const FORM_PASSWORD_NO_AUTOCOMPLETE: KnowledgeBaseEntry = {
  id: 'data-form-password-no-autocomplete',
  category: 'data-exposure',
  severity: 'low',
  name: {
    en: 'Password Field With Autocomplete Enabled',
    uk: 'Поле пароля з увімкненим автозаповненням',
    ru: 'Поле пароля с включённым автозаполнением',
  },
  description: {
    en: 'Password input fields may have autocomplete enabled, which can expose credentials',
    uk: 'Поля вводу пароля можуть мати увімкнене автозаповнення, що може призвести до витоку облікових даних',
    ru: 'Поля ввода пароля могут иметь включённое автозаполнение, что может привести к утечке учётных данных',
  },
  explanation: {
    en:
      'Password fields with autocomplete enabled allow browsers to store and suggest passwords. While convenient for users, this can expose credentials on shared or public computers, or if the device is compromised. Browsers may also autofill credentials from password managers on phishing sites that mimic legitimate forms.',
    uk:
      'Поля пароля з увімкненим автозаповненням дозволяють браузерам зберігати та пропонувати паролі. Хоча це зручно для користувачів, це може призвести до витоку облікових даних на спільних чи публічних комп\'ютерах, а також у разі компрометації пристрою. Браузери також можуть автоматично заповнювати облікові дані з менеджерів паролів на фішингових сайтах, що імітують легітимні форми.',
    ru:
      'Поля пароля с включённым автозаполнением позволяют браузерам сохранять и предлагать пароли. Хотя это удобно для пользователей, это может привести к утечке учётных данных на общих или публичных компьютерах, а также в случае компрометации устройства. Браузеры также могут автоматически заполнять учётные данные из менеджеров паролей на фишинговых сайтах, имитирующих легитимные формы.',
  },
  howToFix: {
    en:
      'For sensitive forms where autocomplete should be disabled, add autocomplete="off" or autocomplete="new-password" to password fields: <input type="password" autocomplete="new-password">. Note that modern browsers may ignore autocomplete="off" for login forms. Use autocomplete="new-password" for registration/change forms and allow autocomplete for standard login forms for better security via password managers.',
    uk:
      'Для чутливих форм, де автозаповнення слід вимкнути, додайте autocomplete="off" або autocomplete="new-password" до полів пароля: <input type="password" autocomplete="new-password">. Зверніть увагу, що сучасні браузери можуть ігнорувати autocomplete="off" для форм входу. Використовуйте autocomplete="new-password" для форм реєстрації чи зміни пароля та дозволяйте автозаповнення для стандартних форм входу для кращої безпеки через менеджери паролів.',
    ru:
      'Для конфиденциальных форм, где автозаполнение следует отключить, добавьте autocomplete="off" или autocomplete="new-password" к полям пароля: <input type="password" autocomplete="new-password">. Обратите внимание, что современные браузеры могут игнорировать autocomplete="off" для форм входа. Используйте autocomplete="new-password" для форм регистрации/смены пароля и разрешайте автозаполнение для стандартных форм входа для лучшей безопасности через менеджеры паролей.',
  },
  impact: {
    en:
      'On shared or compromised devices, stored passwords can be accessed by other users or malware. Additionally, password managers may autofill credentials on cloned phishing sites. However, note that disabling autocomplete can also reduce security by preventing users from using strong, unique passwords from their password manager.',
    uk:
      'На спільних або скомпрометований пристроях збережені паролі можуть бути доступні іншим користувачам чи шкідливому ПЗ. Крім того, менеджери паролів можуть автоматично заповнювати облікові дані на клонованих фішингових сайтах. Проте слід зазначити, що вимкнення автозаповнення також може знизити безпеку, унеможлививши використання користувачами надійних унікальних паролів із їхніх менеджерів паролів.',
    ru:
      'На общих или скомпрометированных устройствах сохранённые пароли могут быть доступны другим пользователям или вредоносному ПО. Кроме того, менеджеры паролей могут автоматически заполнять учётные данные на клонированных фишинговых сайтах. Однако следует отметить, что отключение автозаполнения также может снизить безопасность, лишив пользователей возможности использовать надёжные уникальные пароли из их менеджеров паролей.',
  },
  references: [
    { label: 'MDN - autocomplete', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete' },
  ],
};

export const MIXED_CONTENT: KnowledgeBaseEntry = {
  id: 'data-mixed-content',
  category: 'data-exposure',
  severity: 'high',
  name: {
    en: 'Mixed Content Resources Detected',
    uk: 'Виявлено ресурси зі змішаним контентом',
    ru: 'Обнаружены ресурсы со смешанным контентом',
  },
  description: {
    en: 'Page loads resources over insecure HTTP connections while served over HTTPS',
    uk: 'Сторінка завантажує ресурси через незахищені HTTP-з\'єднання, хоча подається через HTTPS',
    ru: 'Страница загружает ресурсы по незащищённым HTTP-соединениям при подаче по HTTPS',
  },
  explanation: {
    en:
      'Mixed content occurs when an HTTPS page loads sub-resources (scripts, images, styles, iframes) over HTTP. This undermines the security of HTTPS by providing a vector for man-in-the-middle attacks. An attacker on the network can modify HTTP-loaded resources to inject malicious scripts, deface the page, or intercept user data. Modern browsers actively block or warn about mixed content.',
    uk:
      'Змішаний контент виникає, коли HTTPS-сторінка завантажує підресурси (скрипти, зображення, стилі, iframe) через HTTP. Це підриває безпеку HTTPS, відкриваючи вектор для атак «людина посередині». Зловмисник у мережі може змінити ресурси, завантажені через HTTP, щоб впровадити шкідливі скрипти, спотворити сторінку або перехопити дані користувача. Сучасні браузери активно блокують або попереджають про змішаний контент.',
    ru:
      'Смешанный контент возникает, когда HTTPS-страница загружает подресурсы (скрипты, изображения, стили, iframe) по HTTP. Это подрывает безопасность HTTPS, открывая вектор для атак «человек посередине». Злоумышленник в сети может изменить ресурсы, загруженные по HTTP, чтобы внедрить вредоносные скрипты, исказить страницу или перехватить данные пользователя. Современные браузеры активно блокируют или предупреждают о смешанном контенте.',
  },
  howToFix: {
    en:
      'Ensure all resources are loaded over HTTPS. Replace http:// with https:// in all src, href, and action attributes. Use protocol-relative URLs (//example.com/resource) or upgrade-insecure-requests CSP directive: Content-Security-Policy: upgrade-insecure-requests. Audit your templates, JavaScript, and CMS content for hardcoded HTTP URLs. Use tools like mixed content scanners to find all insecure resources.',
    uk:
      'Переконайтеся, що всі ресурси завантажуються через HTTPS. Замініть http:// на https:// в усіх атрибутах src, href та action. Використовуйте відносні URL протоколу (//example.com/resource) або директиву upgrade-insecure-requests у CSP: Content-Security-Policy: upgrade-insecure-requests. Перевірте ваші шаблони, JavaScript та контент CMS на наявність жорстко заданих HTTP-URL. Використовуйте інструменти сканування змішаного контенту для пошуку всіх незахищених ресурсів.',
    ru:
      'Убедитесь, что все ресурсы загружаются по HTTPS. Замените http:// на https:// во всех атрибутах src, href и action. Используйте протокольно-относительные URL (//example.com/resource) или директиву upgrade-insecure-requests в CSP: Content-Security-Policy: upgrade-insecure-requests. Проведите аудит шаблонов, JavaScript и контента CMS на наличие жёстко заданных HTTP-URL. Используйте инструменты сканирования смешанного контента для поиска всех незащищённых ресурсов.',
  },
  impact: {
    en:
      'Attackers on the same network can modify HTTP resources loaded by the HTTPS page, injecting malicious scripts, tracking pixels, or redirecting users. This effectively negates the protection provided by HTTPS. Scripts loaded over HTTP can steal cookies, capture keystrokes, or perform actions on behalf of the user.',
    uk:
      'Зловмисники в тій самій мережі можуть змінювати HTTP-ресурси, завантажені HTTPS-сторінкою, впроваджуючи шкідливі скрипти, пікселі відстеження або перенаправляючи користувачів. Це фактично нівелює захист, який забезпечує HTTPS. Скрипти, завантажені через HTTP, можуть викрадати cookie, перехоплювати натискання клавіш або виконувати дії від імені користувача.',
    ru:
      'Злоумышленники в той же сети могут изменять HTTP-ресурсы, загруженные HTTPS-страницей, внедряя вредоносные скрипты, пиксели отслеживания или перенаправляя пользователей. Это фактически нивелирует защиту, обеспечиваемую HTTPS. Скрипты, загруженные по HTTP, могут похищать cookie, перехватывать нажатия клавиш или выполнять действия от имени пользователя.',
  },
  references: [
    { label: 'MDN - Mixed Content', url: 'https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content' },
    { label: 'OWASP Testing for Mixed Content', url: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/01-Testing_for_Sensitive_Information_Sent_via_Unencrypted_Channels' },
  ],
};

export const SENSITIVE_META_INFO: KnowledgeBaseEntry = {
  id: 'data-sensitive-meta',
  category: 'data-exposure',
  severity: 'low',
  name: {
    en: 'Potentially Sensitive Information in Meta Tags',
    uk: 'Потенційно конфіденційна інформація в мета-тегах',
    ru: 'Потенциально конфиденциальная информация в мета-тегах',
  },
  description: {
    en: 'Meta tags may expose sensitive technology or configuration information',
    uk: 'Мета-теги можуть розкривати конфіденційну інформацію про технології або конфігурацію',
    ru: 'Мета-теги могут раскрывать конфиденциальную информацию о технологиях или конфигурации',
  },
  explanation: {
    en:
      'Meta tags like generator, author, or application-specific meta tags can reveal the technology stack, framework version, or internal tooling used by the application. This information helps attackers identify known vulnerabilities specific to the detected technologies and craft targeted exploits. While not a direct vulnerability, information leakage reduces the effort required for reconnaissance.',
    uk:
      'Мета-теги, такі як generator, author або специфічні для додатка мета-теги, можуть розкрити технологічний стек, версію фреймворку або внутрішні інструменти, що використовує додаток. Ця інформація допомагає зловмисникам виявити відомі вразливості, притаманні виявленим технологіям, та створити цільові експлойти. Хоча це не є безпосередньою вразливістю, витік інформації зменшує зусилля, необхідні для розвідки.',
    ru:
      'Мета-теги такие как generator, author или специфичные для приложения мета-теги могут раскрыть технологический стек, версию фреймворка или внутренние инструменты, используемые приложением. Эта информация помогает злоумышленникам выявить известные уязвимости, присущие обнаруженным технологиям, и создать целевые эксплойты. Хотя это не является прямой уязвимостью, утечка информации снижает усилия, необходимые для разведки.',
  },
  howToFix: {
    en:
      'Remove unnecessary meta tags that reveal technology details. Common offenders include: <meta name="generator" content="WordPress 5.x">, <meta name="framework" content="...">, and version-specific meta tags. Review all meta tags and remove any that do not serve a business purpose. Additionally, remove server headers that leak technology information (X-Powered-By, Server version).',
    uk:
      'Видаліть непотрібні мета-теги, які розкривають деталі технологій. Типові порушники: <meta name="generator" content="WordPress 5.x">, <meta name="framework" content="..."> та версійні мета-теги. Перегляньте всі мета-теги та видаліть ті, що не виконують бізнес-функцію. Крім того, видаліть заголовки сервера, що розкривають інформацію про технології (X-Powered-By, версія Server).',
    ru:
      'Удалите ненужные мета-теги, раскрывающие сведения о технологиях. Типичные нарушители: <meta name="generator" content="WordPress 5.x">, <meta name="framework" content="..."> и версионные мета-теги. Проверьте все мета-теги и удалите те, что не выполняют бизнес-функцию. Кроме того, удалите заголовки сервера, раскрывающие информацию о технологиях (X-Powered-By, версия Server).',
  },
  impact: {
    en:
      'Technology fingerprinting allows attackers to search for known vulnerabilities in the detected software versions. For example, knowing a site runs WordPress 5.2 allows an attacker to check for CVE-2019-8942 and other version-specific vulnerabilities. This information significantly reduces the time needed to find exploitable weaknesses.',
    uk:
      'Фінгерпринтинг технологій дозволяє зловмисникам шукати відомі вразливості у виявлених версіях програмного забезпечення. Наприклад, якщо відомо, що сайт працює на WordPress 5.2, зловмисник може перевірити наявність CVE-2019-8942 та інших вразливостей, специфічних для цієї версії. Ця інформація значно зменшує час, необхідний для пошуку експлуатованих вразливостей.',
    ru:
      'Фингерпринтинг технологий позволяет злоумышленникам искать известные уязвимости в обнаруженных версиях программного обеспечения. Например, знание о том, что сайт работает на WordPress 5.2, позволяет злоумышленнику проверить наличие CVE-2019-8942 и других уязвимостей, специфичных для этой версии. Эта информация значительно сокращает время, необходимое для поиска эксплуатируемых уязвимостей.',
  },
  references: [
    { label: 'OWASP Information Disclosure', url: 'https://owasp.org/www-community/attacks/Information_disclosure' },
  ],
};

export const OPEN_REDIRECT_FORM: KnowledgeBaseEntry = {
  id: 'data-open-redirect',
  category: 'data-exposure',
  severity: 'medium',
  name: {
    en: 'Potential Open Redirect in Forms',
    uk: 'Потенційний відкритий перенаправлення у формах',
    ru: 'Потенциальный открытый перенаправление в формах',
  },
  description: {
    en: 'Forms may contain URL parameters that could be used for open redirect attacks',
    uk: 'Форми можуть містити URL-параметри, які можна використати для атак відкритого перенаправлення',
    ru: 'Формы могут содержать URL-параметры, которые можно использовать для атак открытого перенаправления',
  },
  explanation: {
    en:
      'Open redirects occur when an application accepts user-controlled URLs and redirects to them without validation. Attackers use this to craft URLs that appear to belong to the trusted application but redirect users to malicious sites. This is commonly used in phishing campaigns because users are more likely to trust a URL starting with a known domain.',
    uk:
      'Відкриті перенаправлення виникають, коли додаток приймає URL, контрольовані користувачем, і перенаправляє на них без перевірки. Зловмисники використовують це для створення URL, які виглядають так, ніби належать довіреному додатку, але перенаправляють користувачів на шкідливі сайти. Це часто використовується у фішингових кампаніях, оскільки користувачі більш схильні довіряти URL, що починається з відомого домену.',
    ru:
      'Открытые перенаправления возникают, когда приложение принимает контролируемые пользователем URL и перенаправляет на них без валидации. Злоумышленники используют это для создания URL, которые выглядят принадлежащими доверенному приложению, но перенаправляют пользователей на вредоносные сайты. Это часто используется в фишинговых кампаниях, поскольку пользователи более склонны доверять URL, начинающемуся с известного домена.',
  },
  howToFix: {
    en:
      'Validate all redirect URLs server-side. Maintain a whitelist of allowed redirect destinations. If dynamic redirects are needed, use relative paths only or validate that the URL starts with your domain. Never redirect based on unvalidated query parameters like ?redirect=https://evil.com. Implement URL encoding checks to prevent bypass attempts using URL encoding or double encoding.',
    uk:
      'Валідуйте всі URL перенаправлення на стороні сервера. Підтримуйте білий список дозволених цілей перенаправлення. Якщо потрібні динамічні перенаправлення, використовуйте лише відносні шляхи або перевіряйте, що URL починається з вашого домену. Ніколи не перенаправляйте на основі неперевірених параметрів запиту, таких як ?redirect=https://evil.com. Реалізуйте перевірки URL-кодування для запобігання обходу за допомогою URL-кодування чи подвійного кодування.',
    ru:
      'Валидируйте все URL перенаправления на стороне сервера. Поддерживайте белый список разрешённых целей перенаправления. Если нужны динамические перенаправления, используйте только относительные пути или проверяйте, что URL начинается с вашего домена. Никогда не перенаправляйте на основе невалидированных параметров запроса, таких как ?redirect=https://evil.com. Реализуйте проверки URL-кодирования для предотвращения обхода с помощью URL-кодирования или двойного кодирования.',
  },
  impact: {
    en:
      'Open redirects are powerful tools for phishing attacks. An attacker can craft a link like https://trusted-site.com/redirect?url=https://evil-site.com, and users who see the trusted domain are more likely to click it. This is particularly effective in spear phishing targeting employees of an organization.',
    uk:
      'Відкриті перенаправлення — це потужний інструмент для фішингових атак. Зловмисник може створити посилання на кшталт https://trusted-site.com/redirect?url=https://evil-site.com, і користувачі, які бачать довірений домен, з більшою ймовірністю натиснуть на нього. Це особливо ефективно при цільовому фішингу, спрямованому на працівників організації.',
    ru:
      'Открытые перенаправления — мощный инструмент для фишинговых атак. Злоумышленник может создать ссылку вида https://trusted-site.com/redirect?url=https://evil-site.com, и пользователи, видящие доверенный домен, с большей вероятностью перейдут по ней. Это особенно эффективно при целевом фишинге, направленном на сотрудников организации.',
  },
  references: [
    { label: 'OWASP Open Redirect', url: 'https://owasp.org/www-community/attacks/Open_redirect' },
  ],
};

// ---- Web3 / Crypto ----

export const CRYPTO_ETH_ADDRESS: KnowledgeBaseEntry = {
  id: 'crypto-eth-address',
  category: 'crypto',
  severity: 'info',
  name: {
    en: 'Ethereum Address Detected on Page',
    uk: 'На сторінці виявлено адресу Ethereum',
    ru: 'На странице обнаружен адрес Ethereum',
  },
  description: {
    en: 'One or more Ethereum addresses were found on the scanned page',
    uk: 'На відсканованій сторінці знайдено одну або кілька адрес Ethereum',
    ru: 'На просканированной странице найден один или несколько адресов Ethereum',
  },
  explanation: {
    en:
      'The scanner detected Ethereum addresses in the page content. Ethereum addresses are 42-character hexadecimal strings starting with 0x. While the presence of an Ethereum address is not inherently malicious, it indicates that the page interacts with the Ethereum blockchain. This could be legitimate (payment addresses, donation links) or potentially malicious (phishing, scam wallets).',
    uk:
      'Сканер виявив адреси Ethereum у контенті сторінки. Адреси Ethereum — це 42-символьні шістнадцяткові рядки, що починаються з 0x. Хоча наявність адреси Ethereum не є шкідливою самою по собі, це вказує на те, що сторінка взаємодіє з блокчейном Ethereum. Це може бути легітимним (платіжні адреси, посилання для пожертв) або потенційно шкідливим (фішинг, шахрайські гаманці).',
    ru:
      'Сканер обнаружил адреса Ethereum в содержимом страницы. Адреса Ethereum — это 42-символьные шестнадцатеричные строки, начинающиеся с 0x. Хотя наличие адреса Ethereum не является вредоносным само по себе, это указывает на то, что страница взаимодействует с блокчейном Ethereum. Это может быть легитимным (платёжные адреса, ссылки для пожертвований) или потенциально вредоносным (фишинг, мошеннические кошельки).',
  },
  howToFix: {
    en:
      'Review all detected Ethereum addresses. Verify they belong to the expected entity by checking on blockchain explorers like Etherscan. For payment pages, ensure the address is displayed clearly and matches official documentation. If addresses are not expected on the page, investigate whether they were injected by third-party scripts or compromised content.',
    uk:
      'Перевірте всі виявлені адреси Ethereum. Переконайтеся, що вони належать очікуваній організації, перевіривши на блокчейн-експлорерах на кшталт Etherscan. Для сторінок оплати переконайтеся, що адреса чітко відображається та збігається з офіційною документацією. Якщо адреси на сторінці не очікуються, перевірте, чи не були вони впроваджені сторонніми скриптами чи скомпрометованим контентом.',
    ru:
      'Проверьте все обнаруженные адреса Ethereum. Убедитесь, что они принадлежат ожидаемой организации, проверив на блокчейн-эксплорерах типа Etherscan. Для страниц оплаты убедитесь, что адрес чётко отображается и совпадает с официальной документацией. Если адреса на странице не ожидаются, проверьте, не были ли они внедрены сторонними скриптами или скомпрометированным контентом.',
  },
  impact: {
    en:
      'Malicious sites may display fake Ethereum addresses to trick users into sending cryptocurrency. Attackers may also inject legitimate-looking addresses into compromised pages to redirect payments. Users should always verify addresses independently before sending any cryptocurrency transactions.',
    uk:
      'Шкідливі сайти можуть відображати підроблені адреси Ethereum, щоб обдурити користувачів і змусити їх надіслати криптовалюту. Зловмисники також можуть впроваджувати правдоподібні адреси на скомпрометовані сторінки для перенаправлення платежів. Користувачі завжди повинні самостійно перевіряти адреси перед здійсненням будь-яких криптовалютних транзакцій.',
    ru:
      'Вредоносные сайты могут отображать поддельные адреса Ethereum, чтобы обмануть пользователей и заставить их отправить криптовалюту. Злоумышленники также могут внедрять правдоподобные адреса на скомпрометированные страницы для перенаправления платежей. Пользователи всегда должны самостоятельно проверять адреса перед совершением любых криптовалютных транзакций.',
  },
  references: [
    { label: 'Etherscan', url: 'https://etherscan.io/' },
    { label: 'Ethereum Address Validation', url: 'https://eips.ethereum.org/EIPS/eip-55' },
  ],
};

export const CRYPTO_BTC_ADDRESS: KnowledgeBaseEntry = {
  id: 'crypto-btc-address',
  category: 'crypto',
  severity: 'info',
  name: {
    en: 'Bitcoin Address Detected on Page',
    uk: 'На сторінці виявлено адресу Bitcoin',
    ru: 'На странице обнаружен адрес Bitcoin',
  },
  description: {
    en: 'One or more Bitcoin addresses were found on the scanned page',
    uk: 'На відсканованій сторінці знайдено одну або кілька адрес Bitcoin',
    ru: 'На просканированной странице найден один или несколько адресов Bitcoin',
  },
  explanation: {
    en:
      'The scanner detected Bitcoin addresses in the page content. Bitcoin addresses are alphanumeric strings of 26-35 characters, typically starting with 1, 3, or bc1. While the presence of a Bitcoin address is not inherently malicious, it indicates cryptocurrency-related functionality on the page. Verify the legitimacy of any displayed addresses.',
    uk:
      'Сканер виявив адреси Bitcoin у контенті сторінки. Адреси Bitcoin — це буквено-цифрові рядки з 26–35 символів, що зазвичай починаються з 1, 3 або bc1. Хоча наявність адреси Bitcoin не є шкідливою самою по собі, це вказує на криптовалютну функціональність на сторінці. Перевірте легітимність усіх відображених адрес.',
    ru:
      'Сканер обнаружил адреса Bitcoin в содержимом страницы. Адреса Bitcoin — это буквенно-цифровые строки из 26–35 символов, обычно начинающиеся с 1, 3 или bc1. Хотя наличие адреса Bitcoin не является вредоносным само по себе, это указывает на криптовалютную функциональность на странице. Проверьте легитимность всех отображаемых адресов.',
  },
  howToFix: {
    en:
      'Verify all detected Bitcoin addresses using a blockchain explorer like blockchain.com or blockstream.info. Compare displayed addresses with official documentation. Check if the address has been flagged by any cryptocurrency scam databases. Ensure the page uses HTTPS and has proper security headers to prevent address substitution attacks.',
    uk:
      'Перевірте всі виявлені адреси Bitcoin за допомогою блокчейн-експлорера, такого як blockchain.com або blockstream.info. Порівняйте відображені адреси з офіційною документацією. Перевірте, чи не була адреса позначена в базах даних криптовалютного шахрайства. Переконайтеся, що сторінка використовує HTTPS та має належні заголовки безпеки для запобігання атакам підміни адрес.',
    ru:
      'Проверьте все обнаруженные адреса Bitcoin с помощью блокчейн-эксплорера, такого как blockchain.com или blockstream.info. Сравните отображаемые адреса с официальной документацией. Проверьте, не отмечен ли адрес в базах данных криптовалютного мошенничества. Убедитесь, что страница использует HTTPS и имеет соответствующие заголовки безопасности для предотвращения атак подмены адресов.',
  },
  impact: {
    en:
      'Malicious actors frequently use fake Bitcoin addresses in phishing campaigns. Even on legitimate sites, compromised pages could have addresses replaced to redirect cryptocurrency payments. Users should independently verify addresses before sending funds, especially on pages related to exchanges, wallets, or payment services.',
    uk:
      'Зловмисники часто використовують підроблені адреси Bitcoin у фішингових кампаніях. Навіть на легітимних сайтах скомпрометовані сторінки можуть мати замінені адреси для перенаправлення криптовалютних платежів. Користувачі повинні самостійно перевіряти адреси перед відправкою коштів, особливо на сторінках, пов\'язаних з біржами, гаманцями чи платіжними сервісами.',
    ru:
      'Злоумышленники часто используют поддельные адреса Bitcoin в фишинговых кампаниях. Даже на легитимных сайтах скомпрометированные страницы могут иметь заменённые адреса для перенаправления криптовалютных платежей. Пользователи должны самостоятельно проверять адреса перед отправкой средств, особенно на страницах, связанных с биржами, кошельками или платёжными сервисами.',
  },
  references: [
    { label: 'Blockchain Explorer', url: 'https://www.blockchain.com/explorer' },
    { label: 'Bitcoin Address Format', url: 'https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses' },
  ],
};

export const CRYPTO_WEB3_EXTERNAL: KnowledgeBaseEntry = {
  id: 'crypto-web3-external',
  category: 'crypto',
  severity: 'medium',
  name: {
    en: 'Web3 External Script Integration Detected',
    uk: 'Виявлено інтеграцію зовнішніх Web3-скриптів',
    ru: 'Обнаружена интеграция внешних Web3-скриптов',
  },
  description: {
    en: 'The page loads external scripts from Web3/Crypto CDN sources',
    uk: 'Сторінка завантажує зовнішні скрипти з Web3/криптовалютних CDN-джерел',
    ru: 'Страница загружает внешние скрипты из Web3/криптовалютных CDN-источников',
  },
  explanation: {
    en:
      'External Web3 scripts from CDNs like ethers.js, web3.js, or provider SDKs were detected. While these libraries are commonly used for legitimate blockchain interactions, loading them from external CDNs introduces supply chain attack risks. A compromised CDN could serve malicious versions that steal private keys or wallet signatures.',
    uk:
      'Виявлено зовнішні Web3-скрипти з CDN на кшталт ethers.js, web3.js чи SDK провайдерів. Хоча ці бібліотеки широко використовуються для легітимної взаємодії з блокчейном, завантаження їх із зовнішніх CDN створює ризики атак на ланцюг постачання. Скомпрометований CDN може видавати шкідливі версії, що викрадають приватні ключі чи підписи гаманців.',
    ru:
      'Обнаружены внешние Web3-скрипты из CDN таких как ethers.js, web3.js или SDK провайдеров. Хотя эти библиотеки широко используются для легитимного взаимодействия с блокчейном, загрузка их из внешних CDN создаёт риски атак на цепочку поставок. Скомпрометированный CDN может выдавать вредоносные версии, похищающие приватные ключи или подписи кошельков.',
  },
  howToFix: {
    en:
      'Use Subresource Integrity (SRI) hashes for all external Web3 scripts: <script src="https://cdn.ethers.io/ethers.min.js" integrity="sha384-..." crossorigin="anonymous">. Better yet, self-host these libraries and verify their integrity. Use npm packages and build tools (webpack, vite) to bundle Web3 dependencies. Regularly update dependencies to patch known vulnerabilities. Pin exact versions rather than using latest.',
    uk:
      'Використовуйте хеші цілісності підресурсів (SRI) для всіх зовнішніх Web3-скриптів: <script src="https://cdn.ethers.io/ethers.min.js" integrity="sha384-..." crossorigin="anonymous">. Ще краще — розмістіть ці бібліотеки на власному сервері та перевіряйте їхню цілісність. Використовуйте npm-пакети та інструменти збірки (webpack, vite) для комплектації Web3-залежностей. Регулярно оновлюйте залежності для усунення відомих вразливостей. Фіксуйте точні версії замість використання latest.',
    ru:
      'Используйте хеши целостности подресурсов (SRI) для всех внешних Web3-скриптов: <script src="https://cdn.ethers.io/ethers.min.js" integrity="sha384-..." crossorigin="anonymous">. Ещё лучше — размещайте эти библиотеки на собственном сервере и проверяйте их целостность. Используйте npm-пакеты и инструменты сборки (webpack, vite) для комплектации Web3-зависимостей. Регулярно обновляйте зависимости для исправления известных уязвимостей. Фиксируйте точные версии вместо использования latest.',
  },
  impact: {
    en:
      'Compromised CDN-delivered Web3 scripts could steal wallet private keys, intercept transaction signatures, or redirect payments. The 2021 Poly Network hack and various DeFi exploits have demonstrated that supply chain attacks on Web3 infrastructure can result in losses of hundreds of millions of dollars. Self-hosting with SRI verification significantly reduces this risk.',
    uk:
      'Скомпрометовані Web3-скрипти, що доставляються через CDN, можуть викрадати приватні ключі гаманців, перехоплювати підписи транзакцій або перенаправляти платежі. Злом мережі Poly Network у 2021 році та різні експлойти DeFi продемонстрували, що атаки на ланцюг постачання Web3-інфраструктури можуть призвести до втрат у сотні мільйонів доларів. Самостійне розміщення з перевіркою SRI значно знижує цей ризик.',
    ru:
      'Скомпрометированные Web3-скрипты, доставляемые через CDN, могут похищать приватные ключи кошельков, перехватывать подписи транзакций или перенаправлять платежи. Взлом сети Poly Network в 2021 году и различные эксплойты DeFi продемонстрировали, что атаки на цепочку поставок Web3-инфраструктуры могут привести к потерям в сотни миллионов долларов. Самостоятельное размещение с проверкой SRI значительно снижает этот риск.',
  },
  references: [
    { label: 'SRI Specification', url: 'https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity' },
    { label: 'OWASP Supply Chain', url: 'https://owasp.org/www-community/controls/Supply_Chain_Management' },
  ],
};

export const CRYPTO_DRM_EXTERNAL: KnowledgeBaseEntry = {
  id: 'crypto-wallet-provider',
  category: 'crypto',
  severity: 'low',
  name: {
    en: 'External Wallet Provider Detected',
    uk: 'Виявлено зовнішнього провайдера гаманців',
    ru: 'Обнаружен внешний провайдер кошельков',
  },
  description: {
    en: 'The page references external wallet providers or Web3 injection scripts',
    uk: 'Сторінка посилається на зовнішніх провайдерів гаманців або Web3-скрипти впровадження',
    ru: 'Страница ссылается на внешних провайдеров кошельков или Web3-скрипты внедрения',
  },
  explanation: {
    en:
      'External wallet provider scripts (such as MetaMask, WalletConnect, Coinbase Wallet) were detected on the page. While these are standard integrations for Web3 applications, they indicate that the page interacts with cryptocurrency wallets. Ensure that wallet connection requests are clearly communicated to users and that the page is not impersonating a legitimate dApp.',
    uk:
      'На сторінці виявлено скрипти зовнішніх провайдерів гаманців (таких як MetaMask, WalletConnect, Coinbase Wallet). Хоча це стандартні інтеграції для Web3-додатків, вони вказують на те, що сторінка взаємодіє з криптовалютними гаманцями. Переконайтеся, що запити на підключення гаманця чітко повідомляються користувачам і що сторінка не видаватиме себе за легітимний dApp.',
    ru:
      'На странице обнаружены скрипты внешних провайдеров кошельков (таких как MetaMask, WalletConnect, Coinbase Wallet). Хотя это стандартные интеграции для Web3-приложений, они указывают на то, что страница взаимодействует с криптовалютными кошельками. Убедитесь, что запросы на подключение кошелька чётко сообщаются пользователям и что страница не выдаёт себя за легитимный dApp.',
  },
  howToFix: {
    en:
      'Ensure wallet connection flows clearly indicate which permissions are being requested. Display the connected chain/network clearly. Implement proper error handling for rejected connections. Verify the page URL matches the expected dApp domain. Consider implementing EIP-4361 (Sign-In with Ethereum) for authentication rather than custom wallet signature schemes.',
    uk:
      'Переконайтеся, що процес підключення гаманця чітко вказує, які дозволи запитуються. Зрозуміло відображайте підключену мережу (chain). Реалізуйте належну обробку помилок для відхилених підключень. Перевірте, що URL сторінки збігається з очікуваним доменом dApp. Розгляньте можливість реалізації EIP-4361 (Sign-In with Ethereum) для автентифікації замість власних схем підпису гаманця.',
    ru:
      'Убедитесь, что процесс подключения кошелька чётко указывает, какие разрешения запрашиваются. Понятно отображайте подключённую сеть (chain). Реализуйте надлежащую обработку ошибок для отклонённых подключений. Проверьте, что URL страницы совпадает с ожидаемым доменом dApp. Рассмотрите возможность реализации EIP-4361 (Sign-In with Ethereum) для аутентификации вместо собственных схем подписи кошелька.',
  },
  impact: {
    en:
      'Malicious sites can request excessive wallet permissions or trick users into signing transactions they do not understand. Users connecting their wallets to fake dApps risk losing funds through unauthorized transactions. Always verify the URL and review transaction details before signing.',
    uk:
      'Шкідливі сайти можуть запитувати надмірні дозволи гаманця або обдурити користувачів, змусивши їх підписати транзакції, які вони не розуміють. Користувачі, які підключають свої гаманці до підроблених dApp, ризикують втратити кошти через несанкціоновані транзакції. Завжди перевіряйте URL та переглядайте деталі транзакції перед підписанням.',
    ru:
      'Вредоносные сайты могут запрашивать избыточные разрешения кошелька или обмануть пользователей, заставив их подписать транзакции, которые они не понимают. Пользователи, подключающие свои кошельки к поддельным dApp, рискуют потерять средства через несанкционированные транзакции. Всегда проверяйте URL и просматривайте детали транзакции перед подписанием.',
  },
  references: [
    { label: 'EIP-4361 SIWE', url: 'https://eips.ethereum.org/EIPS/eip-4361' },
    { label: 'Wallet Security Best Practices', url: 'https://docs.metamask.io/guide/security.html' },
  ],
};

// ---- Helper Functions ----

export function getLocalizedEntry(entry: KnowledgeBaseEntry, locale: Locale) {
  return {
    id: entry.id,
    name: entry.name[locale] || entry.name.en,
    category: entry.category,
    severity: entry.severity,
    description: entry.description[locale] || entry.description.en,
    explanation: entry.explanation[locale] || entry.explanation.en,
    howToFix: entry.howToFix[locale] || entry.howToFix.en,
    impact: entry.impact[locale] || entry.impact.en,
    references: entry.references,
  };
}

// ---- JavaScript Analysis ----

export const EXTERN_SCRIPT_NO_SRI: KnowledgeBaseEntry = {
  id: 'sec-extern-script-no-sri',
  category: 'security',
  severity: 'medium',
  name: {
    en: 'External Scripts Without Subresource Integrity',
    uk: 'Зовнішні скрипти без цілісності підресурсів (SRI)',
    ru: 'Внешние скрипты без проверки целостности подресурсов (SRI)',
  },
  description: {
    en: 'External scripts loaded from CDN without Subresource Integrity (SRI) attributes',
    uk: 'Зовнішні скрипти завантажуються з CDN без атрибутів цілісності підресурсів (SRI)',
    ru: 'Внешние скрипты загружаются с CDN без атрибутов целостности подресурсов (SRI)',
  },
  explanation: {
    en:
      'Subresource Integrity (SRI) is a security feature that allows browsers to verify that resources they fetch (such as scripts from CDNs) are delivered without unexpected manipulation. When SRI is enabled, a cryptographic hash of the resource is specified in the integrity attribute, and the browser checks that the fetched resource matches the expected hash. Without SRI, if a CDN is compromised, an attacker could serve a malicious script in place of the legitimate one, leading to complete compromise of any user visiting the page.',
    uk:
      'Цілісність підресурсів (SRI) — це функція безпеки, яка дозволяє браузерам перевіряти, що завантажувані ресурси (наприклад, скрипти з CDN) доставляються без непередбачуваного втручання. Коли SRI увімкнено, криптографічний хеш ресурсу вказується в атрибуті integrity, і браузер перевіряє, чи відповідає завантажений ресурс очікуваному хешу. Без SRI, якщо CDN скомпрометовано, зловмисник може підмінити легітимний скрипт шкідливим, що призведе до повного компрометації будь-якого користувача, який відвідує сторінку.',
    ru:
      'Целостность подресурсов (SRI) — это функция безопасности, позволяющая браузерам проверять, что загружаемые ресурсы (например, скрипты с CDN) доставляются без неожиданного вмешательства. При включённом SRI криптографический хеш ресурса указывается в атрибуте integrity, и браузер проверяет, соответствует ли загруженный ресурс ожидаемому хешу. Без SRI, если CDN скомпрометирован, злоумышленник может подменить легитимный скрипт вредоносным, что приведёт к полной компрометации любого пользователя, посетившего страницу.',
  },
  howToFix: {
    en:
      'Add integrity and crossorigin attributes to all external script tags loaded from CDNs. Use the SRI Hash Generator (https://www.srihash.org/) to generate the hash for each resource. Example: <script src="https://cdn.example.com/lib.js" integrity="sha384-abc123..." crossorigin="anonymous"></script>. Consider self-hosting critical libraries to reduce CDN dependency and improve performance.',
    uk:
      'Додайте атрибути integrity та crossorigin до всіх зовнішніх тегів script, завантажуваних з CDN. Використовуйте генератор хешів SRI (https://www.srihash.org/) для створення хешу для кожного ресурсу. Приклад: <script src="https://cdn.example.com/lib.js" integrity="sha384-abc123..." crossorigin="anonymous"></script>. Розгляньте можливість самостійного хостингу критичних бібліотек для зменшення залежності від CDN та покращення продуктивності.',
    ru:
      'Добавьте атрибуты integrity и crossorigin ко всем внешним тегам script, загружаемым с CDN. Используйте генератор хешей SRI (https://www.srihash.org/) для создания хеша для каждого ресурса. Пример: <script src="https://cdn.example.com/lib.js" integrity="sha384-abc123..." crossorigin="anonymous"></script>. Рассмотрите возможность самостоятельного хостинга критичных библиотек для уменьшения зависимости от CDN и улучшения производительности.',
  },
  impact: {
    en:
      'Without SRI, a compromised CDN or a man-in-the-middle attack could serve tampered scripts to your users, potentially stealing credentials, redirecting to phishing pages, or installing malware. This is especially critical for authentication pages and any page handling financial transactions. CDN compromises have been observed in real-world attacks.',
    uk:
      'Без SRI скомпрометований CDN або атака «людина посередині» може надавати змінені скрипти вашим користувачам, потенційно викрадаючи облікові дані, перенаправляючи на фішингові сторінки або встановлюючи шкідливе ПЗ. Це особливо критично для сторінок автентифікації та будь-якої сторінки, що обробляє фінансові транзакції. Компрометації CDN спостерігалися в реальних атаках.',
    ru:
      'Без SRI скомпрометированный CDN или атака «человек посередине» могут передавать изменённые скрипты вашим пользователям, потенциально похищая учётные данные, перенаправляя на фишинговые страницы или устанавливая вредоносное ПО. Это особенно критично для страниц аутентификации и любой страницы, обрабатывающей финансовые транзакции. Компрометации CDN наблюдались в реальных атаках.',
  },
  references: [
    { label: 'MDN - SRI', url: 'https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity' },
    { label: 'OWASP SRI Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Subresource_Integrity_Cheat_Sheet.html' },
    { label: 'SRI Hash Generator', url: 'https://www.srihash.org/' },
  ],
};

export const INLINE_SCRIPT_SENSITIVE: KnowledgeBaseEntry = {
  id: 'sec-inline-script-sensitive',
  category: 'data-exposure',
  severity: 'high',
  name: {
    en: 'Sensitive Data in Inline Scripts',
    uk: 'Конфіденційні дані у вбудованих скриптах',
    ru: 'Конфиденциальные данные во встроенных скриптах',
  },
  description: {
    en: 'Inline script tags contain sensitive patterns such as API keys, tokens, eval(), or innerHTML',
    uk: 'Вбудовані теги script містять чутливі шаблони, такі як API-ключі, токени, eval() або innerHTML',
    ru: 'Встроенные теги script содержат конфиденциальные паттерны, такие как API-ключи, токены, eval() или innerHTML',
  },
  explanation: {
    en:
      'Inline scripts containing sensitive data such as API keys, authentication tokens, secrets, or passwords are directly exposed in the HTML source. Anyone viewing the page source can extract these values. Additionally, the use of dangerous functions like eval(), innerHTML, document.write(), and postMessage without origin checking introduces significant XSS and injection vulnerabilities. Hardcoded credentials in client-side code are a common finding that can lead to unauthorized access to APIs and services.',
    uk:
      'Вбудовані скрипти, що містять конфіденційні дані, такі як API-ключі, токени автентифікації, секрети чи паролі, безпосередньо відкриті у HTML-джерелі. Будь-хто, хто переглядає джерело сторінки, може витягти ці значення. Крім того, використання небезпечних функцій, таких як eval(), innerHTML, document.write() та postMessage без перевірки походження, створює значні вразливості XSS та впровадження коду. Захардкодені облікові дані в клієнтському коді — це поширена знахідка, яка може призвести до несанкціонованого доступу до API та сервісів.',
    ru:
      'Встроенные скрипты, содержащие конфиденциальные данные, такие как API-ключи, токены аутентификации, секреты или пароли, непосредственно открыты в HTML-источнике. Любой, просматривающий исходный код страницы, может извлечь эти значения. Кроме того, использование опасных функций, таких как eval(), innerHTML, document.write() и postMessage без проверки источника, создаёт значительные XSS-уязвимости и уязвимости внедрения кода. Жёстко закодированные учётные данные в клиентском коде — распространённая находка, которая может привести к несанкционированному доступу к API и сервисам.',
  },
  howToFix: {
    en:
      'Remove all hardcoded sensitive data from client-side code. Move API keys and secrets to server-side environment variables and access them through secure backend endpoints. Replace eval() with safer alternatives such as JSON.parse() for data parsing. Replace innerHTML with textContent or DOMPurify for HTML sanitization. Avoid document.write(). For postMessage, always verify the event.origin. Implement Content-Security-Policy to restrict script execution.',
    uk:
      'Видаліть усі захардкодені конфіденційні дані з клієнтського коду. Перемістіть API-ключі та секрети у серверні змінні оточення та отримуйте доступ до них через захищені серверні кінцеві точки. Замініть eval() на безпечніші альтернативи, такі як JSON.parse() для парсингу даних. Замініть innerHTML на textContent або DOMPurify для санітизації HTML. Уникайте document.write(). Для postMessage завжди перевіряйте event.origin. Впровадьте Content-Security-Policy для обмеження виконання скриптів.',
    ru:
      'Удалите все жёстко закодированные конфиденциальные данные из клиентского кода. Переместите API-ключи и секреты в серверные переменные окружения и обращайтесь к ним через защищённые серверные конечные точки. Замените eval() на более безопасные альтернативы, такие как JSON.parse() для парсинга данных. Замените innerHTML на textContent или DOMPurify для санитизации HTML. Избегайте document.write(). Для postMessage всегда проверяйте event.origin. Внедрите Content-Security-Policy для ограничения выполнения скриптов.',
  },
  impact: {
    en:
      'Exposed API keys can be used to make unauthorized API calls, potentially incurring costs, accessing private data, or performing actions on behalf of the application. eval() and innerHTML enable Cross-Site Scripting (XSS) attacks, allowing attackers to execute arbitrary JavaScript, steal sessions, or redirect users. This is a high-severity finding because client-side code is inherently untrusted and accessible to everyone.',
    uk:
      'Відкриті API-ключі можуть використовуватися для несанкціонованих API-викликів, що потенційно спричиняє витрати, доступ до приватних даних або виконання дій від імені додатку. eval() та innerHTML дозволяють атаки міжсайтового виконання скриптів (XSS), що дозволяє зловмисникам виконувати довільний JavaScript, викрадати сеанси або перенаправляти користувачів. Це високорівнева знахідка, оскільки клієнтський код принципово ненадійний і доступний усім.',
    ru:
      'Открытые API-ключи могут использоваться для несанкционированных API-вызовов, что потенциально влечёт расходы, доступ к приватным данным или выполнение действий от имени приложения. eval() и innerHTML позволяют атаки межсайтового выполнения скриптов (XSS), что позволяет злоумышленникам выполнять произвольный JavaScript, похищать сеансы или перенаправлять пользователей. Это находка высокого уровня, поскольку клиентский код принципиально ненадёжен и доступен всем.',
  },
  references: [
    { label: 'OWASP - Client-side Secrets', url: 'https://owasp.org/www-community/vulnerabilities/Client-side_Secrets' },
    { label: 'MDN - eval()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval' },
    { label: 'DOMPurify', url: 'https://github.com/cure53/DOMPurify' },
  ],
};

export const EXPOSED_API_ENDPOINTS: KnowledgeBaseEntry = {
  id: 'sec-exposed-api-endpoints',
  category: 'data-exposure',
  severity: 'medium',
  name: {
    en: 'Exposed API Endpoints',
    uk: 'Відкриті API-кінцеві точки',
    ru: 'Открытые API-конечные точки',
  },
  description: {
    en: 'API endpoint URLs found in inline JavaScript code',
    uk: 'URL-адреси API-кінцевих точок знайдено у вбудованому коді JavaScript',
    ru: 'URL-адреса API-конечных точек найдены во встроенном коде JavaScript',
  },
  explanation: {
    en:
      'Inline JavaScript code contains hardcoded API endpoint paths (e.g., /api/, /v1/, /graphql, /rest/). This information leakage reveals the application\'s API structure to potential attackers. Knowing the API endpoints allows attackers to probe for vulnerabilities, attempt unauthorized access, perform enumeration attacks, or craft targeted API exploitation attempts. This is particularly concerning when the API lacks proper authentication or rate limiting.',
    uk:
      'Вбудований код JavaScript містить захардкодені шляхи API-кінцевих точок (напр., /api/, /v1/, /graphql, /rest/). Це витік інформації розкриває структуру API додатку потенційним зловмисникам. Знання API-кінцевих точок дозволяє зловмисникам шукати вразливості, намагатися отримати несанкціонований доступ, проводити атаки перерахування або створювати цільові спроби експлуатації API. Це особливо небезпечно, коли API не має належної автентифікації або обмеження частоти запитів.',
    ru:
      'Встроенный код JavaScript содержит жёстко закодированные пути API-конечных точек (напр., /api/, /v1/, /graphql, /rest/). Эта утечка информации раскрывает структуру API приложения потенциальным злоумышленникам. Знание API-конечных точек позволяет злоумышленникам искать уязвимости, пытаться получить несанкционированный доступ, проводить атаки перечисления или создавать целенаправленные попытки эксплуатации API. Это особенно опасно, когда API не имеет надлежащей аутентификации или ограничения частоты запросов.',
  },
  howToFix: {
    en:
      'Move API endpoint configuration to environment variables or a centralized configuration file that is not exposed to the client. Use relative paths where possible. Implement proper API gateway patterns. Ensure all API endpoints have authentication and authorization checks. Consider using API versioning through headers rather than URL paths. Implement rate limiting to prevent enumeration attacks.',
    uk:
      'Перемістіть конфігурацію API-кінцевих точок у змінні оточення або централізований конфігураційний файл, який не відкритий клієнту. Використовуйте відносні шляхи, де це можливо. Впровадьте належні шаблони API-шлюзу. Переконайтеся, що всі API-кінцеві точки мають перевірки автентифікації та авторизації. Розгляньте можливість використання версіонування API через заголовки замість URL-шляхів. Впровадьте обмеження частоти запитів для запобігання атакам перерахування.',
    ru:
      'Переместите конфигурацию API-конечных точек в переменные окружения или централизованный конфигурационный файл, не доступный клиенту. Используйте относительные пути, где это возможно. Внедрите надлежащие шаблоны API-шлюза. Убедитесь, что все API-конечные точки имеют проверки аутентификации и авторизации. Рассмотрите возможность использования версионирования API через заголовки вместо URL-путей. Внедрите ограничение частоты запросов для предотвращения атак перечисления.',
  },
  impact: {
    en:
      'Exposed API endpoints enable reconnaissance and targeted attacks. Attackers can map the API surface, identify authentication mechanisms, test for injection vulnerabilities, and attempt to access restricted resources. If combined with other vulnerabilities (like missing authentication or broken access control), this can lead to data breaches, unauthorized data modification, or complete system compromise.',
    uk:
      'Відкриті API-кінцеві точки дозволяють розвідку та цільові атаки. Зловмисники можуть скласти карту поверхні API, ідентифікувати механізми автентифікації, перевірити наявність вразливостей впровадження та спробувати отримати доступ до обмежених ресурсів. У поєднанні з іншими вразливостями (наприклад, відсутня автентифікація або порушений контроль доступу) це може призвести до витоку даних, несанкціонованої модифікації даних або повної компрометації системи.',
    ru:
      'Открытые API-конечные точки позволяют разведку и целевые атаки. Злоумышленники могут составить карту поверхности API, идентифицировать механизмы аутентификации, проверить наличие уязвимостей внедрения и попытаться получить доступ к ограниченным ресурсам. В сочетании с другими уязвимостями (например, отсутствующая аутентификация или нарушенный контроль доступа) это может привести к утечке данных, несанкционированной модификации данных или полной компрометации системы.',
  },
  references: [
    { label: 'OWASP API Security', url: 'https://owasp.org/www-project-api-security/' },
    { label: 'OWASP API Security Top 10', url: 'https://owasp.org/API-Security/editions/2023/en/0x11-t10/' },
  ],
};

// ---- Info Leakage & Tech Disclosure ----

export const INFO_TECH_DISCLOSURE: KnowledgeBaseEntry = {
  id: 'info-tech-disclosure',
  category: 'data-exposure',
  severity: 'info',
  name: {
    en: 'Technology Stack Disclosure',
    uk: 'Викриття технологічного стеку',
    ru: 'Раскрытие технологического стека',
  },
  description: {
    en: 'Technology stack revealed in HTTP headers or HTML meta tags',
    uk: 'Технологічний стек розкрито через HTTP-заголовки або HTML-метатеги',
    ru: 'Технологический стек раскрыт через HTTP-заголовки или HTML-мета-теги',
  },
  explanation: {
    en:
      'The server is disclosing information about its technology stack through HTTP headers (e.g., Server, X-Powered-By, X-AspNet-Version) or HTML meta tags (e.g., generator meta tag). This information leak reveals the server software, programming language, framework, and CMS versions to potential attackers. Armed with this knowledge, attackers can search for known vulnerabilities specific to the detected technologies and their versions, significantly narrowing the scope of their reconnaissance.',
    uk:
      'Сервер розкриває інформацію про свій технологічний стек через HTTP-заголовки (напр., Server, X-Powered-By, X-AspNet-Version) або HTML-метатеги (напр., мета-тег generator). Ця витік інформації розкриває програмне забезпечення сервера, мову програмування, фреймворк та версії CMS потенційним зловмисникам. Маючи ці дані, зловмисники можуть шукати відомі вразливості, специфічні для виявлених технологій та їх версій, суттєво звужуючи обсяг розвідки.',
    ru:
      'Сервер раскрывает информацию о своём технологическом стеке через HTTP-заголовки (напр., Server, X-Powered-By, X-AspNet-Version) или HTML-мета-теги (напр., мета-тег generator). Эта утечка информации раскрывает программное обеспечение сервера, язык программирования, фреймворк и версии CMS потенциальным злоумышленникам. Имея эти данные, злоумышленники могут искать известные уязвимости, специфичные для обнаруженных технологий и их версий, значительно сужая объём разведки.',
  },
  howToFix: {
    en:
      'Remove or obfuscate server identification headers. For Nginx: set "server_tokens off;". For Apache: set "ServerTokens Prod". Remove the X-Powered-By header in your framework (e.g., in Express.js: app.disable("x-powered-by")). Remove generator meta tags from CMS configurations. Consider using a reverse proxy or WAF to strip identifying headers before they reach the client.',
    uk:
      'Вилучіть або замаскуйте заголовки ідентифікації сервера. Для Nginx: встановіть "server_tokens off;". Для Apache: встановіть "ServerTokens Prod". Вилучіть заголовок X-Powered-By у вашому фреймворку (напр., в Express.js: app.disable("x-powered-by")). Вилучіть мета-теги generator з конфігурацій CMS. Розгляньте можливість використання зворотного проксі або WAF для видалення ідентифікуючих заголовків.',
    ru:
      'Удалите или обфусцируйте заголовки идентификации сервера. Для Nginx: установите "server_tokens off;". Для Apache: установите "ServerTokens Prod". Удалите заголовок X-Powered-By в вашем фреймворке (напр., в Express.js: app.disable("x-powered-by")). Удалите мета-теги generator из конфигураций CMS. Рассмотрите возможность использования обратного прокси или WAF для удаления идентифицирующих заголовков.',
  },
  impact: {
    en:
      'Disclosing technology versions allows attackers to target specific known vulnerabilities (CVEs) for the exact software and version running on the server. This dramatically reduces the time and effort needed for successful exploitation. For example, knowing a site runs PHP 7.4.3 lets an attacker immediately check for CVE-2021-21708 rather than blindly probing.',
    uk:
      'Розкриття версій технологій дозволяє зловмисникам цілитися на специфічні відомі вразливості (CVE) для точного програмного забезпечення та версії, що працює на сервері. Це значно зменшує час та зусилля, необхідні для успішної експлуатації.',
    ru:
      'Раскрытие версий технологий позволяет злоумышленникам целенаправленно искать известные уязвимости (CVE) для конкретного программного обеспечения и версии, работающих на сервере. Это значительно сокращает время и усилия, необходимые для успешной эксплуатации.',
  },
  references: [
    { label: 'OWASP - Information Disclosure', url: 'https://owasp.org/www-community/attacks/Information_disclosure' },
    { label: 'MDN - Remove Server Header', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server' },
  ],
};

export const INFO_EMAIL_LEAKAGE: KnowledgeBaseEntry = {
  id: 'info-email-leakage',
  category: 'data-exposure',
  severity: 'low',
  name: {
    en: 'Email Addresses Found in Page Content',
    uk: 'Знайдено email-адреси у вмісті сторінки',
    ru: 'Обнаружены email-адреса в содержимом страницы',
  },
  description: {
    en: 'Email addresses found in page content',
    uk: 'Email-адреси знайдено у вмісті сторінки',
    ru: 'Email-адреса обнаружены в содержимом страницы',
  },
  explanation: {
    en:
      'The page contains publicly visible email addresses. These can be harvested by automated bots for spam campaigns, phishing attacks, or social engineering. Email addresses exposed on public pages are routinely scraped and added to spam databases. This is particularly concerning for personal email addresses or addresses of specific employees rather than generic contact addresses.',
    uk:
      'Сторінка містить публічно видимі email-адреси. Їх можуть зібрати автоматизовані боти для спам-кампаній, фішингових атак або соціальної інженерії. Email-адреси на публічних сторінках регулярно збираються та додаються до баз даних спаму.',
    ru:
      'Страница содержит публично видимые email-адреса. Их могут собрать автоматизированные боты для спам-кампаний, фишинговых атак или социальной инженерии. Email-адреса на публичных страницах регулярно собираются и добавляются в базы данных спама.',
  },
  howToFix: {
    en:
      'Replace plain-text email addresses with contact forms, use JavaScript-based obfuscation, or employ server-side rendering of email addresses as images. For essential public contacts, use generic addresses (info@, support@) rather than personal ones. Implement email obfuscation techniques such as reversing the address with JavaScript or using entity encoding.',
    uk:
      'Замінійте email-адреси у відкритому тексті контактними формами, використовуйте обфускацію на основі JavaScript або серверний рендеринг email-адрес як зображень. Для важливих публічних контактів використовуйте загальні адреси (info@, support@) замість особистих.',
    ru:
      'Замените email-адреса в открытом тексте контактными формами, используйте обфускацию на основе JavaScript или серверный рендеринг email-адрес как изображений. Для важных публичных контактов используйте общие адреса (info@, support@) вместо личных.',
  },
  impact: {
    en:
      'Exposed email addresses will be added to spam databases, leading to increased spam and phishing emails for the affected addresses. For business addresses, this can reduce productivity. For personal addresses, it increases the risk of targeted phishing and social engineering attacks. Spam bots regularly crawl websites to harvest email addresses.',
    uk:
      'Викриті email-адреси будуть додані до баз даних спаму, що призведе до збільшення кількості спаму та фішингових листів. Для бізнес-адрес це може знизити продуктивність. Для особистих адрес це збільшує ризик цільового фішингу та атак соціальної інженерії.',
    ru:
      'Раскрытые email-адреса будут добавлены в базы данных спама, что приведёт к увеличению количества спама и фишинговых писем. Для бизнес-адрес это может снизить продуктивность. Для личных адрес это увеличивает риск целевого фишинга и атак социальной инженерии.',
  },
  references: [
    { label: 'OWASP - Data Leakage', url: 'https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url' },
  ],
};

export const INFO_PHONE_LEAKAGE: KnowledgeBaseEntry = {
  id: 'info-phone-leakage',
  category: 'data-exposure',
  severity: 'info',
  name: {
    en: 'Phone Numbers Found in Page Content',
    uk: 'Знайдено номери телефонів у вмісті сторінки',
    ru: 'Обнаружены номера телефонов в содержимом страницы',
  },
  description: {
    en: 'Phone numbers found in page content',
    uk: 'Номери телефонів знайдено у вмісті сторінки',
    ru: 'Номера телефонов обнаружены в содержимом страницы',
  },
  explanation: {
    en:
      'The page contains publicly visible phone numbers. While often intentional for contact purposes, exposed phone numbers can be harvested for spam calls, SMS phishing (smishing), or social engineering attacks. Personal or direct-line phone numbers of employees pose a higher risk than generic company numbers.',
    uk:
      'Сторінка містить публічно видимі номери телефонів. Хоча часто це навмисно для контактів, викриті номери можуть бути зібрані для спам-дзвінків, SMS-фішингу (смішингу) або атак соціальної інженерії.',
    ru:
      'Страница содержит публично видимые номера телефонов. Хотя часто это намеренно для контактов, раскрытые номера могут быть собраны для спам-звонков, SMS-фишинга (смишинга) или атак социальной инженерии.',
  },
  howToFix: {
    en:
      'Consider using contact forms instead of displaying direct phone numbers. If phone numbers must be displayed, prefer using company switchboard numbers rather than individual direct lines. Use image-based rendering of phone numbers for critical pages to prevent automated scraping.',
    uk:
      'Розгляньте можливість використання контактних форм замість відображення прямих номерів телефонів. Якщо номери мають бути відображені, надавайте перевагу загальним номерам компанії замість індивідуальних прямих ліній.',
    ru:
      'Рассмотрите возможность использования контактных форм вместо отображения прямых номеров телефонов. Если номера должны быть отображены, отдавайте предпочтение общим номерам компании вместо индивидуальных прямых линий.',
  },
  impact: {
    en:
      'Exposed phone numbers can be used for spam calls, SMS phishing, and social engineering. While the direct security impact is typically low, it contributes to the overall attack surface and can be combined with other leaked information for targeted attacks.',
    uk:
      'Викриті номери телефонів можуть використовуватися для спам-дзвінків, SMS-фішингу та соціальної інженерії. Хоча прямий вплив на безпеку зазвичай низький, це сприяє загальному збільшенню поверхні атаки.',
    ru:
      'Раскрытые номера телефонов могут использоваться для спам-звонков, SMS-фишинга и социальной инженерии. Хотя прямое влияние на безопасность обычно низкое, это способствует общему увеличению поверхности атаки.',
  },
  references: [
    { label: 'OWASP - Data Leakage', url: 'https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url' },
  ],
};

export const INFO_INTERNAL_IP: KnowledgeBaseEntry = {
  id: 'info-internal-ip',
  category: 'data-exposure',
  severity: 'medium',
  name: {
    en: 'Internal IP Addresses or Hostnames Exposed',
    uk: 'Викрито внутрішні IP-адреси або імена хостів',
    ru: 'Раскрыты внутренние IP-адреса или имена хостов',
  },
  description: {
    en: 'Internal IP addresses or hostnames exposed in page content',
    uk: 'Внутрішні IP-адреси або імена хостів розкрито у вмісті сторінки',
    ru: 'Внутренние IP-адреса или имена хостов раскрыты в содержимом страницы',
  },
  explanation: {
    en:
      'The page contains references to internal IP addresses (e.g., 10.x.x.x, 192.168.x.x, 172.16-31.x.x) or internal hostnames (e.g., .local, .internal, .intranet, .corp). This information leaks details about the internal network infrastructure, which can assist attackers in planning network intrusion attempts, understanding the network topology, and identifying potential targets for lateral movement after gaining initial access.',
    uk:
      'Сторінка містить посилання на внутрішні IP-адреси (напр., 10.x.x.x, 192.168.x.x, 172.16-31.x.x) або внутрішні імена хостів (напр., .local, .internal, .intranet, .corp). Ця інформація витікає деталі про внутрішню мережеву інфраструктуру, що може допомогти зловмисникам у плануванні спроб проникнення в мережу.',
    ru:
      'Страница содержит ссылки на внутренние IP-адреса (напр., 10.x.x.x, 192.168.x.x, 172.16-31.x.x) или внутренние имена хостов (напр., .local, .internal, .intranet, .corp). Эта информация раскрывает детали внутренней сетевой инфраструктуры, что может помочь злоумышленникам в планировании попыток проникновения в сеть.',
  },
  howToFix: {
    en:
      'Remove all references to internal IP addresses and hostnames from public-facing content. Use relative paths or environment variables for internal references. Implement a pre-deployment scanning process to detect accidental inclusion of internal network information. Ensure that debug output, error messages, and comments do not contain internal network details.',
    uk:
      'Вилучіть усі посилання на внутрішні IP-адреси та імена хостів з публічного контенту. Використовуйте відносні шляхи або змінні оточення для внутрішніх посилань. Впровадьте процес передрозгортного сканування для виявлення випадкового включення інформації про внутрішню мережу.',
    ru:
      'Удалите все ссылки на внутренние IP-адреса и имена хостов из публичного контента. Используйте относительные пути или переменные окружения для внутренних ссылок. Внедрите процесс предразвертного сканирования для обнаружения случайного включения информации о внутренней сети.',
  },
  impact: {
    en:
      'Knowledge of internal IP addresses and hostnames allows attackers to understand the internal network topology, identify critical infrastructure components (databases, internal services, development servers), and plan targeted attacks. This is particularly dangerous when combined with SSRF vulnerabilities, as it provides known internal targets to probe. Internal hostnames can reveal technology choices, naming conventions, and organizational structure.',
    uk:
      'Знання внутрішніх IP-адрес та імен хостів дозволяє зловмисникам зрозуміти топологію внутрішньої мережі, ідентифікувати критичні компоненти інфраструктури та планувати цільові атаки. Це особливо небезпечно в поєднанні з вразливостями SSRF.',
    ru:
      'Знание внутренних IP-адрес и имён хостов позволяет злоумышленникам понять топологию внутренней сети, идентифицировать критические компоненты инфраструктуры и планировать целевые атаки. Это особенно опасно в сочетании с SSRF-уязвимостями.',
  },
  references: [
    { label: 'OWASP - SSRF', url: 'https://owasp.org/www-community/attacks/Server_Side_Request_Forgery' },
    { label: 'CWE-200', url: 'https://cwe.mitre.org/data/definitions/200.html' },
  ],
};

export const INFO_SENSITIVE_COMMENTS: KnowledgeBaseEntry = {
  id: 'info-sensitive-comments',
  category: 'data-exposure',
  severity: 'medium',
  name: {
    en: 'Sensitive Information in HTML Comments',
    uk: 'Конфіденційна інформація у HTML-коментарях',
    ru: 'Конфиденциальная информация в HTML-комментариях',
  },
  description: {
    en: 'Sensitive information found in HTML comments',
    uk: 'Конфіденційну інформацію знайдено у HTML-коментарях',
    ru: 'Конфиденциальная информация обнаружена в HTML-комментариях',
  },
  explanation: {
    en:
      'HTML comments on the page contain sensitive information such as passwords, API keys, credentials, debug configuration, internal URLs, or security-related TODO notes. HTML comments are visible to anyone viewing the page source and are never processed by the browser but are fully accessible to attackers performing reconnaissance. Developers sometimes leave sensitive notes, credentials, or debug information in comments that are pushed to production.',
    uk:
      'HTML-коментарі на сторінці містять конфіденційну інформацію, таку як паролі, API-ключі, облікові дані, конфігурацію налагодження, внутрішні URL-адреси або примітки TODO щодо безпеки. HTML-коментарі доступні кожному, хто переглядає вихідний код сторінки.',
    ru:
      'HTML-комментарии на странице содержат конфиденциальную информацию, такую как пароли, API-ключи, учётные данные, конфигурацию отладки, внутренние URL-адреса или заметки TODO по безопасности. HTML-комментарии доступны каждому, кто просматривает исходный код страницы.',
  },
  howToFix: {
    en:
      'Remove all sensitive information from HTML comments before deployment. Implement a build step or CI/CD check that scans for sensitive patterns in comments. Use automated tools to strip comments from production builds. Train developers to never commit credentials, debug information, or sensitive notes in code comments. Use pre-commit hooks to detect sensitive data in committed files.',
    uk:
      'Вилучіть усю конфіденційну інформацію з HTML-коментарів перед розгортанням. Впровадьте етап збірки або перевірку CI/CD, яка сканує коментарі на наявність конфіденційних шаблонів. Використовуйте автоматизовані інструменти для видалення коментарів із production-збірок.',
    ru:
      'Удалите всю конфиденциальную информацию из HTML-комментариев перед развёртыванием. Внедрите этап сборки или проверку CI/CD, которая сканирует комментарии на наличие конфиденциальных шаблонов. Используйте автоматизированные инструменты для удаления комментариев из production-сборок.',
  },
  impact: {
    en:
      'Sensitive information in comments provides attackers with direct intelligence about the application. Passwords and API keys can be immediately used for unauthorized access. Debug configuration reveals internal paths and settings. Security TODO notes highlight known weaknesses that attackers can prioritize. Internal URLs expose infrastructure details that aid in network reconnaissance.',
    uk:
      'Конфіденційна інформація в коментарях надає зловмисникам прямі розвідувальні дані про додаток. Паролі та API-ключі можуть бути негайно використані для несанкціонованого доступу. Конфігурація налагодження розкриває внутрішні шляхи та налаштування.',
    ru:
      'Конфиденциальная информация в комментариях предоставляет злоумышленникам прямые разведывательные данные о приложении. Пароли и API-ключи могут быть немедленно использованы для несанкционированного доступа. Конфигурация отладки раскрывает внутренние пути и настройки.',
  },
  references: [
    { label: 'OWASP - Code Review Guide', url: 'https://owasp.org/www-project-code-review-guide/' },
    { label: 'CWE-615', url: 'https://cwe.mitre.org/data/definitions/615.html' },
  ],
};

export const INFO_OPEN_REDIRECT: KnowledgeBaseEntry = {
  id: 'info-open-redirect',
  category: 'security',
  severity: 'medium',
  name: {
    en: 'Meta Refresh Redirect to External URL',
    uk: 'Мета-перенаправлення на зовнішній URL',
    ru: 'Мета-перенаправление на внешний URL',
  },
  description: {
    en: 'Meta refresh redirect to external URL detected',
    uk: 'Виявлено мета-перенаправлення на зовнішній URL',
    ru: 'Обнаружено мета-перенаправление на внешний URL',
  },
  explanation: {
    en:
      'The page contains a <meta http-equiv="refresh"> tag that redirects users to an external URL. This can be exploited for open redirect attacks if the redirect URL is user-controlled or dynamically generated. Meta refresh redirects bypass many security controls that would otherwise catch JavaScript-based redirects. Attackers can use this to redirect users to phishing pages that mimic the legitimate site, stealing credentials or session tokens.',
    uk:
      'Сторінка містить тег <meta http-equiv="refresh">, який перенаправляє користувачів на зовнішній URL. Це може бути використано для атак відкритого перенаправлення, якщо URL перенаправлення контролюється користувачем або генерується динамічно.',
    ru:
      'Страница содержит тег <meta http-equiv="refresh">, который перенаправляет пользователей на внешний URL. Это может быть использовано для атак открытого перенаправления, если URL перенаправления контролируется пользователем или генерируется динамически.',
  },
  howToFix: {
    en:
      'Remove unnecessary meta refresh redirects. If a redirect is needed, use HTTP 301/302 redirects from the server side instead. If meta refresh must be used, validate and whitelist the target URL to ensure it only redirects to trusted domains. Never include user-supplied data directly in the redirect URL without proper validation and sanitization.',
    uk:
      'Вилучіть непотрібні мета-перенаправлення. Якщо перенаправлення потрібне, використовуйте HTTP 301/302 перенаправлення з боку сервера. Якщо мета-перенаправлення необхідне, перевірте та внесіть URL-адресу призначення до білого списку.',
    ru:
      'Удалите ненужные мета-перенаправления. Если перенаправление необходимо, используйте HTTP 301/302 перенаправления со стороны сервера. Если мета-перенаправление необходимо, проверьте и внесите URL-адресу назначения в белый список.',
  },
  impact: {
    en:
      'Open redirects via meta refresh can be used in phishing attacks, where an attacker crafts a URL to the legitimate site that then redirects to a malicious clone. Users are more likely to trust the initial legitimate URL. This can lead to credential theft, session hijacking, malware distribution, or social engineering attacks. Meta refresh redirects are particularly effective because they are harder to detect and block than JavaScript-based redirects.',
    uk:
      'Відкриті перенаправлення через мета-тег можуть використовуватися у фішингових атаках, де зловмисник створює URL на легітимний сайт, який потім перенаправляє на шкідливий клон. Користувачі більш схильні довіряти початковому легітимному URL.',
    ru:
      'Открытые перенаправления через мета-тег могут использоваться в фишинговых атаках, где злоумышленник создаёт URL на легитимный сайт, который затем перенаправляет на вредоносный клон. Пользователи более склонны доверять начальному легитимному URL.',
  },
  references: [
    { label: 'OWASP - Open Redirect', url: 'https://owasp.org/www-community/attacks/Open_redirect' },
    { label: 'CWE-601', url: 'https://cwe.mitre.org/data/definitions/601.html' },
  ],
};

// ---- New high-impact entries ----

export const HARDCODED_API_KEY: KnowledgeBaseEntry = {
  id: 'sec-hardcoded-api-key',
  category: 'security',
  severity: 'critical',
  name: { en: 'Hardcoded API Key / Secret Exposed in Source', uk: 'Захардкоджений API-ключ / секрет у вихідному коді', ru: 'Захардкоженный API-ключ / секрет в исходном коде' },
  description: { en: 'A real API key, secret token or credential was found in client-side source code', uk: 'Реальний API-ключ, секретний токен або обліковий запис знайдено в клієнтському коді', ru: 'Реальный API-ключ, секретный токен или учётные данные найдены в клиентском коде' },
  explanation: {
    en: 'A secret key or API token with a recognizable format (AWS access key, Google API key, Stripe secret key, GitHub token, JWT, etc.) was found in JavaScript source code that is accessible to any visitor. These secrets should NEVER be embedded in client-side code. Any visitor can extract them using browser DevTools.',
    uk: 'У JavaScript-коді, доступному будь-якому відвідувачу, знайдено секретний ключ або API-токен з розпізнаваним форматом (AWS, Google, Stripe, GitHub, JWT тощо). Ці секрети НІКОЛИ не мають бути у клієнтському коді.',
    ru: 'В JavaScript-коде, доступном любому посетителю, найден секретный ключ или API-токен с распознаваемым форматом (AWS, Google, Stripe, GitHub, JWT и т.д.). Эти секреты НИКОГДА не должны быть в клиентском коде.',
  },
  howToFix: {
    en: 'Move all secrets to server-side environment variables. For public-facing API keys (e.g., Google Maps embed key), restrict them by domain, IP, or API quota in the provider console. Rotate any exposed keys immediately. Use tools like git-secrets, trufflehog, or gitleaks to prevent future leaks. For JWTs, validate them server-side only.',
    uk: 'Перемістіть всі секрети до серверних змінних середовища. Для публічних ключів (Google Maps тощо) обмежте їх у консолі провайдера. Негайно замініть будь-які виявлені ключі. Використовуйте git-secrets або trufflehog для запобігання майбутніх витоків.',
    ru: 'Перенесите все секреты в серверные переменные среды. Для публичных ключей ограничьте их в консоли провайдера. Немедленно замените любые обнаруженные ключи. Используйте git-secrets или trufflehog для предотвращения будущих утечек.',
  },
  impact: {
    en: 'Exposed AWS keys can lead to cloud infrastructure takeover and massive bills. Exposed Stripe secret keys allow fraudulent charges. GitHub tokens enable source code theft. Google API key abuse can run up thousands in charges. Any JWT secret exposure allows creating arbitrary tokens and bypassing all authentication.',
    uk: 'Відкриті AWS-ключі можуть призвести до захоплення хмарної інфраструктури та великих рахунків. Відкриті секретні ключі Stripe дозволяють шахрайські платежі. Токени GitHub дозволяють крадіжку коду.',
    ru: 'Открытые AWS-ключи могут привести к захвату облачной инфраструктуры и огромным счетам. Открытые секретные ключи Stripe позволяют мошеннические платежи. Токены GitHub позволяют кражу кода.',
  },
  references: [
    { label: 'OWASP Secrets Management', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html' },
    { label: 'CWE-798', url: 'https://cwe.mitre.org/data/definitions/798.html' },
  ],
};

export const LOCALSTORAGE_SENSITIVE: KnowledgeBaseEntry = {
  id: 'sec-localstorage-sensitive',
  category: 'security',
  severity: 'high',
  name: { en: 'Sensitive Data Stored in localStorage / sessionStorage', uk: 'Чутливі дані в localStorage / sessionStorage', ru: 'Чувствительные данные в localStorage / sessionStorage' },
  description: { en: 'Private keys, tokens, or credentials are being stored in browser localStorage or sessionStorage', uk: 'Приватні ключі, токени або облікові дані зберігаються у localStorage/sessionStorage браузера', ru: 'Приватные ключи, токены или учётные данные хранятся в localStorage/sessionStorage браузера' },
  explanation: {
    en: 'The application stores sensitive data (private keys, session tokens, passwords) in localStorage or sessionStorage. These storage mechanisms are accessible to any JavaScript on the page — including third-party scripts, browser extensions, and XSS payloads. Unlike HttpOnly cookies, there is no browser protection against JavaScript access to localStorage.',
    uk: 'Застосунок зберігає чутливі дані у localStorage або sessionStorage, доступних будь-якому JavaScript на сторінці, включаючи сторонні скрипти, розширення браузера та XSS-пейлоади.',
    ru: 'Приложение хранит чувствительные данные в localStorage или sessionStorage, доступных любому JavaScript на странице, включая сторонние скрипты, расширения браузера и XSS-пейлоады.',
  },
  howToFix: {
    en: 'Never store private keys, passwords, or long-lived tokens in localStorage. Use HttpOnly cookies for session tokens. For Web3 apps, use hardware wallets or browser wallet extensions (MetaMask) which handle private key storage securely. For short-lived tokens, use sessionStorage with caution and combine with CSP to limit XSS risk.',
    uk: 'Ніколи не зберігайте приватні ключі, паролі або довгострокові токени в localStorage. Використовуйте HttpOnly cookies для сеансових токенів. Для Web3 — використовуйте апаратні гаманці або розширення браузера.',
    ru: 'Никогда не храните приватные ключи, пароли или долгосрочные токены в localStorage. Используйте HttpOnly cookies для сеансовых токенов. Для Web3 — используйте аппаратные кошельки или расширения браузера.',
  },
  impact: {
    en: 'An XSS vulnerability anywhere on the page (even in a third-party widget) can silently exfiltrate all localStorage data. For Web3 apps, this means complete theft of private keys and loss of all connected wallet funds. For regular apps, this enables account takeover through stolen session tokens.',
    uk: 'XSS-вразливість будь-де на сторінці може безшумно вивантажити всі дані localStorage. Для Web3-застосунків це означає крадіжку приватних ключів та втрату всіх коштів гаманця.',
    ru: 'XSS-уязвимость где угодно на странице может бесшумно эксфильтровать все данные localStorage. Для Web3-приложений это означает кражу приватных ключей и потерю всех средств кошелька.',
  },
  references: [
    { label: 'OWASP HTML5 Storage', url: 'https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage' },
    { label: 'CWE-922', url: 'https://cwe.mitre.org/data/definitions/922.html' },
  ],
};

export const REVERSE_TABNAPPING: KnowledgeBaseEntry = {
  id: 'sec-reverse-tabnapping',
  category: 'security',
  severity: 'low',
  name: { en: 'Reverse Tabnapping — target="_blank" Without rel="noopener"', uk: 'Reverse Tabnapping — target="_blank" без rel="noopener"', ru: 'Reverse Tabnapping — target="_blank" без rel="noopener"' },
  description: { en: 'Links with target="_blank" allow the opened page to access window.opener and redirect the original tab', uk: 'Посилання з target="_blank" дозволяють відкритій сторінці отримати доступ до window.opener та перенаправити оригінальну вкладку', ru: 'Ссылки с target="_blank" позволяют открытой странице получить доступ к window.opener и перенаправить оригинальную вкладку' },
  explanation: {
    en: 'Links with target="_blank" that lack rel="noopener noreferrer" allow the newly opened page to access the parent window via window.opener. A malicious or compromised target page can then redirect the original tab to a phishing page while the user is reading the new tab. This attack is particularly effective on Web3 sites where users follow links to Etherscan, OpenSea, or DeFi protocols.',
    uk: 'Посилання з target="_blank" без rel="noopener noreferrer" дозволяють новій відкритій сторінці мати доступ до батьківського вікна через window.opener. Шкідлива або скомпрометована цільова сторінка може перенаправити оригінальну вкладку на фішинговий сайт, поки користувач читає нову вкладку.',
    ru: 'Ссылки с target="_blank" без rel="noopener noreferrer" позволяют новой открытой странице иметь доступ к родительскому окну через window.opener. Вредоносная или скомпрометированная целевая страница может перенаправить оригинальную вкладку на фишинговый сайт, пока пользователь читает новую вкладку.',
  },
  howToFix: {
    en: 'Add rel="noopener noreferrer" to all links with target="_blank". Modern browsers (Chrome 88+, Firefox) automatically apply noopener to _blank links, but adding it explicitly ensures backward compatibility. Example: <a href="..." target="_blank" rel="noopener noreferrer">. If using React, configure your linter with the jsx-no-target-blank rule.',
    uk: 'Додайте rel="noopener noreferrer" до всіх посилань з target="_blank". Приклад: <a href="..." target="_blank" rel="noopener noreferrer">. У React налаштуйте правило jsx-no-target-blank в ESLint.',
    ru: 'Добавьте rel="noopener noreferrer" ко всем ссылкам с target="_blank". Пример: <a href="..." target="_blank" rel="noopener noreferrer">. В React настройте правило jsx-no-target-blank в ESLint.',
  },
  impact: {
    en: 'Used in phishing attacks where users click a legitimate-looking link on your site, and the destination page redirects your original page to a phishing clone of your site. The user returns to the "original" tab and sees a fake login page, entering their credentials. Particularly dangerous for crypto wallet login pages.',
    uk: 'Використовується у фішингових атаках: користувач натискає на посилання на вашому сайті, відкрита сторінка перенаправляє оригінальну вкладку на фішинговий клон вашого сайту. Особливо небезпечно для сторінок входу до крипто-гаманців.',
    ru: 'Используется в фишинговых атаках: пользователь нажимает на ссылку на вашем сайте, открытая страница перенаправляет оригинальную вкладку на фишинговый клон вашего сайта. Особенно опасно для страниц входа крипто-кошельков.',
  },
  references: [
    { label: 'OWASP HTML5 Security', url: 'https://owasp.org/www-community/attacks/Reverse_Tabnabbing' },
    { label: 'MDN rel=noopener', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/noopener' },
  ],
};

export const IFRAME_NO_SANDBOX: KnowledgeBaseEntry = {
  id: 'sec-iframe-no-sandbox',
  category: 'security',
  severity: 'info',
  name: { en: 'Embedded iframe Without sandbox Attribute', uk: 'Вбудований iframe без атрибута sandbox', ru: 'Встроенный iframe без атрибута sandbox' },
  description: { en: 'Embedded iframes lack the sandbox attribute, allowing them to execute scripts and access parent window APIs', uk: 'Вбудовані iframe не мають атрибута sandbox, що дозволяє їм виконувати скрипти та доступ до батьківського вікна', ru: 'Встроенные iframe не имеют атрибута sandbox, что позволяет им выполнять скрипты и обращаться к родительскому окну' },
  explanation: {
    en: 'iframes without the sandbox attribute have full JavaScript execution capabilities and can access parent window APIs. A compromised third-party iframe can navigate the parent window, access cookies (if accessible), read form data, or perform actions on behalf of the user. This is especially concerning for iframes loaded from third-party domains.',
    uk: 'Iframe без атрибута sandbox мають повні можливості виконання JavaScript та доступ до API батьківського вікна. Скомпрометований сторонній iframe може навігувати батьківське вікно, отримувати доступ до cookie або виконувати дії від імені користувача.',
    ru: 'Iframe без атрибута sandbox имеют полные возможности выполнения JavaScript и доступ к API родительского окна. Скомпрометированный сторонний iframe может навигировать родительское окно, получать доступ к cookie или выполнять действия от имени пользователя.',
  },
  howToFix: {
    en: 'Add sandbox="allow-scripts allow-same-origin" or similar restrictive policy to all third-party iframes. Use the most restrictive sandbox that still allows required functionality. Common sandbox values: allow-scripts (JS), allow-forms (form submission), allow-popups (popup windows), allow-same-origin (same-origin access). Never use sandbox="" without allow-same-origin for third-party content.',
    uk: 'Додайте sandbox="allow-scripts allow-same-origin" або більш обмежувальну політику до всіх сторонніх iframe. Використовуйте найбільш обмежений sandbox, що все ще дозволяє необхідну функціональність.',
    ru: 'Добавьте sandbox="allow-scripts allow-same-origin" или более ограничительную политику ко всем сторонним iframe. Используйте наиболее ограниченный sandbox, который всё ещё позволяет необходимую функциональность.',
  },
  impact: {
    en: 'A compromised third-party iframe can steal form data, redirect the parent page, exfiltrate user data, or perform actions like initiating transactions. Low severity because exploitation requires the embedded content to be malicious or compromised.',
    uk: 'Скомпрометований сторонній iframe може викрасти дані форм, перенаправити батьківську сторінку або ініціювати транзакції.',
    ru: 'Скомпрометированный сторонний iframe может похитить данные форм, перенаправить родительскую страницу или инициировать транзакции.',
  },
  references: [{ label: 'MDN iframe sandbox', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox' }],
};

export const FORM_EXTERNAL_ACTION: KnowledgeBaseEntry = {
  id: 'sec-form-external-action',
  category: 'security',
  severity: 'high',
  name: { en: 'Form Submitting Data to External Domain', uk: 'Форма надсилає дані на зовнішній домен', ru: 'Форма отправляет данные на внешний домен' },
  description: { en: 'An HTML form action attribute points to an external domain, potentially exfiltrating user data', uk: 'Атрибут action HTML-форми вказує на зовнішній домен, що може призводити до витоку даних користувача', ru: 'Атрибут action HTML-формы указывает на внешний домен, что может привести к утечке данных пользователей' },
  explanation: {
    en: "An HTML form's action attribute is set to a URL on a different domain than the current page. This means all form data (including usernames, passwords, and other inputs) will be sent directly to the external domain. This could be a legitimate design choice (e.g., third-party payment processors) or it could indicate a supply chain attack or form hijacking where an attacker has modified the form action to their server.",
    uk: "Атрибут action HTML-форми вказує на URL на іншому домені. Це означає, що всі дані форми (включаючи паролі) будуть надіслані безпосередньо на зовнішній домен. Це може бути легітимним (платіжні системи) або ознакою атаки на ланцюг постачання.",
    ru: "Атрибут action HTML-формы указывает на URL на другом домене. Это означает, что все данные формы (включая пароли) будут отправлены напрямую на внешний домен. Это может быть легитимным (платёжные системы) или признаком атаки на цепочку поставок.",
  },
  howToFix: {
    en: "Verify that all form action URLs pointing to external domains are intentional and trusted. For payment forms, ensure you are using established payment processors (Stripe, PayPal) and that the action URLs match official documentation. If the external domain is unexpected, immediately investigate for potential supply chain compromise or form hijacking.",
    uk: 'Перевірте, що всі URL в атрибуті action форм, що вказують на зовнішні домени, є навмисними та довіреними. Для платіжних форм переконайтеся, що URL відповідають офіційній документації.',
    ru: 'Проверьте, что все URL в атрибуте action форм, указывающие на внешние домены, являются намеренными и доверенными. Для платёжных форм убедитесь, что URL соответствуют официальной документации.',
  },
  impact: {
    en: 'Credentials, personal data, and payment information entered into the form will be sent to the external domain. In a supply chain attack scenario, this could enable mass credential theft or payment fraud. Attackers have used this vector to compromise high-traffic e-commerce sites and steal thousands of customer credentials.',
    uk: 'Облікові дані, особисті дані та платіжна інформація, введені у форму, будуть надіслані на зовнішній домен. В атаці на ланцюг постачання це може дозволити масову крадіжку облікових даних.',
    ru: 'Учётные данные, персональные данные и платёжная информация, введённые в форму, будут отправлены на внешний домен. В атаке на цепочку поставок это может позволить массовую кражу учётных данных.',
  },
  references: [
    { label: 'OWASP Form Action', url: 'https://owasp.org/www-community/attacks/Web_Parameter_Tampering' },
    { label: 'CWE-601', url: 'https://cwe.mitre.org/data/definitions/601.html' },
  ],
};

export const WEB3_SEED_PHRASE: KnowledgeBaseEntry = {
  id: 'crypto-seed-phrase-exposed',
  category: 'crypto',
  severity: 'critical',
  name: { en: 'Seed Phrase / Private Key Exposed in Source', uk: 'Seed-фраза / приватний ключ у вихідному коді', ru: 'Сид-фраза / приватный ключ в исходном коде' },
  description: { en: 'A BIP39 mnemonic seed phrase or raw private key was found in the page source', uk: 'BIP39 мнемонічну сід-фразу або приватний ключ знайдено у вихідному коді сторінки', ru: 'BIP39 мнемоническая сид-фраза или приватный ключ найдены в исходном коде страницы' },
  explanation: {
    en: 'A cryptocurrency seed phrase (12 or 24 BIP39 mnemonic words) or a raw private key (64-character hex string for Ethereum) was detected in the page HTML or JavaScript source. This is the most severe possible finding in a Web3 security audit. Anyone who sees this page can immediately drain all associated wallets.',
    uk: 'У HTML або JavaScript джерелі сторінки виявлено криптовалютну сід-фразу (12 або 24 BIP39 слова) або приватний ключ (64-символьний hex рядок). Це найсерйозніша можлива знахідка в аудиті Web3 безпеки.',
    ru: 'В HTML или JavaScript источнике страницы обнаружена криптовалютная сид-фраза (12 или 24 слова BIP39) или приватный ключ (64-символьная hex строка). Это наиболее серьёзная возможная находка в аудите Web3 безопасности.',
  },
  howToFix: {
    en: 'If a real seed phrase or private key was found: 1) IMMEDIATELY transfer all funds from associated wallets to a new wallet. 2) Revoke this page from all caches (CDN purge, Google deindex). 3) Rotate all associated keys. 4) Audit git history for previous exposures. NEVER hardcode wallet keys in source code. Use hardware wallets (Ledger, Trezor) and environment variables for server-side signing operations.',
    uk: 'Якщо знайдено реальну сід-фразу або приватний ключ: 1) НЕГАЙНО перемістіть всі кошти з пов\'язаних гаманців на новий. 2) Очистіть CDN кеш та деіндексуйте сторінку. 3) Зробіть ротацію всіх пов\'язаних ключів. Ніколи не хардкодьте ключі.',
    ru: 'Если найдена реальная сид-фраза или приватный ключ: 1) НЕМЕДЛЕННО переведите все средства из связанных кошельков в новый. 2) Очистите CDN кеш и деиндексируйте страницу. 3) Ротируйте все связанные ключи. Никогда не хардкодьте ключи.',
  },
  impact: {
    en: 'Complete and immediate loss of all cryptocurrency assets in associated wallets. A single exposed seed phrase gives full control over all wallet addresses derived from it. This is irreversible — blockchain transactions cannot be reversed once the funds are moved.',
    uk: 'Повна та негайна втрата всіх криптовалютних активів у пов\'язаних гаманцях. Одна відкрита сід-фраза дає повний контроль над усіма адресами гаманців, похідними від неї. Це незворотньо.',
    ru: 'Полная и немедленная потеря всех криптовалютных активов в связанных кошельках. Одна открытая сид-фраза даёт полный контроль над всеми адресами кошельков, производными от неё. Это необратимо.',
  },
  references: [
    { label: 'BIP39 Mnemonic', url: 'https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki' },
    { label: 'OWASP Secrets Management', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html' },
  ],
};

export const WEB3_CLIPBOARD_HIJACK: KnowledgeBaseEntry = {
  id: 'crypto-clipboard-hijack',
  category: 'crypto',
  severity: 'critical',
  name: { en: 'Clipboard Hijacking — Crypto Address Swapping', uk: 'Перехоплення буфера обміну — підміна крипто-адрес', ru: 'Перехват буфера обмена — подмена крипто-адресов' },
  description: { en: 'JavaScript intercepts clipboard copy events to replace copied cryptocurrency addresses with attacker-controlled ones', uk: 'JavaScript перехоплює події копіювання буфера обміну для заміни скопійованих крипто-адрес на адреси зловмисника', ru: 'JavaScript перехватывает события копирования буфера обмена для замены скопированных крипто-адресов на адреса злоумышленника' },
  explanation: {
    en: 'The page contains JavaScript code that intercepts clipboard events (copy, cut events or clipboard API). This technique is used by malicious actors to replace any Ethereum or Bitcoin address copied by the user with an address controlled by the attacker. The user thinks they copied a legitimate address but actually pastes the attacker\'s address in their wallet.',
    uk: 'Сторінка містить JavaScript код, що перехоплює події буфера обміну. Ця техніка використовується зловмисниками для заміни будь-якої крипто-адреси, скопійованої користувачем, на адресу зловмисника. Користувач думає, що скопіював легітимну адресу.',
    ru: 'Страница содержит JavaScript код, перехватывающий события буфера обмена. Эта техника используется злоумышленниками для замены любого крипто-адреса, скопированного пользователем, на адрес злоумышленника. Пользователь думает, что скопировал легитимный адрес.',
  },
  howToFix: {
    en: 'If clipboard access is used for legitimate copy-to-clipboard UX (e.g., "Copy address" button): ensure the copied content is exactly what is displayed, add visual confirmation of what was copied, and audit all clipboard-related JavaScript. If this is third-party code, audit the library immediately. Consider implementing address verification showing the first/last characters.',
    uk: 'Якщо доступ до буфера обміну використовується для легітимних UX цілей: переконайтеся, що скопійований вміст точно відповідає відображеному, додайте візуальне підтвердження. Перевірте весь код, пов\'язаний з буфером обміну.',
    ru: 'Если доступ к буферу обмена используется для легитимных UX целей: убедитесь, что скопированное содержимое точно соответствует отображаемому, добавьте визуальное подтверждение. Проверьте весь код, связанный с буфером обмена.',
  },
  impact: {
    en: 'Users who copy a cryptocurrency address shown on screen and paste it into their wallet will unknowingly send funds to the attacker. This is a highly effective attack because users rarely verify the full pasted address. Losses can be significant — crypto transactions are irreversible.',
    uk: 'Користувачі, які копіюють крипто-адресу та вставляють її в гаманець, несвідомо надішлють кошти зловмиснику. Це дуже ефективна атака, оскільки користувачі рідко перевіряють повну вставлену адресу. Втрати незворотні.',
    ru: 'Пользователи, копирующие крипто-адрес и вставляющие его в кошелёк, неосознанно отправят средства злоумышленнику. Это высокоэффективная атака, поскольку пользователи редко проверяют полный вставленный адрес. Потери необратимы.',
  },
  references: [
    { label: 'Clipboard Hijacking Attacks', url: 'https://owasp.org/www-community/attacks/Clipboard_Hijacking' },
  ],
};

export const WEB3_ETHEREUM_OVERRIDE: KnowledgeBaseEntry = {
  id: 'crypto-ethereum-provider-override',
  category: 'crypto',
  severity: 'high',
  name: { en: 'window.ethereum Provider Override / Wallet Injection Attack', uk: 'Перевизначення window.ethereum / атака впровадження гаманця', ru: 'Переопределение window.ethereum / атака внедрения кошелька' },
  description: { en: 'JavaScript attempts to override or replace window.ethereum, potentially intercepting all wallet transactions', uk: 'JavaScript намагається перевизначити або замінити window.ethereum, потенційно перехоплюючи всі транзакції гаманця', ru: 'JavaScript пытается переопределить или заменить window.ethereum, потенциально перехватывая все транзакции кошелька' },
  explanation: {
    en: 'The page contains JavaScript that assigns to or redefines window.ethereum — the standard interface used by all Web3 wallets (MetaMask, Coinbase Wallet, etc.). This can be used to intercept all wallet interactions: transaction signing, address requests, and token approvals. A malicious override can redirect transactions, forge approval prompts, or extract wallet data.',
    uk: 'Сторінка містить JavaScript, що призначає або перевизначає window.ethereum — стандартний інтерфейс Web3 гаманців. Це може використовуватися для перехоплення всіх взаємодій з гаманцем: підписання транзакцій, запити адрес та схвалення токенів.',
    ru: 'Страница содержит JavaScript, назначающий или переопределяющий window.ethereum — стандартный интерфейс Web3 кошельков. Это может использоваться для перехвата всех взаимодействий с кошельком: подписания транзакций, запросов адресов и одобрений токенов.',
  },
  howToFix: {
    en: 'Audit all code that modifies window.ethereum. Legitimate use cases are limited to polyfills and wallet provider detection. If this appears in third-party code or unexpectedly, treat as a supply chain compromise. Use Subresource Integrity (SRI) on all scripts. Implement a Content Security Policy to limit script sources.',
    uk: 'Перевірте весь код, що змінює window.ethereum. Легітимні випадки обмежені поліфілами та виявленням провайдерів гаманця. Якщо це з\'являється в сторонньому коді, розгляньте як компрометацію ланцюга постачання.',
    ru: 'Проверьте весь код, изменяющий window.ethereum. Легитимные случаи ограничены полифилами и обнаружением провайдеров кошелька. Если это появляется в стороннем коде, рассматривайте как компрометацию цепочки поставок.',
  },
  impact: {
    en: 'A malicious window.ethereum override can intercept every transaction, secretly change recipient addresses or amounts, fake approval dialogs, extract private keys if the wallet exposes them, or perform unauthorized token approvals. All wallet operations become compromised.',
    uk: 'Шкідливе перевизначення window.ethereum може перехоплювати кожну транзакцію, таємно змінювати адреси або суми, підробляти діалоги схвалення або виконувати несанкціоновані схвалення токенів.',
    ru: 'Вредоносное переопределение window.ethereum может перехватывать каждую транзакцию, тайно изменять адреса или суммы, подделывать диалоги одобрения или выполнять несанкционированные одобрения токенов.',
  },
  references: [
    { label: 'EIP-1193 Provider API', url: 'https://eips.ethereum.org/EIPS/eip-1193' },
    { label: 'Web3 Security', url: 'https://consensys.io/blog/the-most-common-smart-contract-bugs-of-2020' },
  ],
};

export const WEB3_WALLET_DRAINER: KnowledgeBaseEntry = {
  id: 'crypto-wallet-drainer',
  category: 'crypto',
  severity: 'critical',
  name: { en: 'Wallet Drainer Pattern Detected', uk: 'Виявлено патерн wallet drainer', ru: 'Обнаружен паттерн wallet drainer' },
  description: { en: 'JavaScript patterns associated with wallet drainer scripts were detected (max approval, transferFrom, permit2)', uk: 'Виявлено JavaScript патерни, пов\'язані зі скриптами wallet drainer (максимальне схвалення, transferFrom, permit2)', ru: 'Обнаружены JavaScript паттерны, связанные со скриптами wallet drainer (максимальное одобрение, transferFrom, permit2)' },
  explanation: {
    en: 'The page contains JavaScript patterns commonly used in wallet drainer scripts: requesting max token approvals (approve with MAX_UINT256/type(uint256).max), permit2 signatures, transferFrom calls, or setApprovalForAll (NFT drainer pattern). These patterns are used by scam DeFi sites to request unlimited access to user tokens and then drain all assets.',
    uk: 'Сторінка містить JavaScript патерни, що часто використовуються в скриптах wallet drainer: запит максимального схвалення токенів (approve з MAX_UINT256), підписи permit2, виклики transferFrom або setApprovalForAll (NFT drainer). Ці патерни використовуються шахрайськими DeFi-сайтами.',
    ru: 'Страница содержит JavaScript паттерны, часто используемые в скриптах wallet drainer: запрос максимального одобрения токенов (approve с MAX_UINT256), подписи permit2, вызовы transferFrom или setApprovalForAll (NFT drainer). Эти паттерны используются мошенническими DeFi-сайтами.',
  },
  howToFix: {
    en: 'If legitimate: ensure token approvals are always for exact amounts needed, never MAX_UINT256 (use exact amount approvals instead). Display clear approval summaries to users. Implement approval revocation tools. If these patterns are unexpected or in third-party code, treat as active malicious code and remove immediately.',
    uk: 'Якщо це легітимно: переконайтеся, що схвалення токенів завжди на точну необхідну суму, ніколи MAX_UINT256. Відображайте чіткі підсумки схвалень користувачам. Реалізуйте інструменти відкликання схвалень.',
    ru: 'Если это легитимно: убедитесь, что одобрения токенов всегда на точную необходимую сумму, никогда MAX_UINT256. Отображайте чёткие сводки одобрений пользователям. Реализуйте инструменты отзыва одобрений.',
  },
  impact: {
    en: 'Wallet drainer scripts have stolen hundreds of millions of dollars in crypto assets. Once a user signs a max approval transaction, the attacker can drain all tokens of that type from the wallet at any time, even long after the user has left the site. NFT drainers using setApprovalForAll can transfer entire NFT collections.',
    uk: 'Скрипти wallet drainer вкрали сотні мільйонів доларів у крипто-активах. Після підписання максимального схвалення зловмисник може дренувати всі токени цього типу з гаманця в будь-який час. NFT drainer через setApprovalForAll може передати цілі колекції NFT.',
    ru: 'Скрипты wallet drainer похитили сотни миллионов долларов в крипто-активах. После подписания максимального одобрения злоумышленник может дренировать все токены этого типа из кошелька в любое время. NFT drainer через setApprovalForAll может передать целые коллекции NFT.',
  },
  references: [
    { label: 'Wallet Drainer Analysis', url: 'https://www.certik.com/resources/blog/wallet-drainer-explained' },
    { label: 'ERC-20 Approve Risks', url: 'https://docs.openzeppelin.com/contracts/4.x/api/token/erc20' },
  ],
};

export const STACK_TRACE_EXPOSED: KnowledgeBaseEntry = {
  id: 'info-stack-trace-exposed',
  category: 'data-exposure',
  severity: 'high',
  name: { en: 'Stack Trace / Debug Information Exposed', uk: 'Стек-трейс / налагоджувальна інформація розкрита', ru: 'Стек-трейс / отладочная информация раскрыта' },
  description: { en: 'Server-side stack traces, error messages, or debug information are visible in the HTTP response', uk: 'Серверні стек-трейси, повідомлення помилок або налагоджувальна інформація відображаються у HTTP-відповіді', ru: 'Серверные стек-трейсы, сообщения об ошибках или отладочная информация отображаются в HTTP-ответе' },
  explanation: {
    en: 'The server is returning debug information, stack traces, or error messages in the HTTP response. This reveals internal implementation details including: file paths, database queries, library versions, server configuration, internal IP addresses, and code logic. This information is extremely valuable to an attacker planning a targeted attack.',
    uk: 'Сервер повертає налагоджувальну інформацію, стек-трейси або повідомлення помилок у HTTP-відповіді. Це розкриває внутрішні деталі реалізації: шляхи файлів, запити до бази даних, версії бібліотек, конфігурацію сервера.',
    ru: 'Сервер возвращает отладочную информацию, стек-трейсы или сообщения об ошибках в HTTP-ответе. Это раскрывает внутренние детали реализации: пути файлов, запросы к базе данных, версии библиотек, конфигурацию сервера.',
  },
  howToFix: {
    en: 'Disable debug mode in production. For Django: set DEBUG = False and configure ALLOWED_HOSTS. For Rails: ensure config.consider_all_requests_local = false in production.rb. For Laravel: set APP_DEBUG=false in .env. For Node.js/Express: use a generic error handler that returns sanitized messages. Never show stack traces to end users.',
    uk: 'Вимкніть режим налагодження у продакшні. Для Django: DEBUG = False. Для Rails: consider_all_requests_local = false. Для Laravel: APP_DEBUG=false. Для Node.js: використовуйте загальний обробник помилок з санітизованими повідомленнями.',
    ru: 'Отключите режим отладки в продакшне. Для Django: DEBUG = False. Для Rails: consider_all_requests_local = false. Для Laravel: APP_DEBUG=false. Для Node.js: используйте общий обработчик ошибок с санитизированными сообщениями.',
  },
  impact: {
    en: 'Stack traces reveal the technology stack, version numbers, file system paths, database table names, and internal logic. This dramatically reduces the effort required for a targeted attack. Database-related stack traces often include query parameters that can reveal SQL injection points.',
    uk: 'Стек-трейси розкривають технологічний стек, версії, шляхи файлової системи, назви таблиць БД та внутрішню логіку. Це різко зменшує зусилля для цільової атаки. Стек-трейси з БД часто містять параметри запитів, що виявляють точки SQL-ін\'єкції.',
    ru: 'Стек-трейсы раскрывают технологический стек, версии, пути файловой системы, имена таблиц БД и внутреннюю логику. Это резко снижает усилия для целевой атаки. Стек-трейсы с БД часто содержат параметры запросов, раскрывающие точки SQL-инъекции.',
  },
  references: [
    { label: 'OWASP Error Handling', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html' },
    { label: 'CWE-209', url: 'https://cwe.mitre.org/data/definitions/209.html' },
  ],
};

export const ROBOTS_SENSITIVE_PATHS: KnowledgeBaseEntry = {
  id: 'info-robots-sensitive-paths',
  category: 'data-exposure',
  severity: 'low',
  name: { en: 'robots.txt Reveals Sensitive Paths', uk: 'robots.txt розкриває чутливі шляхи', ru: 'robots.txt раскрывает чувствительные пути' },
  description: { en: 'The robots.txt file exposes admin panels, API endpoints, or other sensitive paths that should not be publicly known', uk: 'Файл robots.txt розкриває адмін-панелі, API-ендпоінти або інші чутливі шляхи', ru: 'Файл robots.txt раскрывает административные панели, API-эндпоинты или другие чувствительные пути' },
  explanation: {
    en: 'The robots.txt file is publicly accessible and contains Disallow directives that reveal sensitive paths. While the intention is to prevent search engine indexing, the opposite effect occurs for attackers — the Disallow entries serve as a roadmap of sensitive areas. Common sensitive paths revealed: /admin, /api, /backup, /config, /.env, staging environments, and internal tools.',
    uk: 'Файл robots.txt публічно доступний і містить директиви Disallow, що розкривають чутливі шляхи. Хоча намір — запобігти індексуванню пошуковими системами, для зловмисників це навпаки — шляхи Disallow слугують картою чутливих ділянок.',
    ru: 'Файл robots.txt публично доступен и содержит директивы Disallow, раскрывающие чувствительные пути. Хотя намерение — предотвратить индексирование поисковыми системами, для злоумышленников это наоборот — пути Disallow служат картой чувствительных областей.',
  },
  howToFix: {
    en: "Don't rely on robots.txt for security. Properly protect sensitive endpoints with authentication and authorization regardless of robots.txt. Consider using a wildcard Disallow: / approach if you don't need search indexing. For sensitive admin panels, add authentication at the server level rather than relying on obscurity.",
    uk: 'Не покладайтеся на robots.txt для безпеки. Захищайте чутливі ендпоінти автентифікацією незалежно від robots.txt. Розгляньте підхід Disallow: / якщо індексування не потрібне.',
    ru: 'Не полагайтесь на robots.txt для безопасности. Защищайте чувствительные эндпоинты аутентификацией независимо от robots.txt. Рассмотрите подход Disallow: / если индексирование не нужно.',
  },
  impact: {
    en: 'Revealed admin paths allow targeted attacks on management interfaces. Exposed API paths enable API enumeration attacks. Staging environment URLs can lead to less-secured pre-production systems being targeted. This is reconnaissance information that reduces attacker effort significantly.',
    uk: 'Виявлені адмін-шляхи дозволяють цільові атаки на інтерфейси управління. Відкриті API-шляхи дозволяють атаки перерахування API. URL середовищ staging можуть призвести до атак на менш захищені pre-production системи.',
    ru: 'Раскрытые admin-пути позволяют целевые атаки на интерфейсы управления. Открытые API-пути позволяют атаки перечисления API. URL staging-сред могут привести к атакам на менее защищённые pre-production системы.',
  },
  references: [
    { label: 'robots.txt Security', url: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/01-Conduct_Search_Engine_Discovery_Reconnaissance_for_Information_Leakage' },
  ],
};

export const HTTP_NO_HTTPS_REDIRECT: KnowledgeBaseEntry = {
  id: 'sec-http-no-https-redirect',
  category: 'security',
  severity: 'low',
  name: { en: 'HTTP Version Does Not Redirect to HTTPS', uk: 'HTTP-версія не перенаправляє на HTTPS', ru: 'HTTP-версия не перенаправляет на HTTPS' },
  description: { en: 'The site is accessible over HTTP without redirecting to the secure HTTPS version', uk: 'Сайт доступний через HTTP без перенаправлення на HTTPS', ru: 'Сайт доступен по HTTP без перенаправления на HTTPS' },
  explanation: {
    en: 'When a user visits the HTTP version of the site, the server serves content over an unencrypted connection instead of redirecting to HTTPS. This means any communication over HTTP is transmitted in plaintext and can be intercepted, modified, or eavesdropped on by anyone on the network path between the user and server. HSTS headers are ineffective without this redirect.',
    uk: 'Коли користувач відвідує HTTP-версію сайту, сервер обслуговує контент через незашифроване з\'єднання замість перенаправлення на HTTPS. Будь-яка комунікація через HTTP передається у відкритому вигляді.',
    ru: 'Когда пользователь посещает HTTP-версию сайта, сервер обслуживает контент через незашифрованное соединение вместо перенаправления на HTTPS. Любая коммуникация по HTTP передаётся в открытом виде.',
  },
  howToFix: {
    en: 'Configure your web server to redirect all HTTP traffic to HTTPS with a 301 Permanent Redirect. Nginx: return 301 https://$host$request_uri;. Apache: Redirect permanent / https://yoursite.com/. Combined with HSTS, this ensures users always use encrypted connections. Test both HTTP and HTTPS versions after configuration.',
    uk: 'Налаштуйте веб-сервер для перенаправлення всього HTTP-трафіку на HTTPS з 301. Nginx: return 301 https://$host$request_uri;. Apache: Redirect permanent / https://yoursite.com/.',
    ru: 'Настройте веб-сервер для перенаправления всего HTTP-трафика на HTTPS с 301. Nginx: return 301 https://$host$request_uri;. Apache: Redirect permanent / https://yoursite.com/.',
  },
  impact: {
    en: 'Users who visit http:// version have their traffic exposed to interception. An attacker performing SSL stripping can downgrade connections to HTTP indefinitely if no redirect exists. Login credentials and session tokens transmitted over HTTP are visible to network observers.',
    uk: 'Користувачі, що відвідують http://, мають свій трафік відкритим для перехоплення. Зловмисник може виконати SSL stripping атаку, якщо перенаправлення відсутнє. Облікові дані та токени, передані через HTTP, видимі мережевим спостерігачам.',
    ru: 'Пользователи, посещающие http://, имеют трафик открытым для перехвата. Злоумышленник может выполнить SSL stripping атаку, если перенаправление отсутствует. Учётные данные и токены, переданные по HTTP, видны сетевым наблюдателям.',
  },
  references: [
    { label: 'OWASP Transport Security', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html' },
    { label: 'MDN HTTPS redirect', url: 'https://developer.mozilla.org/en-US/docs/Web/Security/HTTP_strict_transport_security' },
  ],
};

export const CORS_MISCONFIGURED: KnowledgeBaseEntry = {
  id: 'sec-cors-misconfigured',
  category: 'security',
  severity: 'high',
  name: {
    en: 'CORS Misconfiguration — Overly Permissive Policy',
    uk: 'Неправильна конфігурація CORS — надто дозвільна політика',
    ru: 'Неправильная конфигурация CORS — слишком разрешительная политика',
  },
  description: {
    en: 'Access-Control-Allow-Origin is set to wildcard (*) or reflects the Origin header without validation',
    uk: 'Access-Control-Allow-Origin встановлено в * або відображає заголовок Origin без перевірки',
    ru: 'Access-Control-Allow-Origin установлен в * или отражает заголовок Origin без проверки',
  },
  explanation: {
    en: 'The Cross-Origin Resource Sharing (CORS) policy is misconfigured. When Access-Control-Allow-Origin is set to wildcard (*), any website can make cross-origin requests to your server and read the responses. If Access-Control-Allow-Credentials is also true (wildcard + credentials), this is a CRITICAL vulnerability: attackers can make authenticated requests to your API from any origin, stealing session data, user information, or performing privileged actions. Even without credentials, a wildcard CORS policy allows any site to read responses, leaking sensitive data returned by your API endpoints.',
    uk: 'Політика Cross-Origin Resource Sharing (CORS) налаштована неправильно. Коли Access-Control-Allow-Origin встановлено в *, будь-який сайт може робити крос-доменні запити до вашого сервера та читати відповіді. Якщо ще й Access-Control-Allow-Credentials: true — це КРИТИЧНА вразливість.',
    ru: 'Политика Cross-Origin Resource Sharing (CORS) настроена неправильно. Когда Access-Control-Allow-Origin установлен в *, любой сайт может делать кросс-доменные запросы к вашему серверу и читать ответы. Если ещё и Access-Control-Allow-Credentials: true — это КРИТИЧЕСКАЯ уязвимость.',
  },
  howToFix: {
    en: 'Restrict Access-Control-Allow-Origin to specific trusted origins. Maintain an allowlist of permitted origins and validate the incoming Origin header against it: if (allowedOrigins.includes(req.headers.origin)) res.setHeader("Access-Control-Allow-Origin", req.headers.origin). Never combine Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true — browsers block this per spec, but some frameworks mishandle it. Use Access-Control-Allow-Methods and Access-Control-Allow-Headers to restrict permitted methods and headers.',
    uk: 'Обмежте Access-Control-Allow-Origin конкретними довіреними походженнями. Ведіть список дозволених origins та перевіряйте вхідний заголовок Origin. Ніколи не поєднуйте Access-Control-Allow-Origin: * з Access-Control-Allow-Credentials: true.',
    ru: 'Ограничьте Access-Control-Allow-Origin конкретными доверенными источниками. Ведите список разрешённых origins и проверяйте входящий заголовок Origin. Никогда не совмещайте Access-Control-Allow-Origin: * с Access-Control-Allow-Credentials: true.',
  },
  impact: {
    en: 'A CORS misconfiguration can allow malicious websites to silently make authenticated requests to your API on behalf of logged-in users, reading sensitive data (personal info, tokens, financial records) or performing privileged operations. Combined with credentials, full account takeover is possible. This is a top bug class found in real-world pentests and bug bounties.',
    uk: 'Неправильна конфігурація CORS дозволяє шкідливим сайтам робити автентифіковані запити до вашого API від імені авторизованих користувачів, читаючи конфіденційні дані або виконуючи привілейовані операції.',
    ru: 'Неправильная конфигурация CORS позволяет вредоносным сайтам делать аутентифицированные запросы к вашему API от имени авторизованных пользователей, читая конфиденциальные данные или выполняя привилегированные операции.',
  },
  references: [
    { label: 'OWASP CORS', url: 'https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny' },
    { label: 'PortSwigger CORS', url: 'https://portswigger.net/web-security/cors' },
    { label: 'MDN CORS', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS' },
  ],
};

export const CSP_WEAK_POLICY: KnowledgeBaseEntry = {
  id: 'sec-csp-weak',
  category: 'security',
  severity: 'medium',
  name: {
    en: 'Content-Security-Policy Is Present but Weak',
    uk: 'Content-Security-Policy присутній, але слабкий',
    ru: 'Content-Security-Policy присутствует, но слабый',
  },
  description: {
    en: "CSP contains unsafe directives (unsafe-inline, unsafe-eval, wildcard *) that undermine the policy's protection",
    uk: 'CSP містить небезпечні директиви (unsafe-inline, unsafe-eval, *), які підривають захист',
    ru: 'CSP содержит небезопасные директивы (unsafe-inline, unsafe-eval, *), подрывающие защиту',
  },
  explanation: {
    en: "A Content-Security-Policy header is present but contains directives that significantly weaken or negate its protection. 'unsafe-inline' allows inline scripts and event handlers, defeating CSP's main purpose of blocking injected scripts. 'unsafe-eval' allows eval() and similar dangerous functions. A wildcard (*) in script-src allows scripts from any domain. These directives are commonly added for quick-fix compatibility but leave the site vulnerable to XSS attacks despite having CSP.",
    uk: "Заголовок Content-Security-Policy присутній, але містить директиви, що значно послаблюють захист. 'unsafe-inline' дозволяє вбудовані скрипти та обробники подій, позбавляючи CSP основної функції блокування впроваджених скриптів. 'unsafe-eval' дозволяє eval() та подібні небезпечні функції.",
    ru: "Заголовок Content-Security-Policy присутствует, но содержит директивы, значительно ослабляющие защиту. 'unsafe-inline' разрешает встроенные скрипты и обработчики событий, лишая CSP основной функции блокировки внедрённых скриптов. 'unsafe-eval' разрешает eval() и подобные опасные функции.",
  },
  howToFix: {
    en: "Remove 'unsafe-inline' by replacing inline scripts with external files and using nonce-based or hash-based allowlisting. Remove 'unsafe-eval' by refactoring code that uses eval(), new Function(), or setTimeout with string arguments. Replace wildcard sources with specific trusted domains. Use Content-Security-Policy-Report-Only mode to test stricter policies before enforcement. Tools like CSP Evaluator (csp-evaluator.withgoogle.com) can help identify weak directives.",
    uk: "Видаліть 'unsafe-inline', замінивши вбудовані скрипти зовнішніми файлами та використовуючи nonce-based або hash-based дозволи. Видаліть 'unsafe-eval', рефакторуючи код, що використовує eval(). Замініть wildcard-джерела конкретними довіреними доменами.",
    ru: "Удалите 'unsafe-inline', заменив встроенные скрипты внешними файлами и используя nonce-based или hash-based разрешения. Удалите 'unsafe-eval', рефакторируя код, использующий eval(). Замените wildcard-источники конкретными доверенными доменами.",
  },
  impact: {
    en: "A weak CSP provides a false sense of security. With 'unsafe-inline', any XSS payload that can inject an inline <script> tag or event handler will execute, making CSP ineffective against the most common attack vector. Attackers actively look for CSP configurations with these bypasses.",
    uk: "Слабкий CSP створює хибне відчуття безпеки. З 'unsafe-inline' будь-який XSS-пейлоад, що може впровадити тег <script> або обробник подій, буде виконаний, роблячи CSP неефективним.",
    ru: "Слабый CSP создаёт ложное ощущение безопасности. С 'unsafe-inline' любой XSS-пейлоад, способный внедрить тег <script> или обработчик событий, будет выполнен, делая CSP неэффективным.",
  },
  references: [
    { label: 'CSP Evaluator', url: 'https://csp-evaluator.withgoogle.com' },
    { label: 'OWASP CSP Bypass', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html' },
  ],
};

export const SERVER_VERSION_DISCLOSURE: KnowledgeBaseEntry = {
  id: 'sec-server-version-disclosure',
  category: 'security',
  severity: 'low',
  name: {
    en: 'Server Version Disclosure',
    uk: 'Розкриття версії сервера',
    ru: 'Раскрытие версии сервера',
  },
  description: {
    en: 'Server or X-Powered-By header reveals specific version information',
    uk: 'Заголовок Server або X-Powered-By розкриває конкретну інформацію про версію',
    ru: 'Заголовок Server или X-Powered-By раскрывает конкретную информацию о версии',
  },
  explanation: {
    en: 'The server is disclosing its software version in HTTP response headers (Server or X-Powered-By). This information helps attackers identify exactly which version of the software is running and search for known CVEs, exploits, or version-specific attack techniques. Version disclosure is a direct violation of the principle of least information.',
    uk: 'Сервер розкриває версію програмного забезпечення в HTTP-заголовках відповіді (Server або X-Powered-By). Ця інформація допомагає зловмисникам ідентифікувати точну версію та шукати відомі CVE, експлойти або версійно-специфічні техніки атак.',
    ru: 'Сервер раскрывает версию программного обеспечения в HTTP-заголовках ответа (Server или X-Powered-By). Эта информация помогает злоумышленникам идентифицировать точную версию и искать известные CVE, эксплойты или версионно-специфичные техники атак.',
  },
  howToFix: {
    en: 'Remove or mask version information from Server and X-Powered-By headers. For nginx: server_tokens off; in nginx.conf. For Apache: ServerTokens Prod; and ServerSignature Off; in httpd.conf. For PHP (X-Powered-By): expose_php = Off in php.ini. For Express.js: app.disable("x-powered-by") or use the helmet middleware.',
    uk: 'Вилучіть або приховайте інформацію про версію з заголовків Server та X-Powered-By. Для nginx: server_tokens off;. Для Apache: ServerTokens Prod; та ServerSignature Off;. Для PHP: expose_php = Off. Для Express.js: app.disable("x-powered-by").',
    ru: 'Удалите или скройте информацию о версии из заголовков Server и X-Powered-By. Для nginx: server_tokens off;. Для Apache: ServerTokens Prod; и ServerSignature Off;. Для PHP: expose_php = Off. Для Express.js: app.disable("x-powered-by").',
  },
  impact: {
    en: 'Knowing the exact server version allows attackers to target known vulnerabilities (CVEs) without trial and error. For example, knowing the exact nginx or PHP version allows narrowing down exploitable vulnerabilities from thousands to a handful. This is a standard first step in targeted attacks and automated exploitation chains.',
    uk: 'Знання точної версії сервера дозволяє зловмисникам цілеспрямовано використовувати відомі вразливості (CVE) без зайвих спроб. Наприклад, знаючи точну версію nginx або PHP, можна звузити список потенційно вразливих CVE.',
    ru: 'Знание точной версии сервера позволяет злоумышленникам целенаправленно использовать известные уязвимости (CVE) без лишних попыток. Зная точную версию nginx или PHP, можно сузить список потенциально эксплуатируемых CVE.',
  },
  references: [
    { label: 'OWASP Info Disclosure', url: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/02-Fingerprint_Web_Server' },
    { label: 'CWE-200', url: 'https://cwe.mitre.org/data/definitions/200.html' },
  ],
};

export const SENSITIVE_PATH_EXPOSED: KnowledgeBaseEntry = {
  id: 'sec-sensitive-path-exposed',
  category: 'security',
  severity: 'high',
  name: {
    en: 'Sensitive File or Path Exposed',
    uk: 'Відкритий чутливий файл або шлях',
    ru: 'Открытый чувствительный файл или путь',
  },
  description: {
    en: 'Sensitive files (.env, .git, phpinfo, backup) are publicly accessible',
    uk: 'Чутливі файли (.env, .git, phpinfo, backup) доступні публічно',
    ru: 'Чувствительные файлы (.env, .git, phpinfo, backup) доступны публично',
  },
  explanation: {
    en: 'One or more sensitive files or directories are publicly accessible on the web server. This can include environment configuration files (.env) containing database credentials and API keys, version control directories (.git) exposing the full source code and history, PHP info pages (phpinfo.php) revealing the server configuration, or backup files (*.sql, *.bak, *.zip) containing application data. Any of these can provide an attacker with critical information or direct access to sensitive data.',
    uk: 'Один або більше чутливих файлів або директорій є публічно доступними на веб-сервері. Це може включати конфігураційні файли середовища (.env) з обліковими даними бази даних та API-ключами, директорії контролю версій (.git), PHP info сторінки або резервні копії.',
    ru: 'Один или несколько чувствительных файлов или директорий публично доступны на веб-сервере. Это может включать файлы конфигурации среды (.env) с учётными данными базы данных и API-ключами, директории контроля версий (.git), PHP info страницы или резервные копии.',
  },
  howToFix: {
    en: 'Immediately restrict access to these paths via web server configuration. For nginx: location ~ /\\.(?!well-known) { deny all; }. For Apache: <FilesMatch "^\\.(env|git|htaccess)"> Require all denied </FilesMatch>. Remove backup files from the webroot. Add .env, .git, and backup directories to .gitignore. Use .htaccess or nginx rules to block access to sensitive file extensions (.bak, .sql, .tar, .zip).',
    uk: 'Негайно обмежте доступ до цих шляхів через конфігурацію веб-сервера. Для nginx: location ~ /\\.(?!well-known) { deny all; }. Вилучіть резервні копії з webroot. Додайте .env, .git та резервні директорії до .gitignore.',
    ru: 'Немедленно ограничьте доступ к этим путям через конфигурацию веб-сервера. Для nginx: location ~ /\\.(?!well-known) { deny all; }. Удалите резервные копии из webroot. Добавьте .env, .git и резервные директории в .gitignore.',
  },
  impact: {
    en: 'Exposed .env files directly provide database passwords, API secret keys, and service credentials. Exposed .git repositories allow downloading the entire source code. A phpinfo.php page reveals the complete server configuration. These are among the most severe findings in a penetration test, often leading to immediate full system compromise.',
    uk: 'Відкриті .env файли безпосередньо надають паролі баз даних, секретні API-ключі та облікові дані сервісів. Відкриті .git репозиторії дозволяють завантажити весь вихідний код. Це одні з найсерйозніших знахідок у тесті на проникнення.',
    ru: 'Открытые .env файлы непосредственно предоставляют пароли баз данных, секретные API-ключи и учётные данные сервисов. Открытые .git репозитории позволяют скачать весь исходный код. Это одни из наиболее серьёзных находок в тесте на проникновение.',
  },
  references: [
    { label: 'OWASP A05 Security Misconfiguration', url: 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/' },
    { label: 'HackTricks - .env exposure', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-web' },
  ],
};

export const HTTP_TRACE_ENABLED: KnowledgeBaseEntry = {
  id: 'sec-http-trace-enabled',
  category: 'security',
  severity: 'low',
  name: {
    en: 'HTTP TRACE Method Enabled',
    uk: 'HTTP-метод TRACE увімкнено',
    ru: 'HTTP-метод TRACE включён',
  },
  description: {
    en: 'The server responds to HTTP TRACE requests, which can be used in Cross-Site Tracing (XST) attacks',
    uk: 'Сервер відповідає на HTTP TRACE запити, що може бути використано в атаках Cross-Site Tracing (XST)',
    ru: 'Сервер отвечает на HTTP TRACE запросы, что может быть использовано в атаках Cross-Site Tracing (XST)',
  },
  explanation: {
    en: 'The HTTP TRACE method is designed for diagnostic purposes, echoing back the received request. This can be exploited in Cross-Site Tracing (XST) attacks: if an attacker can inject a script that sends a TRACE request, the server echoes back all request headers, including the HttpOnly cookie and Authorization headers, bypassing the HttpOnly protection. While modern browsers block TRACE in XMLHttpRequest, it remains a security misconfiguration that should be disabled.',
    uk: 'Метод HTTP TRACE призначений для діагностичних цілей, відображаючи отриманий запит. Це може бути використано в атаках Cross-Site Tracing (XST): якщо зловмисник може впровадити скрипт, що надсилає TRACE запит, сервер відображає всі заголовки запиту, включаючи HttpOnly cookie.',
    ru: 'Метод HTTP TRACE предназначен для диагностических целей, отображая полученный запрос. Это может быть использовано в атаках Cross-Site Tracing (XST): если злоумышленник может внедрить скрипт, отправляющий TRACE запрос, сервер отображает все заголовки запроса, включая HttpOnly cookie.',
  },
  howToFix: {
    en: 'Disable the TRACE method on your web server. For nginx: if ($request_method = TRACE) { return 405; }. For Apache: TraceEnable off in httpd.conf. For IIS: disable via web.config using verb filtering. For Express.js: app.use((req, res, next) => { if (req.method === "TRACE") return res.status(405).end(); next(); }).',
    uk: 'Вимкніть метод TRACE на вашому веб-сервері. Для nginx: if ($request_method = TRACE) { return 405; }. Для Apache: TraceEnable off у httpd.conf. Для Express.js: перехоплювач middleware для відхилення TRACE запитів.',
    ru: 'Отключите метод TRACE на вашем веб-сервере. Для nginx: if ($request_method = TRACE) { return 405; }. Для Apache: TraceEnable off в httpd.conf. Для Express.js: перехватчик middleware для отклонения TRACE запросов.',
  },
  impact: {
    en: 'When combined with an XSS vulnerability, TRACE can be used to steal HttpOnly cookies that would otherwise be inaccessible to JavaScript. While browsers have mitigated many XST attack vectors, disabling TRACE follows security hardening best practices and removes this attack surface.',
    uk: 'У поєднанні з XSS-вразливістю TRACE може використовуватися для крадіжки HttpOnly cookie, які інакше були б недоступні для JavaScript. Вимкнення TRACE відповідає найкращим практикам посилення безпеки.',
    ru: 'В сочетании с XSS-уязвимостью TRACE может использоваться для кражи HttpOnly cookie, которые иначе были бы недоступны для JavaScript. Отключение TRACE соответствует лучшим практикам усиления безопасности.',
  },
  references: [
    { label: 'OWASP TRACE Method', url: 'https://owasp.org/www-community/attacks/Cross_Site_Tracing' },
    { label: 'CWE-16', url: 'https://cwe.mitre.org/data/definitions/16.html' },
  ],
};

/**
 * Converts a KnowledgeBaseEntry to a flat ScanFinding-compatible object
 * for the given locale. Falls back to English if the locale is not available.
 * Scanner modules use this because ScanFinding stores plain strings,
 * not localized Records.
 */
export function entryToFinding(
  entry: KnowledgeBaseEntry,
  overrides?: { evidence?: string; details?: string; exploitScenario?: string; confidence?: Confidence },
  locale: Locale = 'en',
) {
  const confidence: Confidence =
    overrides?.confidence ??
    entry.confidence ??
    FINDING_CONFIDENCE[entry.id] ??
    'medium';

  const { confidence: _drop, ...restOverrides } = overrides ?? {};

  return {
    id: entry.id,
    title: entry.name[locale] || entry.name.en,
    category: entry.category,
    severity: entry.severity,
    confidence,
    explanation: entry.explanation[locale] || entry.explanation.en,
    howToFix: entry.howToFix[locale] || entry.howToFix.en,
    impact: entry.impact[locale] || entry.impact.en,
    exploitScenario: restOverrides?.exploitScenario || generateExploitScenarioForEntry(entry, locale),
    references: entry.references,
    ...restOverrides,
  };
}

// Auto-generate exploit scenarios based on finding type
function generateExploitScenarioForEntry(entry: KnowledgeBaseEntry, locale: Locale = 'en'): string {
  const id = entry.id;
  const cat = entry.category;

  if (cat === 'crypto') {
    return locale === 'uk'
      ? 'Криптовалютні адреси на веб-сторінках слід незалежно перевіряти перед будь-якими транзакціями. Зловмисники можуть замінити легітимні адреси на власні для перенаправлення платежів. Завжди перевіряйте адреси через офіційну документацію та блокчейн-експлорери.'
      : locale === 'ru'
      ? 'Криптовалютные адреса на веб-страницах следует независимо проверять перед любыми транзакциями. Злоумышленники могут заменить легитимные адреса на собственные для перенаправления платежей. Всегда проверяйте адреса через официальную документацию и блокчейн-эксплореры.'
      : 'Cryptocurrency addresses displayed on web pages should be independently verified before any transactions. Malicious actors may replace legitimate addresses with their own to redirect payments. Always cross-reference addresses with official documentation and use blockchain explorers to verify ownership history.';
  }

  const scenarios: Record<string, Record<Locale, string>> = {
    'sec-missing-csp': {
      en: 'An attacker could inject malicious JavaScript code into the website through various vectors (XSS, compromised third-party scripts, or data injection). Once injected, the script could steal user session cookies, capture keystrokes, redirect users to phishing pages, or perform unauthorized actions. Without CSP, the browser has no mechanism to block or restrict such injected code.',
      uk: 'Зловмисник може впровадити шкідливий JavaScript-код на сайт через різні вектори (XSS, скомпрометовані сторонні скрипти або впровадження даних). Без CSP браузер не має механізму блокування чи обмеження такого впровадженого коду.',
      ru: 'Злоумышленник может внедрить вредоносный JavaScript-код на сайт через различные векторы (XSS, скомпрометированные сторонние скрипты или внедрение данных). Без CSP браузер не имеет механизма блокировки или ограничения такого внедрённого кода.',
    },
    'sec-cookie-no-secure': {
      en: 'An attacker on the same network (e.g., public Wi-Fi) could intercept unencrypted HTTP requests containing session cookies. With these stolen cookies, the attacker can impersonate authenticated users, accessing personal data, modifying account settings, or performing financial transactions.',
      uk: 'Зловмисник у тій самій мережі (наприклад, публічний Wi-Fi) може перехопити незашифровані HTTP-запити з сеансовими cookie. Викрадені cookie дозволяють зловмиснику видавати себе за авторизованих користувачів.',
      ru: 'Злоумышленник в той же сети (например, публичный Wi-Fi) может перехватить незашифрованные HTTP-запросы с сеансовыми cookie. украденные cookie позволяют злоумышленнику выдавать себя за аутентифицированных пользователей.',
    },
    'sec-cookie-no-httponly': {
      en: 'If an XSS vulnerability exists anywhere on the page, an attacker can execute JavaScript that reads all non-HttpOnly cookies via document.cookie. Stolen session tokens enable full account takeover without the user noticing.',
      uk: 'Якщо на сторінці існує вразливість XSS, зловмисник може виконати JavaScript, який зчитує всі cookie без HttpOnly через document.cookie. Викрадені сеансові токени дозволяють повне захоплення облікового запису.',
      ru: 'Если на странице существует XSS-уязвимость, злоумышленник может выполнить JavaScript, который считывает все cookie без HttpOnly через document.cookie. украденные сеансовые токены позволяют полный захват учётной записи.',
    },
    'data-form-no-csrf': {
      en: 'An attacker could create a malicious webpage that automatically submits hidden forms to the target site. When a logged-in user visits this page, their browser sends session cookies with the request, causing the server to process actions as if the user intentionally submitted them.',
      uk: 'Зловмисник може створити шкідливу сторінку, яка автоматично відправляє приховані форми на цільовий сайт. Браузер користувача автоматично надсилає сеансові cookie з запитом.',
      ru: 'Злоумышленник может создать вредоносную страницу, которая автоматически отправляет скрытые формы на целевой сайт. Браузер пользователя автоматически отправляет сеансовые cookie с запросом.',
    },
    'sec-missing-hsts': {
      en: 'An attacker performing a man-in-the-middle attack could intercept the initial HTTP request and prevent the browser from upgrading to HTTPS. The attacker can serve a fake version of the website to capture login credentials or session tokens.',
      uk: 'Зловмисник може перехопити початковий HTTP-запит і запобігти переходу браузера на HTTPS. Зловмисник може показати підроблену версію сайту для захоплення облікових даних.',
      ru: 'Злоумышленник может перехватить начальный HTTP-запрос и предотвратить переход браузера на HTTPS. Злоумышленник может показать поддельную версию сайта для захвата учётных данных.',
    },
    'sec-missing-xframe': {
      en: 'An attacker could embed the legitimate website in a transparent iframe on a malicious page, overlaying invisible buttons on top of visible decoy buttons. Users unknowingly click on the targeted site, potentially transferring funds or changing settings.',
      uk: 'Зловмисник може вбудувати сайт у прозорий iframe на шкідливій сторінці, накладаючи невидимі кнопки на видимі елементи. Користувачі натискають на приховані елементи цільового сайту.',
      ru: 'Злоумышленник может встроить сайт в прозрачный iframe на вредоносной странице, накладывая невидимые кнопки на видимые элементы. Пользователи нажимают на скрытые элементы целевого сайта.',
    },
    'data-mixed-content': {
      en: 'An attacker on the network can modify HTTP resources loaded by the HTTPS page, injecting malicious scripts, tracking pixels, or redirecting users. This effectively negates all HTTPS protections and can lead to complete site compromise.',
      uk: 'Зловмисник у мережі може змінити HTTP-ресурси, впровадивши шкідливі скрипти або перенаправивши користувачів. Це фактично нівелює захист HTTPS.',
      ru: 'Злоумышленник в сети может изменить HTTP-ресурсы, внедрив вредоносные скрипты или перенаправив пользователей. Это фактически нивелирует защиту HTTPS.',
    },
    'sec-cookie-no-samesite': {
      en: 'An attacker can craft a page on a different domain that submits requests to the target site. The browser will include cookies with these cross-site requests, enabling unauthorized actions to be performed without the user\'s knowledge.',
      uk: 'Зловмисник може створити сторінку на іншому домені, яка відправляє запити на цільовий сайт. Браузер включить cookie з цими міжсайтовими запитами.',
      ru: 'Злоумышленник может создать страницу на другом домене, которая отправляет запросы на целевой сайт. Браузер включит cookie с этими межсайтовыми запросами.',
    },
    // Specific exploit scenarios for LOW-severity findings
    'sec-missing-xcontent': {
      en: 'An attacker uploads a file named "avatar.jpg" to a user profile, but the file actually contains HTML with a phishing form mimicking your login page. Without the nosniff header, the browser ignores the declared image/jpeg Content-Type and renders it as an HTML page. Your site becomes a hosting platform for phishing attacks, damaging your reputation and compromising user credentials.',
      uk: 'Зловмисник завантажує файл "avatar.jpg" у профіль користувача, але файл насправді містить HTML з фішинговою формою, що імітує сторінку входу. Без заголовка nosniff браузер відображає його як HTML-сторінку. Ваш сайт стає платформою для фішингових атак, що шкодить репутації та може скомпрометувати облікові дані.',
      ru: 'Злоумышленник загружает файл "avatar.jpg" в профиль пользователя, но файл содержит HTML с фишинговой формой, имитирующей страницу входа. Без заголовка nosniff браузер отображает его как HTML-страницу. Ваш сайт становится платформой для фишинговых атак, наносящих ущерб репутации и компрометирующих учётные данные.',
    },
    'sec-missing-referrer': {
      en: 'A user navigates from "https://yoursite.com/account?session_token=abc123" to an external link. The full URL including the session token leaks in the Referer header to the third-party site. If that third party is compromised or malicious, the session token can be used to hijack the user\'s session. Sensitive URL parameters are routinely collected by advertising networks through referrer data.',
      uk: 'Користувач переходить з "https://yoursite.com/account?session_token=abc123" на зовнішнє посилання. Повний URL з токеном сесії витікає в заголовку Referer на сторонній сайт. Якщо третя сторона скомпрометована, токен може бути використаний для захоплення сесії користувача.',
      ru: 'Пользователь переходит с "https://yoursite.com/account?session_token=abc123" на внешнюю ссылку. Полный URL с токеном сессии утекает в заголовке Referer на сторонний сайт. Если третья сторона скомпрометирована, токен может быть использован для захвата сессии пользователя.',
    },
    'sec-missing-permissions': {
      en: 'An XSS vulnerability allows an attacker to inject a script calling navigator.mediaDevices.getUserMedia(). Without the Permissions-Policy header, the browser shows a permission prompt. Since the script runs on your trusted domain, users likely grant camera/microphone access, enabling corporate espionage or privacy violations.',
      uk: 'XSS-вразливість дозволяє зловмиснику впровадити скрипт, що викликає navigator.mediaDevices.getUserMedia(). Без заголовка Permissions-Policy браузер покаже запит на дозвіл. Оскільки скрипт працює на вашому домені, користувачі, ймовірно, нададуть доступ до камери/мікрофона.',
      ru: 'XSS-уязвимость позволяет злоумышленнику внедрить скрипт, вызывающий navigator.mediaDevices.getUserMedia(). Без заголовка Permissions-Policy браузер покажет запрос разрешения. Поскольку скрипт работает на вашем домене, пользователи, вероятно, предоставят доступ к камере/микрофону.',
    },
    'sec-extern-script-no-sri': {
      en: 'A JavaScript library hosted on a CDN is compromised through a supply chain attack. The attacker replaces it with a malicious version including a crypto miner and credential-stealing code. Without SRI, the browser cannot detect the modification and executes the malicious code with full page privileges. Adding an integrity hash would have prevented the attack.',
      uk: 'JavaScript-бібліотека на CDN скомпрометована через атаку на ланцюг постачання. Зловмисник замінює її на шкідливу версію з криптомайнером та кодом крадіжки даних. Без SRI браузер не може виявити модифікацію. Додавання хешу integrity запобігло б атаці.',
      ru: 'JavaScript-библиотека на CDN скомпрометирована через атаку на цепочку поставок. Злоумышленник заменяет её на вредоносную версию с криптомайнером и кодом кражи данных. Без SRI браузер не может обнаружить модификацию. Добавление хеша integrity предотвратило бы атаку.',
    },
  };

  if (scenarios[id]) {
    return scenarios[id][locale] || scenarios[id].en;
  }

  // Generic fallback
  return locale === 'uk'
    ? 'Ця вразливість може бути використана як частина ширшої атаки. В поєднанні з іншими слабкостями вона може дозволити зловмисникам отримати несанкціонований доступ, викрасти дані або порушити роботу сервісу.'
    : locale === 'ru'
    ? 'Эта уязвимость может быть использована как часть более широкой атаки. В сочетании с другими слабостями она может позволить злоумышленникам получить несанкционированный доступ, украсть данные или нарушить работу сервиса.'
    : 'This vulnerability could be exploited as part of a broader attack chain. When combined with other weaknesses, it may allow attackers to gain unauthorized access, exfiltrate sensitive data, or disrupt service availability.';
}

export function getAllEntries(): KnowledgeBaseEntry[] {
  return knowledgeBaseArray;
}

export function getEntryById(id: string): KnowledgeBaseEntry | undefined {
  return knowledgeBase[id];
}

export function getCategories(): Category[] {
  return ['security', 'data-exposure', 'crypto'];
}

export function getSeverities(): Severity[] {
  return ['critical', 'high', 'medium', 'low', 'info'];
}

export function getEntriesByCategory(category: Category): KnowledgeBaseEntry[] {
  return knowledgeBaseArray.filter((entry) => entry.category === category);
}

export function getEntriesBySeverity(severity: Severity): KnowledgeBaseEntry[] {
  return knowledgeBaseArray.filter((entry) => entry.severity === severity);
}

// Master map for quick lookup
export const knowledgeBaseArray: KnowledgeBaseEntry[] = [
  MISSING_CSP,
  MISSING_HSTS,
  MISSING_XFRAME,
  MISSING_XCONTENT,
  MISSING_REFERRER,
  MISSING_PERMISSIONS,
  COOKIE_NO_SECURE,
  COOKIE_NO_HTTPONLY,
  COOKIE_NO_SAMESITE,
  FORM_NO_CSRF,
  FORM_PASSWORD_NO_AUTOCOMPLETE,
  MIXED_CONTENT,
  SENSITIVE_META_INFO,
  OPEN_REDIRECT_FORM,
  CRYPTO_ETH_ADDRESS,
  CRYPTO_BTC_ADDRESS,
  CRYPTO_WEB3_EXTERNAL,
  CRYPTO_DRM_EXTERNAL,
  EXTERN_SCRIPT_NO_SRI,
  INLINE_SCRIPT_SENSITIVE,
  EXPOSED_API_ENDPOINTS,
  INFO_TECH_DISCLOSURE,
  INFO_EMAIL_LEAKAGE,
  INFO_PHONE_LEAKAGE,
  INFO_INTERNAL_IP,
  INFO_SENSITIVE_COMMENTS,
  INFO_OPEN_REDIRECT,
  CORS_MISCONFIGURED,
  CSP_WEAK_POLICY,
  SERVER_VERSION_DISCLOSURE,
  SENSITIVE_PATH_EXPOSED,
  HTTP_TRACE_ENABLED,
  HARDCODED_API_KEY,
  LOCALSTORAGE_SENSITIVE,
  REVERSE_TABNAPPING,
  IFRAME_NO_SANDBOX,
  FORM_EXTERNAL_ACTION,
  WEB3_SEED_PHRASE,
  WEB3_CLIPBOARD_HIJACK,
  WEB3_ETHEREUM_OVERRIDE,
  WEB3_WALLET_DRAINER,
  STACK_TRACE_EXPOSED,
  ROBOTS_SENSITIVE_PATHS,
  HTTP_NO_HTTPS_REDIRECT,
];

export const knowledgeBase: Record<string, KnowledgeBaseEntry> = {
  [MISSING_CSP.id]: MISSING_CSP,
  [MISSING_HSTS.id]: MISSING_HSTS,
  [MISSING_XFRAME.id]: MISSING_XFRAME,
  [MISSING_XCONTENT.id]: MISSING_XCONTENT,
  [MISSING_REFERRER.id]: MISSING_REFERRER,
  [MISSING_PERMISSIONS.id]: MISSING_PERMISSIONS,
  [COOKIE_NO_SECURE.id]: COOKIE_NO_SECURE,
  [COOKIE_NO_HTTPONLY.id]: COOKIE_NO_HTTPONLY,
  [COOKIE_NO_SAMESITE.id]: COOKIE_NO_SAMESITE,
  [FORM_NO_CSRF.id]: FORM_NO_CSRF,
  [FORM_PASSWORD_NO_AUTOCOMPLETE.id]: FORM_PASSWORD_NO_AUTOCOMPLETE,
  [MIXED_CONTENT.id]: MIXED_CONTENT,
  [SENSITIVE_META_INFO.id]: SENSITIVE_META_INFO,
  [OPEN_REDIRECT_FORM.id]: OPEN_REDIRECT_FORM,
  [CRYPTO_ETH_ADDRESS.id]: CRYPTO_ETH_ADDRESS,
  [CRYPTO_BTC_ADDRESS.id]: CRYPTO_BTC_ADDRESS,
  [CRYPTO_WEB3_EXTERNAL.id]: CRYPTO_WEB3_EXTERNAL,
  [CRYPTO_DRM_EXTERNAL.id]: CRYPTO_DRM_EXTERNAL,
  [EXTERN_SCRIPT_NO_SRI.id]: EXTERN_SCRIPT_NO_SRI,
  [INLINE_SCRIPT_SENSITIVE.id]: INLINE_SCRIPT_SENSITIVE,
  [EXPOSED_API_ENDPOINTS.id]: EXPOSED_API_ENDPOINTS,
  [INFO_TECH_DISCLOSURE.id]: INFO_TECH_DISCLOSURE,
  [INFO_EMAIL_LEAKAGE.id]: INFO_EMAIL_LEAKAGE,
  [INFO_PHONE_LEAKAGE.id]: INFO_PHONE_LEAKAGE,
  [INFO_INTERNAL_IP.id]: INFO_INTERNAL_IP,
  [INFO_SENSITIVE_COMMENTS.id]: INFO_SENSITIVE_COMMENTS,
  [INFO_OPEN_REDIRECT.id]: INFO_OPEN_REDIRECT,
  [CORS_MISCONFIGURED.id]: CORS_MISCONFIGURED,
  [CSP_WEAK_POLICY.id]: CSP_WEAK_POLICY,
  [SERVER_VERSION_DISCLOSURE.id]: SERVER_VERSION_DISCLOSURE,
  [SENSITIVE_PATH_EXPOSED.id]: SENSITIVE_PATH_EXPOSED,
  [HTTP_TRACE_ENABLED.id]: HTTP_TRACE_ENABLED,
  [HARDCODED_API_KEY.id]: HARDCODED_API_KEY,
  [LOCALSTORAGE_SENSITIVE.id]: LOCALSTORAGE_SENSITIVE,
  [REVERSE_TABNAPPING.id]: REVERSE_TABNAPPING,
  [IFRAME_NO_SANDBOX.id]: IFRAME_NO_SANDBOX,
  [FORM_EXTERNAL_ACTION.id]: FORM_EXTERNAL_ACTION,
  [WEB3_SEED_PHRASE.id]: WEB3_SEED_PHRASE,
  [WEB3_CLIPBOARD_HIJACK.id]: WEB3_CLIPBOARD_HIJACK,
  [WEB3_ETHEREUM_OVERRIDE.id]: WEB3_ETHEREUM_OVERRIDE,
  [WEB3_WALLET_DRAINER.id]: WEB3_WALLET_DRAINER,
  [STACK_TRACE_EXPOSED.id]: STACK_TRACE_EXPOSED,
  [ROBOTS_SENSITIVE_PATHS.id]: ROBOTS_SENSITIVE_PATHS,
  [HTTP_NO_HTTPS_REDIRECT.id]: HTTP_NO_HTTPS_REDIRECT,
};
