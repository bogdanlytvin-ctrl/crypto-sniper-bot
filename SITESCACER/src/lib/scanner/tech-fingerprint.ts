import type { ScanFinding } from './types';
import type { Locale } from '@/lib/i18n/translations';
import {
  INFO_TECH_DISCLOSURE,
  entryToFinding,
} from './knowledge-base';

// ---- Types ----

export interface TechDetection {
  category: 'server' | 'framework' | 'cms' | 'cdn' | 'library' | 'analytics' | 'language';
  name: string;
  version?: string;
  evidence: string;
}

export interface TechFingerprintResult {
  technologies: TechDetection[];
  findings: ScanFinding[];
}

// ---- Helpers ----

function getHeader(headers: Record<string, string>, name: string): string | undefined {
  // Case-insensitive header lookup
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) return value;
  }
  return undefined;
}

function extractVersion(value: string, name: string): string | undefined {
  // Try to find version number after the name
  const patterns = [
    new RegExp(`${escapeRegex(name)}\\s*/\\s*([\\d.]+)`, 'i'),
    new RegExp(`${escapeRegex(name)}\\s+v?([\\d.]+)`, 'i'),
    new RegExp(`([\\d]+(?:\\.[\\d]+){1,3})`),
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return undefined;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---- Server detection from HTTP headers ----

function detectServerFromHeaders(headers: Record<string, string>): TechDetection[] {
  const results: TechDetection[] = [];

  // Server header
  const serverHeader = getHeader(headers, 'Server');
  if (serverHeader) {
    const serverPatterns: Array<{ name: string; pattern: RegExp }> = [
      { name: 'nginx', pattern: /nginx/i },
      { name: 'Apache', pattern: /apache/i },
      { name: 'IIS', pattern: /iis|internet information services/i },
      { name: 'LiteSpeed', pattern: /litespeed/i },
      { name: 'Caddy', pattern: /caddy/i },
      { name: 'Tomcat', pattern: /tomcat|coyote/i },
      { name: 'Jetty', pattern: /jetty/i },
      { name: 'OpenResty', pattern: /openresty/i },
      { name: 'Cloudflare', pattern: /cloudflare/i },
      { name: 'Varnish', pattern: /varnish/i },
      { name: 'Tengine', pattern: /tengine/i },
      { name: 'Express', pattern: /express/i },
    ];

    for (const sp of serverPatterns) {
      if (sp.pattern.test(serverHeader)) {
        results.push({
          category: 'server',
          name: sp.name,
          version: extractVersion(serverHeader, sp.name),
          evidence: `Server: ${serverHeader}`,
        });
        break;
      }
    }
  }

  // X-Powered-By header
  const poweredBy = getHeader(headers, 'X-Powered-By');
  if (poweredBy) {
    const poweredPatterns: Array<{ name: string; pattern: RegExp; category: TechDetection['category'] }> = [
      { name: 'Express', pattern: /express/i, category: 'framework' },
      { name: 'PHP', pattern: /php/i, category: 'language' },
      { name: 'ASP.NET', pattern: /asp\.net/i, category: 'framework' },
      { name: 'Next.js', pattern: /next/i, category: 'framework' },
      { name: 'Nuxt', pattern: /nuxt/i, category: 'framework' },
      { name: 'Remix', pattern: /remix/i, category: 'framework' },
      { name: 'SvelteKit', pattern: /sveltekit/i, category: 'framework' },
      { name: 'Hapi', pattern: /hapi/i, category: 'framework' },
      { name: 'Koa', pattern: /koa/i, category: 'framework' },
      { name: 'Fastify', pattern: /fastify/i, category: 'framework' },
      { name: 'Django', pattern: /django/i, category: 'framework' },
      { name: 'Ruby on Rails', pattern: /rails/i, category: 'framework' },
      { name: 'Laravel', pattern: /laravel/i, category: 'framework' },
    ];

    for (const pp of poweredPatterns) {
      if (pp.pattern.test(poweredBy)) {
        results.push({
          category: pp.category,
          name: pp.name,
          version: extractVersion(poweredBy, pp.name),
          evidence: `X-Powered-By: ${poweredBy}`,
        });
      }
    }
  }

  // X-AspNet-Version
  const aspNetVersion = getHeader(headers, 'X-AspNet-Version') || getHeader(headers, 'X-AspNetMvc-Version');
  if (aspNetVersion) {
    results.push({
      category: 'framework',
      name: 'ASP.NET',
      version: aspNetVersion,
      evidence: `X-AspNet-Version: ${aspNetVersion}`,
    });
  }

  // X-Runtime (often set by Puma, Passenger, etc.)
  const xRuntime = getHeader(headers, 'X-Runtime');
  if (xRuntime) {
    results.push({
      category: 'server',
      name: xRuntime,
      evidence: `X-Runtime: ${xRuntime}`,
    });
  }

  // Via header (proxy/cache detection)
  const via = getHeader(headers, 'Via');
  if (via) {
    const viaPatterns: Array<{ name: string; pattern: RegExp; category: TechDetection['category'] }> = [
      { name: 'Varnish', pattern: /varnish/i, category: 'cdn' },
      { name: 'Squid', pattern: /squid/i, category: 'cdn' },
      { name: 'Cloudflare', pattern: /cloudflare/i, category: 'cdn' },
      { name: 'Fastly', pattern: /fastly/i, category: 'cdn' },
    ];
    for (const vp of viaPatterns) {
      if (vp.pattern.test(via)) {
        results.push({
          category: vp.category,
          name: vp.name,
          evidence: `Via: ${via}`,
        });
      }
    }
  }

  // X-Cache header
  const xCache = getHeader(headers, 'X-Cache') || getHeader(headers, 'X-Cache-Status');
  if (xCache) {
    const cachePatterns: Array<{ name: string; pattern: RegExp }> = [
      { name: 'Cloudflare', pattern: /cf-cache|hitlet|cloudflare/i },
      { name: 'Fastly', pattern: /fastly/i },
      { name: 'Varnish', pattern: /varnish/i },
      { name: 'AWS CloudFront', pattern: /cloudfront/i },
    ];
    for (const cp of cachePatterns) {
      if (cp.pattern.test(xCache)) {
        results.push({
          category: 'cdn',
          name: cp.name,
          evidence: `X-Cache: ${xCache}`,
        });
        break;
      }
    }
  }

  return results;
}

// ---- Framework / CMS detection from HTML ----

function detectTechFromHtml(html: string, pageUrl: string): TechDetection[] {
  const results: TechDetection[] = [];

  // Generator meta tag (CMS detection)
  const generatorMatch = html.match(/<meta\s+[^>]*name\s*=\s*["']generator["'][^>]*content\s*=\s*["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta\s+[^>]*content\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["']generator["'][^>]*>/i);

  if (generatorMatch) {
    const content = generatorMatch[1];
    const cmsPatterns: Array<{ name: string; pattern: RegExp }> = [
      { name: 'WordPress', pattern: /wordpress/i },
      { name: 'Drupal', pattern: /drupal/i },
      { name: 'Joomla', pattern: /joomla/i },
      { name: 'Wix', pattern: /wix\.com/i },
      { name: 'Squarespace', pattern: /squarespace/i },
      { name: 'Shopify', pattern: /shopify/i },
      { name: 'Ghost', pattern: /ghost/i },
      { name: 'Hugo', pattern: /hugo/i },
      { name: 'Jekyll', pattern: /jekyll/i },
      { name: 'Gatsby', pattern: /gatsby/i },
      { name: 'Hexo', pattern: /hexo/i },
      { name: 'Typo3', pattern: /typo3/i },
      { name: 'Bitrix', pattern: /bitrix/i },
      { name: '1C-Bitrix', pattern: /1c-bitrix/i },
      { name: 'MODX', pattern: /modx/i },
      { name: 'CMS Made Simple', pattern: /cms\s*made\s*simple/i },
    ];

    for (const cms of cmsPatterns) {
      if (cms.pattern.test(content)) {
        results.push({
          category: 'cms',
          name: cms.name,
          evidence: `<meta name="generator" content="${content}">`,
        });
        break;
      }
    }
  }

  // Framework detection from script/link patterns
  const scriptPatterns: Array<{ name: string; pattern: RegExp; category: TechDetection['category'] }> = [
    // React
    { name: 'React', pattern: /react(?:\.production)?\.min\.js|react-dom|__NEXT_DATA__|data-reactroot/i, category: 'framework' },
    { name: 'React', pattern: /<div\s+id=["']root["']|<div\s+id=["']__next["']/i, category: 'framework' },
    // Next.js
    { name: 'Next.js', pattern: /__NEXT_DATA__|_next\/static|next\.router/i, category: 'framework' },
    // Vue
    { name: 'Vue.js', pattern: /vue(?:\.\d+)?\.min\.js|v-bind|v-if|v-for|__vue__/i, category: 'framework' },
    { name: 'Nuxt.js', pattern: /__NUXT__|_nuxt\//i, category: 'framework' },
    // Angular
    { name: 'Angular', pattern: /ng-version|angular\.min\.js|ng-app/i, category: 'framework' },
    // Svelte
    { name: 'Svelte', pattern: /svelte(?:\.\d+)?\.js|__svelte/i, category: 'framework' },
    // jQuery
    { name: 'jQuery', pattern: /jquery(?:[-.]?\d+)?\.min\.js|jquery\.js/i, category: 'library' },
    // Bootstrap
    { name: 'Bootstrap', pattern: /bootstrap(?:\.\d+)?\.min\.(?:css|js)/i, category: 'library' },
    { name: 'Bootstrap', pattern: /bootstrap\.min\.css/i, category: 'library' },
    // Tailwind
    { name: 'Tailwind CSS', pattern: /tailwind(?:css)?(?:\.\d+)?\.min\.css|tailwind\.css/i, category: 'library' },
    // Tailwind heuristic: require numbered responsive/spacing classes (e.g. px-4, py-2, text-sm,
    // gap-4, w-full, h-full, max-w-) that are Tailwind-specific and not used by other CSS frameworks.
    { name: 'Tailwind CSS', pattern: /class="[^"]*(?:px-\d|py-\d|text-(?:xs|sm|base|lg|xl|2xl)|gap-\d|max-w-|min-h-|w-full|h-full|flex-col|items-center|justify-between)[^"]*"/i, category: 'library' },
    // Font Awesome
    { name: 'Font Awesome', pattern: /font-awesome|fontawesome/i, category: 'library' },
    // GSAP
    { name: 'GSAP', pattern: /gsap(?:\.\d+)?\.min\.js|greensock/i, category: 'library' },
    // D3.js
    { name: 'D3.js', pattern: /d3(?:\.v\d+)?\.min\.js|d3\.js/i, category: 'library' },
    // Chart.js
    { name: 'Chart.js', pattern: /chart(?:\.js|\.min\.js)/i, category: 'library' },
    // Three.js
    { name: 'Three.js', pattern: /three(?:\.module)?\.min\.js/i, category: 'library' },
    // Axios
    { name: 'Axios', pattern: /axios(?:\.\d+)?\.min\.js/i, category: 'library' },
    // Lodash
    { name: 'Lodash', pattern: /lodash(?:\.\d+|-core)?\.min\.js/i, category: 'library' },
    // Moment.js
    { name: 'Moment.js', pattern: /moment(?:\.\d+)?\.min\.js/i, category: 'library' },
  ];

  for (const sp of scriptPatterns) {
    if (sp.pattern.test(html)) {
      // Avoid duplicate detections
      if (!results.some((r) => r.name === sp.name)) {
        results.push({
          category: sp.category,
          name: sp.name,
          evidence: `Detected from script/CSS pattern: ${sp.pattern.source}`,
        });
      }
    }
  }

  // Analytics detection
  const analyticsPatterns: Array<{ name: string; pattern: RegExp }> = [
    { name: 'Google Analytics', pattern: /google-analytics\.com|gtag|ga\(['"]create/i },
    { name: 'Google Tag Manager', pattern: /googletagmanager\.com\/gtm/i },
    { name: 'Google Ads', pattern: /googleads(?:ervices)?\.com|googlesyndication/i },
    { name: 'Facebook Pixel', pattern: /connect\.facebook\.net.*fbevents/i },
    { name: 'Hotjar', pattern: /static\.hotjar\.com/i },
    { name: 'Yandex.Metrica', pattern: /mc\.yandex\.ru|yandex\.ru\/metrika/i },
    { name: 'Plausible', pattern: /plausible\.io/i },
    { name: 'Matomo', pattern: /matomo\.(?:js|php)|piwik/i },
    { name: 'Segment', pattern: /cdn\.segment\.com/i },
    { name: 'Amplitude', pattern: /amplitude\.com/i },
  ];

  for (const ap of analyticsPatterns) {
    if (ap.pattern.test(html)) {
      results.push({
        category: 'analytics',
        name: ap.name,
        evidence: `Detected analytics: ${ap.name}`,
      });
    }
  }

  return results;
}

// ---- CDN/Hosting detection ----

function detectCdnFromHeadersAndUrl(headers: Record<string, string>, pageUrl: string): TechDetection[] {
  const results: TechDetection[] = [];

  // Check CF-RAY (Cloudflare)
  const cfRay = getHeader(headers, 'CF-RAY');
  if (cfRay) {
    results.push({
      category: 'cdn',
      name: 'Cloudflare',
      evidence: `CF-RAY: ${cfRay}`,
    });
  }

  // Check X-Amz-Cf-Id (AWS CloudFront)
  const amzCf = getHeader(headers, 'X-Amz-Cf-Id');
  if (amzCf) {
    results.push({
      category: 'cdn',
      name: 'AWS CloudFront',
      evidence: `X-Amz-Cf-Id: ${amzCf}`,
    });
  }

  // Check X-Fastly-Request-ID
  const fastlyId = getHeader(headers, 'X-Fastly-Request-ID');
  if (fastlyId) {
    results.push({
      category: 'cdn',
      name: 'Fastly',
      evidence: `X-Fastly-Request-ID: ${fastlyId}`,
    });
  }

  // Check hosting from URL patterns
  try {
    const hostname = new URL(pageUrl).hostname;
    if (hostname.endsWith('.vercel.app') || hostname.endsWith('.vercel-dns.com')) {
      results.push({ category: 'cdn', name: 'Vercel', evidence: `Hostname: ${hostname}` });
    } else if (hostname.endsWith('.netlify.app') || hostname.endsWith('.netlify.com')) {
      results.push({ category: 'cdn', name: 'Netlify', evidence: `Hostname: ${hostname}` });
    } else if (hostname.endsWith('.herokuapp.com')) {
      results.push({ category: 'cdn', name: 'Heroku', evidence: `Hostname: ${hostname}` });
    } else if (hostname.endsWith('.github.io')) {
      results.push({ category: 'cdn', name: 'GitHub Pages', evidence: `Hostname: ${hostname}` });
    } else if (hostname.endsWith('.cloudwaysapps.com')) {
      results.push({ category: 'cdn', name: 'Cloudways', evidence: `Hostname: ${hostname}` });
    } else if (hostname.endsWith('.onrender.com')) {
      results.push({ category: 'cdn', name: 'Render', evidence: `Hostname: ${hostname}` });
    } else if (hostname.endsWith('.pages.dev')) {
      results.push({ category: 'cdn', name: 'Cloudflare Pages', evidence: `Hostname: ${hostname}` });
    }
  } catch {
    // Invalid URL, skip
  }

  // Check X-Served-By
  const servedBy = getHeader(headers, 'X-Served-By');
  if (servedBy) {
    if (/cache-/.test(servedBy) || /cdn/i.test(servedBy)) {
      results.push({
        category: 'cdn',
        name: 'CDN',
        evidence: `X-Served-By: ${servedBy}`,
      });
    }
  }

  return results;
}

// ---- Language detection from headers ----

function detectLanguageFromHeaders(headers: Record<string, string>): TechDetection[] {
  const results: TechDetection[] = [];

  // X-Powered-By language indicators already handled in detectServerFromHeaders
  // Additional language detection
  const poweredBy = getHeader(headers, 'X-Powered-By');
  if (poweredBy) {
    const langPatterns: Array<{ name: string; pattern: RegExp }> = [
      { name: 'PHP', pattern: /php/i },
      { name: 'Python', pattern: /python|wsgi|gunicorn|uvicorn/i },
      { name: 'Ruby', pattern: /ruby|puma|passenger/i },
      { name: 'Java', pattern: /java|jetty|tomcat/i },
      { name: 'Go', pattern: /go$/i },
      { name: 'Node.js', pattern: /node|express/i },
      { name: 'Rust', pattern: /rust|actix/i },
    ];
    for (const lp of langPatterns) {
      if (lp.pattern.test(poweredBy) && !results.some((r) => r.name === lp.name)) {
        results.push({
          category: 'language',
          name: lp.name,
          evidence: `X-Powered-By: ${poweredBy}`,
        });
      }
    }
  }

  return results;
}

// ---- Main detection function ----

export function detectTechStack(
  page: { headers: Record<string, string>; body: string; url: string },
  locale: Locale = 'en',
): TechFingerprintResult {
  const technologies: TechDetection[] = [];
  const findings: ScanFinding[] = [];

  // Run all detection phases
  const serverDetections = detectServerFromHeaders(page.headers);
  const htmlDetections = detectTechFromHtml(page.body, page.url);
  const cdnDetections = detectCdnFromHeadersAndUrl(page.headers, page.url);
  const languageDetections = detectLanguageFromHeaders(page.headers);

  // Combine and deduplicate: CDN detections take priority over server for same-named providers
  // (e.g. Cloudflare detected via CF-RAY header wins over Server: cloudflare)
  const allDetections = [
    ...cdnDetections,       // CDN first — preferred category for CDN providers
    ...serverDetections,
    ...htmlDetections,
    ...languageDetections,
  ];
  const seenByName = new Set<string>();
  for (const det of allDetections) {
    if (!seenByName.has(det.name)) {
      seenByName.add(det.name);
      technologies.push(det);
    }
  }

  // If any technologies were detected, create a finding for tech disclosure
  if (technologies.length > 0) {
    const techNames = technologies.map((t) => `${t.name}${t.version ? ` ${t.version}` : ''}`).join(', ');
    const evidence = technologies.map((t) => t.evidence).join('; ').slice(0, 500);

    findings.push(
      entryToFinding(INFO_TECH_DISCLOSURE, { evidence, details: `Detected technologies: ${techNames}` }, locale),
    );
  }

  return { technologies, findings };
}
