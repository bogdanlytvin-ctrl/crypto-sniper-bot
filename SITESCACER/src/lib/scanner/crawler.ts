import { validateUrl } from './scanner';
import type { CrawledPage } from './types';

const MAX_PAGES = 10;
const MAX_DEPTH = 2;
const CRAWL_TIMEOUT = 8000; // 8s per page
const CONCURRENCY = 4;      // 4 parallel pages (was 3)

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove fragment
    u.hash = '';
    // Sort query parameters for consistent deduplication
    const params = new URLSearchParams(u.search);
    const sortedParams = new URLSearchParams([...params.entries()].sort());
    u.search = sortedParams.toString() ? `?${sortedParams.toString()}` : '';
    return u.toString();
  } catch {
    return url;
  }
}

async function fetchPage(url: string): Promise<CrawledPage | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CRAWL_TIMEOUT);

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

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null; // skip non-HTML
    }

    const body = await response.text();

    return {
      url,
      body: body.slice(0, 500000), // cap at 500KB per page
      headers,
      setCookies,
      statusCode: response.status,
      contentType,
    };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// Parse robots.txt and return disallowed paths (best-effort)
async function fetchRobotsTxt(baseUrl: string): Promise<Set<string>> {
  const disallowed = new Set<string>();
  try {
    const u = new URL(baseUrl);
    const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SecureScope/1.0)', 'Accept-Language': 'en-US,en;q=0.9' },
    });
    clearTimeout(timeout);

    if (!response.ok) return disallowed;

    const text = await response.text();
    const lines = text.split(/\r?\n/);

    let inRelevantBlock = false;
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      // Check if this is a user-agent directive
      if (trimmed.startsWith('user-agent:')) {
        const agent = trimmed.slice('user-agent:'.length).trim();
        // Apply rules for * (all agents) or our scanner agent
        if (agent === '*' || agent.includes('securescope')) {
          inRelevantBlock = true;
        } else {
          inRelevantBlock = false;
        }
        continue;
      }

      if (!inRelevantBlock) continue;

      // Parse Disallow directives
      if (trimmed.startsWith('disallow:')) {
        const path = trimmed.slice('disallow:'.length).trim();
        if (path && path !== '/') {
          disallowed.add(path);
        } else if (path === '/') {
          // Disallow: / means ALL pages are disallowed
          disallowed.add('/');
          break;
        }
      }
    }
  } catch {
    // robots.txt not available or parse error — continue without restrictions
  }
  return disallowed;
}

// Check if a URL is disallowed by robots.txt rules
function isDisallowedByRobots(url: string, disallowedPaths: Set<string>, baseUrl: string): boolean {
  if (disallowedPaths.size === 0) return false;

  // If Disallow: / was set, block everything
  if (disallowedPaths.has('/')) return true;

  try {
    const u = new URL(url);
    const base = new URL(baseUrl);
    if (u.host !== base.host) return false;

    const urlPath = u.pathname;

    for (const rule of disallowedPaths) {
      // Simple prefix matching for disallow rules
      if (urlPath === rule || urlPath.startsWith(rule)) {
        return true;
      }
    }
  } catch {
    // invalid URL, skip
  }
  return false;
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const baseDomain = extractDomain(baseUrl);

  // Extract from <a href>, skip rel="nofollow" links
  const hrefPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;

  let match;
  while ((match = hrefPattern.exec(html)) !== null) {
    try {
      const raw = match[1];
      // Skip javascript:, mailto:, tel:, #
      if (/^(javascript|mailto|tel|#)/i.test(raw)) continue;

      // Skip nofollow links
      const tagContext = html.slice(Math.max(0, match.index - 2), Math.min(html.length, match.index + match[0].length + 2));
      if (/rel\s*=\s*["'][^"']*nofollow/i.test(tagContext)) continue;

      const resolved = new URL(raw, baseUrl);
      // Only same domain, only http/https
      if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') continue;
      if (extractDomain(resolved.href) !== baseDomain) continue;

      links.push(normalizeUrl(resolved.href));
    } catch {
      // invalid URL, skip
    }
  }

  // Extract from <iframe src="">
  const iframePattern = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = iframePattern.exec(html)) !== null) {
    try {
      const raw = match[1];
      if (/^(javascript|mailto|tel|#)/i.test(raw)) continue;
      const resolved = new URL(raw, baseUrl);
      if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') continue;
      if (extractDomain(resolved.href) !== baseDomain) continue;
      links.push(normalizeUrl(resolved.href));
    } catch {
      // invalid URL, skip
    }
  }

  // Extract from <link rel="alternate" href="">
  const alternatePattern = /<link[^>]+rel=["'][^"']*alternate[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
  while ((match = alternatePattern.exec(html)) !== null) {
    try {
      const raw = match[1];
      if (/^(javascript|mailto|tel|#)/i.test(raw)) continue;
      const resolved = new URL(raw, baseUrl);
      if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') continue;
      if (extractDomain(resolved.href) !== baseDomain) continue;
      links.push(normalizeUrl(resolved.href));
    } catch {
      // invalid URL, skip
    }
  }

  // Extract from <area href=""> (image maps)
  const areaPattern = /<area[^>]+href=["']([^"']+)["'][^>]*>/gi;
  while ((match = areaPattern.exec(html)) !== null) {
    try {
      const raw = match[1];
      if (/^(javascript|mailto|tel|#)/i.test(raw)) continue;
      const resolved = new URL(raw, baseUrl);
      if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') continue;
      if (extractDomain(resolved.href) !== baseDomain) continue;
      links.push(normalizeUrl(resolved.href));
    } catch {
      // invalid URL, skip
    }
  }

  return links;
}

async function fetchSitemap(baseUrl: string): Promise<string[]> {
  try {
    const u = new URL(baseUrl);
    const sitemapUrl = `${u.protocol}//${u.host}/sitemap.xml`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(sitemapUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SecureScope/1.0)', 'Accept-Language': 'en-US,en;q=0.9' },
    });
    clearTimeout(timeout);

    if (!response.ok) return [];

    const text = await response.text();
    const baseDomain = extractDomain(baseUrl);
    const urls: string[] = [];

    // Parse <loc> from sitemap
    const locPattern = /<loc>([^<]+)<\/loc>/gi;
    let match;
    while ((match = locPattern.exec(text)) !== null) {
      try {
        const url = new URL(match[1].trim());
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          if (extractDomain(url.href) === baseDomain) {
            urls.push(normalizeUrl(url.href));
          }
        }
      } catch {
        // skip
      }
    }

    return urls;
  } catch {
    return [];
  }
}

function filterCrawlable(url: string): boolean {
  // Skip common non-page URLs
  const skipPatterns = [
    /\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot|mp[34]|avi|mov|pdf|zip|tar|gz)$/i,
    /\/api\//i,
    /\/feed/i,
    /\/wp-json/i,
    /\/robots\.txt/i,
    /\/favicon/i,
    /\.(xml|json|atom|rss)$/i,
    /\?.*json/i,
    /#.*$/,
    /mailto:/i,
    /tel:/i,
  ];
  return !skipPatterns.some((p) => p.test(url));
}

// Priority paths to scan first — these pages typically contain login forms,
// payment flows, admin panels, and auth endpoints that matter most for security.
// Highest-value security pages — checked before normal BFS
const PRIORITY_PATHS = [
  '/login', '/signin',
  '/admin', '/dashboard',
  '/payment', '/checkout',
  '/auth', '/wallet',
  '/register', '/signup',
  '/settings', '/account',
];

export async function crawlDomain(startUrl: string, maxPages: number = MAX_PAGES): Promise<{
  pages: CrawledPage[];
  stats: { pagesAttempted: number; pagesScanned: number; pagesFailed: number; depth: number; urls: string[] };
}> {
  const validation = validateUrl(startUrl);
  if (!validation.valid || !validation.sanitized) {
    return { pages: [], stats: { pagesAttempted: 0, pagesScanned: 0, pagesFailed: 0, depth: 0, urls: [] } };
  }

  const seedUrl = validation.sanitized;
  const seen = new Set<string>();
  const queue: { url: string; depth: number; priority?: boolean }[] = [];
  const pages: CrawledPage[] = [];
  let pagesFailed = 0;
  let pagesAttempted = 0;
  let pagesDisallowed = 0;
  let priorityMissed = 0; // priority probes that returned 404 (not real failures)

  // Add seed URL
  const seedNorm = normalizeUrl(seedUrl);
  queue.push({ url: seedNorm, depth: 0 });
  seen.add(seedNorm);

  // Pre-queue priority paths at depth 1 (before sitemap URLs)
  // These will be probed even if not linked from the homepage
  try {
    const base = new URL(seedUrl);
    for (const path of PRIORITY_PATHS) {
      const priorityUrl = normalizeUrl(`${base.protocol}//${base.host}${path}`);
      if (!seen.has(priorityUrl)) {
        seen.add(priorityUrl);
        queue.push({ url: priorityUrl, depth: 1, priority: true });
      }
    }
  } catch {
    // invalid base URL, skip priority paths
  }

  // Fetch robots.txt (best-effort, don't block on failure)
  let disallowedPaths: Set<string> = new Set();
  try {
    disallowedPaths = await fetchRobotsTxt(seedUrl);
  } catch {
    // robots.txt unavailable — continue without restrictions
  }

  // Try sitemap
  let sitemapUrls: string[] = [];
  try {
    sitemapUrls = await fetchSitemap(seedUrl);
  } catch {
    // sitemap not available
  }

  // Add sitemap URLs to queue (depth 1) — skip disallowed
  for (const surl of sitemapUrls) {
    if (!seen.has(surl) && filterCrawlable(surl) && !isDisallowedByRobots(surl, disallowedPaths, seedUrl)) {
      seen.add(surl);
      queue.push({ url: surl, depth: 1 });
    }
  }

  // BFS crawl with concurrency control.
  // Priority items (pre-queued security pages) are sorted to the front each batch.
  while (queue.length > 0 && pages.length < maxPages) {
    // Sort so priority items come first
    queue.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));

    // Filter out URLs already at MAX_DEPTH before forming batches
    const eligible = queue.splice(0, Math.min(CONCURRENCY, queue.length))
      .filter(({ depth }) => depth < MAX_DEPTH);

    if (eligible.length === 0) break;

    const results = await Promise.all(
      eligible.map(async ({ url, depth, priority }) => {
        pagesAttempted++;

        // Skip if disallowed by robots.txt — don't count as failure
        if (isDisallowedByRobots(url, disallowedPaths, seedUrl)) {
          pagesDisallowed++;
          return null;
        }

        const page = await fetchPage(url);
        // Skip priority probes that returned 404 — they don't exist on this site
        if (!page || (priority && page.statusCode === 404)) {
          if (priority) priorityMissed++;
          return null;
        }
        return { page, depth };
      })
    );

    for (const result of results) {
      if (!result) continue;

      const { page, depth } = result;
      pages.push(page);

      // Extract links and add to queue (only if we haven't hit max pages or max depth)
      if (depth < MAX_DEPTH - 1 && pages.length < maxPages) {
        const links = extractLinks(page.body, page.url);
        for (const link of links) {
          if (!seen.has(link) && filterCrawlable(link) && !isDisallowedByRobots(link, disallowedPaths, seedUrl)) {
            seen.add(link);
            queue.push({ url: link, depth: depth + 1 });
          }
        }
      }
    }
  }

  return {
    pages,
    stats: {
      pagesAttempted,
      pagesScanned: pages.length,
      pagesFailed: pagesAttempted - pages.length - pagesDisallowed - priorityMissed,
      depth: MAX_DEPTH,
      urls: pages.map((p) => p.url),
    },
  };
}
