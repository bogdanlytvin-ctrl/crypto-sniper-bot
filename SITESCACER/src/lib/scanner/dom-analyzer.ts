import type { ScanFinding } from './types';
import type { Locale } from '@/lib/i18n/translations';
import {
  FORM_NO_CSRF,
  FORM_PASSWORD_NO_AUTOCOMPLETE,
  MIXED_CONTENT,
  SENSITIVE_META_INFO,
  CRYPTO_WEB3_EXTERNAL,
  CRYPTO_DRM_EXTERNAL,
  REVERSE_TABNAPPING,
  IFRAME_NO_SANDBOX,
  FORM_EXTERNAL_ACTION,
  entryToFinding,
} from './knowledge-base';

interface DomAnalysisInput {
  html: string;
  pageUrl: string;
}

export interface DomAnalysisResult {
  findings: ScanFinding[];
  meta: { forms: number; inputs: number; scripts: string[] };
}

// Localized evidence message templates
const ev = {
  csrfFound: (n: number, l: Locale) =>
    l === 'uk' ? `Знайдено ${n} POST-форму(и) без поля CSRF-токена`
    : l === 'ru' ? `Найдено ${n} POST-форму(ы) без поля CSRF-токена`
    : `Found ${n} POST form(s) without CSRF token fields`,

  csrfDetails: (n: number, l: Locale) =>
    l === 'uk' ? `POST-форми без видимих CSRF-токенів вразливі до атак міжсайтової підробки запитів (CSRF). Знайдено ${n} форму(и) з method="POST", але без відповідних полів csrf_token, _token або authenticity_token.`
    : l === 'ru' ? `POST-формы без видимых CSRF-токенов уязвимы к атакам межсайтовой подделки запросов (CSRF). Найдено ${n} форму(ы) с method="POST", но без соответствующих полей csrf_token, _token или authenticity_token.`
    : `POST forms without visible CSRF tokens are vulnerable to Cross-Site Request Forgery. Found ${n} form(s) with method="POST" but no matching csrf_token, _token, or authenticity_token input fields.`,

  pwAutocomplete: (n: number, l: Locale) =>
    l === 'uk' ? `Знайдено ${n} поле(я) пароля зі стандартним автозаповненням`
    : l === 'ru' ? `Найдено ${n} поле(я) пароля со стандартным автозаполнением`
    : `Found ${n} password field(s) with default autocomplete`,

  pwAutocompleteDetails: (_n: number, l: Locale) =>
    l === 'uk' ? 'Поля пароля без явного атрибута autocomplete можуть дозволяти браузерам кешувати облікові дані на спільних пристроях.'
    : l === 'ru' ? 'Поля пароля без явного атрибута autocomplete могут позволять браузерам кэшировать учётные данные на общих устройствах.'
    : 'Password fields without explicit autocomplete attribute may allow browsers to cache credentials on shared devices.',

  mixedContent: (n: number, l: Locale) =>
    l === 'uk' ? `Знайдено ${n} HTTP-ресурс(ів) на HTTPS-сторінці`
    : l === 'ru' ? `Найдено ${n} HTTP-ресурс(ов) на HTTPS-странице`
    : `Found ${n} HTTP resource(s) on HTTPS page`,

  mixedContentDetails: (resources: string, more: number, l: Locale) =>
    l === 'uk' ? `Ресурси, завантажені через HTTP на HTTPS-сторінці: ${resources}${more > 0 ? ` та ще ${more}` : ''}`
    : l === 'ru' ? `Ресурсы, загруженные по HTTP на HTTPS-странице: ${resources}${more > 0 ? ` и ещё ${more}` : ''}`
    : `Resources loaded over HTTP on an HTTPS page: ${resources}${more > 0 ? ` and ${more} more` : ''}`,

  metaTags: (tags: string, l: Locale) =>
    l === 'uk' ? `Знайдено мета-теги, що розкривають технології: ${tags}`
    : l === 'ru' ? `Найдены мета-теги, раскрывающие технологии: ${tags}`
    : `Found technology-revealing meta tags: ${tags}`,

  metaTagsDetails: (tags: string, l: Locale) =>
    l === 'uk' ? `Наступні мета-теги можуть розкривати інформацію про технологічний стек: ${tags}`
    : l === 'ru' ? `Следующие мета-теги могут раскрывать информацию о технологическом стеке: ${tags}`
    : `The following meta tags may reveal technology stack information: ${tags}`,

  web3Scripts: (n: number, scripts: string, l: Locale) =>
    l === 'uk' ? `Знайдено ${n} зовнішній(ніх) Web3-скрипт(ів): ${scripts}`
    : l === 'ru' ? `Найдено ${n} внешний(их) Web3-скрипт(ов): ${scripts}`
    : `Found ${n} Web3 external script(s): ${scripts}`,

  web3ScriptsDetails: (scripts: string, l: Locale) =>
    l === 'uk' ? `Зовнішні Web3-бібліотеки завантажуються з CDN: ${scripts}. Розгляньте самостійне хостинг з Subresource Integrity.`
    : l === 'ru' ? `Внешние Web3-библиотеки загружаются с CDN: ${scripts}. Рассмотрите самостоятельный хостинг с Subresource Integrity.`
    : `External Web3 libraries loaded from CDN: ${scripts}. Consider self-hosting with Subresource Integrity.`,

  walletRefs: (refs: string, l: Locale) =>
    l === 'uk' ? `Виявлено посилання на провайдери гаманців: ${refs}`
    : l === 'ru' ? `Обнаружены ссылки на провайдеры кошельков: ${refs}`
    : `Detected wallet provider references: ${refs}`,

  walletRefsDetails: (refs: string, l: Locale) =>
    l === 'uk' ? `Сторінка посилається на такі провайдери гаманців: ${refs}. Перевірте, що процеси підключення гаманців безпечні та чітко повідомляються користувачам.`
    : l === 'ru' ? `Страница ссылается на следующие провайдеры кошельков: ${refs}. Проверьте, что процессы подключения кошельков безопасны и чётко сообщаются пользователям.`
    : `The page references the following wallet providers: ${refs}. Verify that wallet connection flows are secure and clearly communicated to users.`,
};

export function analyzeDom(input: DomAnalysisInput, locale: Locale = 'en'): DomAnalysisResult {
  const findings: ScanFinding[] = [];
  const { html, pageUrl } = input;

  // --- Form Analysis ---
  const formPattern = /<form[^>]*>/gi;
  const forms = html.match(formPattern) || [];
  // Comprehensive CSRF token patterns: Django, Rails, Laravel, ASP.NET, generic
  const csrfTokens = html.match(
    /name=["'](?:csrf[_\w]*|_token|authenticity_token|csrfmiddlewaretoken|__requestverificationtoken|_csrf|xsrf[_\w]*|anti[_-]?forgery[_\w]*)["']/gi,
  ) || [];
  // Also check for CSRF meta tags (common in Rails/Angular)
  const csrfMeta = html.match(/<meta[^>]*name=["']csrf[^"']*["'][^>]*>/i);

  if (forms.length > 0 && csrfTokens.length === 0 && !csrfMeta) {
    const postForms = forms.filter((f) => /method=["']post["']/i.test(f));
    if (postForms.length > 0) {
      findings.push(
        entryToFinding(FORM_NO_CSRF, {
          evidence: ev.csrfFound(postForms.length, locale),
          details: ev.csrfDetails(postForms.length, locale),
        }, locale),
      );
    }
  }

  // --- Password Field Autocomplete ---
  const passwordFields = html.match(/<input[^>]*type=["']password["'][^>]*>/gi) || [];
  const noAutocompletePasswords = passwordFields.filter((f) => {
    const autocomplete = f.match(/autocomplete=["']([^"']+)["']/i);
    return !autocomplete || !['new-password', 'off', 'current-password'].includes(autocomplete[1].toLowerCase());
  });

  if (noAutocompletePasswords.length > 0) {
    findings.push(
      entryToFinding(FORM_PASSWORD_NO_AUTOCOMPLETE, {
        evidence: ev.pwAutocomplete(noAutocompletePasswords.length, locale),
        details: ev.pwAutocompleteDetails(noAutocompletePasswords.length, locale),
      }, locale),
    );
  }

  // --- Mixed Content Detection ---
  // Only flag active/passive mixed content — NOT regular <a href="http://"> links.
  // Active: script src, iframe src, object/embed/video/audio src, form action
  // Passive: img src, link href (stylesheet), CSS url()
  const mixedResources: string[] = [];
  let match;

  // Active mixed content: script, iframe, frame, object, embed, audio, video, form action
  const activeMixedPattern = /<(?:script|iframe|frame|object|embed|audio|video|source)[^>]+\bsrc\s*=\s*["'](http:\/\/[^"']+)["']/gi;
  while ((match = activeMixedPattern.exec(html)) !== null) {
    if (!match[1].includes('localhost') && !match[1].includes('127.0.0.1')) {
      mixedResources.push(match[1]);
    }
  }

  // Form action over HTTP (CSRF / credential leak)
  const httpFormActionPattern = /<form[^>]+\baction\s*=\s*["'](http:\/\/[^"']+)["']/gi;
  while ((match = httpFormActionPattern.exec(html)) !== null) {
    if (!match[1].includes('localhost') && !match[1].includes('127.0.0.1')) {
      mixedResources.push(match[1]);
    }
  }

  // Passive: img/picture/track src, link rel=stylesheet
  const passiveMixedPattern = /<(?:img|track|picture)[^>]+\bsrc\s*=\s*["'](http:\/\/[^"']+)["']|<link[^>]+\brel\s*=\s*["']stylesheet["'][^>]+\bhref\s*=\s*["'](http:\/\/[^"']+)["']|<link[^>]+\bhref\s*=\s*["'](http:\/\/[^"']+)["'][^>]+\brel\s*=\s*["']stylesheet["']/gi;
  while ((match = passiveMixedPattern.exec(html)) !== null) {
    const url = match[1] || match[2] || match[3];
    if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      mixedResources.push(url);
    }
  }

  // CSS url(http://) — inline style mixed content
  const cssUrlPattern = /url\(\s*["']?(http:\/\/[^"'\s)]+)/gi;
  while ((match = cssUrlPattern.exec(html)) !== null) {
    if (!match[1].includes('localhost') && !match[1].includes('127.0.0.1')) {
      mixedResources.push(match[1]);
    }
  }

  if (mixedResources.length > 0 && pageUrl.startsWith('https://')) {
    const shown = mixedResources.slice(0, 5).join(', ');
    const more = mixedResources.length > 5 ? mixedResources.length - 5 : 0;
    findings.push(
      entryToFinding(MIXED_CONTENT, {
        evidence: ev.mixedContent(mixedResources.length, locale),
        details: ev.mixedContentDetails(shown, more, locale),
      }, locale),
    );
  }

  // --- Sensitive Meta Tags ---
  const metaGenerator = html.match(/<meta[^>]*name=["']generator["'][^>]*>/i);
  // Only detect CMS/framework/powered meta tags, NOT generic application-name
  const metaCms = html.match(/<meta[^>]*name=["'](?:framework|cms|powered-by|powered)[^"']*["'][^>]*>/i);

  if (metaGenerator || metaCms) {
    const sensitiveMetas: string[] = [];
    if (metaGenerator) sensitiveMetas.push(metaGenerator[0]);
    if (metaCms) sensitiveMetas.push(metaCms[0]);

    // Extract name="..." content="..." from meta tags for evidence
    const extractMetaInfo = (tag: string): string => {
      const name = tag.match(/name=["']([^"']+)["']/i)?.[1] || '';
      const content = tag.match(/content=["']([^"']+)["']/i)?.[1] || '';
      return content ? `${name}: ${content}` : name || tag.slice(0, 60);
    };

    findings.push(
      entryToFinding(SENSITIVE_META_INFO, {
        evidence: ev.metaTags(sensitiveMetas.map(extractMetaInfo).join(', '), locale),
        details: ev.metaTagsDetails(sensitiveMetas.join(' | '), locale),
      }, locale),
    );
  }

  // --- Web3 External Script Detection ---
  const web3ScriptPatterns = [
    /cdn[.\w]*ethers/i,
    /cdn[.\w]*web3/i,
    /unpkg\.com\/ethers/i,
    /cdnjs\.cloudflare\.com.*web3/i,
    /cdn\.jsdelivr\.net.*ethers/i,
    /walletconnect/i,
    /web3modal/i,
  ];

  const scriptSrcPattern = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
  const scripts: string[] = [];
  const web3Scripts: string[] = [];
  while ((match = scriptSrcPattern.exec(html)) !== null) {
    scripts.push(match[1]);
    const src = match[1];
    for (const pattern of web3ScriptPatterns) {
      if (pattern.test(src)) {
        web3Scripts.push(src);
        break;
      }
    }
  }

  if (web3Scripts.length > 0) {
    findings.push(
      entryToFinding(CRYPTO_WEB3_EXTERNAL, {
        evidence: ev.web3Scripts(web3Scripts.length, web3Scripts.slice(0, 3).join(', '), locale),
        details: ev.web3ScriptsDetails(web3Scripts.join(', '), locale),
      }, locale),
    );
  }

  // --- Wallet Provider Detection ---
  // Patterns are intentionally specific to avoid false positives on sites that merely
  // *mention* wallet brands (e.g. "We accept Coinbase Pay" in marketing copy).
  // Only flag when there is clear JS SDK / integration evidence.
  const walletPatterns = [
    /window\.ethereum/i,
    /window\.web3/i,
    /window\.solana/i,
    /walletconnect/i,
    // Coinbase: require wallet-SDK context — not just the brand name in text
    /coinbaseWallet|CoinbaseWallet|coinbase-wallet|coinbase\.com\/wallet|@coinbase\/wallet/i,
  ];
  const walletRefs: string[] = [];
  for (const p of walletPatterns) {
    const m = html.match(p);
    if (m) walletRefs.push(m[0]);
  }

  if (walletRefs.length > 0) {
    findings.push(
      entryToFinding(CRYPTO_DRM_EXTERNAL, {
        evidence: ev.walletRefs(walletRefs.join(', '), locale),
        details: ev.walletRefsDetails(walletRefs.join(', '), locale),
      }, locale),
    );
  }

  // --- Reverse Tabnapping: target="_blank" without rel="noopener" ---
  const blankLinkPattern = /<a[^>]*target=["']_blank["'][^>]*>/gi;
  const blankLinks = html.match(blankLinkPattern) || [];
  const unsafeBlankLinks = blankLinks.filter(tag => {
    const rel = tag.match(/rel=["']([^"']*)["']/i)?.[1] || '';
    return !rel.includes('noopener') && !rel.includes('noreferrer');
  });

  if (unsafeBlankLinks.length > 0) {
    findings.push(
      entryToFinding(REVERSE_TABNAPPING, {
        evidence: locale === 'uk'
          ? `${unsafeBlankLinks.length} посилань з target="_blank" без rel="noopener noreferrer"`
          : locale === 'ru'
          ? `${unsafeBlankLinks.length} ссылок с target="_blank" без rel="noopener noreferrer"`
          : `${unsafeBlankLinks.length} link(s) with target="_blank" missing rel="noopener noreferrer"`,
        details: locale === 'uk'
          ? `Приклади: ${unsafeBlankLinks.slice(0, 2).map(l => l.slice(0, 80)).join(' | ')}`
          : locale === 'ru'
          ? `Примеры: ${unsafeBlankLinks.slice(0, 2).map(l => l.slice(0, 80)).join(' | ')}`
          : `Examples: ${unsafeBlankLinks.slice(0, 2).map(l => l.slice(0, 80)).join(' | ')}`,
      }, locale),
    );
  }

  // --- Iframe without sandbox ---
  // Trusted embeds that universally need JS and don't require sandbox
  const TRUSTED_IFRAME_HOSTS = new Set([
    'www.youtube.com', 'youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com',
    'player.vimeo.com', 'vimeo.com',
    'www.google.com', 'maps.google.com', 'maps.google.com.ua',
    'www.googletagmanager.com', 'googletagmanager.com',
    'www.facebook.com', 'facebook.com',
    'platform.twitter.com', 'twitter.com',
    'open.spotify.com', 'w.soundcloud.com',
    'docs.google.com', 'forms.gle', 'form.typeform.com',
    'calendly.com', 'app.calendly.com',
    'www.google.com', 'recaptcha.net',
    'js.hsforms.net', 'app.hubspot.com',
  ]);
  const iframePattern = /<iframe[^>]*>/gi;
  const iframes = html.match(iframePattern) || [];
  const unsandboxedIframes = iframes.filter(tag => {
    const src = tag.match(/src=["']([^"']*)["']/i)?.[1] || '';
    // Only flag third-party iframes without sandbox
    if (!src || src.startsWith('/') || src.startsWith('#')) return false;
    try {
      const iframeHost = new URL(src).hostname;
      const pageHost = new URL(pageUrl).hostname;
      if (iframeHost === pageHost) return false; // same-origin is fine
      if (TRUSTED_IFRAME_HOSTS.has(iframeHost)) return false; // known trusted embeds
    } catch { return false; }
    return !/sandbox/i.test(tag);
  });

  if (unsandboxedIframes.length > 0) {
    findings.push(
      entryToFinding(IFRAME_NO_SANDBOX, {
        evidence: locale === 'uk'
          ? `${unsandboxedIframes.length} сторонній(іх) iframe без атрибута sandbox`
          : locale === 'ru'
          ? `${unsandboxedIframes.length} сторонний(их) iframe без атрибута sandbox`
          : `${unsandboxedIframes.length} third-party iframe(s) without sandbox attribute`,
        details: unsandboxedIframes.slice(0, 2).map(t => {
          const src = t.match(/src=["']([^"']{0,80})["']/i)?.[1] || '';
          return src;
        }).filter(Boolean).join(', '),
      }, locale),
    );
  }

  // --- Form submitting to external domain ---
  const formActionPattern = /<form[^>]*action=["']([^"']+)["'][^>]*>/gi;
  let formMatch;
  const externalFormActions: string[] = [];
  let pageHost = '';
  try { pageHost = new URL(pageUrl).hostname; } catch { /* */ }

  while ((formMatch = formActionPattern.exec(html)) !== null) {
    const action = formMatch[1];
    if (!action.startsWith('/') && !action.startsWith('#') && !action.startsWith('?')) {
      try {
        const actionHost = new URL(action).hostname;
        if (pageHost && actionHost !== pageHost) {
          externalFormActions.push(action.slice(0, 100));
        }
      } catch { /* relative URL */ }
    }
  }

  if (externalFormActions.length > 0) {
    findings.push(
      entryToFinding(FORM_EXTERNAL_ACTION, {
        evidence: locale === 'uk'
          ? `${externalFormActions.length} форма(и) надсилають дані на зовнішній домен: ${externalFormActions.slice(0, 2).join(', ')}`
          : locale === 'ru'
          ? `${externalFormActions.length} форма(ы) отправляют данные на внешний домен: ${externalFormActions.slice(0, 2).join(', ')}`
          : `${externalFormActions.length} form(s) submitting to external domain: ${externalFormActions.slice(0, 2).join(', ')}`,
        details: locale === 'uk'
          ? `Форми надсилають дані на зовнішні домени. Переконайтеся, що ці домени є авторизованими партнерами (платіжні системи тощо): ${externalFormActions.join(', ')}`
          : locale === 'ru'
          ? `Формы отправляют данные на внешние домены. Убедитесь, что эти домены являются авторизованными партнёрами: ${externalFormActions.join(', ')}`
          : `Forms are submitting to external domains. Verify these are authorized partners (payment processors, etc.): ${externalFormActions.join(', ')}`,
      }, locale),
    );
  }

  return {
    findings,
    meta: {
      forms: forms.length,
      inputs: (html.match(/<input[^>]*>/gi) || []).length,
      scripts,
    },
  };
}
