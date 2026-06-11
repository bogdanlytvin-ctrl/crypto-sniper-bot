export type Locale = 'en' | 'uk' | 'ru';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  uk: 'Українська',
  ru: 'Русский',
};

type TranslationKeys = {
  // Header
  appName: string;
  subtitle: string;

  // Scan
  scanPlaceholder: string;
  scanButton: string;
  scanning: string;
  scanNew: string;
  reScan: string;
  invalidUrl: string;

  // Tabs
  tabOverview: string;
  tabSecurity: string;
  tabCrypto: string;
  tabData: string;

  // Overview
  riskScore: string;
  riskScoreDesc: string;
  totalFindings: string;
  criticalIssues: string;
  highIssues: string;
  mediumIssues: string;
  lowIssues: string;
  scanCompleted: string;
  scanDuration: string;
  targetUrl: string;

  // Severity
  severityCritical: string;
  severityHigh: string;
  severityMedium: string;
  severityLow: string;
  severityInfo: string;

  // Categories
  categorySecurity: string;
  categoryDataExposure: string;
  categoryCrypto: string;

  // Findings
  findings: string;
  noFindings: string;
  explanation: string;
  howToFix: string;
  impact: string;
  references: string;
  details: string;
  copied: string;
  copyFix: string;
  exportReport: string;
  scanSteps: string;
  stepHeaders: string;
  stepCookies: string;
  stepDom: string;
  stepWeb3: string;
  stepReport: string;
  scanProgress: string;
  emptyTitle: string;
  emptyDesc: string;
  featSecurity: string;
  featSecurityDesc: string;
  featWeb3: string;
  featWeb3Desc: string;
  featData: string;
  featDataDesc: string;
  builtFor: string;

  // Risk labels
  riskLow: string;
  riskMedium: string;
  riskHigh: string;
  riskCritical: string;

  // Meta info
  metaStatus: string;
  metaContentType: string;
  metaForms: string;
  metaInputs: string;
  metaWeb3Addresses: string;

  // Locale change
  rescanForLocale: string;

  // History
  scanHistory: string;
  noHistory: string;
  deleteHistory: string;

  // General
  loading: string;
  error: string;
  back: string;
  seconds: string;
  sec: string;

  // Scan Depth
  scanDepth: string;
  depthSingle: string;
  depthMulti: string;
  stepJsAnalysis: string;
  externScriptNoSri: string;
  inlineScriptSensitive: string;
  exposedApiEndpoints: string;

  // Exploit Scenario
  exploitScenario: string;

  // Risk Adjustments
  riskEscalated: string;
  riskOriginal: string;
  riskAdjusted: string;
  aiInsight: string;

  // Crawl Info
  pagesScanned: string;
  crawlDepth: string;
  sourcePage: string;

  // PDF Report
  downloadPdf: string;
  exportJson: string;
  exportTxt: string;

  // Tech Stack & OWASP
  techStack: string;
  owaspMapping: string;
  detectedTech: string;

  // Export Report Labels
  reportTitle: string;
  reportDate: string;
  reportScore: string;
  reportFindings: string;
  reportExplanation: string;
  reportHowToFix: string;
  reportImpact: string;
  reportExploitation: string;
  reportRiskEscalation: string;
  reportReferences: string;
  reportCategory: string;
  reportSourcePage: string;
  reportEvidence: string;
  reportGeneratedBy: string;
  reportTarget: string;
  reportTotalFindings: string;
  reportTechnologies: string;
  reportTechnologiesNote: string;
  reportPossibleImpact: string;
};

const translations: Record<Locale, TranslationKeys> = {
  en: {
    appName: 'SecureScope',
    subtitle: 'Web Security & Web3 Analysis Platform',
    scanPlaceholder: 'Enter URL to scan (e.g., https://example.com)',
    scanButton: 'Start Security Scan',
    scanning: 'Scanning...',
    scanNew: 'New Scan',
    reScan: 'Re-scan',
    invalidUrl: 'Please enter a valid URL including the protocol (https://)',
    tabOverview: 'Overview',
    tabSecurity: 'Security',
    tabCrypto: 'Crypto',
    tabData: 'Data',
    riskScore: 'Risk Score',
    riskScoreDesc: 'Overall security posture assessment',
    totalFindings: 'Total Findings',
    criticalIssues: 'Critical',
    highIssues: 'High',
    mediumIssues: 'Medium',
    lowIssues: 'Low',
    scanCompleted: 'Scan Completed',
    scanDuration: 'Scan Duration',
    targetUrl: 'Target URL',
    severityCritical: 'Critical',
    severityHigh: 'High',
    severityMedium: 'Medium',
    severityLow: 'Low',
    severityInfo: 'Info',
    categorySecurity: 'Security',
    categoryDataExposure: 'Data Exposure',
    categoryCrypto: 'Crypto / Web3',
    findings: 'Findings',
    noFindings: 'No findings in this category. Well done!',
    explanation: 'Explanation',
    howToFix: 'How to Fix',
    impact: 'Impact',
    references: 'References',
    details: 'Details',
    scanHistory: 'Scan History',
    noHistory: 'No scan history yet. Start your first scan!',
    deleteHistory: 'Clear History',
    loading: 'Loading...',
    error: 'An error occurred',
    back: 'Back',
    seconds: 'seconds',
    sec: 's',
    copied: 'Copied!',
    copyFix: 'Copy fix',
    exportReport: 'Export Report',
    scanSteps: 'Scan Steps',
    stepHeaders: 'Analyzing HTTP headers...',
    stepCookies: 'Checking cookie security...',
    stepDom: 'Scanning DOM structure...',
    stepWeb3: 'Detecting Web3 elements...',
    stepReport: 'Generating report...',
    scanProgress: 'Analyzing',
    emptyTitle: 'Enter a URL above to start your security analysis',
    emptyDesc: 'Results will appear here with detailed findings, risk scores, and recommendations',
    featSecurity: 'Security Headers',
    featSecurityDesc: 'CSP, HSTS, X-Frame-Options, cookies',
    featWeb3: 'Web3 Detection',
    featWeb3Desc: 'Ethereum, Bitcoin, wallet providers',
    featData: 'Data Exposure',
    featDataDesc: 'CSRF, mixed content, meta leakage',
    builtFor: 'Built for security professionals',
    riskLow: 'Low Risk',
    riskMedium: 'Medium Risk',
    riskHigh: 'High Risk',
    riskCritical: 'Critical Risk',
    metaStatus: 'Status',
    metaContentType: 'Content-Type',
    metaForms: 'Forms',
    metaInputs: 'Inputs',
    metaWeb3Addresses: 'Web3 Addresses',
    rescanForLocale: 'Results language changed. Click to re-scan.',
    scanDepth: 'Scan Depth',
    depthSingle: 'Single Page',
    depthMulti: 'Multi-Page (Crawl)',
    stepJsAnalysis: 'Analyzing JavaScript resources...',
    externScriptNoSri: 'External Scripts Without SRI',
    inlineScriptSensitive: 'Sensitive Data in Inline Scripts',
    exposedApiEndpoints: 'Exposed API Endpoints',
    exploitScenario: 'Possible Exploitation Scenario',
    riskEscalated: 'Risk Escalated',
    riskOriginal: 'Original Severity',
    riskAdjusted: 'Adjusted Severity',
    aiInsight: 'AI Insight',
    pagesScanned: 'Pages Scanned',
    crawlDepth: 'Crawl Depth',
    sourcePage: 'Source Page',
    downloadPdf: 'Download PDF Report',
    exportJson: 'Export JSON',
    exportTxt: 'Export TXT',
    techStack: 'Technology Stack',
    owaspMapping: 'OWASP Classification',
    detectedTech: 'Detected {count} technologies',
    reportTitle: 'SecureScope - Security Report',
    reportDate: 'Date',
    reportScore: 'Score',
    reportFindings: 'Findings',
    reportExplanation: 'Explanation',
    reportHowToFix: 'How to Fix',
    reportImpact: 'Impact',
    reportExploitation: 'Possible Exploitation',
    reportRiskEscalation: 'Risk Escalation',
    reportReferences: 'References',
    reportCategory: 'Category',
    reportSourcePage: 'Source Page',
    reportEvidence: 'Evidence',
    reportGeneratedBy: 'Generated by SecureScope',
    reportTarget: 'Target',
    reportTotalFindings: 'Total Findings',
    reportTechnologies: 'Technologies Detected',
    reportTechnologiesNote: '* Technology detection limited in offline report. Use server-generated report for full details.',
    reportPossibleImpact: 'Possible Impact',
  },
  uk: {
    appName: 'SecureScope',
    subtitle: 'Платформа аналізу веб-безпеки та Web3',
    scanPlaceholder: 'Введіть URL для сканування (напр., https://example.com)',
    scanButton: 'Почати сканування безпеки',
    scanning: 'Сканування...',
    scanNew: 'Нове сканування',
    reScan: 'Пересканувати',
    invalidUrl: 'Введіть коректний URL з протоколом (https://)',
    tabOverview: 'Огляд',
    tabSecurity: 'Безпека',
    tabCrypto: 'Крипто',
    tabData: 'Дані',
    riskScore: 'Рівень ризику',
    riskScoreDesc: 'Загальна оцінка стану безпеки',
    totalFindings: 'Загальних знахідок',
    criticalIssues: 'Критичні',
    highIssues: 'Високі',
    mediumIssues: 'Середні',
    lowIssues: 'Низькі',
    scanCompleted: 'Сканування завершено',
    scanDuration: 'Тривалість сканування',
    targetUrl: 'Цільовий URL',
    severityCritical: 'Критично',
    severityHigh: 'Високий',
    severityMedium: 'Середній',
    severityLow: 'Низький',
    severityInfo: 'Інфо',
    categorySecurity: 'Безпека',
    categoryDataExposure: 'Витік даних',
    categoryCrypto: 'Крипто / Web3',
    findings: 'Знахідки',
    noFindings: 'У цій категорії немає знахідок. Чудово!',
    explanation: 'Пояснення',
    howToFix: 'Як виправити',
    impact: 'Вплив',
    references: 'Посилання',
    details: 'Деталі',
    scanHistory: 'Історія сканувань',
    noHistory: 'Історія сканувань порожня. Почніть перше сканування!',
    deleteHistory: 'Очистити історію',
    loading: 'Завантаження...',
    error: 'Сталася помилка',
    back: 'Назад',
    seconds: 'секунд',
    sec: 'с',
    copied: 'Скопійовано!',
    copyFix: 'Скопіювати',
    exportReport: 'Експорт звіту',
    scanSteps: 'Етапи сканування',
    stepHeaders: 'Аналіз HTTP-заголовків...',
    stepCookies: 'Перевірка безпеки cookie...',
    stepDom: 'Сканування структури DOM...',
    stepWeb3: 'Виявлення Web3-елементів...',
    stepReport: 'Генерація звіту...',
    scanProgress: 'Аналіз',
    emptyTitle: 'Введіть URL вище, щоб розпочати аналіз безпеки',
    emptyDesc: 'Тут з\'являться результати з детальними знахідками, оцінками ризику та рекомендаціями',
    featSecurity: 'Заголовки безпеки',
    featSecurityDesc: 'CSP, HSTS, X-Frame-Options, cookie',
    featWeb3: 'Виявлення Web3',
    featWeb3Desc: 'Ethereum, Bitcoin, гаманці',
    featData: 'Витік даних',
    featDataDesc: 'CSRF, змішаний контент, метатеги',
    builtFor: 'Створено для професіоналів з безпеки',
    riskLow: 'Низький ризик',
    riskMedium: 'Середній ризик',
    riskHigh: 'Високий ризик',
    riskCritical: 'Критичний ризик',
    metaStatus: 'Статус',
    metaContentType: 'Тип контенту',
    metaForms: 'Форми',
    metaInputs: 'Поля вводу',
    metaWeb3Addresses: 'Web3 адреси',
    rescanForLocale: 'Мова результатів змінена. Натисніть для повторного сканування.',
    scanDepth: 'Глибина сканування',
    depthSingle: 'Одна сторінка',
    depthMulti: 'Багатосторінкове (Обхід)',
    stepJsAnalysis: 'Аналіз JavaScript-ресурсів...',
    externScriptNoSri: 'Зовнішні скрипти без SRI',
    inlineScriptSensitive: 'Конфіденційні дані у вбудованих скриптах',
    exposedApiEndpoints: 'Відкриті API-кінцеві точки',
    exploitScenario: 'Можливий сценарій експлуатації',
    riskEscalated: 'Ризик підвищено',
    riskOriginal: 'Початкова важливість',
    riskAdjusted: 'Скоригована важливість',
    aiInsight: 'AI Інсайт',
    pagesScanned: 'Сторінок відскановано',
    crawlDepth: 'Глибина обходу',
    sourcePage: 'Джерело',
    downloadPdf: 'Завантажити PDF-звіт',
    exportJson: 'Експорт JSON',
    exportTxt: 'Експорт TXT',
    techStack: 'Технологічний стек',
    owaspMapping: 'Класифікація OWASP',
    detectedTech: 'Виявлено {count} технологій',
    reportTitle: 'SecureScope - Звіт з безпеки',
    reportDate: 'Дата',
    reportScore: 'Оцінка',
    reportFindings: 'Знахідки',
    reportExplanation: 'Пояснення',
    reportHowToFix: 'Як виправити',
    reportImpact: 'Вплив',
    reportExploitation: 'Можливий сценарій експлуатації',
    reportRiskEscalation: 'Підвищення ризику',
    reportReferences: 'Посилання',
    reportCategory: 'Категорія',
    reportSourcePage: 'Джерело',
    reportEvidence: 'Докази',
    reportGeneratedBy: 'Згенеровано SecureScope',
    reportTarget: 'Ціль',
    reportTotalFindings: 'Загальних знахідок',
    reportTechnologies: 'Виявлені технології',
    reportTechnologiesNote: '* Визначення технологій обмежене в офлайн-звіті. Використовуйте серверний звіт для повних деталей.',
    reportPossibleImpact: 'Можливий вплив',
  },
  ru: {
    appName: 'SecureScope',
    subtitle: 'Платформа анализа веб-безопасности и Web3',
    scanPlaceholder: 'Введите URL для сканирования (напр., https://example.com)',
    scanButton: 'Начать сканирование безопасности',
    scanning: 'Сканирование...',
    scanNew: 'Новое сканирование',
    reScan: 'Пересканировать',
    invalidUrl: 'Введите корректный URL с протоколом (https://)',
    tabOverview: 'Обзор',
    tabSecurity: 'Безопасность',
    tabCrypto: 'Крипто',
    tabData: 'Данные',
    riskScore: 'Уровень риска',
    riskScoreDesc: 'Общая оценка состояния безопасности',
    totalFindings: 'Всего находок',
    criticalIssues: 'Критические',
    highIssues: 'Высокие',
    mediumIssues: 'Средние',
    lowIssues: 'Низкие',
    scanCompleted: 'Сканирование завершено',
    scanDuration: 'Длительность сканирования',
    targetUrl: 'Целевой URL',
    severityCritical: 'Критично',
    severityHigh: 'Высокий',
    severityMedium: 'Средний',
    severityLow: 'Низкий',
    severityInfo: 'Инфо',
    categorySecurity: 'Безопасность',
    categoryDataExposure: 'Утечка данных',
    categoryCrypto: 'Крипто / Web3',
    findings: 'Находки',
    noFindings: 'В этой категории нет находок. Отлично!',
    explanation: 'Объяснение',
    howToFix: 'Как исправить',
    impact: 'Влияние',
    references: 'Ссылки',
    details: 'Детали',
    scanHistory: 'История сканирований',
    noHistory: 'История сканирований пуста. Начните первое сканирование!',
    deleteHistory: 'Очистить историю',
    loading: 'Загрузка...',
    error: 'Произошла ошибка',
    back: 'Назад',
    seconds: 'секунд',
    sec: 'с',
    copied: 'Скопировано!',
    copyFix: 'Копировать',
    exportReport: 'Экспорт отчёта',
    scanSteps: 'Этапы сканирования',
    stepHeaders: 'Анализ HTTP-заголовков...',
    stepCookies: 'Проверка безопасности cookie...',
    stepDom: 'Сканирование структуры DOM...',
    stepWeb3: 'Обнаружение Web3-элементов...',
    stepReport: 'Генерация отчёта...',
    scanProgress: 'Анализ',
    emptyTitle: 'Введите URL выше, чтобы начать анализ безопасности',
    emptyDesc: 'Здесь появятся результаты с подробными находками, оценками рисков и рекомендациями',
    featSecurity: 'Заголовки безопасности',
    featSecurityDesc: 'CSP, HSTS, X-Frame-Options, cookie',
    featWeb3: 'Обнаружение Web3',
    featWeb3Desc: 'Ethereum, Bitcoin, кошельки',
    featData: 'Утечка данных',
    featDataDesc: 'CSRF, смешанный контент, мета-теги',
    builtFor: 'Создано для профессионалов безопасности',
    riskLow: 'Низкий риск',
    riskMedium: 'Средний риск',
    riskHigh: 'Высокий риск',
    riskCritical: 'Критический риск',
    metaStatus: 'Статус',
    metaContentType: 'Тип контента',
    metaForms: 'Формы',
    metaInputs: 'Поля ввода',
    metaWeb3Addresses: 'Web3 адреса',
    rescanForLocale: 'Язык результатов изменён. Нажмите для повторного сканирования.',
    scanDepth: 'Глубина сканирования',
    depthSingle: 'Одна страница',
    depthMulti: 'Многостраничное (Обход)',
    stepJsAnalysis: 'Анализ JavaScript-ресурсов...',
    externScriptNoSri: 'Внешние скрипты без SRI',
    inlineScriptSensitive: 'Конфиденциальные данные во встроенных скриптах',
    exposedApiEndpoints: 'Открытые API-конечные точки',
    exploitScenario: 'Возможный сценарий эксплуатации',
    riskEscalated: 'Риск повышен',
    riskOriginal: 'Исходная серьёзность',
    riskAdjusted: 'Скорректированная серьёзность',
    aiInsight: 'AI Инсайт',
    pagesScanned: 'Страниц просканировано',
    crawlDepth: 'Глубина обхода',
    sourcePage: 'Источник',
    downloadPdf: 'Скачать PDF-отчёт',
    exportJson: 'Экспорт JSON',
    exportTxt: 'Экспорт TXT',
    techStack: 'Технологический стек',
    owaspMapping: 'Классификация OWASP',
    detectedTech: 'Обнаружено {count} технологий',
    reportTitle: 'SecureScope - Отчёт по безопасности',
    reportDate: 'Дата',
    reportScore: 'Оценка',
    reportFindings: 'Находки',
    reportExplanation: 'Объяснение',
    reportHowToFix: 'Как исправить',
    reportImpact: 'Влияние',
    reportExploitation: 'Возможный сценарий эксплуатации',
    reportRiskEscalation: 'Повышение риска',
    reportReferences: 'Ссылки',
    reportCategory: 'Категория',
    reportSourcePage: 'Источник',
    reportEvidence: 'Доказательства',
    reportGeneratedBy: 'Сгенерировано SecureScope',
    reportTarget: 'Цель',
    reportTotalFindings: 'Всего находок',
    reportTechnologies: 'Обнаруженные технологии',
    reportTechnologiesNote: '* Определение технологий ограничено в офлайн-отчёте. Используйте серверный отчёт для полных деталей.',
    reportPossibleImpact: 'Возможное влияние',
  },
};

export function t(locale: Locale, key: keyof TranslationKeys): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}

export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale] || translations.en;
}

export const SUPPORTED_LOCALES: Locale[] = ['en', 'uk', 'ru'];
