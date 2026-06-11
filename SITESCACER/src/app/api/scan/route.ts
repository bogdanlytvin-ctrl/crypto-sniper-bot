import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateUrl, performScan } from '@/lib/scanner/scanner';
import { saveScanLog, logApiRequest } from '@/lib/logger';

// In-memory scan cache for deduplication
const recentScans = new Map<string, { timestamp: number; scanId: string }>();
const SCAN_COOLDOWN = 30000; // 30 seconds between scans of the same URL

// Clean up expired cache entries on each access (avoids setInterval in serverless/standalone)
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of recentScans) {
    if (now - entry.timestamp > 120000) {
      recentScans.delete(key);
    }
  }
}

// Extend timeout for Vercel/serverless deployments (scan can take 15-25s)
export const maxDuration = 60;

// Sanitize error messages to prevent information disclosure
function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Strip file paths, potential secrets, and stack-like info
    const msg = error.message
      .replace(/at\s+.*\n/g, '')
      .replace(/\/[^\s:]+/g, '[path]')
      .replace(/\b(secret|key|token|password)\s*[:=]\s*\S+/gi, '[redacted]');
    return msg.length > 200 ? msg.slice(0, 200) + '...' : msg;
  }
  return 'Scan failed';
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { url, locale, depth } = body;

    if (!url || typeof url !== 'string') {
      logApiRequest({ timestamp: new Date().toISOString(), method: 'POST', path: '/api/scan', status: 400, duration: Date.now() - startTime, error: 'URL is required' });
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const scanLocale = (locale && ['en', 'uk', 'ru'].includes(locale)) ? locale : 'en';
    const scanDepth = depth === 'multi' ? 'multi' : 'single';
    const forceRescan = body.force === true;

    // Validate and sanitize URL
    const validation = validateUrl(url.trim());
    if (!validation.valid) {
      logApiRequest({ timestamp: new Date().toISOString(), method: 'POST', path: '/api/scan', status: 400, duration: Date.now() - startTime, error: validation.error });
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const sanitizedUrl = validation.sanitized!;

    // Clean up expired cache entries
    cleanExpiredCache();

    // Debounce: check if recently scanned (skipped when force=true)
    const recent = recentScans.get(sanitizedUrl);
    if (!forceRescan && recent && Date.now() - recent.timestamp < SCAN_COOLDOWN) {
      // Return the recent scan
      const existingScan = await db.scan.findUnique({ where: { id: recent.scanId } });
      if (existingScan && existingScan.status === 'completed') {
        return NextResponse.json({
          id: existingScan.id,
          url: existingScan.url,
          status: 'completed',
          cached: true,
          findings: JSON.parse(existingScan.findings),
          riskScore: existingScan.riskScore,
          riskAdjustments: JSON.parse(existingScan.metadata || '{}').riskAdjustments || [],
          metadata: JSON.parse(existingScan.metadata),
        });
      }
    }

    // Create scan record
    const scan = await db.scan.create({
      data: {
        url: sanitizedUrl,
        status: 'scanning',
      },
    });

    // Update recent scans
    recentScans.set(sanitizedUrl, { timestamp: Date.now(), scanId: scan.id });

    // Perform the scan with a hard 50s timeout to prevent hanging
    try {
      const scanTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Scan timeout: site took too long to respond')), 50000)
      );
      const result = await Promise.race([performScan(sanitizedUrl, scanLocale, scanDepth), scanTimeout]) as Awaited<ReturnType<typeof performScan>>;

      // Save results to database
      const metadataToStore = {
        timestamp: result.timestamp,
        duration: result.duration,
        summary: result.summary,
        depth: scanDepth,
        meta: {
          statusCode: result.meta.statusCode,
          contentType: result.meta.contentType,
          web3Addresses: result.meta.web3Addresses,
          forms: result.meta.forms,
          inputs: result.meta.inputs,
          technologies: result.meta.technologies || [],
        },
        riskAdjustments: result.riskAdjustments || [],
        crawl: result.crawl || null,
      };

      // Save scan log to file for review
      saveScanLog({
        timestamp: new Date().toISOString(),
        scanId: scan.id,
        url: sanitizedUrl,
        locale: scanLocale,
        depth: scanDepth,
        status: 'completed',
        riskScore: result.riskScore,
        findingsCount: result.findings.length,
        duration: Date.now() - startTime,
        summary: result.summary,
        findings: result.findings,
        riskAdjustments: result.riskAdjustments,
        metadata: metadataToStore,
      });

      await db.scan.update({
        where: { id: scan.id },
        data: {
          status: 'completed',
          riskScore: result.riskScore,
          findings: JSON.stringify(result.findings),
          metadata: JSON.stringify(metadataToStore),
          completedAt: new Date(),
        },
      });

      logApiRequest({ timestamp: new Date().toISOString(), method: 'POST', path: '/api/scan', status: 200, duration: Date.now() - startTime, body: { url: sanitizedUrl, locale: scanLocale, depth: scanDepth } });

      return NextResponse.json({
        id: scan.id,
        url: sanitizedUrl,
        status: 'completed',
        findings: result.findings,
        riskScore: result.riskScore,
        riskAdjustments: result.riskAdjustments || [],
        metadata: metadataToStore,
      });
    } catch (scanError) {
      // Update scan as failed
      await db.scan.update({
        where: { id: scan.id },
        data: { status: 'failed' },
      });

      const message = sanitizeErrorMessage(scanError);

      // Log the failure
      saveScanLog({
        timestamp: new Date().toISOString(),
        scanId: scan.id,
        url: sanitizedUrl,
        locale: scanLocale,
        depth: scanDepth,
        status: 'failed',
        error: message,
      });

      logApiRequest({ timestamp: new Date().toISOString(), method: 'POST', path: '/api/scan', status: 422, duration: Date.now() - startTime, error: message });
      return NextResponse.json({ error: message }, { status: 422 });
    }
  } catch {
    logApiRequest({ timestamp: new Date().toISOString(), method: 'POST', path: '/api/scan', status: 500, duration: Date.now() - startTime, error: 'Internal server error' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
