import type { ScanResult, ScanFinding, RiskAdjustment, CrawlStats, TechDetection } from './types';
import type { Locale } from '@/lib/i18n/translations';
import { analyzeHeaders } from './http-analyzer';
import { analyzeDom } from './dom-analyzer';
import { detectWeb3, detectAddressReuse } from './web3-detector';
import { analyzeJavaScript } from './js-analyzer';
import { detectTechStack } from './tech-fingerprint';
import { detectInfoLeakage } from './info-leakage';
import { probeSensitivePaths } from './path-probe';
import { analyzeRisk, generateExploitScenario } from './risk-engine';
import { applyOwaspMapping, getOwaspSummary } from './owasp-mapping';
import type { ContextFlags } from './risk-engine';
import { crawlDomain } from './crawler';

// SSRF protection: validate URL before scanning
export function validateUrl(url: string): { valid: boolean; error?: string; sanitized?: string } {
  try {
    // Decode percent-encoded characters first to catch obfuscated URLs
    let decodedUrl: string;
    try {
      decodedUrl = decodeURIComponent(url);
    } catch {
      decodedUrl = url;
    }

    let parsed = new URL(decodedUrl);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    // Block private/internal IP ranges
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]' ||
      hostname.match(/^10\./) ||
      hostname.match(/^172\.(1[6-9]|2\d|3[01])\./) ||
      hostname.match(/^192\.168\./) ||
      hostname.match(/^169\.254\./) ||
      hostname.match(/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./) ||
      hostname.match(/^224\./) ||  // multicast
      hostname.match(/^ff0/) ||     // multicast IPv6
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.corp') ||
      hostname.endsWith('.lan') ||
      hostname === 'metadata.google.internal' ||
      hostname === 'metadata' ||
      hostname.endsWith('.amazonaws.com') && hostname.includes('compute.internal') ||
      hostname.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) ||
      hostname.includes('0x7f') ||      // hex-encoded loopback
      hostname.includes('0177') ||      // octal-encoded loopback
      hostname.includes('2130706433')    // decimal-encoded loopback
    ) {
      return { valid: false, error: 'Scanning of internal or private network addresses is not allowed' };
    }

    // Block excessively long URLs (potential DoS)
    if (url.length > 2048) {
      return { valid: false, error: 'URL is too long (maximum 2048 characters)' };
    }

    // Sanitize: rebuild URL to prevent injection (strips fragment, credentials, etc.)
    const sanitized = `${parsed.protocol}//${parsed.hostname}${parsed.port ? ':' + parsed.port : ''}${parsed.pathname}${parsed.search}`;
    return { valid: true, sanitized };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// Sanitize text content for storage/display
export function sanitizeContent(content: string, maxLength = 10000): string {
  if (!content) return '';
  // Strip script tags content
  let sanitized = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  // Strip style tags
  sanitized = sanitized.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Strip HTML tags for text display
  sanitized = sanitized.replace(/<[^>]+>/g, ' ');
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  // Truncate
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength) + '...';
  }
  return sanitized;
}

// Ensure every finding has exploitScenario and confidence
function ensureExploitScenarios(findings: ScanFinding[], locale: Locale = 'en'): void {
  for (const finding of findings) {
    if (!finding.exploitScenario || finding.exploitScenario.trim() === '') {
      if (finding.impact && finding.impact.trim() !== '') {
        finding.exploitScenario = finding.impact;
      } else {
        finding.exploitScenario = generateExploitScenario(finding, locale);
      }
    }
    // Fill confidence if not already set by analyzer
    if (!finding.confidence) {
      (finding as ScanFinding & { confidence: string }).confidence = 'medium';
    }
  }
}

// Derive context flags from scan findings and URL
function deriveContextFlagsFromFindings(findings: ScanFinding[], scannedUrl: string, formCount = 0): ContextFlags {
  const flags: ContextFlags = {
    hasAuthForms: false,
    hasLoginPages: false,
    isHttps: false,
    isStaticSite: false,
    hasDangerousJs: false,
  };

  // Check if URL is HTTPS
  try {
    flags.isHttps = new URL(scannedUrl).protocol === 'https:';
  } catch {
    // ignore
  }

  // Scan findings for auth-related evidence.
  // Only check evidence+details — NOT explanation/impact/exploitScenario which contain
  // boilerplate KB text like "capture login credentials" for every security finding.
  const authIndicators = [
    /password/i,
    /login/i,
    /sign[\s-]*in/i,
    /auth(?:entication|orization)?/i,
    /credential/i,
    /type=["']password["']/i,
    /type=["']email["']/i,
    /autocomplete=["'](?:current-password|username)/i,
  ];

  const dangerousJsIds = new Set(['sec-inline-script-sensitive', 'sec-potential-xss']);

  for (const finding of findings) {
    // Only check actual scan evidence/details — explanation is boilerplate KB text
    const evidence = (finding.evidence || '') + ' ' + (finding.details || '');

    for (const pattern of authIndicators) {
      if (pattern.test(evidence)) {
        flags.hasAuthForms = true;
        break;
      }
    }

    if (dangerousJsIds.has(finding.id) || (finding.evidence && /eval\(|innerHTML|document\.write/i.test(finding.evidence))) {
      flags.hasDangerousJs = true;
    }

    // Check source page URLs for login-related paths
    if (finding.sourcePage) {
      try {
        const pageUrl = new URL(finding.sourcePage);
        const pathLower = pageUrl.pathname.toLowerCase();
        if (/login|signin|auth|sign-in|sign_up|signup|register|account/i.test(pathLower)) {
          flags.hasLoginPages = true;
        }
      } catch {
        // ignore
      }
    }
  }

  // Static site: no forms, no auth forms, no login pages
  flags.isStaticSite = formCount === 0 && !flags.hasAuthForms && !flags.hasLoginPages;

  return flags;
}

// Analyze a single page (headers + DOM + Web3 + JS + Tech + InfoLeakage)
function analyzePage(
  page: { headers: Record<string, string>; setCookies: string[]; body: string; url: string; statusCode: number; contentType: string },
  locale: Locale
): {
  findings: ScanFinding[];
  ethAddresses: string[];
  btcAddresses: string[];
  forms: number;
  inputs: number;
  scripts: string[];
  web3Patterns: any[];
  technologies: TechDetection[];
} {
  const headerFindings = analyzeHeaders({ headers: page.headers, setCookies: page.setCookies }, locale);
  const domResult = analyzeDom({ html: page.body, pageUrl: page.url }, locale);
  const web3Result = detectWeb3(page.body, locale, page.url);
  const jsFindings = analyzeJavaScript({ html: page.body, pageUrl: page.url }, locale);
  const techResult = detectTechStack({ headers: page.headers, body: page.body, url: page.url }, locale);
  const infoLeakageResult = detectInfoLeakage({ body: page.body, url: page.url }, locale);

  // Tag findings with source page
  const allFindings = [
    ...headerFindings,
    ...domResult.findings,
    ...web3Result.findings,
    ...jsFindings,
    ...techResult.findings,
    ...infoLeakageResult.findings,
  ];
  for (const f of allFindings) {
    if (!f.sourcePage) f.sourcePage = page.url;
  }

  return {
    findings: allFindings,
    ethAddresses: web3Result.ethAddresses,
    btcAddresses: web3Result.btcAddresses,
    forms: domResult.meta.forms,
    inputs: domResult.meta.inputs,
    scripts: domResult.meta.scripts,
    web3Patterns: web3Result.patterns,
    technologies: techResult.technologies,
  };
}

export async function performScan(url: string, locale: Locale = 'en', depth: string = 'single'): Promise<ScanResult> {
  const startTime = Date.now();

  if (depth === 'multi') {
    return performMultiPageScan(url, locale);
  }

  // Single page scan
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s — enough for any live site

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeout);

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const setCookies: string[] = [];
    try {
      const cookieHeaders = response.headers.getSetCookie?.() || [];
      cookieHeaders.forEach((c: string) => setCookies.push(c));
    } catch {
      // no cookies
    }

    const rawBody = await response.text();
    const body = rawBody.slice(0, 500000); // Cap at 500KB (same as crawler)
    const statusCode = response.status;
    const contentType = response.headers.get('content-type') || 'unknown';

    // Detect WAF/CDN challenge or block pages — skip DOM analysis to avoid false positives
    const cfRayPresent = response.headers.get('cf-ray') !== null;
    const wafChallengeHeader = response.headers.get('x-amzn-waf-action') === 'challenge'
      || response.headers.get('x-amzn-waf-action') === 'block'
      || response.headers.get('cf-mitigated') !== null;
    const isChallengePage = wafChallengeHeader
      || (statusCode === 403 && cfRayPresent)  // Cloudflare 403 = challenge/block page
      || (statusCode === 403 && (
        body.includes('cf-mitigated') ||
        body.includes('challenge-platform') ||
        body.includes('Just a moment') ||
        body.includes('Checking your browser') ||
        body.length < 10000
      )) || (statusCode === 202 && wafChallengeHeader);

    // Run all analyzers (page analysis + path probing in parallel)
    const [pageResult, pathProbeResult] = await Promise.all([
      Promise.resolve(analyzePage({ headers, setCookies, body, url, statusCode, contentType }, locale)),
      probeSensitivePaths(url, locale),
    ]);

    // Combine and deduplicate findings
    let allFindings = [...pageResult.findings, ...pathProbeResult.findings];

    // If blocked by WAF/challenge, discard ALL findings — they reflect the challenge page,
    // not the real site. Only the info-waf-blocked notice is added below.
    if (isChallengePage) {
      allFindings = [];
      // Add informational finding about the block
      const blockMessages: Record<string, string> = {
        en: 'The target site returned HTTP 403 (blocked by WAF/CDN). Security header analysis is based on the block page, not the actual site content. Consider using a headless browser for a more thorough scan.',
        uk: 'Цільовий сайт повернув HTTP 403 (заблоковано WAF/CDN). Аналіз заголовків безпеки базується на сторінці блокування, а не на реальному вмісті сайту. Для глибшого сканування рекомендується використовувати headless-браузер.',
        ru: 'Целевой сайт вернул HTTP 403 (заблокирован WAF/CDN). Анализ заголовков безопасности основан на странице блокировки, а не на реальном содержимом сайта. Для более глубокого сканирования рекомендуется использовать headless-браузер.',
      };
      const wafBlockTitles: Record<string, string> = {
        en: 'Access restricted (WAF/CDN)',
        uk: 'Доступ до сайту обмежений (WAF/CDN)',
        ru: 'Доступ к сайту ограничен (WAF/CDN)',
      };
      const wafBlockEvidence: Record<string, string> = {
        en: `HTTP ${statusCode} — WAF/CDN challenge detected (x-amzn-waf-action / cf-mitigated / challenge page)`,
        uk: `HTTP ${statusCode} — виявлено WAF/CDN-challenge (x-amzn-waf-action / cf-mitigated / challenge-сторінка)`,
        ru: `HTTP ${statusCode} — обнаружен WAF/CDN-challenge (x-amzn-waf-action / cf-mitigated / challenge-страница)`,
      };
      allFindings.push({
        id: 'info-waf-blocked',
        title: wafBlockTitles[locale] || wafBlockTitles.en,
        category: 'security' as const,
        severity: 'info' as const,
        explanation: blockMessages[locale] || blockMessages.en,
        howToFix: '',
        impact: '',
        exploitScenario: '',
        evidence: wafBlockEvidence[locale] || wafBlockEvidence.en,
        details: blockMessages[locale] || blockMessages.en,
        sourcePage: url,
        references: [],
      });
    }

    const seen = new Set<string>();
    const dedupedFindings: ScanFinding[] = [];
    for (const f of allFindings) {
      const dedupKey = `${f.id}-${f.sourcePage || 'main'}`;
      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        dedupedFindings.push(f);
      }
    }

    // Add web3 pattern findings
    for (const pattern of pageResult.web3Patterns) {
      dedupedFindings.push({
        id: `crypto-pattern-${pattern.type}`,
        title: pattern.description,
        category: 'crypto' as const,
        severity: pattern.severity,
        explanation: pattern.details,
        howToFix: '',
        impact: '',
        exploitScenario: pattern.details,
        evidence: pattern.description,
        details: pattern.details,
        sourcePage: pattern.page || url,
        references: [],
      });
    }

    // Ensure every finding has an exploit scenario
    ensureExploitScenarios(dedupedFindings, locale);

    // Derive context flags from findings and URL
    const contextFlags = deriveContextFlagsFromFindings(dedupedFindings, url, pageResult.forms);

    // Run smart risk engine with context flags
    const riskResult = analyzeRisk(dedupedFindings, locale, contextFlags, url);
    const adjustedFindings = riskResult.adjusted;
    const riskScore = riskResult.score;
    const riskAdjustments = riskResult.adjustments;

    // Ensure exploit scenarios are still present after risk adjustments
    ensureExploitScenarios(adjustedFindings, locale);

    // Apply OWASP mapping
    applyOwaspMapping(adjustedFindings);

    // Re-calculate summary after risk adjustments
    const summary = calculateSummary(adjustedFindings);

    const duration = Date.now() - startTime;

    return {
      url,
      timestamp: new Date().toISOString(),
      duration,
      riskScore,
      findings: adjustedFindings,
      riskAdjustments,
      summary,
      meta: {
        statusCode,
        contentType,
        headers,
        cookies: setCookies,
        web3Addresses: [
          ...pageResult.ethAddresses.map((a) => ({ type: 'ETH' as const, address: a })),
          ...pageResult.btcAddresses.map((a) => ({ type: 'BTC' as const, address: a })),
        ],
        forms: pageResult.forms,
        inputs: pageResult.inputs,
        scripts: pageResult.scripts,
        technologies: pageResult.technologies,
      },
    };
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function performMultiPageScan(startUrl: string, locale: Locale): Promise<ScanResult> {
  const startTime = Date.now();

  // Crawl the domain and run path probing in parallel
  const [{ pages, stats }, pathProbeResult] = await Promise.all([
    crawlDomain(startUrl, 10),
    probeSensitivePaths(startUrl, locale),
  ]);

  if (pages.length === 0) {
    // Fallback to single page scan
    return performScan(startUrl, locale, 'single');
  }

  // Analyze each page
  const allFindings: ScanFinding[] = [...pathProbeResult.findings];
  const allEthAddresses: string[] = [];
  const allBtcAddresses: string[] = [];
  const allWeb3Patterns: any[] = [];
  const allTechnologies: TechDetection[] = [];
  let totalForms = 0;
  let totalInputs = 0;
  const allScripts: string[] = [];
  let mainHeaders: Record<string, string> = {};
  let mainCookies: string[] = [];
  let mainStatusCode = 200;
  let mainContentType = '';

  const pageResults: Array<{ url: string; ethAddresses: string[]; btcAddresses: string[] }> = [];

  for (const page of pages) {
    const result = analyzePage(page, locale);

    allFindings.push(...result.findings);
    allEthAddresses.push(...result.ethAddresses);
    allBtcAddresses.push(...result.btcAddresses);
    allWeb3Patterns.push(...result.web3Patterns);
    totalForms += result.forms;
    totalInputs += result.inputs;
    allScripts.push(...result.scripts);
    allTechnologies.push(...result.technologies);

    pageResults.push({
      url: page.url,
      ethAddresses: result.ethAddresses,
      btcAddresses: result.btcAddresses,
    });

    // Keep main page data
    if (page.url === pages[0].url || page.url === startUrl) {
      mainHeaders = page.headers;
      mainCookies = page.setCookies;
      mainStatusCode = page.statusCode;
      mainContentType = page.contentType;
    }
  }

  // Detect address reuse across pages
  const reuseFindings = detectAddressReuse(pageResults, locale);
  allFindings.push(...reuseFindings);

  // Add web3 pattern findings
  for (const pattern of allWeb3Patterns) {
    allFindings.push({
      id: `crypto-pattern-${pattern.type}`,
      title: pattern.description,
      category: 'crypto' as const,
      severity: pattern.severity,
      explanation: pattern.details,
      howToFix: '',
      impact: '',
      exploitScenario: pattern.details,
      evidence: pattern.description,
      details: pattern.details,
      sourcePage: pattern.page,
      references: [],
    });
  }

  // Deduplicate: one finding per (id + page) — allows same finding on different pages
  const seen = new Set<string>();
  const dedupedFindings: ScanFinding[] = [];
  for (const f of allFindings) {
    const dedupKey = `${f.id}-${f.sourcePage || 'main'}`;
    if (!seen.has(dedupKey)) {
      seen.add(dedupKey);
      dedupedFindings.push(f);
    }
  }

  // Ensure every finding has an exploit scenario
  ensureExploitScenarios(dedupedFindings, locale);

  // Derive context flags from findings and URL
  const contextFlags = deriveContextFlagsFromFindings(dedupedFindings, startUrl);

  // Run smart risk engine with context flags
  const riskResult = analyzeRisk(dedupedFindings, locale, contextFlags, startUrl);
  const adjustedFindings = riskResult.adjusted;
  const riskScore = riskResult.score;
  const riskAdjustments = riskResult.adjustments;

  // Ensure exploit scenarios are still present after risk adjustments
  ensureExploitScenarios(adjustedFindings, locale);

  // Apply OWASP mapping
  applyOwaspMapping(adjustedFindings);

  const summary = calculateSummary(adjustedFindings);
  const duration = Date.now() - startTime;

  // Unique web3 addresses
  const uniqueEth = [...new Set(allEthAddresses)];
  const uniqueBtc = [...new Set(allBtcAddresses)];

  const crawlStats: CrawlStats = {
    pagesAttempted: stats.pagesAttempted,
    pagesScanned: stats.pagesScanned,
    pagesFailed: stats.pagesFailed,
    depth: stats.depth,
    urls: stats.urls,
  };

  return {
    url: startUrl,
    timestamp: new Date().toISOString(),
    duration,
    riskScore,
    findings: adjustedFindings,
    riskAdjustments,
    summary,
    meta: {
      statusCode: mainStatusCode,
      contentType: mainContentType,
      headers: mainHeaders,
      cookies: mainCookies,
      web3Addresses: [
        ...uniqueEth.map((a) => ({ type: 'ETH' as const, address: a, pages: pageResults.filter((p) => p.ethAddresses.map((e) => e.toLowerCase()).includes(a.toLowerCase())).map((p) => p.url) })),
        ...uniqueBtc.map((a) => ({ type: 'BTC' as const, address: a, pages: pageResults.filter((p) => p.btcAddresses.includes(a)).map((p) => p.url) })),
      ],
      forms: totalForms,
      inputs: totalInputs,
      scripts: [...new Set(allScripts)],
      technologies: deduplicateTechnologies(allTechnologies),
    },
    crawl: crawlStats,
  };
}

function calculateSummary(findings: ScanFinding[]) {
  const byOwasp = getOwaspSummary(findings);
  return {
    total: findings.length,
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
    info: findings.filter((f) => f.severity === 'info').length,
    byCategory: {
      security: findings.filter((f) => f.category === 'security').length,
      'data-exposure': findings.filter((f) => f.category === 'data-exposure').length,
      crypto: findings.filter((f) => f.category === 'crypto').length,
    },
    byOwasp,
  };
}

function deduplicateTechnologies(techs: TechDetection[]): TechDetection[] {
  const seen = new Set<string>();
  const result: TechDetection[] = [];
  for (const tech of techs) {
    const key = `${tech.category}:${tech.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tech);
    }
  }
  return result;
}
