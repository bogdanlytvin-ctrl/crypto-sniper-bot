import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { saveScanLog } from '@/lib/logger';

// Demo HTML — same content as /api/demo but used for internal scanning
const DEMO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AcmeCorp DeFi — Demo Scan Target</title>
</head>
<body>
<!-- Treasury wallet: 0x742d35Cc6634C0532925a3b8D4C9C3b9Eff83D89 -->
<header>
  <h1>AcmeCorp DeFi Platform</h1>
  <nav>
    <a href="https://docs.example.com" target="_blank">Documentation</a>
    <a href="https://blog.example.com" target="_blank">Blog</a>
    <a href="/admin" target="_blank">Admin Panel</a>
  </nav>
</header>
<main>
  <section>
    <h2>Connect Your Wallet</h2>
    <p>Our smart contract address: <code>0xdAC17F958D2ee523a2206206994597C13D831ec7</code></p>
    <button onclick="connectWallet()">Connect Wallet</button>
  </section>
  <section>
    <h2>Live Price Feed</h2>
    <iframe src="https://widget.coinstats.app/coins" width="600" height="400"></iframe>
  </section>
  <section>
    <h2>Token Approval</h2>
    <button onclick="approveMax()">Approve Max</button>
  </section>
</main>
<script>
  const apiKey = "sk-proj_demo_test_key_abcdef1234567890ABCDEF";
  const analyticsToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_payload.demo_sig";

  function connectWallet() {
    localStorage.setItem('authToken', 'demo_auth_token_xyz789');
    localStorage.setItem('privateKey', 'user_session_private_ref');
  }

  function approveMax() {
    const MAX_UINT256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
    console.log("Approving MAX_UINT256:", MAX_UINT256);
  }

  if (typeof window !== 'undefined') {
    window.ethereum = window.ethereum || {};
    window.ethereum.request = async function(args) { return null; };
  }

  document.addEventListener('copy', function(e) {
    const selected = window.getSelection().toString();
    if (selected.match(/^0x[a-fA-F0-9]{40}$/)) {
      e.clipboardData.setData('text/plain', selected);
      e.preventDefault();
    }
  });

  function runDynamic(code) { return eval(code); }
</script>
</body>
</html>`;

// Demo response headers — intentionally missing security headers
const DEMO_HEADERS: Record<string, string> = {
  'content-type': 'text/html; charset=utf-8',
  'server': 'Apache/2.4.41 (Ubuntu)',
  'x-powered-by': 'PHP/7.4.3',
};

export const maxDuration = 60;

export async function POST() {
  const startTime = Date.now();
  const demoUrl = 'demo://securescope-demo-target';
  const locale = 'en';
  const depth = 'single';

  try {
    // Lazy import to avoid module loading at startup
    const { analyzeRisk, generateExploitScenario } = await import('@/lib/scanner/risk-engine');
    const { applyOwaspMapping } = await import('@/lib/scanner/owasp-mapping');
    const { analyzeHeaders } = await import('@/lib/scanner/http-analyzer');
    const { analyzeDom } = await import('@/lib/scanner/dom-analyzer');
    const { detectWeb3 } = await import('@/lib/scanner/web3-detector');
    const { analyzeJavaScript } = await import('@/lib/scanner/js-analyzer');
    const { detectTechStack } = await import('@/lib/scanner/tech-fingerprint');
    const { detectInfoLeakage } = await import('@/lib/scanner/info-leakage');
    const { getOwaspSummary } = await import('@/lib/scanner/owasp-mapping');

    // Run all analysis modules directly on demo HTML (no fetch, no SSRF)
    const headerFindings = analyzeHeaders({ headers: DEMO_HEADERS, setCookies: [] }, locale);
    const domResult = analyzeDom({ html: DEMO_HTML, pageUrl: demoUrl }, locale);
    const web3Result = detectWeb3(DEMO_HTML, locale, demoUrl);
    const jsFindings = analyzeJavaScript({ html: DEMO_HTML, pageUrl: demoUrl }, locale);
    const techResult = detectTechStack({ headers: DEMO_HEADERS, body: DEMO_HTML, url: demoUrl }, locale);
    const infoLeakageResult = detectInfoLeakage({ body: DEMO_HTML, url: demoUrl }, locale);

    const allFindings = [
      ...headerFindings,
      ...domResult.findings,
      ...web3Result.findings,
      ...jsFindings,
      ...techResult.findings,
      ...infoLeakageResult.findings,
    ];

    // Tag source page
    for (const f of allFindings) {
      if (!f.sourcePage) f.sourcePage = demoUrl;
    }

    // Add web3 pattern findings
    for (const pattern of web3Result.patterns) {
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
        sourcePage: demoUrl,
        references: [],
      });
    }

    // Deduplicate
    const seen = new Set<string>();
    const dedupedFindings = allFindings.filter(f => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });

    // Ensure exploit scenarios
    for (const finding of dedupedFindings) {
      if (!finding.exploitScenario || finding.exploitScenario.trim() === '') {
        finding.exploitScenario = finding.impact || generateExploitScenario(finding, locale);
      }
    }

    // Risk engine
    const contextFlags = { hasAuthForms: false, hasLoginPages: false, isHttps: false };
    const riskResult = analyzeRisk(dedupedFindings, locale, contextFlags, demoUrl);
    const adjustedFindings = riskResult.adjusted;
    const riskScore = riskResult.score;

    // Ensure exploit scenarios survive risk engine
    for (const finding of adjustedFindings) {
      if (!finding.exploitScenario || finding.exploitScenario.trim() === '') {
        finding.exploitScenario = finding.impact || generateExploitScenario(finding, locale);
      }
    }

    applyOwaspMapping(adjustedFindings);

    const summary = {
      total: adjustedFindings.length,
      critical: adjustedFindings.filter(f => f.severity === 'critical').length,
      high: adjustedFindings.filter(f => f.severity === 'high').length,
      medium: adjustedFindings.filter(f => f.severity === 'medium').length,
      low: adjustedFindings.filter(f => f.severity === 'low').length,
      info: adjustedFindings.filter(f => f.severity === 'info').length,
      byCategory: {
        security: adjustedFindings.filter(f => f.category === 'security').length,
        'data-exposure': adjustedFindings.filter(f => f.category === 'data-exposure').length,
        crypto: adjustedFindings.filter(f => f.category === 'crypto').length,
      },
      byOwasp: getOwaspSummary(adjustedFindings),
    };

    const duration = Date.now() - startTime;

    const metadataToStore = {
      timestamp: new Date().toISOString(),
      duration,
      summary,
      depth,
      meta: { statusCode: 200, contentType: 'text/html', web3Addresses: [], forms: domResult.meta.forms, inputs: domResult.meta.inputs, technologies: techResult.technologies },
      riskAdjustments: riskResult.adjustments || [],
      crawl: null,
    };

    // Save to DB
    const scan = await db.scan.create({
      data: { url: demoUrl, status: 'completed', riskScore, findings: JSON.stringify(adjustedFindings), metadata: JSON.stringify(metadataToStore), completedAt: new Date() },
    });

    saveScanLog({ timestamp: new Date().toISOString(), scanId: scan.id, url: demoUrl, locale, depth, status: 'completed', riskScore, findingsCount: adjustedFindings.length, duration, summary, findings: adjustedFindings, riskAdjustments: riskResult.adjustments, metadata: metadataToStore });

    return NextResponse.json({
      id: scan.id,
      url: demoUrl,
      status: 'completed',
      findings: adjustedFindings,
      riskScore,
      riskAdjustments: riskResult.adjustments || [],
      metadata: metadataToStore,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message.slice(0, 200) : 'Demo scan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
