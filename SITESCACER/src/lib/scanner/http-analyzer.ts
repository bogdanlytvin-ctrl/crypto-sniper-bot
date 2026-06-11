import type { ScanFinding } from './types';
import type { Locale } from '@/lib/i18n/translations';
import {
  knowledgeBase,
  MISSING_CSP,
  MISSING_HSTS,
  MISSING_XFRAME,
  MISSING_XCONTENT,
  MISSING_REFERRER,
  MISSING_PERMISSIONS,
  COOKIE_NO_SECURE,
  COOKIE_NO_HTTPONLY,
  COOKIE_NO_SAMESITE,
  CORS_MISCONFIGURED,
  CSP_WEAK_POLICY,
  SERVER_VERSION_DISCLOSURE,
  entryToFinding,
} from './knowledge-base';

interface HeaderAnalysisInput {
  headers: Record<string, string>;
  setCookies: string[];
}

// Localized evidence message templates
const evidenceMessages: Record<string, Record<Locale, string | ((v: string) => string)>> = {
  noCsp: {
    en: 'No Content-Security-Policy header found in HTTP response',
    uk: 'У HTTP-відповіді не знайдено заголовка Content-Security-Policy',
    ru: 'В HTTP-ответе не найден заголовок Content-Security-Policy',
  },
  noHsts: {
    en: 'No Strict-Transport-Security header found in HTTP response',
    uk: 'У HTTP-відповіді не знайдено заголовка Strict-Transport-Security',
    ru: 'В HTTP-ответе не найден заголовок Strict-Transport-Security',
  },
  noXframe: {
    en: 'Neither X-Frame-Options header nor frame-ancestors CSP directive found',
    uk: 'Не знайдено ні заголовка X-Frame-Options, ні директиви frame-ancestors у CSP',
    ru: 'Не найден ни заголовок X-Frame-Options, ни директива frame-ancestors в CSP',
  },
  noXcto: {
    en: 'No X-Content-Type-Options header found',
    uk: 'Заголовок X-Content-Type-Options не знайдено',
    ru: 'Заголовок X-Content-Type-Options не найден',
  },
  xctoWrong: {
    en: (val: string) => `X-Content-Type-Options is "${val}" instead of "nosniff"`,
    uk: (val: string) => `X-Content-Type-Options має значення "${val}" замість "nosniff"`,
    ru: (val: string) => `X-Content-Type-Options имеет значение "${val}" вместо "nosniff"`,
  },
  noReferrer: {
    en: 'No Referrer-Policy header found',
    uk: 'Заголовок Referrer-Policy не знайдено',
    ru: 'Заголовок Referrer-Policy не найден',
  },
  referrerLax: {
    en: (val: string) => `Referrer-Policy is "${val}" which may be too permissive`,
    uk: (val: string) => `Referrer-Policy має значення "${val}", що може бути занадто м\'яким`,
    ru: (val: string) => `Referrer-Policy имеет значение "${val}", что может быть слишком мягким`,
  },
  noPermissions: {
    en: 'No Permissions-Policy (or Feature-Policy) header found',
    uk: 'Не знайдено заголовка Permissions-Policy (або Feature-Policy)',
    ru: 'Не найден заголовок Permissions-Policy (или Feature-Policy)',
  },
  cookiesNoSecure: {
    en: (names: string) => `Cookies without Secure flag: ${names}`,
    uk: (names: string) => `Cookie без прапорця Secure: ${names}`,
    ru: (names: string) => `Cookie без флага Secure: ${names}`,
  },
  cookiesNoSecureDetails: {
    en: (names: string) => `The following cookies lack the Secure attribute and may be transmitted over unencrypted connections: ${names}`,
    uk: (names: string) => `Наступні cookie не мають атрибута Secure і можуть передаватися через незашифровані з\'єднання: ${names}`,
    ru: (names: string) => `Следующие cookie не имеют атрибута Secure и могут передаваться по незашифрованным соединениям: ${names}`,
  },
  cookiesNoHttpOnly: {
    en: (names: string) => `Cookies without HttpOnly flag: ${names}`,
    uk: (names: string) => `Cookie без прапорця HttpOnly: ${names}`,
    ru: (names: string) => `Cookie без флага HttpOnly: ${names}`,
  },
  cookiesNoHttpOnlyDetails: {
    en: (names: string) => `The following cookies are accessible via JavaScript (document.cookie): ${names}`,
    uk: (names: string) => `Наступні cookie доступні через JavaScript (document.cookie): ${names}`,
    ru: (names: string) => `Следующие cookie доступны через JavaScript (document.cookie): ${names}`,
  },
  cookiesNoSameSite: {
    en: (names: string) => `Cookies without SameSite attribute: ${names}`,
    uk: (names: string) => `Cookie без атрибута SameSite: ${names}`,
    ru: (names: string) => `Cookie без атрибута SameSite: ${names}`,
  },
  cookiesNoSameSiteDetails: {
    en: (names: string) => `The following cookies may be sent with cross-site requests: ${names}`,
    uk: (names: string) => `Наступні cookie можуть надсилатися з міжсайтовими запитами: ${names}`,
    ru: (names: string) => `Следующие cookie могут отправляться с межсайтовыми запросами: ${names}`,
  },
  corsWildcard: {
    en: 'Access-Control-Allow-Origin: * — any origin can read API responses',
    uk: 'Access-Control-Allow-Origin: * — будь-яке походження може читати відповіді API',
    ru: 'Access-Control-Allow-Origin: * — любой источник может читать ответы API',
  },
  corsCritical: {
    en: (origin: string) => `CRITICAL: Access-Control-Allow-Origin reflects "${origin}" + Access-Control-Allow-Credentials: true — authenticated cross-origin requests possible`,
    uk: (origin: string) => `КРИТИЧНО: Access-Control-Allow-Origin відображає "${origin}" + Access-Control-Allow-Credentials: true — можливі автентифіковані крос-доменні запити`,
    ru: (origin: string) => `КРИТИЧНО: Access-Control-Allow-Origin отражает "${origin}" + Access-Control-Allow-Credentials: true — возможны аутентифицированные кросс-доменные запросы`,
  },
  cspWeakDirectives: {
    en: (directives: string) => `CSP contains dangerous directives: ${directives}`,
    uk: (directives: string) => `CSP містить небезпечні директиви: ${directives}`,
    ru: (directives: string) => `CSP содержит опасные директивы: ${directives}`,
  },
  serverVersion: {
    en: (val: string) => val,
    uk: (val: string) => val,
    ru: (val: string) => val,
  },
};

function ev(key: string, locale: Locale): string {
  return (evidenceMessages[key]?.[locale] || evidenceMessages[key]?.en || key) as string;
}

function evFn(key: string, locale: Locale, arg: string): string {
  const msg = evidenceMessages[key]?.[locale] || evidenceMessages[key]?.en;
  return typeof msg === 'function' ? msg(arg) : String(msg);
}

export function analyzeHeaders(input: HeaderAnalysisInput, locale: Locale = 'en'): ScanFinding[] {
  const findings: ScanFinding[] = [];
  const { headers, setCookies } = input;

  // Normalize header keys for case-insensitive comparison
  const h = (key: string) => {
    const lower = key.toLowerCase();
    return Object.keys(headers).find((k) => k.toLowerCase() === lower);
  };

  // --- WAF/CDN Detection ---
  const cfRay = headers[h('cf-ray') || ''];
  const isCloudflare = !!cfRay;
  const serverHeader = headers[h('server') || ''] || '';
  const isWafProtected = isCloudflare ||
    /cloudflare/i.test(serverHeader) ||
    /akamai/i.test(serverHeader) ||
    /incapsula/i.test(serverHeader) ||
    /imperva/i.test(serverHeader) ||
    /sucuri/i.test(serverHeader) ||
    !!headers[h('x-sucuri-id') || ''] ||
    !!headers[h('x-cdn') || ''];

  const wafNames: string[] = [];
  if (isCloudflare) wafNames.push('Cloudflare');
  if (/akamai/i.test(serverHeader)) wafNames.push('Akamai');
  if (/incapsula|imperva/i.test(serverHeader)) wafNames.push('Imperva');
  if (/sucuri/i.test(serverHeader) || headers[h('x-sucuri-id') || '']) wafNames.push('Sucuri');
  const wafName = wafNames.length > 0 ? wafNames.join('/') : 'WAF/CDN';

  // --- Security Headers ---

  // Content-Security-Policy
  if (!h('content-security-policy')) {
    findings.push(
      entryToFinding(MISSING_CSP, {
        evidence: ev('noCsp', locale),
      }, locale),
    );
  }

  // Strict-Transport-Security
  if (!h('strict-transport-security')) {
    findings.push(
      entryToFinding(MISSING_HSTS, {
        evidence: ev('noHsts', locale),
      }, locale),
    );
  }

  // X-Frame-Options
  if (!h('x-frame-options')) {
    // Check if frame-ancestors is in CSP
    const csp = headers[h('content-security-policy') || ''];
    const hasFrameAncestors = csp && csp.toLowerCase().includes('frame-ancestors');
    if (!hasFrameAncestors) {
      if (isWafProtected) {
        // WAF/CDN detected — likely adds X-Frame-Options at edge level
        // Report as low severity with WAF context note
        const wafXframeFinding = entryToFinding(MISSING_XFRAME, {
          evidence: ev('noXframe', locale),
        }, locale);
        // Downgrade severity: WAF typically handles this at edge
        wafXframeFinding.severity = 'low';
        (wafXframeFinding as any).originalSeverity = 'medium';
        const wafNote: Record<string, string> = {
          en: `${wafName} detected (${cfRay ? 'CF-RAY: ' + cfRay.slice(0, 16) + '...' : 'Server: ' + serverHeader}). ${wafName} typically injects X-Frame-Options (SAMEORIGIN) at the edge level, which may not be visible in the response headers received by our scanner. This finding is reported as LOW severity because the actual protection likely exists at the ${wafName} layer. Verify your ${wafName} dashboard to confirm X-Frame-Options configuration.`,
          uk: `Виявлено ${wafName} (${cfRay ? 'CF-RAY: ' + cfRay.slice(0, 16) + '...' : 'Server: ' + serverHeader}). ${wafName} зазвичай впроваджує X-Frame-Options (SAMEORIGIN) на рівні edge, що може бути невидимим у заголовках відповіді, отриманих нашим сканером. Ця знахідка повідомляється з LOW-серверністю, оскільки фактичний захист, ймовірно, існує на рівні ${wafName}. Перевірте налаштування ${wafName} для підтвердження конфігурації X-Frame-Options.`,
          ru: `Обнаружен ${wafName} (${cfRay ? 'CF-RAY: ' + cfRay.slice(0, 16) + '...' : 'Server: ' + serverHeader}). ${wafName} обычно внедряет X-Frame-Options (SAMEORIGIN) на уровне edge, что может быть невидимо в заголовках ответа, полученных нашим сканером. Эта находка сообщается с LOW-критичностью, поскольку фактическая защита, вероятно, существует на уровне ${wafName}. Проверьте настройки ${wafName} для подтверждения конфигурации X-Frame-Options.`,
        };
        wafXframeFinding.explanation = wafNote[locale] || wafNote.en;
        (wafXframeFinding as any).riskAdjustment = {
          reason: wafNote[locale] || wafNote.en,
          from: 'medium',
          to: 'low',
        };
        findings.push(wafXframeFinding);
      } else {
        findings.push(
          entryToFinding(MISSING_XFRAME, {
            evidence: ev('noXframe', locale),
          }, locale),
        );
      }
    }
  }

  // X-Content-Type-Options
  const xcto = headers[h('x-content-type-options') || ''];
  if (!xcto || xcto.toLowerCase() !== 'nosniff') {
    findings.push(
      entryToFinding(MISSING_XCONTENT, {
        evidence: xcto ? evFn('xctoWrong', locale, xcto) : ev('noXcto', locale),
      }, locale),
    );
  }

  // Referrer-Policy
  const rp = headers[h('referrer-policy') || ''];
  if (!rp) {
    findings.push(
      entryToFinding(MISSING_REFERRER, {
        evidence: ev('noReferrer', locale),
      }, locale),
    );
  } else if (
    !rp.includes('strict-origin') &&
    !rp.includes('no-referrer') &&
    !rp.includes('same-origin')
  ) {
    findings.push(
      entryToFinding(MISSING_REFERRER, {
        evidence: evFn('referrerLax', locale, rp),
      }, locale),
    );
  }

  // Permissions-Policy
  if (!h('permissions-policy') && !h('feature-policy')) {
    findings.push(
      entryToFinding(MISSING_PERMISSIONS, {
        evidence: ev('noPermissions', locale),
      }, locale),
    );
  }

  // --- Cookie Analysis ---
  // Whitelist: CDN/WAF/set-by-infrastructure cookies that are not application-controlled.
  // These cookies cannot be used for CSRF, session theft, etc.
  const CDN_COOKIE_PREFIXES = [
    '__cf_bm',      // Cloudflare Bot Management
    '__cflb',       // Cloudflare Load Balancing
    '__cfduid',     // Cloudflare Device ID
    '_cfuvid',      // Cloudflare Unique Visitor ID
    '_cfms',        // Cloudflare Measurement Science (analytics)
    'cf_',          // Cloudflare generic
    '__cfseq',     // Cloudflare Sequential
    '__ycl_',       // Yandex Cloud
    '__yft_',       // Yandex fingerprint
    'AWSALB',       // AWS ALB
    'AWSALBCORS',   // AWS ALB CORS
    'X-Amz-',       // AWS CloudFront (starts with X-Amz-)
    'ak_bmsc',      // Akamai Bot Manager
    '_abck',        // Akamai Bot Manager
    'bm_mi',        // Akamai Bot Manager (mobile intelligence)
    'bm_sv',        // Akamai Bot Manager (session validation)
    'nlbi_',        // Imperva (Incapsula)
    'visid_incap_', // Imperva
    'incap_ses_',   // Imperva
    'bm_sz',        // Sucuri
    'nix',          // Sucuri
    '__sucuri_',    // Sucuri
    '__stripe_mid', // Stripe (set by Stripe.js, not server)
    '__stripe_sid', // Stripe
    '_ga',          // Google Analytics (client-side only)
    '_gid',         // Google Analytics
    '_gat',         // Google Analytics
    '_gat_gtag_',   // Google Analytics (gtag variant)
    '_gcl_au',      // Google Ads conversion linker
    '_fbp',         // Meta Pixel
    '_hjid',        // Hotjar
    'intercom-id',  // Intercom
    '__hstc',       // HubSpot
    'cf_clearance', // Cloudflare challenge clearance
  ];

  function isCdnCookie(name: string): boolean {
    return CDN_COOKIE_PREFIXES.some(prefix =>
      name.toLowerCase().startsWith(prefix.toLowerCase()) || name.toLowerCase() === prefix.toLowerCase()
    );
  }

  // Routing/tracking cookies: not auth-sensitive, lower severity (medium vs high)
  // e.g., oai-chat-web-route, oai-did, next-locale, __next_hmr_cb
  function isRoutingOrTrackingCookie(name: string): boolean {
    const n = name.toLowerCase();
    return /[-_]route$/.test(n) ||       // *-route (load balancing)
      /[-_]lb$/.test(n) ||               // *-lb (load balancer)
      /[-_]node$/.test(n) ||             // *-node (server node)
      /[-_]did$/.test(n) ||              // *-did (device ID)
      /[-_]device[-_]?id/.test(n) ||     // *-device-id
      /^next[-_]locale/.test(n) ||       // locale cookie
      /^i18n/.test(n) ||                 // i18n preference
      /^lang/.test(n) ||                 // language preference
      /^locale/.test(n) ||               // locale preference
      /^theme/.test(n) ||                // theme preference
      /^color[-_]?scheme/.test(n) ||     // color scheme
      // Analytics / marketing / A-B testing cookies (intentionally JS-accessible)
      /^_ga/.test(n) ||                  // Google Analytics
      /^_gid/.test(n) ||                 // Google Analytics
      /^_fbp/.test(n) ||                 // Facebook Pixel
      /^_fbc/.test(n) ||                 // Facebook click
      /^tk_/.test(n) ||                  // WordPress.com / Tumblr tracking
      /^explat_/.test(n) ||              // WordPress.com A/B testing
      /^kndctr_/.test(n) ||              // Adobe Experience Cloud
      /^mbox/.test(n) ||                 // Adobe Target
      /^at_check/.test(n) ||             // Adobe Target check
      /^amplitude[-_]/.test(n) ||        // Amplitude analytics
      /^mixpanel/.test(n) ||             // Mixpanel analytics
      /^intercom[-_]/.test(n) ||         // Intercom
      /^hubspot/.test(n) ||              // HubSpot
      /^_hs/.test(n) ||                  // HubSpot
      /^drift/.test(n) ||                // Drift chat
      /^__utm/.test(n) ||                // Google Analytics legacy
      /^__hstc/.test(n) ||              // HubSpot
      /^mp_/.test(n) ||                   // Mixpanel
      // Publisher / media analytics (NYT, BBC, Guardian, etc.)
      /^nyt[-_]/.test(n) ||              // New York Times analytics
      /^bbc[-_]/.test(n) ||              // BBC analytics
      /^guardian[-_]/.test(n) ||         // Guardian analytics
      /[-_]traceid$/.test(n) ||          // Trace ID
      /[-_]purr$/.test(n) ||             // NYT paywall meter
      // Bot-detection & security challenge services (JS-accessible by design)
      n === '_octo' ||                   // GitHub analytics cookie
      n === 'datadome' ||                // DataDome bot detection
      /^__cf_bm/.test(n) ||             // Cloudflare bot management
      /^_px/.test(n) ||                  // PerimeterX
      /^recaptcha/.test(n) ||            // reCAPTCHA
      // Geo / network detection cookies (never auth-related)
      /^geoip$/i.test(n) ||             // GeoIP
      /^geo[-_]/.test(n) ||             // geo prefix
      /[-_]geo$/.test(n) ||             // geo suffix
      /^networkprobe/i.test(n) ||        // Network probe / feature detection
      /probe/i.test(n) ||               // Probe cookies
      // Wikimedia Foundation cookies
      /^wmf[-_]/.test(n) ||             // WMF- prefix
      /^wm[-_]last[-_]access/i.test(n) || // WMF last access
      // Anonymous user ID cookies (not auth, just anonymous fingerprint)
      /[-_]anon[-_]?id$/i.test(n) ||
      /[-_]anonymous[-_]?id$/i.test(n) ||
      n.endsWith('-a') ||                // Anonymous ID pattern (nyt-a, etc.)
      /^wpcom_/.test(n) ||               // WordPress.com UI/A-B testing
      /^ab_/.test(n) ||                  // Generic A/B test
      /^experiment_/.test(n) ||          // Generic experiment
      /^variant_/.test(n) ||             // Generic variant
      // CDN load-balancer / infrastructure cookies
      n === 'edgebucket' ||              // Reddit/CDN load balancer
      /^lb[-_]/.test(n) ||              // Generic LB
      /[-_]shard$/.test(n) ||           // Shard routing
      /^server[-_]id/.test(n) ||        // Server sticky
      /^sticky[-_]/.test(n) ||          // Sticky session
      // GDPR/privacy consent cookies (never auth-sensitive)
      /[-_]gdpr$/.test(n) ||
      /[-_]geo$/.test(n) ||
      /[-_]consent$/.test(n) ||
      /^consent[-_]/.test(n) ||
      /^gdpr[-_]/.test(n) ||
      /^cookie[-_](?:consent|notice|policy|accept|law)/.test(n) ||
      /^cookieconsent/.test(n) ||
      /^cc_/.test(n) ||                  // Cookie Consent prefix
      /^CookieConsent/i.test(n) ||
      /[-_]present$/.test(n);            // Session presence flags
  }

  if (setCookies.length > 0) {
    const insecureCookies: string[] = [];
    const insecureRoutingCookies: string[] = [];
    const nonHttpOnlyCookies: string[] = [];
    const noSameSiteCookies: string[] = [];

    for (const cookie of setCookies) {
      const parts = cookie.split(';').map((p) => p.trim());
      const name = parts[0]?.split('=')[0] || 'unknown';

      // Skip CDN/WAF/infrastructure cookies — they are not application-controlled
      if (isCdnCookie(name)) continue;

      const isRouting = isRoutingOrTrackingCookie(name);

      if (!cookie.toLowerCase().includes('secure')) {
        if (isRouting) {
          insecureRoutingCookies.push(name); // separate list — lower severity
        } else {
          insecureCookies.push(name);
        }
      }
      if (!cookie.toLowerCase().includes('httponly')) {
        if (!isRouting) nonHttpOnlyCookies.push(name);
      }
      if (!cookie.toLowerCase().includes('samesite')) {
        if (!isRouting) noSameSiteCookies.push(name);
      }
    }

    if (insecureCookies.length > 0) {
      const names = insecureCookies.join(', ');
      findings.push(
        entryToFinding(COOKIE_NO_SECURE, {
          evidence: evFn('cookiesNoSecure', locale, names),
          details: evFn('cookiesNoSecureDetails', locale, names),
        }, locale),
      );
    }

    if (nonHttpOnlyCookies.length > 0) {
      const names = nonHttpOnlyCookies.join(', ');
      findings.push(
        entryToFinding(COOKIE_NO_HTTPONLY, {
          evidence: evFn('cookiesNoHttpOnly', locale, names),
          details: evFn('cookiesNoHttpOnlyDetails', locale, names),
        }, locale),
      );
    }

    if (noSameSiteCookies.length > 0) {
      const names = noSameSiteCookies.join(', ');
      findings.push(
        entryToFinding(COOKIE_NO_SAMESITE, {
          evidence: evFn('cookiesNoSameSite', locale, names),
          details: evFn('cookiesNoSameSiteDetails', locale, names),
        }, locale),
      );
    }

    // Routing/tracking cookies without Secure — reported at LOW severity (not auth-sensitive)
    if (insecureRoutingCookies.length > 0) {
      const names = insecureRoutingCookies.join(', ');
      const f = entryToFinding(COOKIE_NO_SECURE, {
        confidence: 'medium',
        evidence: locale === 'uk'
          ? `Routing/tracking cookie без Secure: ${names}`
          : locale === 'ru'
          ? `Routing/tracking cookie без Secure: ${names}`
          : `Routing/tracking cookies without Secure flag: ${names}`,
        details: locale === 'uk'
          ? `Ці cookie є routing/tracking (не сесійними): ${names}. Вони не містять автентифікаційних даних, тому ризик нижчий.`
          : locale === 'ru'
          ? `Эти cookie являются routing/tracking (не сессионными): ${names}. Они не содержат аутентификационных данных, поэтому риск ниже.`
          : `These are routing/tracking cookies (not session auth): ${names}. They don't carry authentication data, so risk is lower.`,
      }, locale);
      f.id = 'sec-cookie-routing-no-secure';
      f.severity = 'low';
      findings.push(f);
    }
  }

  // --- CORS Misconfiguration ---
  const acao = headers[h('access-control-allow-origin') || ''];
  const acac = headers[h('access-control-allow-credentials') || ''];
  const hasCredentials = acac?.toLowerCase() === 'true';

  if (acao) {
    if (acao.trim() === '*') {
      const corsFinding = entryToFinding(CORS_MISCONFIGURED, {
        evidence: ev('corsWildcard', locale),
        details: hasCredentials
          ? (locale === 'uk'
            ? 'КРИТИЧНО: Access-Control-Allow-Origin: * з Allow-Credentials: true. Будь-який сайт може читати автентифіковані відповіді API.'
            : locale === 'ru'
            ? 'КРИТИЧНО: Access-Control-Allow-Origin: * с Allow-Credentials: true. Любой сайт может читать аутентифицированные ответы API.'
            : 'CRITICAL: Access-Control-Allow-Origin: * with Allow-Credentials: true. Any site can read authenticated API responses.')
          : (locale === 'uk'
            ? 'Access-Control-Allow-Origin: * без credentials дозволяє читати публічні відповіді. Ризик нижчий, але може витікати чутлива інформація з публічних ендпоінтів.'
            : locale === 'ru'
            ? 'Access-Control-Allow-Origin: * без credentials позволяет читать публичные ответы. Риск ниже, но может утекать чувствительная информация из публичных эндпоинтов.'
            : 'Access-Control-Allow-Origin: * without credentials allows reading public responses. Risk is lower, but sensitive data in public endpoints may be leaked.'),
      }, locale);
      // * without credentials = MEDIUM (public API pattern); * + credentials = CRITICAL
      if (hasCredentials) {
        corsFinding.severity = 'critical';
      } else {
        corsFinding.severity = 'medium';
        corsFinding.confidence = 'medium';
      }
      findings.push(corsFinding);
    } else if (acao !== 'null' && hasCredentials) {
      // Reflects Origin + credentials = critical
      const critFinding = entryToFinding(CORS_MISCONFIGURED, {
        evidence: evFn('corsCritical', locale, acao),
        details: locale === 'uk'
          ? `Сервер відображає Origin у Access-Control-Allow-Origin: ${acao} та встановлює Access-Control-Allow-Credentials: true. Будь-який запит з цього домену може читати автентифіковані відповіді API.`
          : locale === 'ru'
          ? `Сервер отражает Origin в Access-Control-Allow-Origin: ${acao} и устанавливает Access-Control-Allow-Credentials: true. Любой запрос с этого домена может читать аутентифицированные ответы API.`
          : `Server reflects Origin in Access-Control-Allow-Origin: ${acao} and sets Access-Control-Allow-Credentials: true. Any request from that origin can read authenticated API responses.`,
      }, locale);
      critFinding.severity = 'critical';
      findings.push(critFinding);
    }
  }

  // --- CSP Weakness Analysis ---
  const cspValue = headers[h('content-security-policy') || ''];
  if (cspValue) {
    const weakDirectives: string[] = [];

    // Nonce/hash/strict-dynamic make 'unsafe-inline' safe in modern browsers
    const hasNonce = /nonce-[a-zA-Z0-9+/=_-]{8,}/i.test(cspValue);
    const hasHash = /'sha(?:256|384|512)-[a-zA-Z0-9+/=]{20,}'/i.test(cspValue);
    const hasStrictDynamic = /'strict-dynamic'/i.test(cspValue);

    if (/unsafe-inline/i.test(cspValue) && !hasNonce && !hasHash && !hasStrictDynamic) {
      weakDirectives.push("'unsafe-inline'");
    }
    // 'wasm-unsafe-eval' only allows WebAssembly compilation — not dangerous like eval()
    const cspWithoutWasm = cspValue.replace(/wasm-unsafe-eval/gi, '');
    if (/(?<!\w)unsafe-eval/i.test(cspWithoutWasm)) weakDirectives.push("'unsafe-eval'");

    // Only flag bare '*' wildcard (any domain), not '*.domain.com' subdomain wildcards
    if (/script-src[^;]*\*(?!\.)/i.test(cspValue)) weakDirectives.push('script-src *');
    if (/default-src[^;]*\*(?!\.)/i.test(cspValue) && !/script-src/i.test(cspValue)) weakDirectives.push('default-src *');

    if (weakDirectives.length > 0) {
      findings.push(
        entryToFinding(CSP_WEAK_POLICY, {
          evidence: evFn('cspWeakDirectives', locale, weakDirectives.join(', ')),
          details: locale === 'uk'
            ? `Значення CSP: ${cspValue.slice(0, 300)}${cspValue.length > 300 ? '...' : ''}`
            : locale === 'ru'
            ? `Значение CSP: ${cspValue.slice(0, 300)}${cspValue.length > 300 ? '...' : ''}`
            : `CSP value: ${cspValue.slice(0, 300)}${cspValue.length > 300 ? '...' : ''}`,
        }, locale),
      );
    }
  }

  // --- Server Version Disclosure ---
  const versionPattern = /[\d]+\.[\d]/;
  const serverVal = headers[h('server') || ''];
  const poweredVal = headers[h('x-powered-by') || ''];

  if (serverVal && versionPattern.test(serverVal)) {
    findings.push(
      entryToFinding(SERVER_VERSION_DISCLOSURE, {
        evidence: evFn('serverVersion', locale, `Server: ${serverVal}`),
        details: locale === 'uk'
          ? `Заголовок Server розкриває версію: "${serverVal}". Зловмисник може цілеспрямовано шукати CVE для цієї конкретної версії.`
          : locale === 'ru'
          ? `Заголовок Server раскрывает версию: "${serverVal}". Злоумышленник может целенаправленно искать CVE для этой конкретной версии.`
          : `Server header discloses version: "${serverVal}". An attacker can specifically search for CVEs targeting this exact version.`,
      }, locale),
    );
  }

  if (poweredVal && versionPattern.test(poweredVal)) {
    const xpbFinding = entryToFinding(SERVER_VERSION_DISCLOSURE, {
      evidence: evFn('serverVersion', locale, `X-Powered-By: ${poweredVal}`),
      details: locale === 'uk'
        ? `Заголовок X-Powered-By розкриває версію технології: "${poweredVal}".`
        : locale === 'ru'
        ? `Заголовок X-Powered-By раскрывает версию технологии: "${poweredVal}".`
        : `X-Powered-By header discloses technology version: "${poweredVal}".`,
    }, locale);
    xpbFinding.id = 'sec-xpoweredby-version-disclosure';
    findings.push(xpbFinding);
  }

  return findings;
}
