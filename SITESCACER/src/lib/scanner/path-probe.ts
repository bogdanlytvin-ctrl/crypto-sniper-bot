import type { ScanFinding } from './types';
import type { Locale } from '@/lib/i18n/translations';
import {
  SENSITIVE_PATH_EXPOSED,
  HTTP_TRACE_ENABLED,
  ROBOTS_SENSITIVE_PATHS,
  HTTP_NO_HTTPS_REDIRECT,
  entryToFinding,
} from './knowledge-base';

export interface PathProbeResult {
  findings: ScanFinding[];
  traceEnabled: boolean;
  exposedPaths: string[];
  httpsRedirect: boolean;
  securityTxtPresent: boolean;
}

// Sensitive paths to probe — highest-value only, ordered by severity
const SENSITIVE_PATHS = [
  // Environment / config files (critical — immediate credential exposure)
  { path: '/.env', description: '.env config file', critical: true },
  { path: '/.env.local', description: '.env.local config', critical: true },
  { path: '/.env.production', description: '.env.production config', critical: true },
  // Git exposure (critical — full source code leak)
  { path: '/.git/HEAD', description: '.git/HEAD (git repository exposed)', critical: true },
  { path: '/.git/config', description: '.git/config (git config exposed)', critical: true },
  // Database dumps (critical)
  { path: '/backup.sql', description: 'backup.sql database dump', critical: true },
  { path: '/dump.sql', description: 'dump.sql database dump', critical: true },
  { path: '/backup.zip', description: 'backup.zip archive', critical: true },
  // WordPress config backup (critical)
  { path: '/wp-config.php.bak', description: 'wp-config.php.bak (WordPress config backup)', critical: true },
  // PHP info pages (high — server config disclosure)
  { path: '/phpinfo.php', description: 'phpinfo.php page', critical: false },
  { path: '/info.php', description: 'info.php page', critical: false },
  // Admin panels (medium)
  { path: '/phpmyadmin', description: 'phpMyAdmin', critical: false },
  { path: '/phpmyadmin/', description: 'phpMyAdmin/', critical: false },
  // Debug logs (medium — may contain stack traces / credentials)
  { path: '/debug.log', description: 'debug.log file', critical: false },
  { path: '/storage/logs/laravel.log', description: 'Laravel storage log', critical: false },
];

const PROBE_TIMEOUT = 2000;  // 2s per request — fast enough for any live server
const MAX_CONCURRENT = 12;   // 12 parallel — all 15 paths in 2 batches max

async function probeOnePath(
  baseUrl: string,
  path: string,
): Promise<{ accessible: boolean; statusCode: number; snippet?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT);

  try {
    const u = new URL(path, baseUrl);
    const response = await fetch(u.toString(), {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SecureScope-PathProbe/1.0)',
        Accept: 'text/html,text/plain,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    // 200/206 = accessible; 403 might still reveal existence but we skip it
    if (response.status === 200 || response.status === 206) {
      let snippet = '';
      try {
        const text = await response.text();
        // Check content makes sense (not just a 200 soft-404 or React SPA fallback)
        const ct = response.headers.get('content-type') || '';
        if (ct.includes('text/html') && /<html/i.test(text) && /index\.html|react|<!DOCTYPE/i.test(text)) {
          // Likely a SPA 200 fallback — not really the file
          return { accessible: false, statusCode: response.status };
        }
        snippet = text.slice(0, 200).trim();
        // For .env files, must look like actual env content (case-insensitive: db_host= or DB_HOST=)
        if (path.includes('.env') && !snippet.match(/[A-Za-z_]+=.+/)) {
          return { accessible: false, statusCode: response.status };
        }
        // For .git/HEAD, must start with "ref:" or a SHA
        if (path.includes('.git/HEAD') && !snippet.match(/^ref:|^[a-f0-9]{40}/)) {
          return { accessible: false, statusCode: response.status };
        }
        // For SQL files, must look like SQL
        if (path.match(/\.(sql)$/) && !snippet.match(/CREATE|INSERT|DROP|--/i)) {
          return { accessible: false, statusCode: response.status };
        }
      } catch {
        // body read failed
      }
      return { accessible: true, statusCode: response.status, snippet };
    }
    return { accessible: false, statusCode: response.status };
  } catch {
    clearTimeout(timeout);
    return { accessible: false, statusCode: 0 };
  }
}

// Sensitive Disallow paths that indicate exposed internals when in robots.txt
const ROBOTS_SENSITIVE_PATTERNS = [
  /Disallow:\s*\/(admin|administrator|phpmyadmin|wp-admin|wp-login|wp-config)/i,
  /Disallow:\s*\/(?:\.env|\.git|backup|dump|debug|config|secret|private|internal|staging|dev)/i,
  /Disallow:\s*\/(?:api\/internal|api\/admin|internal\/|private\/|secret\/)/i,
  /Disallow:\s*\/(?:database|db\/|sql\/)/i,
  /Disallow:\s*\/(?:logs?\/|error\.log|debug\.log|laravel\.log)/i,
];

async function probeRobotsTxt(
  baseUrl: string,
): Promise<{ paths: string[]; raw?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
  try {
    const u = new URL('/robots.txt', baseUrl);
    const response = await fetch(u.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SecureScope/1.0)' },
    });
    clearTimeout(timeout);
    if (response.status !== 200) return { paths: [] };
    const text = await response.text();
    const sensitivePaths: string[] = [];
    for (const pattern of ROBOTS_SENSITIVE_PATTERNS) {
      const lines = text.split('\n');
      for (const line of lines) {
        if (pattern.test(line)) {
          const pathMatch = line.match(/Disallow:\s*(\S+)/i);
          if (pathMatch && !sensitivePaths.includes(pathMatch[1])) {
            sensitivePaths.push(pathMatch[1]);
          }
        }
      }
    }
    return { paths: sensitivePaths, raw: text.slice(0, 500) };
  } catch {
    clearTimeout(timeout);
    return { paths: [] };
  }
}

async function checkSecurityTxt(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
  try {
    const u = new URL('/.well-known/security.txt', baseUrl);
    const response = await fetch(u.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SecureScope/1.0)' },
    });
    clearTimeout(timeout);
    if (response.status !== 200) return false;
    const text = await response.text();
    // Must contain at least a Contact field to be a valid security.txt
    return /^Contact:\s+\S+/im.test(text);
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

async function checkHttpsRedirect(baseUrl: string): Promise<boolean> {
  // Only relevant if the target is HTTPS — check if http:// redirects to https://
  try {
    const u = new URL(baseUrl);
    if (u.protocol !== 'https:') return true; // not applicable
    const httpUrl = `http://${u.host}${u.pathname}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
    const response = await fetch(httpUrl, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SecureScope/1.0)' },
    });
    clearTimeout(timeout);
    if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
      const location = response.headers.get('location') || '';
      return location.startsWith('https://');
    }
    // If no redirect from http → not redirecting to https
    return false;
  } catch {
    // Could not connect on HTTP — likely redirects or port closed; assume OK
    return true;
  }
}

async function probeTrace(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
  try {
    const response = await fetch(baseUrl, {
      method: 'TRACE',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'SecureScope-TraceCheck/1.0' },
    });
    clearTimeout(timeout);
    return response.status === 200;
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

export async function probeSensitivePaths(
  baseUrl: string,
  locale: Locale = 'en',
): Promise<PathProbeResult> {
  const findings: ScanFinding[] = [];
  const exposedPaths: string[] = [];

  // Run probes in parallel batches
  const results: Array<{ path: typeof SENSITIVE_PATHS[0]; accessible: boolean; snippet?: string }> = [];

  for (let i = 0; i < SENSITIVE_PATHS.length; i += MAX_CONCURRENT) {
    const batch = SENSITIVE_PATHS.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map(async (p) => {
        const res = await probeOnePath(baseUrl, p.path);
        return { path: p, accessible: res.accessible, snippet: res.snippet };
      }),
    );
    results.push(...batchResults);
  }

  // Check TRACE, robots.txt, security.txt, HTTPS redirect in parallel
  const [traceEnabled, robotsResult, httpsRedirect, securityTxtPresent] = await Promise.all([
    probeTrace(baseUrl),
    probeRobotsTxt(baseUrl),
    checkHttpsRedirect(baseUrl),
    checkSecurityTxt(baseUrl),
  ]);

  // Build findings from exposed paths
  const accessiblePaths = results.filter((r) => r.accessible);
  for (const { path: p, snippet } of accessiblePaths) {
    exposedPaths.push(p.path);
    const finding = entryToFinding(SENSITIVE_PATH_EXPOSED, {
      evidence: locale === 'uk'
        ? `Доступний ${p.description}: ${p.path}`
        : locale === 'ru'
        ? `Доступен ${p.description}: ${p.path}`
        : `Accessible ${p.description}: ${p.path}`,
      details: snippet
        ? (locale === 'uk'
          ? `Шлях ${p.path} доступний публічно. Перші 200 символів відповіді: ${snippet}`
          : locale === 'ru'
          ? `Путь ${p.path} доступен публично. Первые 200 символов ответа: ${snippet}`
          : `Path ${p.path} is publicly accessible. First 200 chars of response: ${snippet}`)
        : (locale === 'uk'
          ? `Шлях ${p.path} доступний публічно (HTTP 200). Негайно обмежте доступ.`
          : locale === 'ru'
          ? `Путь ${p.path} доступен публично (HTTP 200). Немедленно ограничьте доступ.`
          : `Path ${p.path} is publicly accessible (HTTP 200). Restrict access immediately.`),
    }, locale);

    if (p.critical) {
      finding.severity = 'critical';
    }

    findings.push(finding);
  }

  // Add TRACE finding if enabled
  if (traceEnabled) {
    findings.push(
      entryToFinding(HTTP_TRACE_ENABLED, {
        evidence: locale === 'uk'
          ? `HTTP TRACE запит повернув 200 OK для ${baseUrl}`
          : locale === 'ru'
          ? `HTTP TRACE запрос вернул 200 OK для ${baseUrl}`
          : `HTTP TRACE request returned 200 OK for ${baseUrl}`,
        details: locale === 'uk'
          ? 'Метод HTTP TRACE активний. Може використовуватися разом з XSS для крадіжки HttpOnly cookie (Cross-Site Tracing).'
          : locale === 'ru'
          ? 'Метод HTTP TRACE активен. Может использоваться совместно с XSS для кражи HttpOnly cookie (Cross-Site Tracing).'
          : 'HTTP TRACE method is active. Can be combined with XSS to steal HttpOnly cookies (Cross-Site Tracing attack).',
      }, locale),
    );
  }

  // Add robots.txt sensitive paths finding
  if (robotsResult.paths.length > 0) {
    const pathList = robotsResult.paths.join(', ');
    findings.push(
      entryToFinding(ROBOTS_SENSITIVE_PATHS, {
        evidence: locale === 'uk'
          ? `robots.txt розкриває ${robotsResult.paths.length} чутливих шляхів`
          : locale === 'ru'
          ? `robots.txt раскрывает ${robotsResult.paths.length} чувствительных путей`
          : `robots.txt discloses ${robotsResult.paths.length} sensitive path(s)`,
        details: locale === 'uk'
          ? `Директиви Disallow в robots.txt розкривають внутрішні шляхи: ${pathList}. Зловмисники використовують robots.txt для виявлення цілей для атаки.`
          : locale === 'ru'
          ? `Директивы Disallow в robots.txt раскрывают внутренние пути: ${pathList}. Злоумышленники используют robots.txt для обнаружения целей для атаки.`
          : `robots.txt Disallow directives expose internal paths: ${pathList}. Attackers routinely check robots.txt to discover attack targets.`,
      }, locale),
    );
  }

  // Add HTTP→HTTPS redirect finding if missing
  if (!httpsRedirect) {
    findings.push(
      entryToFinding(HTTP_NO_HTTPS_REDIRECT, {
        evidence: locale === 'uk'
          ? `HTTP-версія сайту не перенаправляє на HTTPS`
          : locale === 'ru'
          ? `HTTP-версия сайта не перенаправляет на HTTPS`
          : `HTTP version of the site does not redirect to HTTPS`,
        details: locale === 'uk'
          ? 'Запити на http:// не перенаправляються на https://. Користувачі, які вводять URL без "https://", потрапляють на незахищене з\'єднання.'
          : locale === 'ru'
          ? 'Запросы на http:// не перенаправляются на https://. Пользователи, вводящие URL без "https://", попадают на незащищённое соединение.'
          : 'Requests to http:// are not redirected to https://. Users who type the URL without "https://" get an unencrypted connection.',
      }, locale),
    );
  }

  return { findings, traceEnabled, exposedPaths, httpsRedirect, securityTxtPresent };
}
