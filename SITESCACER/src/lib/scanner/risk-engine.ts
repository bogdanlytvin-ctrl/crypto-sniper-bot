import type { ScanFinding, RiskAdjustment, Severity } from './types';
import type { Locale } from '@/lib/i18n/translations';

// Localized exploit scenario templates
const exploitScenarios: Record<string, Record<Locale, string>> = {
  info: {
    en: 'This finding is informational and does not represent an immediate security threat, but may be relevant for security awareness and monitoring purposes.',
    uk: 'Ця знахідка є інформаційною і не становить безпосередньої загрози безпеці, але може бути корисною для моніторингу та обізнаності з питань безпеки.',
    ru: 'Эта находка является информационной и не представляет непосредственной угрозы безопасности, но может быть полезна для мониторинга и осведомлённости в области безопасности.',
  },
  crypto: {
    en: 'Cryptocurrency addresses displayed on web pages should be independently verified before any transactions. Malicious actors may replace legitimate addresses with their own to redirect payments. Always cross-reference addresses with official documentation and use blockchain explorers to verify ownership history.',
    uk: 'Криптоадреси, показані на вебсторінках, слід перевірити самостійно перед будь-якими транзакціями. Зловмисники можуть замінити легітимні адреси на власні для перенаправлення платежів. Завжди перевіряйте адреси через офіційну документацію та блокчейн-експлорери.',
    ru: 'Криптоадреса, отображаемые на веб-страницах, следует проверять самостоятельно перед любыми транзакциями. Злоумышленники могут заменить легитимные адреса на собственные для перенаправления платежей. Всегда сверяйте адреса с официальной документацией и проверяйте через блокчейн-эксплореры.',
  },
  'sec-missing-csp': {
    en: 'An attacker could inject malicious JavaScript code into the website through various vectors (XSS, compromised third-party scripts, or data injection). Once injected, the script could steal user session cookies, capture keystrokes, redirect users to phishing pages, or perform unauthorized actions. Without CSP, the browser has no mechanism to block or restrict such injected code.',
    uk: 'Зловмисник може впровадити шкідливий JavaScript-код через різні вектори (XSS, скомпрометовані сторонні скрипти або впровадження даних). Вбудований скрипт може викрадати сеансові cookie, перехоплювати натискання клавіш, перенаправляти користувачів на фішингові сторінки або виконувати несанкціоновані дії. Без CSP браузер не має механізму блокування впровадженого коду.',
    ru: 'Злоумышленник может внедрить вредоносный JavaScript-код через различные векторы (XSS, скомпрометированные сторонние скрипты или внедрение данных). Внедрённый скрипт может похищать сеансовые cookie, перехватывать нажатия клавиш, перенаправлять пользователей на фишинговые страницы или выполнять несанкционированные действия. Без CSP браузер не имеет механизма блокировки внедрённого кода.',
  },
  'data-mixed-content': {
    en: 'Active mixed content on an HTTPS page allows scripts or resources loaded over HTTP to be modified by network attackers to inject malicious code, effectively negating all HTTPS protections. The encrypted channel is compromised by unencrypted sub-resources.',
    uk: 'Активний змішаний контент на HTTPS-сторінці дозволяє зловмисникам у мережі змінювати скрипти та ресурси, завантажені через HTTP, для впровадження шкідливого коду, що фактично скасовує всі переваги HTTPS. Зашифрований канал компрометується незашифрованими підресурсами.',
    ru: 'Активный смешанный контент на HTTPS-странице позволяет злоумышленникам в сети изменять скрипты и ресурсы, загруженные по HTTP, для внедрения вредоносного кода, что фактически аннулирует все преимущества HTTPS. Зашифрованный канал компрометируется незашифрованными подресурсами.',
  },
  cookie: {
    en: 'An attacker on the same network (e.g., public Wi-Fi) or an XSS payload could intercept or access session cookies. With these cookies, the attacker can impersonate authenticated users, access personal data, modify account settings, or perform financial transactions without the user\'s knowledge.',
    uk: 'Зловмисник у тій самій мережі (наприклад, публічний Wi-Fi) або через XSS-вектор може перехопити або отримати доступ до сеансових cookie. За допомогою цих cookie зловмисник може видавати себе за авторизованого користувача, отримувати доступ до особистих даних, змінювати налаштування облікового запису або виконувати фінансові транзакції без відома користувача.',
    ru: 'Злоумышленник в той же сети (например, публичный Wi-Fi) или через XSS-вектор может перехватить или получить доступ к сеансовым cookie. С помощью этих cookie злоумышленник может выдавать себя за аутентифицированного пользователя, получать доступ к персональным данным, изменять настройки учётной записи или выполнять финансовые транзакции без ведома пользователя.',
  },
  csrf: {
    en: 'An attacker could create a malicious webpage that automatically submits hidden forms to the target site. When a logged-in user visits this page, their browser sends session cookies with the request, causing the server to process the request as if the user intentionally submitted it. This could lead to unauthorized password changes, fund transfers, or data modification.',
    uk: 'Зловмисник може створити шкідливу вебсторінку, яка автоматично відправляє приховані форми на цільовий сайт. Коли авторизований користувач відвідує цю сторінку, його браузер надсилає сеансові cookie з запитом, і сервер обробляє запит так, ніби користувач навмисно його відправив. Це може призвести до несанкціонованої зміни пароля, переказу коштів або модифікації даних.',
    ru: 'Злоумышленник может создать вредоносную веб-страницу, которая автоматически отправляет скрытые формы на целевой сайт. Когда аутентифицированный пользователь посещает эту страницу, его браузер отправляет сеансовые cookie с запросом, и сервер обрабатывает запрос так, будто пользователь намеренно его отправил. Это может привести к несанкционированной смене пароля, переводу средств или модификации данных.',
  },
  xframe: {
    en: 'An attacker could embed the legitimate website in a transparent iframe on a malicious page, overlaying invisible buttons on top of visible decoy buttons. When users think they are clicking a harmless element, they are actually clicking on the targeted site, potentially transferring funds, changing settings, or granting permissions.',
    uk: 'Зловмисник може вбудувати легітимний сайт у прозорий iframe на шкідливій сторінці, накладаючи невидимі кнопки поверх видимих приманок. Коли користувачі думають, що натискають безпечний елемент, насправді вони натискають на цільовий сайт, потенційно переказуючи кошти, змінюючи налаштування або надаючи дозволи.',
    ru: 'Злоумышленник может встроить легитимный сайт в прозрачный iframe на вредоносной странице, накладывая невидимые кнопки поверх видимых приманок. Когда пользователи думают, что нажимают безопасный элемент, на самом деле они нажимают на целевой сайт, потенциально переводя средства, изменяя настройки или предоставляя разрешения.',
  },
  hsts: {
    en: 'An attacker performing a man-in-the-middle attack on the same network could intercept the initial HTTP request and prevent the browser from upgrading to HTTPS. The attacker can then serve a fake version of the website, capture login credentials, session tokens, or modify page content, all while the user sees no visible warning.',
    uk: 'Зловмисник, що проводить атаку «людина посередині» в тій самій мережі, може перехопити початковий HTTP-запит і завадити браузеру перейти на HTTPS. Зловмисник може подати підроблену версію сайту, перехопити облікові дані, сеансові токени або змінити контент сторінки, а користувач не побачить жодного попередження.',
    ru: 'Злоумышленник, проводящий атаку «человек посередине» в той же сети, может перехватить начальный HTTP-запит и помешать браузеру перейти на HTTPS. Злоумышленник может подать поддельную версию сайта, перехватить учётные данные, сеансовые токены или изменить контент страницы, а пользователь не увидит никакого предупреждения.',
  },
  sri: {
    en: 'If a CDN is compromised or a malicious actor gains access to a third-party script hosted on a CDN, the script can be replaced with malicious code. Since the browser trusts the CDN origin, the injected code runs with full page privileges, enabling credential theft, session hijacking, cryptocurrency mining, or botnet enrollment.',
    uk: 'Якщо CDN скомпрометовано або зловмисник отримує доступ до стороннього скрипта на CDN, скрипт може бути замінений на шкідливий код. Оскільки браузер довіряє походженню CDN, впроваджений код виконується з повними привілеями сторінки, що дозволяє крадіжку облікових даних, захоплення сеансів, майнінг криптовалют або залучення до ботнету.',
    ru: 'Если CDN скомпрометирован или злоумышленник получает доступ к стороннему скрипту на CDN, скрипт может быть заменён на вредоносный код. Поскольку браузер доверяет источнику CDN, внедрённый код выполняется с полными привилегиями страницы, что позволяет кражу учётных данных, захват сеансов, майнинг криптовалют или включение в ботнет.',
  },
  api: {
    en: 'Exposed API endpoints provide attackers with a roadmap of the application\'s backend structure. These endpoints can be probed for authentication bypass, data extraction, privilege escalation, or denial-of-service attacks. API endpoints are often the primary target in automated attacks and security assessments.',
    uk: 'Відкриті API-ендпоінти надають зловмисникам карту структури бекенду додатку. Ці ендпоінти можуть бути досліджені для обходу автентифікації, витоку даних, підвищення привілеїв або атак відмови в обслуговуванні. API-ендпоінти часто є головною ціллю в автоматизованих атаках та аудиту безпеки.',
    ru: 'Открытые API-эндпоинты предоставляют злоумышленникам карту структуры бэкенда приложения. Эти эндпоинты могут быть исследованы для обхода аутентификации, утечки данных, повышения привилегий или атак отказа в обслуживании. API-эндпоинты часто являются главной целью в автоматизированных атаках и аудите безопасности.',
  },
  // Specific exploit scenarios for LOW-severity findings
  'sec-missing-xcontent': {
    en: 'An attacker uploads a file named "avatar.jpg" to a user profile, but the file actually contains HTML with a phishing form that mimics your login page. Without the nosniff header, the browser ignores the declared image/jpeg Content-Type and renders it as an HTML page when accessed directly. Your site becomes a hosting platform for phishing attacks, damaging your reputation and potentially compromising user credentials. This attack vector has been used in real-world campaigns against major platforms.',
    uk: 'Зловмисник завантажує файл "avatar.jpg" у профіль користувача, але файл насправді містить HTML з фішинговою формою, що імітує сторінку входу. Без заголовка nosniff браузер ігнорує оголошений Content-Type image/jpeg і відображає його як HTML-сторінку при прямому доступі. Ваш сайт стає платформою для розміщення фішингових атак, що шкодить вашій репутації та може скомпрометувати облікові дані користувачів.',
    ru: 'Злоумышленник загружает файл "avatar.jpg" в профиль пользователя, но файл фактически содержит HTML с фишинговой формой, имитирующей страницу входа. Без заголовка nosniff браузер игнорирует объявленный Content-Type image/jpeg и отображает его как HTML-страницу при прямом доступе. Ваш сайт становится платформой для размещения фишинговых атак, наносящих ущерб репутации и потенциально компрометирующих учётные данные пользователей.',
  },
  'sec-missing-referrer': {
    en: 'A user is logged into your application and navigates from "https://yoursite.com/account?session_token=abc123" to an external link. The full URL including the session token is sent in the Referer header to the third-party site. The external site logs this data, and if that third party is compromised or malicious, the session token can be used to hijack the user\'s session. Sensitive URL parameters including session IDs, access tokens, search queries, and user identifiers are routinely collected by advertising networks and analytics scripts through referrer data.',
    uk: 'Користувач авторизований у вашому додатку і переходить з "https://yoursite.com/account?session_token=abc123" на зовнішнє посилання. Повний URL включно з токеном сесії надсилається в заголовку Referer на сторонній сайт. Сторонній сайт логує ці дані, і якщо ця третя сторона скомпрометована або зловмисна, токен сесії може бути використаний для захоплення сесії користувача. Чутливі URL-параметри регулярно збираються рекламними мережами та аналітичними скриптами через дані реферера.',
    ru: 'Пользователь авторизован в вашем приложении и переходит с "https://yoursite.com/account?session_token=abc123" на внешнюю ссылку. Полный URL включая токен сессии отправляется в заголовке Referer на сторонний сайт. Сторонний сайт логирует эти данные, и если третья сторона скомпрометирована или злонамеренна, токен сессии может быть использован для захвата сессии пользователя. Конфиденциальные URL-параметры регулярно собираются рекламными сетями и аналитическими скриптами через данные реферера.',
  },
  'sec-missing-permissions': {
    en: 'An existing XSS vulnerability on your site (even a minor one) allows an attacker to inject a script that calls navigator.mediaDevices.getUserMedia(). Without the Permissions-Policy header, the browser will show a permission prompt to the user. Since the script runs on your trusted domain, the user is likely to grant camera or microphone access, believing it is a legitimate feature. The attacker can then stream audio and video from the user\'s device, enabling corporate espionage, blackmail, or privacy violations. This has been demonstrated in real attacks against banking and healthcare platforms.',
    uk: 'Існуюча XSS-вразливість на вашому сайті (навіть незначна) дозволяє зловмиснику впровадити скрипт, що викликає navigator.mediaDevices.getUserMedia(). Без заголовка Permissions-Policy браузер покаже запит на дозвіл користувачу. Оскільки скрипт працює на вашому довіреному домені, користувач, ймовірно, надасть доступ до камери або мікрофона, вважаючи це легітимною функцією. Зловмисник зможе транслювати аудіо та відео з пристрою користувача, що дозволяє корпоративний шпигунство, шантаж або порушення конфіденційності.',
    ru: 'Существующая XSS-уязвимость на вашем сайте (даже незначительная) позволяет злоумышленнику внедрить скрипт, вызывающий navigator.mediaDevices.getUserMedia(). Без заголовка Permissions-Policy браузер покажет запрос разрешения пользователю. Поскольку скрипт работает на вашем доверенном домене, пользователь, вероятно, предоставит доступ к камере или микрофону, считая это легитимной функцией. Злоумышленник сможет транслировать аудио и видео с устройства пользователя, что позволяет корпоративный шпионаж, шантаж или нарушение конфиденциальности.',
  },
  'sec-extern-script-no-sri': {
    en: 'A popular JavaScript library hosted on cdnjs.cloudflare.com is compromised through a supply chain attack. The attacker replaces the legitimate file with a malicious version that includes a cryptocurrency miner and credential-stealing code. Since your site loads this script without Subresource Integrity (SRI), the browser cannot detect the modification and executes the malicious code with full page privileges. Millions of users are affected before the compromise is detected. Adding an integrity hash would have immediately prevented the attack by causing the browser to reject the tampered resource.',
    uk: 'Популярна JavaScript-бібліотека, розміщена на cdnjs.cloudflare.com, скомпрометована через атаку на ланцюг постачання. Зловмисник замінює легітимний файл на шкідливу версію, що включає криптомайнер та код крадіжки облікових даних. Оскільки ваш сайт завантажує цей скрипт без Subresource Integrity (SRI), браузер не може виявити модифікацію і виконує шкідливий код з повними привілеями сторінки. Додавання хешу integrity миттєво запобігло б атаці, змусивши браузер відхилити підроблений ресурс.',
    ru: 'Популярная JavaScript-библиотека, размещённая на cdnjs.cloudflare.com, скомпрометирована через атаку на цепочку поставок. Злоумышленник заменяет легитимный файл на вредоносную версию, включающую криптомайнер и код кражи учётных данных. Поскольку ваш сайт загружает этот скрипт без Subresource Integrity (SRI), браузер не может обнаружить модификацию и выполняет вредоносный код с полными привилегиями страницы. Добавление хеша integrity немедленно предотвратило бы атаку, заставив браузер отклонить подменённый ресурс.',
  },
  fallback: {
    en: 'This security weakness could be exploited as part of a broader attack chain. When combined with other vulnerabilities, it may allow attackers to gain unauthorized access, exfiltrate sensitive data, or disrupt service availability. Security issues are rarely exploited in isolation — real-world attacks typically chain multiple weaknesses together.',
    uk: 'Ця вразливість безпеки може бути використана як частина ширшого ланцюжка атак. У поєднанні з іншими вразливостями вона може дозволити зловмисникам отримати несанкціонований доступ, викрасти конфіденційні дані або порушити доступність сервісу. Проблеми безпеки рідко використовуються ізольовано — реальні атаки зазвичай поєднують кілька вразливостей.',
    ru: 'Эта уязвимость безопасности может быть использована как часть более широкой цепочки атак. В сочетании с другими уязвимостями она может позволить злоумышленникам получить несанкционированный доступ, эксфильтровать конфиденциальные данные или нарушить доступность сервиса. Проблемы безопасности редко эксплуатируются изолированно — реальные атаки обычно связывают несколько уязвимостей.',
  },
};

function getLocalizedScenario(key: string, locale: Locale): string {
  const entry = exploitScenarios[key];
  if (!entry) return exploitScenarios.fallback[locale] || exploitScenarios.fallback.en;
  return entry[locale] || entry.en || exploitScenarios.fallback.en;
}

// Severity escalation order
const severityOrder: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

// Context flags for scan context awareness
export interface ContextFlags {
  hasAuthForms: boolean;
  hasLoginPages: boolean;
  isHttps: boolean;
  isStaticSite?: boolean; // no forms, no auth — CSP missing is less critical
  hasDangerousJs?: boolean; // eval/innerHTML/document.write detected
}

interface ComboRule {
  triggerIds: string[]; // all must be present
  targetId: string; // which finding to escalate
  escalateTo: Severity;
  reasonEn: string;
  reasonUk: string;
  reasonRu: string;
  requiresContext?: (flags: ContextFlags) => boolean; // optional context gate
}

// Combo detection rules: when multiple findings appear together,
// the combined risk is higher than individual findings suggest
const COMBO_RULES: ComboRule[] = [
  {
    triggerIds: ['sec-missing-csp', 'sec-inline-script-sensitive'],
    targetId: 'sec-missing-csp',
    escalateTo: 'critical',
    reasonEn: 'CRITICAL ESCALATION: Missing CSP combined with inline scripts containing sensitive patterns. Without CSP, any existing XSS vulnerability can be directly exploited to inject arbitrary scripts, steal sessions, or perform unauthorized actions. The absence of a Content-Security-Policy header removes the primary browser-level defense against code injection attacks.',
    reasonUk: 'КРИТИЧНЕ ПІДВИЩЕННЯ: Відсутність CSP у поєднанні з вбудованими скриптами, що містять чутливі шаблони. Без CSP будь-яка існуюча вразливість XSS може бути безпосередньо використана для впровадження довільних скриптів, крадіжки сеансів або виконання несанкціонованих дій.',
    reasonRu: 'КРИТИЧЕСКОЕ ПОВЫШЕНИЕ: Отсутствие CSP в сочетании со встроенными скриптами, содержащими конфиденциальные паттерны. Без CSP любая существующая XSS-уязвимость может быть напрямую использована для внедрения произвольных скриптов, кражи сеансов или выполнения несанкционированных действий.',
  },
  {
    // Only CRITICAL if site is HTTP (not HTTPS) — on HTTPS sites cookies still travel encrypted
    triggerIds: ['sec-cookie-no-secure', 'sec-cookie-no-httponly'],
    targetId: 'sec-cookie-no-secure',
    escalateTo: 'high',
    requiresContext: (flags) => !flags.isHttps,
    reasonEn: 'ESCALATION TO HIGH: Cookies lack both Secure and HttpOnly flags on an HTTP site. This enables session hijacking through network interception (MITM) and XSS-based cookie theft simultaneously.',
    reasonUk: 'ПІДВИЩЕННЯ ДО HIGH: Cookie не мають прапорців Secure та HttpOnly на HTTP-сайті. Це дозволяє захоплення сеансу через перехоплення в мережі та XSS.',
    reasonRu: 'ПОВЫШЕНИЕ ДО HIGH: Cookie не имеют флагов Secure и HttpOnly на HTTP-сайте. Это позволяет захват сеанса через перехват в сети и XSS.',
  },
  {
    // CRITICAL only if the site has auth forms AND no CSRF protection
    triggerIds: ['sec-cookie-no-samesite', 'data-form-no-csrf'],
    targetId: 'data-form-no-csrf',
    escalateTo: 'high',
    requiresContext: (flags) => flags.hasAuthForms,
    reasonEn: 'ESCALATION TO HIGH: CSRF protection is missing from auth forms AND cookies lack SameSite attribute. Attackers can forge cross-site requests that execute authenticated actions.',
    reasonUk: 'ПІДВИЩЕННЯ ДО HIGH: Захист CSRF відсутній у формах автентифікації, а cookie не мають SameSite.',
    reasonRu: 'ПОВЫШЕНИЕ ДО HIGH: Защита CSRF отсутствует в формах аутентификации, а cookie не имеют SameSite.',
  },
  {
    // CRITICAL only when site is HTTP (cookies truly travel in plaintext)
    triggerIds: ['sec-missing-hsts', 'sec-cookie-no-secure'],
    targetId: 'sec-cookie-no-secure',
    escalateTo: 'high',
    requiresContext: (flags) => !flags.isHttps,
    reasonEn: 'ESCALATION TO HIGH: HSTS is not enforced AND cookies lack Secure flag on an HTTP site. Session cookies travel in plaintext — attackers on the same network can intercept them trivially.',
    reasonUk: 'ПІДВИЩЕННЯ ДО HIGH: HSTS не застосовується, а cookie без Secure на HTTP-сайті. Сеансові cookie передаються відкритим текстом.',
    reasonRu: 'ПОВЫШЕНИЕ ДО HIGH: HSTS не применяется, а cookie без Secure на HTTP-сайте. Сеансовые cookie передаются в открытом виде.',
  },
  {
    triggerIds: ['sec-missing-csp', 'sec-missing-xframe'],
    targetId: 'sec-missing-xframe',
    escalateTo: 'high',
    reasonEn: 'ESCALATION TO HIGH: Both CSP and X-Frame-Options are missing, leaving the site completely unprotected against framing-based attacks like clickjacking. Without either defense mechanism, the entire page can be embedded in a malicious iframe on any domain.',
    reasonUk: 'ПІДВИЩЕННЯ ДО HIGH: І CSP, і X-Frame-Options відсутні, що залишає сайт повністю незахищеним від фреймових атак на кшталт клікджекінгу.',
    reasonRu: 'ПОВЫШЕНИЕ ДО HIGH: И CSP, и X-Frame-Options отсутствуют, что оставляет сайт полностью незащищённым от фреймовых атак типа кликджекинга.',
  },
  {
    triggerIds: ['sec-missing-hsts'],
    targetId: 'sec-missing-hsts',
    escalateTo: 'high',
    requiresContext: (flags) => flags.isHttps,
    reasonEn: 'ESCALATION TO HIGH: HSTS is missing on a site that serves content over HTTPS. Without HSTS, the initial HTTP connection before redirect is vulnerable to SSL stripping attacks, and users who type "http://" manually will not be automatically upgraded to HTTPS.',
    reasonUk: 'ПІДВИЩЕННЯ ДО HIGH: HSTS відсутній на сайті, що подає контент через HTTPS. Без HSTS початкове HTTP-з\'єднання вразливе до атак зняття SSL.',
    reasonRu: 'ПОВЫШЕНИЕ ДО HIGH: HSTS отсутствует на сайте, подающем контент по HTTPS. Без HSTS начальное HTTP-соединение уязвимо к атакам снятия SSL.',
  },
  {
    triggerIds: ['sec-cookie-no-samesite'],
    targetId: 'sec-cookie-no-samesite',
    escalateTo: 'high',
    reasonEn: 'ESCALATION TO HIGH: Cookies without SameSite protection can be sent with any cross-site request. Modern browsers default to Lax, but explicitly missing SameSite means inconsistent behavior across browsers, and legacy browsers will send cookies with all requests enabling CSRF attacks.',
    reasonUk: 'ПІДВИЩЕННЯ ДО HIGH: Cookie без захисту SameSite можуть надсилатися з будь-яким міжсайтовим запитом. Явно відсутній SameSite означає непослідовну поведінку між браузерами.',
    reasonRu: 'ПОВЫШЕНИЕ ДО HIGH: Cookie без защиты SameSite могут отправляться с любым межсайтовым запросом. Явно отсутствующий SameSite означает непоследовательное поведение между браузерами.',
  },
  {
    triggerIds: ['data-mixed-content'],
    targetId: 'data-mixed-content',
    escalateTo: 'critical',
    reasonEn: 'CRITICAL ESCALATION: Active mixed content on an HTTPS page. Scripts or resources loaded over HTTP can be modified by network attackers to inject malicious code, effectively negating all HTTPS protections. The encrypted channel is compromised by unencrypted sub-resources.',
    reasonUk: 'КРИТИЧНЕ ПІДВИЩЕННЯ: Активний змішаний контент на HTTPS-сторінці. Скрипти або ресурси, завантажені через HTTP, можуть бути змінені зловмисниками в мережі для впровадження шкідливого коду.',
    reasonRu: 'КРИТИЧЕСКОЕ ПОВЫШЕНИЕ: Активный смешанный контент на HTTPS-странице. Скрипты или ресурсы, загруженные по HTTP, могут быть изменены злоумышленниками в сети для внедрения вредоносного кода.',
  },
  // NEW: exposed-api-endpoints + missing-csp
  {
    triggerIds: ['sec-exposed-api-endpoints', 'sec-missing-csp'],
    targetId: 'sec-exposed-api-endpoints',
    escalateTo: 'high',
    reasonEn: 'ESCALATION TO HIGH: Exposed API endpoints detected without Content-Security-Policy. Attackers can probe these endpoints for authentication bypass, data extraction, or privilege escalation. Without CSP, injected scripts can also interact with these APIs, amplifying the attack surface significantly.',
    reasonUk: 'ПІДВИЩЕННЯ ДО HIGH: Виявлено відкриті API-ендпоінти без Content-Security-Policy. Зловмисники можуть досліджувати ці ендпоінти для обходу автентифікації, витоку даних або підвищення привілеїв.',
    reasonRu: 'ПОВЫШЕНИЕ ДО HIGH: Обнаружены открытые API-эндпоинты без Content-Security-Policy. Злоумышленники могут исследовать эти эндпоинты для обхода аутентификации, утечки данных или повышения привилегий.',
  },
  // info-tech-disclosure + sec-missing-csp → escalate only to low (tech disclosure is informational by itself)
  {
    triggerIds: ['info-tech-disclosure', 'sec-missing-csp'],
    targetId: 'info-tech-disclosure',
    escalateTo: 'low',
    reasonEn: 'ESCALATION TO LOW: Technology stack is disclosed while the site also lacks CSP. Knowing the stack gives attackers a head start on crafting targeted exploits.',
    reasonUk: 'ПІДВИЩЕННЯ ДО LOW: Технологічний стек розкрито, а сайт не має CSP.',
    reasonRu: 'ПОВЫШЕНИЕ ДО LOW: Технологический стек раскрыт, а сайт не имеет CSP.',
  },
  // info-sensitive-comments + sec-missing-csp → escalate
  {
    triggerIds: ['info-sensitive-comments', 'sec-missing-csp'],
    targetId: 'info-sensitive-comments',
    escalateTo: 'high',
    reasonEn: 'ESCALATION TO HIGH: Sensitive information found in HTML comments (passwords, API keys, debug settings) combined with missing Content-Security-Policy. Debug comments containing credentials are often left by developers and represent an immediate security risk when exposed to production.',
    reasonUk: 'ПІДВИЩЕННЯ ДО HIGH: Чутлива інформація в HTML-коментарях у поєднанні з відсутністю CSP.',
    reasonRu: 'ПОВЫШЕНИЕ ДО HIGH: Конфиденциальная информация в HTML-комментариях в сочетании с отсутствием CSP.',
  },
  // info-email-leakage + info-phone-leakage → personal data exposure
  {
    triggerIds: ['info-email-leakage', 'info-phone-leakage'],
    targetId: 'info-email-leakage',
    escalateTo: 'medium',
    reasonEn: 'ESCALATION TO MEDIUM: Both email addresses and phone numbers are publicly exposed on this page. The combination of multiple types of personal contact information increases privacy and GDPR compliance concerns. Scrapers can easily harvest this data for spam, phishing, or social engineering campaigns.',
    reasonUk: 'ПІДВИЩЕННЯ ДО MEDIUM: Електронні адреси та телефонні номери публічно розкриті на цій сторінці.',
    reasonRu: 'ПОВЫШЕНИЕ ДО MEDIUM: Электронные адреса и телефонные номера публично раскрыты на этой странице.',
  },
  // info-internal-ip + sec-missing-csp → high (critical info disclosure)
  {
    triggerIds: ['info-internal-ip', 'sec-missing-csp'],
    targetId: 'info-internal-ip',
    escalateTo: 'high',
    reasonEn: 'ESCALATION TO HIGH: Internal IP addresses or hostnames are exposed on a site that lacks Content-Security-Policy. Internal network information disclosure combined with the absence of CSP creates a reconnaissance risk that could be used for targeted network attacks.',
    reasonUk: 'ПІДВИЩЕННЯ ДО HIGH: Внутрішні IP-адреси розкриті на сайті без CSP.',
    reasonRu: 'ПОВЫШЕНИЕ ДО HIGH: Внутренние IP-адреса раскрыты на сайте без CSP.',
  },
  // Hardcoded API key + exposed API endpoints → CRITICAL (attacker can immediately use key)
  {
    triggerIds: ['sec-hardcoded-api-key', 'sec-exposed-api-endpoints'],
    targetId: 'sec-hardcoded-api-key',
    escalateTo: 'critical',
    reasonEn: 'CRITICAL ESCALATION: Hardcoded API key combined with exposed API endpoints. An attacker can immediately use the discovered key to call the exposed endpoints, authenticate as the application, and exfiltrate data or perform unauthorized operations.',
    reasonUk: 'КРИТИЧНЕ ПІДВИЩЕННЯ: Хардкодний API-ключ у поєднанні з відкритими API-ендпоінтами. Зловмисник може негайно використати знайдений ключ для виклику ендпоінтів від імені додатку.',
    reasonRu: 'КРИТИЧЕСКОЕ ПОВЫШЕНИЕ: Захардкоженный API-ключ в сочетании с открытыми API-эндпоинтами. Злоумышленник может немедленно использовать ключ для вызова эндпоинтов от имени приложения.',
  },
  // Dangerous JS (eval/innerHTML) + missing CSP → CRITICAL (active XSS risk)
  {
    triggerIds: ['sec-inline-script-sensitive', 'sec-missing-csp'],
    targetId: 'sec-inline-script-sensitive',
    escalateTo: 'high',
    requiresContext: (flags) => !!flags.hasDangerousJs,
    reasonEn: 'ESCALATION TO HIGH: Dangerous JavaScript patterns (eval/innerHTML/document.write) combined with missing Content-Security-Policy. These patterns create direct XSS attack vectors with no browser-level protection in place.',
    reasonUk: 'ПІДВИЩЕННЯ ДО HIGH: Небезпечні JS-патерни (eval/innerHTML) разом з відсутністю CSP. Ці патерни створюють прямі вектори XSS-атак без захисту на рівні браузера.',
    reasonRu: 'ПОВЫШЕНИЕ ДО HIGH: Опасные JS-паттерны (eval/innerHTML) вместе с отсутствием CSP. Эти паттерны создают прямые XSS-векторы без защиты на уровне браузера.',
  },
  // Web3 wallet integration + dangerous JS patterns → CRITICAL (wallet drainer risk)
  {
    triggerIds: ['crypto-wallet-provider', 'sec-inline-script-sensitive'],
    targetId: 'crypto-wallet-provider',
    escalateTo: 'high',
    reasonEn: 'ESCALATION TO HIGH: Web3 wallet integration detected alongside sensitive/dangerous inline JavaScript. This combination is a common pattern in wallet drainer attacks, where malicious scripts hijack wallet transaction signing to redirect funds.',
    reasonUk: 'ПІДВИЩЕННЯ ДО HIGH: Виявлено інтеграцію Web3-гаманця разом із чутливими вбудованими JS-скриптами. Ця комбінація — типовий патерн атак wallet drainer.',
    reasonRu: 'ПОВЫШЕНИЕ ДО HIGH: Обнаружена интеграция Web3-кошелька вместе с конфиденциальными встроенными JS-скриптами. Эта комбинация — типичный паттерн атак wallet drainer.',
  },
];

function getReason(reasons: { en: string; uk: string; ru: string }, locale: Locale): string {
  return reasons[locale] || reasons.en;
}

// Cookie and session-related finding IDs that should be boosted in auth context
const COOKIE_SESSION_IDS = new Set([
  'sec-cookie-no-secure',
  'sec-cookie-no-httponly',
  'sec-cookie-no-samesite',
]);

export function analyzeRisk(
  findings: ScanFinding[],
  locale: Locale = 'en',
  contextFlags?: ContextFlags,
  scannedUrl?: string,
): { adjusted: ScanFinding[]; adjustments: RiskAdjustment[]; score: number } {
  const findingIds = new Set(findings.map((f) => f.id));
  const adjustments: RiskAdjustment[] = [];

  // Derive context flags if not provided (scanner.ts always provides them, this is a safety fallback)
  const flags: ContextFlags = contextFlags || { hasAuthForms: false, hasLoginPages: false, isHttps: false };

  // Apply combo rules
  const escalatedIds = new Set<string>();

  for (const rule of COMBO_RULES) {
    // Check context gate if present
    if (rule.requiresContext && !rule.requiresContext(flags)) continue;

    // Check if ALL trigger IDs are present
    const allPresent = rule.triggerIds.every((id) => findingIds.has(id));
    if (!allPresent) continue;

    // Only escalate if it would actually increase severity
    const target = findings.find((f) => f.id === rule.targetId);
    if (!target) continue;

    if (severityOrder[target.severity] >= severityOrder[rule.escalateTo]) continue;
    if (escalatedIds.has(rule.targetId)) continue;

    // Skip escalation if the finding was already downgraded by WAF/CDN context
    if (target.riskAdjustment?.reason?.toLowerCase().includes('waf') ||
        target.riskAdjustment?.reason?.toLowerCase().includes('cloudflare') ||
        target.riskAdjustment?.reason?.toLowerCase().includes('cdn')) {
      continue;
    }

    const originalSeverity = target.severity;

    // Create adjustment record
    adjustments.push({
      findingId: rule.targetId,
      reason: getReason({ en: rule.reasonEn, uk: rule.reasonUk, ru: rule.reasonRu }, locale),
      originalSeverity,
      adjustedSeverity: rule.escalateTo,
      relatedFindings: rule.triggerIds.filter((id) => id !== rule.targetId),
    });

    // Apply escalation to the finding
    target.originalSeverity = target.severity;
    target.severity = rule.escalateTo;
    target.riskAdjustment = {
      reason: getReason({ en: rule.reasonEn, uk: rule.reasonUk, ru: rule.reasonRu }, locale),
      from: originalSeverity,
      to: rule.escalateTo,
    };

    escalatedIds.add(rule.targetId);
  }

  // Static site descalation: missing CSP is less critical if site has no forms/auth/scripts
  if (flags.isStaticSite) {
    const cspFinding = findings.find(f => f.id === 'sec-missing-csp');
    if (cspFinding && !escalatedIds.has('sec-missing-csp')) {
      const currentLevel = severityOrder[cspFinding.severity];
      if (currentLevel >= severityOrder['medium']) {
        const originalSeverity = cspFinding.severity;
        const downTo: Severity = 'medium';
        const staticReason = {
          en: 'DESCALATION: Missing CSP on a static site with no forms, no authentication, and no user input. Without dynamic content or user interaction, the XSS risk is significantly lower. Still recommended to add CSP as best practice.',
          uk: 'ЗНИЖЕННЯ: Відсутність CSP на статичному сайті без форм, автентифікації та введення даних користувача. Без динамічного контенту ризик XSS значно нижчий.',
          ru: 'СНИЖЕНИЕ: Отсутствие CSP на статическом сайте без форм, аутентификации и ввода данных. Без динамического контента риск XSS значительно ниже.',
        };
        adjustments.push({ findingId: 'sec-missing-csp', reason: getReason(staticReason, locale), originalSeverity, adjustedSeverity: downTo, relatedFindings: ['static-site-context'] });
        cspFinding.originalSeverity = originalSeverity;
        cspFinding.severity = downTo;
        cspFinding.riskAdjustment = { reason: getReason(staticReason, locale), from: originalSeverity, to: downTo };
        escalatedIds.add('sec-missing-csp');
      }
    }
  }

  // Context-aware boosting: boost cookie/session findings if auth context detected
  if (flags.hasAuthForms || flags.hasLoginPages) {
    for (const finding of findings) {
      if (!COOKIE_SESSION_IDS.has(finding.id)) continue;
      if (escalatedIds.has(finding.id)) continue;

      // Only boost if severity is medium or below
      const currentLevel = severityOrder[finding.severity];
      if (currentLevel >= severityOrder['high']) continue;

      const boostTo: Severity = currentLevel < severityOrder['medium'] ? 'medium' : 'high';
      const originalSeverity = finding.severity;

      const authBoostReason = {
        en: `AUTH CONTEXT BOOST: This finding is escalated because authentication-related elements (login forms, password fields, or auth pages) were detected on the scanned site. Cookie and session security vulnerabilities pose a significantly higher risk when sensitive authentication data is at stake.`,
        uk: `ПІДВИЩЕННЯ КОНТЕКСТУ АВТЕНТИФІКАЦІЇ: Це знахідження підвищено, оскільки на відсканованому сайті виявлено елементи автентифікації (форми входу, поля паролів або сторінки авторизації). Вразливості безпеки cookie та сеансів становлять значно вищий ризик, коли йдеться про конфіденційні дані автентифікації.`,
        ru: `ПОВЫШЕНИЕ КОНТЕКСТА АУТЕНТИФИКАЦИИ: Эта находка повышена, так как на отсканированном сайте обнаружены элементы аутентификации (формы входа, поля паролей или страницы авторизации). Уязвимости безопасности cookie и сеансов представляют значительно более высокий риск, когда речь идёт о конфиденциальных данных аутентификации.`,
      };

      adjustments.push({
        findingId: finding.id,
        reason: getReason(authBoostReason, locale),
        originalSeverity,
        adjustedSeverity: boostTo,
        relatedFindings: ['auth-context-detected'],
      });

      finding.originalSeverity = originalSeverity;
      finding.severity = boostTo;
      finding.riskAdjustment = {
        reason: getReason(authBoostReason, locale),
        from: originalSeverity,
        to: boostTo,
      };

      escalatedIds.add(finding.id);
    }
  }

  // Calculate risk score with adjusted severities
  const weights: Record<string, number> = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 0,
  };

  let score = 0;
  for (const finding of findings) {
    score += weights[finding.severity] || 0;
  }

  // Bonus: multiple findings of same category increase score slightly
  const categoryCounts: Record<string, number> = {};
  for (const finding of findings) {
    categoryCounts[finding.category] = (categoryCounts[finding.category] || 0) + 1;
  }
  for (const count of Object.values(categoryCounts)) {
    if (count >= 3) score += 5;
    if (count >= 5) score += 5;
  }

  // Bonus: if there are adjusted findings, add extra weight
  if (adjustments.length > 0) {
    score += adjustments.length * 3;
  }

  return {
    adjusted: findings,
    adjustments,
    score: Math.min(100, score),
  };
}

// Generate exploit scenario text for a finding (used as fallback when KB doesn't have one)
export function generateExploitScenario(finding: ScanFinding, locale: Locale = 'en'): string {
  const severity = finding.severity;
  const category = finding.category;

  if (severity === 'info') {
    return getLocalizedScenario('info', locale);
  }

  if (category === 'crypto') {
    return getLocalizedScenario('crypto', locale);
  }

  if (finding.id === 'sec-missing-csp') {
    return getLocalizedScenario('sec-missing-csp', locale);
  }

  if (finding.id.includes('cookie')) {
    return getLocalizedScenario('cookie', locale);
  }

  if (finding.id.includes('csrf') || finding.id.includes('form')) {
    return getLocalizedScenario('csrf', locale);
  }

  if (finding.id.includes('xframe')) {
    return getLocalizedScenario('xframe', locale);
  }

  if (finding.id.includes('hsts')) {
    return getLocalizedScenario('hsts', locale);
  }

  if (finding.id.includes('sri') || finding.id.includes('inline-script')) {
    return getLocalizedScenario('sri', locale);
  }

  if (finding.id.includes('api')) {
    return getLocalizedScenario('api', locale);
  }

  // Specific scenarios for LOW-level header findings
  if (finding.id === 'sec-missing-xcontent') {
    return getLocalizedScenario('sec-missing-xcontent', locale);
  }

  if (finding.id === 'sec-missing-referrer') {
    return getLocalizedScenario('sec-missing-referrer', locale);
  }

  if (finding.id === 'sec-missing-permissions') {
    return getLocalizedScenario('sec-missing-permissions', locale);
  }

  if (finding.id === 'sec-extern-script-no-sri') {
    return getLocalizedScenario('sec-extern-script-no-sri', locale);
  }

  return getLocalizedScenario('fallback', locale);
}
