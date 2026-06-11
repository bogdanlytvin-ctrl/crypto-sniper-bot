import type { ScanFinding } from './types';
import type { Locale } from '@/lib/i18n/translations';
import {
  EXTERN_SCRIPT_NO_SRI,
  INLINE_SCRIPT_SENSITIVE,
  EXPOSED_API_ENDPOINTS,
  HARDCODED_API_KEY,
  LOCALSTORAGE_SENSITIVE,
  entryToFinding,
} from './knowledge-base';

function shannonEntropy(s: string): number {
  const freq: Record<string, number> = {};
  for (const c of s) freq[c] = (freq[c] || 0) + 1;
  let e = 0;
  const len = s.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    e -= p * Math.log2(p);
  }
  return e;
}

const PLACEHOLDER_PATTERNS = [
  /^(x{4,}|0{4,}|1{4,}|a{4,}|test|demo|example|sample|dummy|fake|mock|placeholder|changeme|your[-_]?key|insert[-_]?here|todo|replace|xxx+|yyy+|zzz+)/i,
  /^(sk_test_|pk_test_|rk_test_)/i,
];

function isLikelyPlaceholder(value: string): boolean {
  if (value.length < 12) return true;
  if (PLACEHOLDER_PATTERNS.some(p => p.test(value))) return true;
  const unique = new Set(value).size;
  if (unique <= 3 && value.length > 8) return true;
  return false;
}

// Defined at module level — not recreated on every analyzeJavaScript() call.
// Stored as {name, source, flags} to create fresh instances per scan (avoid lastIndex state leakage).
const API_KEY_PATTERN_DEFS: Array<{ name: string; source: string; flags: string }> = [
  { name: 'AWS Access Key',         source: String.raw`\bAKIA[A-Z0-9]{16}\b`,                                                  flags: 'g'  },
  { name: 'AWS Secret Key',         source: String.raw`\baws[_\-\s]*secret[_\-\s]*(?:access[_\-\s]*)?key["'\s]*[:=]["'\s]*([A-Za-z0-9/+]{40})\b`, flags: 'gi' },
  { name: 'Google API Key',         source: String.raw`\bAIza[A-Za-z0-9_\-]{35}\b`,                                           flags: 'g'  },
  { name: 'Stripe Secret Key',      source: String.raw`\bsk_live_[A-Za-z0-9]{24,}\b`,                                         flags: 'g'  },
  { name: 'Stripe Restricted Key',  source: String.raw`\brk_live_[A-Za-z0-9]{24,}\b`,                                         flags: 'g'  },
  { name: 'GitHub Token',           source: String.raw`\bghp_[A-Za-z0-9]{36}\b`,                                              flags: 'g'  },
  { name: 'GitHub Actions Token',   source: String.raw`\bghs_[A-Za-z0-9]{36}\b`,                                              flags: 'g'  },
  { name: 'Slack Token',            source: String.raw`\bxox[bpoa]-[A-Za-z0-9\-]{10,}\b`,                                    flags: 'g'  },
  { name: 'SendGrid API Key',       source: String.raw`\bSG\.[A-Za-z0-9_\-]{22,}\.[A-Za-z0-9_\-]{43}\b`,                    flags: 'g'  },
  { name: 'Mailgun API Key',        source: String.raw`\bkey-[a-zA-Z0-9]{32}\b`,                                              flags: 'g'  },
  { name: 'Twilio API Key',         source: String.raw`\bSK[0-9a-fA-F]{32}\b`,                                               flags: 'g'  },
  { name: 'JWT Token',              source: String.raw`\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+`,             flags: 'g'  },
  { name: 'Private Key (PEM)',      source: String.raw`-----BEGIN (?:RSA |EC )?PRIVATE KEY-----`,                             flags: 'g'  },
  { name: 'Ethereum Private Key',   source: String.raw`\b(?:privateKey|private_key)\s*[:=]\s*["']?(0x[a-fA-F0-9]{64})["']?`, flags: 'gi' },
  { name: 'Infura Project ID',      source: String.raw`\binfura\.io\/v3\/[a-f0-9]{32}\b`,                                    flags: 'gi' },
  { name: 'Alchemy API Key',        source: String.raw`\balchemyapi\.io\/v2\/[A-Za-z0-9_\-]{32,}\b`,                         flags: 'gi' },
];

interface JsAnalysisInput {
  html: string;
  pageUrl: string;
}

// Localized evidence message templates
const ev = {
  // --- Inline Script Sensitive ---
  inlineSensitive: (n: number, patterns: string, l: Locale) =>
    l === 'uk' ? `Знайдено ${n} вбудований(і) скрипт(ів) із чутливими шаблонами: ${patterns}`
    : l === 'ru' ? `Найдено ${n} встроенный(ых) скрипт(ов) с конфиденциальными паттернами: ${patterns}`
    : `Found ${n} inline script(s) with sensitive patterns: ${patterns}`,

  inlineSensitiveDetails: (patterns: string, l: Locale) =>
    l === 'uk' ? `Виявлені чутливі шаблони у вбудованих скриптах: ${patterns}. Ці шаблони можуть розкривати API-ключі, токени, або використовувати небезпечні функції.`
    : l === 'ru' ? `Обнаружены конфиденциальные паттерны во встроенных скриптах: ${patterns}. Эти паттерны могут раскрывать API-ключи, токены или использовать опасные функции.`
    : `Detected sensitive patterns in inline scripts: ${patterns}. These patterns may expose API keys, tokens, or use dangerous functions.`,

  // --- External Script No SRI ---
  externNoSri: (n: number, scripts: string, l: Locale) =>
    l === 'uk' ? `Знайдено ${n} зовнішній(ніх) скрипт(ів) з CDN без SRI: ${scripts}`
    : l === 'ru' ? `Найдено ${n} внешний(их) скрипт(ов) с CDN без SRI: ${scripts}`
    : `Found ${n} external script(s) from CDN without SRI: ${scripts}`,

  externNoSriDetails: (scripts: string, l: Locale) =>
    l === 'uk' ? `Наступні зовнішні скрипти завантажуються з CDN без атрибута integrity: ${scripts}. Додайте SRI-хеші для перевірки цілісності ресурсів.`
    : l === 'ru' ? `Следующие внешние скрипты загружаются с CDN без атрибута integrity: ${scripts}. Добавьте SRI-хеши для проверки целостности ресурсов.`
    : `The following external scripts are loaded from CDN without integrity attribute: ${scripts}. Add SRI hashes to verify resource integrity.`,

  // --- Exposed API Endpoints ---
  exposedEndpoints: (n: number, endpoints: string, l: Locale) =>
    l === 'uk' ? `Знайдено ${n} відкритий(х) API-кінцевий(і) пункт(и): ${endpoints}`
    : l === 'ru' ? `Найдено ${n} открытую(ых) API-конечную(ые) точку(ки): ${endpoints}`
    : `Found ${n} exposed API endpoint(s): ${endpoints}`,

  exposedEndpointsDetails: (endpoints: string, l: Locale) =>
    l === 'uk' ? `Виявлені API-кінцеві точки у вбудованих скриптах: ${endpoints}. Вони можуть бути ціллю для розвідки та атак перерахування.`
    : l === 'ru' ? `Обнаружены API-конечные точки во встроенных скриптах: ${endpoints}. Они могут быть целью для разведки и атак перечисления.`
    : `Detected API endpoints in inline scripts: ${endpoints}. They may be targets for reconnaissance and enumeration attacks.`,
};

export function analyzeJavaScript(input: JsAnalysisInput, locale: Locale = 'en'): ScanFinding[] {
  const findings: ScanFinding[] = [];
  const { html } = input;

  // --- 1. Inline scripts with sensitive patterns ---
  const inlineScriptPattern = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  // Context patterns that indicate a SAFE occurrence (not a real credential leak)
  const SAFE_PASSWORD_CONTEXTS = [
    /type[\s]*==?['"]password['"]/i,
    /type[\s]*===?['"]password['"]/i,
    /type[\s]*!=?['"]password['"]/i,
    /type[\s]*!==?['"]password['"]/i,
    /type[\s]*['"]password['"]/i,
    /placeholder.*password/i,
    /password.*placeholder/i,
    /forgotpassword/i,
    /forgot_password/i,
    /forgot-password/i,
    /changepassword/i,
    /change_password/i,
    /change-password/i,
    /resetpassword/i,
    /reset_password/i,
    /reset-password/i,
    /setpassword/i,
    /confirm.*password/i,
    /newpassword/i,
    /password.*field/i,
    /password.*input/i,
    /password.*label/i,
    /password.*title/i,
    /password.*heading/i,
    /password.*text/i,
    /password.*message/i,
    /password.*description/i,
    /password.*seo/i,
    /seo.*password/i,
    /password.*page/i,
    /password.*step/i,
    /createpassword/i,
    /currentpassword/i,
    /enterpassword/i,
    /passwordstrength/i,
    /showpassword/i,
    /hidepassword/i,
    /togglepassword/i,
    /requirepassword/i,
    /validatepassword/i,
    /minlength.*password/i,
    /password.*minlength/i,
    /maxlength.*password/i,
    /passwordpolicy/i,
    /querySelector.*password/i,
    /getElementById.*password/i,
  ];

  function isSafeContext(content: string, keyword: string): boolean {
    const lower = content.toLowerCase();
    if (keyword === 'password') {
      return SAFE_PASSWORD_CONTEXTS.some(p => p.test(lower));
    }
    if (keyword === 'token' || keyword === 'secret') {
      // Web3 / educational safe contexts — these mention secrets/tokens
      // but are NOT actual credential leaks
      const SAFE_TOKEN_SECRET_CONTEXTS = [
        /secret[\s_-]*recovery[\s_-]*phrase/i,
        /recovery[\s_-]*phrase/i,
        /secret[\s_-]*seed/i,
        /seed[\s_-]*phrase/i,
        /never[\s_-]*share.*secret/i,
        /keep.*secret/i,
        /secret.*safe/i,
        /secret.*wallet/i,
        /wallet.*secret/i,
        /secret.*phrase/i,
        /token[\s_-]*contract/i,
        /token[\s_-]*address/i,
        /token[\s_-]*approve/i,
        /token[\s_-]*balance/i,
        /token[\s_-]*standard/i,
        /erc.?20.*token/i,
        /nft.*token/i,
        /token.*name/i,
        /token.*symbol/i,
        /token.*decimals/i,
        /token.*type/i,
        /token.*id/i,
        /token.*list/i,
        /token.*uri/i,
        /nf?token/i,
        /transfer.*token/i,
        /token.*transfer/i,
        /token.*allowance/i,
        /token.*total.*supply/i,
        /access[\s_-]*token.*description/i,
        /bearer.*token.*description/i,
        /token.*description/i,
        /secret.*description/i,
        /password.*description/i,
        /forgot.*password/i,
        /reset.*password/i,
        /change.*password/i,
      ];
      if (SAFE_TOKEN_SECRET_CONTEXTS.some(p => p.test(lower))) return true;

      // Must be in assignment pattern like: token = '...' or secret: '...'
      // to be flagged as a real finding
      return !/["'][A-Za-z0-9_+/=\-]{16,}["']/.test(content);
    }
    return false;
  }

  const sensitiveKeywords = [
    // Only flag if followed by assignment with a string value (actual leak)
    { pattern: /\bapi[_-]?key\s*[:=]\s*["'][A-Za-z0-9_\-+/=]{8,}["']/i, name: 'api_key' },
    { pattern: /\bapikey\s*[:=]\s*["'][A-Za-z0-9_\-+/=]{8,}["']/i, name: 'apikey' },
    { pattern: /\bsecret[_-]?key\s*[:=]\s*["'][A-Za-z0-9_\-+/=]{8,}["']/i, name: 'secret_key' },
    { pattern: /\bprivate[_-]?key\s*[:=]\s*["'][A-Za-z0-9_\-+/=]{16,}["']/i, name: 'private_key' },
    // Password only if it looks like a hardcoded assignment, not UI label
    { pattern: /\bpassword\s*[:=]\s*["'][^"']{4,}["']/i, name: 'password' },
    // Token only if it looks like a real token value (long string)
    { pattern: /\btoken\s*[:=]\s*["'][A-Za-z0-9_\-+/=.]{20,}["']/i, name: 'token' },
    // Bearer token with actual value
    { pattern: /bearer\s+[A-Za-z0-9_\-+/=.]{20,}/i, name: 'bearer_token' },
    // eval only with string literal argument (actual dangerous usage)
    { pattern: /\beval\s*\(\s*["'`]/i, name: 'eval(string)' },
  ];

  const sensitivePatternsFound: string[] = [];
  let sensitiveScriptsCount = 0;

  while ((match = inlineScriptPattern.exec(html)) !== null) {
    const content = match[1];
    const matchedPatterns: string[] = [];

    for (const kw of sensitiveKeywords) {
      const m = content.match(kw.pattern);
      if (m) {
        if (isSafeContext(content, kw.name)) continue;
        // For password/token/secret: extract the quoted value and check entropy
        // Avoids false positives like: const password = "enter your password"
        if (kw.name === 'password' || kw.name === 'token' || kw.name === 'secret_key' || kw.name === 'apikey') {
          const valMatch = m[0].match(/["']([^"']+)["']\s*$/);
          if (valMatch) {
            const val = valMatch[1];
            if (val.length < 12 || shannonEntropy(val) < 3.0) continue;
          }
        }
        matchedPatterns.push(m[0].trim().substring(0, 40));
      }
    }

    // postMessage listener without origin check — only flag when the handler processes
    // sensitive data (auth tokens, credentials, payment info). Ad-tech and analytics
    // scripts use postMessage extensively without origin checks and that is acceptable.
    if (/addEventListener\s*\(\s*["']message["']/i.test(content) &&
        !/event\.origin/i.test(content) &&
        !/\.origin\s*[!=]==?/i.test(content) &&
        !/allowedOrigins/i.test(content) &&
        /\b(?:password|token|secret|credential|auth|login|session|payment|card|cvv|wallet|private[_-]?key)\b/i.test(content)) {
      if (!matchedPatterns.includes('postMessage listener (no origin check)')) {
        matchedPatterns.push('postMessage listener (no origin check)');
      }
    }

    if (matchedPatterns.length > 0) {
      sensitiveScriptsCount++;
      sensitivePatternsFound.push(...matchedPatterns);
    }
  }

  if (sensitiveScriptsCount > 0) {
    const uniquePatterns = [...new Set(sensitivePatternsFound)];
    const shown = uniquePatterns.slice(0, 5).join(', ');
    findings.push(
      entryToFinding(INLINE_SCRIPT_SENSITIVE, {
        evidence: ev.inlineSensitive(sensitiveScriptsCount, shown, locale),
        details: ev.inlineSensitiveDetails(shown + (uniquePatterns.length > 5 ? ` +${uniquePatterns.length - 5}` : ''), locale),
      }, locale),
    );
  }

  // --- 2. External scripts without SRI ---
  const externalScriptPattern = /<script[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
  const cdnDomains = [
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net',
    'unpkg.com',
    'cdnjs.com',
    'ajax.googleapis.com',
    'cdn.rawgit.com',
    'cdn.bootcdn.net',
    'cdn.staticfile.net',
    'cdn.baomitu.com',
    'fastly.net',
    'cloudflare.com/ajax',
  ];

  const scriptsNoSri: string[] = [];
  let scriptMatch;

  while ((scriptMatch = externalScriptPattern.exec(html)) !== null) {
    const tag = scriptMatch[0];
    const src = scriptMatch[1];

    // Check if it's from a CDN
    const isCdn = cdnDomains.some((domain) => src.toLowerCase().includes(domain.toLowerCase()));
    if (isCdn) {
      // Check if it has integrity attribute
      if (!/integrity\s*=/i.test(tag)) {
        scriptsNoSri.push(src);
      }
    }
  }

  if (scriptsNoSri.length > 0) {
    const shown = scriptsNoSri.slice(0, 3).map((s) => {
      try {
        const url = new URL(s);
        return url.pathname.split('/').pop() || s;
      } catch {
        return s;
      }
    }).join(', ');
    findings.push(
      entryToFinding(EXTERN_SCRIPT_NO_SRI, {
        evidence: ev.externNoSri(scriptsNoSri.length, shown, locale),
        details: ev.externNoSriDetails(scriptsNoSri.join(', '), locale),
      }, locale),
    );
  }

  // --- 3. Exposed API endpoints in inline scripts ---
  const apiPatterns = [
    /["']\/api\/[^"']*["']/gi,
    /["']\/v\d+\/[^"']*["']/gi,
    /["']\/graphql["']/gi,
    /["']\/rest\/[^"']*["']/gi,
    /["']\/v\d+["']/gi,
  ];

  const apiEndpoints: string[] = [];
  let apiMatch;

  // Search in all inline scripts
  while ((match = inlineScriptPattern.exec(html)) !== null) {
    const content = match[1];
    for (const pattern of apiPatterns) {
      while ((apiMatch = pattern.exec(content)) !== null) {
        const endpoint = apiMatch[0].replace(/['"]/g, '');
        if (!apiEndpoints.includes(endpoint)) {
          apiEndpoints.push(endpoint);
        }
      }
      // Reset lastIndex
      pattern.lastIndex = 0;
    }
  }

  // Filter out benign public/analytics endpoints — only flag sensitive ones
  const BENIGN_ENDPOINT_PATTERNS = [
    /^\/api\/v?\d*\/(events?|analytics|tracking?|beacon|log|logs|metrics?|stats?|ping|health|heartbeat|telemetry|pageview|impression|click|track|report|reports?)(\/?|$)/i,
    /^\/api\/(events?|analytics|tracking?|beacon|log|logs|metrics?|stats?|ping|health|heartbeat|telemetry|pageview|impression|click|track|report|reports?)(\/?|$)/i,
    /^\/v\d+\/(events?|analytics|tracking?|beacon|log|metrics?|stats?|ping|health|heartbeat|telemetry)(\/?|$)/i,
  ];
  const SENSITIVE_ENDPOINT_KEYWORDS = /\/(admin|auth|login|password|token|key|secret|internal|private|user|account|payment|billing|config|settings|debug|seed|wallet)\b/i;

  const sensitiveEndpoints = apiEndpoints.filter(ep =>
    !BENIGN_ENDPOINT_PATTERNS.some(p => p.test(ep)) &&
    (SENSITIVE_ENDPOINT_KEYWORDS.test(ep) || apiEndpoints.length >= 3),
  );

  if (sensitiveEndpoints.length > 0) {
    const shown = sensitiveEndpoints.slice(0, 6).join(', ');
    findings.push(
      entryToFinding(EXPOSED_API_ENDPOINTS, {
        evidence: ev.exposedEndpoints(sensitiveEndpoints.length, shown, locale),
        details: ev.exposedEndpointsDetails(sensitiveEndpoints.join(', '), locale),
      }, locale),
    );
  }

  // --- 4. document.write / innerHTML with dynamic content (XSS sinks) ---
  // Only flag when the sink is used with variable/dynamic content, not static strings
  const xssSinkPattern = /(?:document\.write|\.innerHTML|\.outerHTML)\s*(?:\+=|=)\s*(?!["'`])/gi;
  let sinkMatch;
  const xssSinks: string[] = [];
  // fresh regex on html to avoid lastIndex issues
  const freshInlinePattern = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  while ((sinkMatch = freshInlinePattern.exec(html)) !== null) {
    const content = sinkMatch[1];
    const sinkMatches = content.match(xssSinkPattern);
    if (sinkMatches) {
      sinkMatches.slice(0, 3).forEach(m => {
        const sink = m.trim().replace(/\s+/g, ' ').slice(0, 60);
        if (!xssSinks.includes(sink)) xssSinks.push(sink);
      });
    }
  }

  if (xssSinks.length > 0) {
    const finding = entryToFinding(INLINE_SCRIPT_SENSITIVE, {
      evidence: locale === 'uk'
        ? `DOM XSS sink(и) з динамічним вмістом: ${xssSinks.slice(0, 3).join(', ')}`
        : locale === 'ru'
        ? `DOM XSS sink(и) с динамическим содержимым: ${xssSinks.slice(0, 3).join(', ')}`
        : `DOM XSS sink(s) with dynamic content: ${xssSinks.slice(0, 3).join(', ')}`,
      details: locale === 'uk'
        ? `Виявлені DOM XSS-сінки (document.write/innerHTML) з динамічним вмістом у вбудованих скриптах. Якщо вміст містить дані користувача без санітизації — це пряма XSS-вразливість.`
        : locale === 'ru'
        ? `Обнаружены DOM XSS-синки (document.write/innerHTML) с динамическим содержимым во встроенных скриптах. Если содержимое включает данные пользователя без санитизации — это прямая XSS-уязвимость.`
        : `DOM XSS sinks (document.write/innerHTML) with dynamic content found in inline scripts. If the content includes user-controlled data without sanitization, this is a direct XSS vulnerability.`,
    }, locale);
    // Downgrade confidence to medium for innerHTML-only sinks — they are very common in
    // framework/CMS code and often render server-controlled (not user-controlled) content.
    // document.write is more dangerous and keeps high confidence.
    const hasDocumentWrite = xssSinks.some(s => s.includes('document.write'));
    if (!hasDocumentWrite) {
      finding.confidence = 'medium';
    }
    findings.push(finding);
  }

  // --- 5. Real API Key / Secret pattern detection ---
  // Uses API_KEY_PATTERN_DEFS (module-level) — fresh RegExp per call to avoid lastIndex state.
  const apiKeyPattern2 = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  const foundKeys: Array<{ name: string; masked: string; entropy: number }> = [];

  while ((match = apiKeyPattern2.exec(html)) !== null) {
    const content = match[1];
    for (const { name, source, flags } of API_KEY_PATTERN_DEFS) {
      const km = content.match(new RegExp(source, flags));
      if (km) {
        const val = km[0];
        if (isLikelyPlaceholder(val)) continue;
        const entropy = shannonEntropy(val);
        if (entropy < 3.2) continue;
        const masked = val.length > 12 ? `${val.slice(0, 8)}...${val.slice(-4)}` : val.slice(0, 4) + '...';
        if (!foundKeys.some(k => k.name === name)) {
          foundKeys.push({ name, masked, entropy });
        }
      }
    }
  }
  // Also scan full HTML for inline patterns (meta tags, data attributes) — first 8 patterns only
  for (const { name, source } of API_KEY_PATTERN_DEFS.slice(0, 8)) {
    if (foundKeys.some(k => k.name === name)) continue;
    const km = html.match(new RegExp(source, 'g'));
    if (km) {
      const val = km[0];
      if (isLikelyPlaceholder(val)) continue;
      const entropy = shannonEntropy(val);
      if (entropy < 3.2) continue;
      const masked = val.length > 12 ? `${val.slice(0, 8)}...${val.slice(-4)}` : val.slice(0, 4) + '...';
      foundKeys.push({ name, masked, entropy });
    }
  }

  if (foundKeys.length > 0) {
    const shown = foundKeys.slice(0, 5).map(k => `${k.name}: ${k.masked}`).join(', ');
    const minEntropy = Math.min(...foundKeys.map(k => k.entropy));
    const confidence = minEntropy >= 4.5 ? 'high' : 'medium';
    findings.push(
      entryToFinding(HARDCODED_API_KEY, {
        confidence,
        evidence: locale === 'uk'
          ? `Знайдено ${foundKeys.length} реальний(их) API ключ(ів): ${shown}`
          : locale === 'ru'
          ? `Найдено ${foundKeys.length} реальный(ых) API ключ(ей): ${shown}`
          : `Found ${foundKeys.length} real API key(s): ${shown}`,
        details: locale === 'uk'
          ? `Виявлено реальні API ключі/секрети у вихідному коді: ${shown}. Ці ключі мають бути НЕГАЙНО відкликані та замінені.`
          : locale === 'ru'
          ? `Обнаружены реальные API ключи/секреты в исходном коде: ${shown}. Эти ключи должны быть НЕМЕДЛЕННО отозваны и заменены.`
          : `Real API keys/secrets found in source code: ${shown}. These keys must be IMMEDIATELY revoked and rotated.`,
      }, locale),
    );
  }

  // --- 6. localStorage / sessionStorage with sensitive data ---
  const localStoragePatterns = [
    /localStorage\s*\.\s*setItem\s*\(\s*["'](?:token|accessToken|access_token|privateKey|private_key|password|secret|apiKey|api_key|authToken|auth_token|jwt|sessionToken|session_token|wallet|seed|mnemonic)["']/gi,
    /sessionStorage\s*\.\s*setItem\s*\(\s*["'](?:token|accessToken|access_token|privateKey|private_key|password|secret|apiKey|api_key|authToken|auth_token|jwt|sessionToken|session_token|wallet|seed|mnemonic)["']/gi,
  ];

  const localStorageItems: string[] = [];
  for (const pattern of localStoragePatterns) {
    const storageMatches = html.match(pattern);
    if (storageMatches) {
      storageMatches.forEach(m => {
        const keyMatch = m.match(/["']([^"']+)["']\s*\)/);
        if (keyMatch && !localStorageItems.includes(keyMatch[1])) {
          localStorageItems.push(keyMatch[1]);
        }
      });
    }
  }

  if (localStorageItems.length > 0) {
    const hasSession = /sessionStorage\s*\.\s*setItem/.test(html);
    const hasLocal = /localStorage\s*\.\s*setItem/.test(html);
    const storageType = hasSession && hasLocal ? 'localStorage + sessionStorage' : hasSession ? 'sessionStorage' : 'localStorage';
    findings.push(
      entryToFinding(LOCALSTORAGE_SENSITIVE, {
        evidence: locale === 'uk'
          ? `${storageType}.setItem() з чутливими ключами: ${localStorageItems.join(', ')}`
          : locale === 'ru'
          ? `${storageType}.setItem() с чувствительными ключами: ${localStorageItems.join(', ')}`
          : `${storageType}.setItem() with sensitive keys: ${localStorageItems.join(', ')}`,
        details: locale === 'uk'
          ? `Виявлено зберігання чутливих даних у ${storageType} браузера. Зловмисник з XSS-доступом може читати ці дані через JavaScript. Ключі: ${localStorageItems.join(', ')}`
          : locale === 'ru'
          ? `Обнаружено хранение чувствительных данных в ${storageType} браузера. Злоумышленник с XSS-доступом может читать эти данные через JavaScript. Ключи: ${localStorageItems.join(', ')}`
          : `Sensitive data stored in browser ${storageType}. An attacker with XSS access can read this data via JavaScript. Keys: ${localStorageItems.join(', ')}`,
      }, locale),
    );
  }

  return findings;
}
