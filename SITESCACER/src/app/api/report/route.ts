import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// OWASP Top 10 (2021) mapping from finding IDs/categories
const OWASP_CATEGORY_MAP: Record<string, string> = {
  // A05:2021 - Security Misconfiguration
  'sec-missing-csp': 'A05:2021 - Security Misconfiguration',
  'sec-missing-hsts': 'A05:2021 - Security Misconfiguration',
  'sec-missing-xframe': 'A01:2021 - Broken Access Control',
  'sec-missing-xcontent': 'A05:2021 - Security Misconfiguration',
  'sec-missing-referrer': 'A05:2021 - Security Misconfiguration',
  'sec-missing-permissions': 'A05:2021 - Security Misconfiguration',
  'sec-cookie-no-samesite': 'A05:2021 - Security Misconfiguration',
  'sec-cookie-no-secure': 'A07:2021 - Identification and Authentication Failures',
  'sec-cookie-no-httponly': 'A07:2021 - Identification and Authentication Failures',
  'data-form-no-csrf': 'A05:2021 - Security Misconfiguration',
  'data-mixed-content': 'A05:2021 - Security Misconfiguration',
  'data-ssl-expired': 'A05:2021 - Security Misconfiguration',
  'data-ssl-weak': 'A05:2021 - Security Misconfiguration',
  // A08:2021 - Software and Data Integrity Failures
  'sec-extern-script-no-sri': 'A08:2021 - Software and Data Integrity Failures',
  'sec-inline-script-sensitive': 'A03:2021 - Injection',
  'sec-open-redirect': 'A08:2021 - Software and Data Integrity Failures',
  // A01:2021 - Broken Access Control
  'data-sens-data-exposed': 'A01:2021 - Broken Access Control',
  'data-directory-listing': 'A01:2021 - Broken Access Control',
  'data-internal-path': 'A01:2021 - Broken Access Control',
  'data-admin-panel': 'A01:2021 - Broken Access Control',
  'data-debug-info': 'A01:2021 - Broken Access Control',
  'data-error-disclosure': 'A01:2021 - Broken Access Control',
  'data-comment-code': 'A01:2021 - Broken Access Control',
  'data-source-code': 'A01:2021 - Broken Access Control',
  'data-git-exposed': 'A01:2021 - Broken Access Control',
  'data-env-exposed': 'A01:2021 - Broken Access Control',
  // A02:2021 - Cryptographic Failures (crypto-specific only)
  'crypto-eth-address': 'A02:2021 - Cryptographic Failures',
  'crypto-btc-address': 'A02:2021 - Cryptographic Failures',
  'crypto-pattern': 'A02:2021 - Cryptographic Failures',
  'crypto-address-reuse': 'A02:2021 - Cryptographic Failures',
  'data-ssn-exposed': 'A02:2021 - Cryptographic Failures',
  'data-api-key': 'A02:2021 - Cryptographic Failures',
  'data-private-key': 'A02:2021 - Cryptographic Failures',
  // A05 for info leakage (not crypto)
  'data-email-exposed': 'A05:2021 - Security Misconfiguration',
  'data-phone-exposed': 'A05:2021 - Security Misconfiguration',
  'info-phone-leakage': 'A05:2021 - Security Misconfiguration',
  'info-email-leakage': 'A05:2021 - Security Misconfiguration',
  'info-tech-disclosure': 'A05:2021 - Security Misconfiguration',
  // A07:2021
  'sec-autocomplete-password': 'A07:2021 - Identification and Authentication Failures',
  'sec-password-autofill': 'A07:2021 - Identification and Authentication Failures',
  // A03:2021 - Injection
  'sec-potential-xss': 'A03:2021 - Injection',
  'sec-potential-sqli': 'A03:2021 - Injection',
  // A06:2021
  'sec-outdated-lib': 'A06:2021 - Vulnerable and Outdated Components',
  'sec-known-cve': 'A06:2021 - Vulnerable and Outdated Components',
  // A04:2021
  'sec-exposed-api-endpoints': 'A04:2021 - Insecure Design',
};

// OWASP category descriptions
const OWASP_DESCRIPTIONS: Record<string, string> = {
  'A01:2021 - Broken Access Control': 'Restrictions on what authenticated users are allowed to do are often not properly enforced. Attackers can exploit these flaws to access unauthorized functionality and/or data.',
  'A02:2021 - Cryptographic Failures': 'Failures related to cryptography (or lack thereof), which often lead to exposure of sensitive data. This includes use of weak algorithms, hardcoded keys, or transmitting data in cleartext.',
  'A03:2021 - Injection': 'User-supplied data is not validated, sanitized, or typed by the application before being used in SQL, NoSQL, OS, or LDAP queries, leading to code injection vulnerabilities.',
  'A04:2021 - Insecure Design': 'Insecure design is a broad category representing different weaknesses related to design and architectural flaws. It calls for more use of threat modeling, secure design patterns, and reference architectures.',
  'A05:2021 - Security Misconfiguration': 'The application might be vulnerable if it is missing appropriate security hardening, has unnecessary features enabled, uses default accounts/passwords, or exposes overly informative error messages.',
  'A06:2021 - Vulnerable and Outdated Components': 'Using components with known vulnerabilities (e.g., outdated libraries, frameworks) can allow an attacker to exploit known weaknesses and take control of the application.',
  'A07:2021 - Identification and Authentication Failures': 'Confirmation of user identity, authentication, and session management is critical to protect against authentication-related attacks.',
  'A08:2021 - Software and Data Integrity Failures': 'Software and data integrity failures relate to code and infrastructure that does not protect against integrity violations. This includes using software from untrusted sources or insecure CI/CD pipelines.',
  'A09:2021 - Security Logging and Monitoring Failures': 'Without logging and monitoring, breaches cannot be detected. Insufficient logging, detection, monitoring, and active response allows attackers to further attack systems and maintain persistence.',
  'A10:2021 - Server-Side Request Forgery (SSRF)': 'SSRF flaws occur when a web application fetches a remote resource without validating the user-supplied URL. It allows an attacker to coerce the application to send requests to unexpected destinations.',
};

function mapFindingToOwasp(finding: any): string {
  // First try exact ID match
  if (OWASP_CATEGORY_MAP[finding.id]) {
    return OWASP_CATEGORY_MAP[finding.id];
  }
  // Then try prefix matching for dynamic IDs
  for (const [pattern, category] of Object.entries(OWASP_CATEGORY_MAP)) {
    if (finding.id.startsWith(pattern)) {
      return category;
    }
  }
  // Category-based fallback
  if (finding.category === 'crypto') {
    return 'A02:2021 - Cryptographic Failures';
  }
  if (finding.category === 'data-exposure') {
    return 'A05:2021 - Security Misconfiguration';
  }
  if (finding.category === 'security') {
    return 'A05:2021 - Security Misconfiguration';
  }
  return 'A05:2021 - Security Misconfiguration';
}

function buildOwaspClassification(findings: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of findings) {
    const category = f.owaspCategory || mapFindingToOwasp(f);
    counts[category] = (counts[category] || 0) + 1;
  }
  return counts;
}

function buildTechnologyStack(technologies: any[]): Record<string, string[]> {
  if (!technologies || technologies.length === 0) return {};
  // Sort so CDN entries come before server entries (for known CDN providers like Cloudflare)
  // This ensures CDN wins in dedup, not server
  const sorted = [...technologies].sort((a, b) => {
    if (a.category === 'cdn' && b.category === 'server') return -1;
    if (a.category === 'server' && b.category === 'cdn') return 1;
    return 0;
  });
  const grouped: Record<string, string[]> = {};
  const seenNames = new Set<string>();
  for (const t of sorted) {
    const cat = t.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    const label = t.version ? `${t.name} ${t.version}` : t.name;
    if (!seenNames.has(t.name)) {
      seenNames.add(t.name);
      grouped[cat].push(label);
    }
  }
  // Remove empty groups
  for (const key of Object.keys(grouped)) {
    if (grouped[key].length === 0) delete grouped[key];
  }
  return grouped;
}

function detectPageContext(findings: any[], metadata: any): string[] {
  const contexts: string[] = [];
  const allText = findings.map((f: any) =>
    ((f.evidence || '') + ' ' + (f.details || '') + ' ' + (f.title || '') + ' ' + (f.sourcePage || '')).toLowerCase()
  ).join(' ');

  if (/login|signin|sign.in|sign-in|authentication/i.test(allText)) contexts.push('Login Page');
  if (/payment|checkout|billing|credit.card|stripe|paypal/i.test(allText)) contexts.push('Payment Page');
  if (/register|signup|sign.up|sign-up|create.account/i.test(allText)) contexts.push('Registration Page');
  if (/admin|dashboard|manage|settings|panel/i.test(allText)) contexts.push('Admin/Management');
  if (/api|endpoint|rest|graphql/i.test(allText)) contexts.push('API Endpoint');
  if (/web3|blockchain|ethereum|smart.contract|dapp/i.test(allText)) contexts.push('Web3 / Blockchain');

  return contexts;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get('scanId');
    const format = searchParams.get('format') || 'pdf';

    if (!scanId) {
      return NextResponse.json({ error: 'scanId is required' }, { status: 400 });
    }

    // Fetch scan from database
    const scan = await db.scan.findUnique({ where: { id: scanId } });

    if (!scan || scan.status !== 'completed') {
      return NextResponse.json({ error: 'Scan not found or not completed' }, { status: 404 });
    }

    const findings = JSON.parse(scan.findings || '[]');
    const metadata = JSON.parse(scan.metadata || '{}');
    const riskScore = scan.riskScore;

    if (format === 'json') {
      return generateJsonReport(scan, findings, metadata, riskScore);
    }

    return generatePdfReport(scan, findings, metadata, riskScore);
  } catch {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

function generateJsonReport(
  scan: any,
  findings: any[],
  metadata: any,
  riskScore: number
) {
  const technologies = metadata.meta?.technologies || [];
  const owaspClassification = buildOwaspClassification(findings);
  const technologyStack = buildTechnologyStack(technologies);
  const pageContexts = detectPageContext(findings, metadata);

  const report = {
    reportInfo: {
      title: 'SecureScope Security Report',
      version: '2.1',
      generatedAt: new Date().toISOString(),
      generator: 'SecureScope Web Security & Web3 Analysis Platform',
    },
    target: {
      url: scan.url,
      scannedAt: scan.completedAt?.toISOString() || scan.createdAt.toISOString(),
      scanDuration: metadata.duration ? `${(metadata.duration / 1000).toFixed(1)}s` : 'N/A',
      scanDepth: metadata.depth || 'single',
    },
    riskAssessment: {
      score: riskScore,
      level: riskScore <= 30 ? 'Low' : riskScore <= 60 ? 'Medium' : riskScore <= 80 ? 'High' : 'Critical',
      summary: metadata.summary || {},
      adjustments: metadata.riskAdjustments || [],
    },
    owaspClassification,
    technologyStack,
    pageContexts,
    crawlInfo: metadata.crawl || null,
    findings: findings.map((f: any) => ({
      id: f.id,
      title: f.title,
      severity: f.severity,
      originalSeverity: f.originalSeverity || null,
      category: f.category,
      owaspCategory: f.owaspCategory || mapFindingToOwasp(f),
      sourcePage: f.sourcePage || null,
      explanation: f.explanation,
      impact: f.impact,
      exploitScenario: f.exploitScenario || null,
      howToFix: f.howToFix,
      evidence: f.evidence || null,
      details: f.details || null,
      riskAdjustment: f.riskAdjustment || null,
      references: f.references || [],
    })),
    meta: metadata.meta || {},
  };

  return new NextResponse(JSON.stringify(report, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="securescope-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

function generatePdfReport(
  scan: any,
  findings: any[],
  metadata: any,
  riskScore: number
) {
  const summary = metadata.summary || {};
  const crawl = metadata.crawl || null;
  const technologies = metadata.meta?.technologies || [];
  const riskLevel = riskScore <= 30 ? 'Low Risk' : riskScore <= 60 ? 'Medium Risk' : riskScore <= 80 ? 'High Risk' : 'Critical Risk';
  const riskColor = riskScore <= 30 ? '#10b981' : riskScore <= 60 ? '#f59e0b' : riskScore <= 80 ? '#ef4444' : '#991b1b';

  // OWASP classification
  const owaspClassification = buildOwaspClassification(findings);
  const owaspCategoryCount = Object.keys(owaspClassification).length;

  // Technology stack
  const technologyStack = buildTechnologyStack(technologies);
  const techCategoryNames: Record<string, string> = {
    server: 'Server',
    framework: 'Framework',
    cms: 'CMS',
    cdn: 'CDN',
    library: 'Library',
    analytics: 'Analytics',
    language: 'Language',
    other: 'Other',
  };

  // Page context
  const pageContexts = detectPageContext(findings, metadata);

  const sortedFindings = [...findings].sort((a: any, b: any) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return (order[a.severity] ?? 5) - (order[b.severity] ?? 5);
  });

  const criticalFindings = sortedFindings.filter((f: any) => f.severity === 'critical');
  const highFindings = sortedFindings.filter((f: any) => f.severity === 'high');
  const mediumFindings = sortedFindings.filter((f: any) => f.severity === 'medium');
  const lowFindings = sortedFindings.filter((f: any) => f.severity === 'low' || f.severity === 'info');

  function findingToHtml(f: any): string {
    const riskBadge = f.riskAdjustment
      ? `<div class="escalation"><strong>Risk Escalated: ${esc(f.riskAdjustment.from)} &rarr; ${esc(f.riskAdjustment.to)}</strong><br><em>${esc(f.riskAdjustment.reason)}</em></div>`
      : '';

    const owaspCat = f.owaspCategory || mapFindingToOwasp(f);
    const owaspLine = `<p><strong>OWASP:</strong> <span style="font-family:monospace;font-size:12px;color:#64748b">${esc(owaspCat)}</span></p>`;

    const sourceLine = f.sourcePage ? `<p><strong>Source Page:</strong> ${esc(f.sourcePage)}</p>` : '';
    const detailsBlock = f.details && f.details !== f.explanation
      ? `<div class="section"><strong>Details:</strong><br><pre>${esc(f.details)}</pre></div>` : '';

    const refs = f.references && f.references.length > 0
      ? `<p><strong>References:</strong><br>${f.references.map((r: any) => `<a href="${esc(r.url)}" style="color:#059669">${esc(r.label)}</a>`).join(' &middot; ')}</p>` : '';

    const validConf = new Set(['low', 'medium', 'high', 'verified']);
    const confBadge = f.confidence && validConf.has(f.confidence)
      ? `<span class="confidence conf-${f.confidence}">${esc(f.confidence.toUpperCase())}</span>`
      : '';

    return `<div class="finding ${f.severity}">
<h3><span class="severity ${f.severity}">${f.severity.toUpperCase()}</span>${confBadge} ${esc(f.title)}</h3>
<p><strong>Category:</strong> ${esc(f.category || '')}</p>${owaspLine}${sourceLine}
${f.evidence ? `<div class="evidence">${esc(f.evidence)}</div>` : ''}
<div class="section"><strong>Explanation:</strong><br>${esc(f.explanation || '')}</div>
<div class="exploit"><strong>Possible Impact:</strong><br>${esc(f.exploitScenario || 'N/A')}</div>
<div class="section"><strong>Impact:</strong><br>${esc(f.impact || '')}</div>
<div class="section"><strong>How to Fix:</strong><br>${esc(f.howToFix || '')}</div>
${detailsBlock}${riskBadge}${refs}
</div>`;
  }

  function sectionHtml(title: string, arr: any[]): string {
    if (!arr.length) return '';
    return `<h2>${title} (${arr.length})</h2>\n${arr.map(findingToHtml).join('\n')}`;
  }

  const riskAdjustments = metadata.riskAdjustments || [];
  const riskAdjHtml = riskAdjustments.length > 0
    ? `<h2>Risk Score Adjustments</h2><div class="adjustments">${riskAdjustments.map((a: any) => `<div class="adjustment"><p><strong>${esc(a.findingId)}</strong>: ${esc(a.originalSeverity)} &rarr; ${esc(a.adjustedSeverity)}</p><p class="reason">${esc(a.reason)}</p></div>`).join('')}</div>`
    : '';

  const crawlHtml = crawl && crawl.pagesScanned > 1
    ? `<div class="meta"><p><strong>Pages Scanned:</strong> ${crawl.pagesScanned} / ${crawl.pagesAttempted} attempted</p><p><strong>Crawl Depth:</strong> ${crawl.depth} levels</p><p><strong>Pages Failed:</strong> ${crawl.pagesFailed}</p></div>`
    : '';

  const recsHtml = generateRecommendations(sortedFindings);

  // Technology Stack HTML
  const techStackHtml = technologies.length > 0
    ? `<h2>Technology Stack</h2>
<div class="tech-grid">
${Object.entries(technologyStack).filter(([, names]) => names.length > 0).map(([cat, names]) =>
  `<div class="tech-card">
<div class="cat">${esc(techCategoryNames[cat] || cat)}</div>
<div class="name">${names.map(n => esc(n)).join(', ')}</div>
${technologies.filter(t => t.category === cat && t.evidence).slice(0, 2).map(t => `<div class="evidence">${esc(t.evidence)}</div>`).join('')}
</div>`
).join('\n')}
</div>`
    : '';

  // OWASP Classification HTML
  const owaspEntries = Object.entries(owaspClassification).sort((a, b) => b[1] - a[1]);
  const owaspHtml = owaspEntries.length > 0
    ? `<h2>OWASP Top 10 Classification</h2>
<div class="owasp-grid">
${owaspEntries.map(([code, count]) => {
  // Normalize: split on " - " (with spaces) or "-" (without spaces)
  const parts = code.split(/\s*-\s*/);
  const codeOnly = parts[0] || code;
  const name = parts.slice(1).join(' - ') || '';
  const color = count >= 3 ? '#ef4444' : count >= 2 ? '#f97316' : '#eab308';
  // Look up description by exact code or normalized form
  const desc = OWASP_DESCRIPTIONS[code] || OWASP_DESCRIPTIONS[parts[0] + ' - ' + name] || '';
  return `<div class="owasp-card">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
<div class="code">${esc(codeOnly)}</div>
<div class="count" style="color:${color}">${count}</div>
</div>
<div style="font-size:13px;font-weight:600;color:#334155;margin-bottom:4px">${esc(name)}</div>
<div style="font-size:11px;color:#94a3b8;line-height:1.5">${esc(desc)}</div>
</div>`;
}).join('\n')}
</div>`
    : '';

  // Page context HTML
  const pageContextHtml = pageContexts.length > 0
    ? `<div class="meta" style="margin-top:12px">
<p><strong>Page Types Detected:</strong> ${pageContexts.map(c => esc(c)).join(', ')}</p>
</div>`
    : '';

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>SecureScope Report - ${esc(scan.url)}</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:820px;margin:0 auto;padding:48px 32px;color:#1e293b;line-height:1.65;font-size:14px}
.print-btn{position:fixed;top:16px;right:16px;background:#10b981;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,0.4);z-index:9999;display:flex;align-items:center;gap:8px}
.print-btn:hover{background:#059669}
@media print{.print-btn{display:none!important}}
h1{color:#10b981;font-size:28px;margin-bottom:4px;font-weight:800;letter-spacing:-0.5px}
.subtitle{color:#64748b;font-size:13px;margin-bottom:32px}
h2{color:#334155;font-size:18px;margin-top:36px;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;font-weight:700}
h3{color:#475569;font-size:14px;margin-bottom:10px}
.meta{background:#f8fafc;padding:20px 24px;border-radius:10px;margin:16px 0;border:1px solid #e2e8f0}
.meta p{margin:6px 0;font-size:13px}
.meta strong{color:#334155}
.score-display{display:flex;align-items:center;gap:24px;margin:24px 0}
.score-circle{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;color:#fff;flex-shrink:0}
.score-info h3{font-size:20px;color:#1e293b;margin-bottom:4px}
.score-info p{color:#64748b;font-size:13px}
.finding{border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin:14px 0;page-break-inside:avoid;background:#fff}
.finding.critical{border-left:5px solid #ef4444;background:#fef2f2}
.finding.high{border-left:5px solid #f97316;background:#fff7ed}
.finding.medium{border-left:5px solid #eab308;background:#fefce8}
.finding.low{border-left:5px solid #22c55e;background:#f0fdf4}
.finding.info{border-left:5px solid #0ea5e9;background:#f0f9ff}
.severity{display:inline-block;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:700;color:#fff;letter-spacing:0.5px;text-transform:uppercase;margin-right:6px}
.severity.critical{background:#ef4444}.severity.high{background:#f97316}.severity.medium{background:#eab308;color:#1e293b}.severity.low{background:#22c55e}.severity.info{background:#0ea5e9}
.confidence{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;margin-right:8px;border:1px solid}
.conf-low{background:#f8fafc;color:#64748b;border-color:#cbd5e1}.conf-medium{background:#eff6ff;color:#3b82f6;border-color:#93c5fd}.conf-high{background:#f0fdf4;color:#16a34a;border-color:#86efac}.conf-verified{background:#faf5ff;color:#7c3aed;border-color:#c4b5fd}
.evidence{font-family:'SF Mono',Monaco,monospace;font-size:12px;color:#64748b;background:#f1f5f9;padding:12px;border-radius:6px;margin:10px 0;word-break:break-all;border:1px solid #e2e8f0}
.section{background:#f8fafc;padding:14px 16px;border-radius:8px;margin:10px 0;border:1px solid #e2e8f0}
.section strong{color:#334155;font-size:12px;text-transform:uppercase;letter-spacing:0.3px}
.exploit{background:#fef2f2;border:1px solid #fecaca;padding:14px 16px;border-radius:8px;color:#991b1b;margin:10px 0}
.exploit strong{color:#b91c1c}
.escalation{background:#fffbeb;border:1px solid #fde68a;padding:14px 16px;border-radius:8px;margin:10px 0;color:#92400e}
.adjustments{background:#f8fafc;padding:16px 20px;border-radius:10px;margin:16px 0;border:1px solid #e2e8f0}
.adjustment{padding:10px 0;border-bottom:1px solid #e2e8f0}
.adjustment:last-child{border-bottom:none}
.adjustment .reason{color:#64748b;font-size:12px;margin-top:4px;font-style:italic}
pre{white-space:pre-wrap;word-break:break-word;font-size:12px}
.summary-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:20px 0}
.summary-card{text-align:center;padding:16px 8px;border-radius:8px;border:1px solid #e2e8f0;background:#fff}
.summary-card .number{font-size:28px;font-weight:800;line-height:1}
.summary-card .label{font-size:11px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:0.3px}
.recommendations{background:#f0fdf4;border:1px solid #bbf7d0;padding:20px 24px;border-radius:10px;margin:20px 0}
.recommendations h3{color:#166534;margin-bottom:12px}
.recommendations ol{padding-left:20px}
.recommendations li{margin:8px 0;font-size:13px;line-height:1.6}
.recommendations li strong{color:#166534}
.footer{margin-top:48px;padding-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;text-align:center}
.exec-summary{margin:16px 0}
.exec-statement{font-size:14px;line-height:1.7;color:#334155;background:#f8fafc;padding:14px 18px;border-radius:8px;border-left:4px solid #6366f1;margin:14px 0}
.exec-conf{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
.conf-pill{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.5px;border:1px solid}
.conf-pill.conf-low{background:#f8fafc;color:#64748b;border-color:#cbd5e1}
.conf-pill.conf-medium{background:#eff6ff;color:#3b82f6;border-color:#93c5fd}
.conf-pill.conf-high{background:#f0fdf4;color:#16a34a;border-color:#86efac}
.conf-pill.conf-verified{background:#faf5ff;color:#7c3aed;border-color:#c4b5fd}
.exec-top{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin:12px 0}
.exec-top ol{padding-left:20px;margin:8px 0 0}
.exec-top li{margin:8px 0;font-size:13px;line-height:1.6}
.tech-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin:16px 0}
.tech-card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px}
.tech-card .cat{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.3px}
.tech-card .name{font-size:14px;font-weight:600;color:#1e293b;margin-top:4px}
.tech-card .evidence{font-size:11px;color:#94a3b8;font-family:monospace;margin-top:4px;word-break:break-all}
.owasp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin:16px 0}
.owasp-card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px}
.owasp-card .code{font-size:11px;color:#64748b;font-family:monospace}
.owasp-card .count{font-size:24px;font-weight:800}
@media print{body{padding:24px 16px}.finding{break-inside:avoid}.tech-grid,.owasp-grid{grid-template-columns:repeat(2,1fr)}}
</style></head><body>
<button class="print-btn" onclick="window.print()">&#x1F5A8; Save as PDF</button>
<h1>SecureScope</h1>
<p class="subtitle">Web Security &amp; Web3 Analysis Report</p>
<div class="meta">
<p><strong>Target:</strong> ${esc(scan.url)}</p>
<p><strong>Scan Date:</strong> ${new Date(scan.completedAt?.toISOString() || scan.createdAt.toISOString()).toLocaleString()}</p>
<p><strong>Duration:</strong> ${metadata.duration ? `${(metadata.duration / 1000).toFixed(1)} seconds` : 'N/A'}</p>
<p><strong>Scan Depth:</strong> ${metadata.depth === 'multi' ? 'Multi-Page (Crawl)' : 'Single Page'}</p>
</div>
${crawlHtml}
<div class="score-display">
<div class="score-circle" style="background:${riskColor}">${riskScore}</div>
<div class="score-info">
<h3>${riskLevel}</h3>
<p>Overall security posture score out of 100. ${riskScore <= 30 ? 'The target demonstrates strong security practices.' : riskScore <= 60 ? 'The target has moderate security concerns that should be addressed.' : riskScore <= 80 ? 'Significant security vulnerabilities detected. Immediate action recommended.' : 'Critical security vulnerabilities detected. Immediate remediation required.'}</p>
</div>
</div>
<h2>Executive Summary</h2>
${generateExecutiveSummary(sortedFindings, summary, riskScore, owaspCategoryCount, Object.values(technologyStack).flat().length, pageContexts, esc)}
<div class="meta" style="margin-top:12px">
<p><strong>OWASP Categories Affected:</strong> ${owaspCategoryCount} of 10</p>
<p><strong>Technologies Detected:</strong> ${Object.values(technologyStack).flat().length}</p>
${pageContexts.length > 0 ? `<p><strong>Page Types Detected:</strong> ${pageContexts.map(c => esc(c)).join(', ')}</p>` : ''}
</div>
${techStackHtml}
${owaspHtml}
${riskAdjHtml}
${sectionHtml('Critical Findings', criticalFindings)}
${sectionHtml('High Severity Findings', highFindings)}
${sectionHtml('Medium Severity Findings', mediumFindings)}
${sectionHtml('Low Severity &amp; Informational', lowFindings)}
${recsHtml}
<div class="footer">Generated by SecureScope &mdash; Web Security &amp; Web3 Analysis Platform<br>${new Date().toISOString()} &middot; Report ID: ${scan.id}</div>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html;charset=utf-8',
      'Content-Disposition': `attachment; filename="securescope-${new Date().toISOString().slice(0, 10)}.html"`,
    },
  });
}

function generateExecutiveSummary(
  findings: any[],
  summary: any,
  riskScore: number,
  owaspCount: number,
  techCount: number,
  pageContexts: string[],
  escFn: (s: string) => string,
): string {
  const critical = summary.critical || 0;
  const high = summary.high || 0;
  const medium = summary.medium || 0;
  const lowInfo = (summary.low || 0) + (summary.info || 0);
  const total = summary.total || 0;

  // Business-language risk statement
  const riskStatement = riskScore <= 25
    ? 'This target demonstrates <strong>strong security practices</strong>. Only minor improvements are recommended.'
    : riskScore <= 50
    ? 'This target has <strong>moderate security concerns</strong>. Several issues should be addressed to reduce risk.'
    : riskScore <= 75
    ? 'This target has <strong>significant vulnerabilities</strong> that require prompt attention to prevent potential data breaches or attacks.'
    : 'This target has <strong>critical security vulnerabilities</strong> that require <span style="color:#ef4444;font-weight:700">immediate remediation</span>. Risk of exploitation is high.';

  // Confidence distribution
  const verified = findings.filter(f => f.confidence === 'verified').length;
  const highConf = findings.filter(f => f.confidence === 'high').length;
  const medConf = findings.filter(f => f.confidence === 'medium').length;
  const lowConf = findings.filter(f => f.confidence === 'low').length;

  const confRow = total > 0
    ? `<div class="exec-conf"><span class="conf-pill conf-verified">VERIFIED ${verified}</span><span class="conf-pill conf-high">HIGH ${highConf}</span><span class="conf-pill conf-medium">MEDIUM ${medConf}</span><span class="conf-pill conf-low">LOW ${lowConf}</span></div>`
    : '';

  // Top 3 critical/high findings in plain language
  const topFindings = findings
    .filter(f => f.severity === 'critical' || f.severity === 'high')
    .slice(0, 3);
  const topList = topFindings.length > 0
    ? `<div class="exec-top"><strong>Top Priority Issues:</strong><ol>${topFindings.map(f =>
        `<li><span class="severity ${escFn(f.severity)}" style="font-size:10px;padding:2px 7px">${escFn(f.severity.toUpperCase())}</span> <strong>${escFn(f.title)}</strong>${f.evidence ? ` — <em style="color:#64748b;font-size:12px">${escFn(f.evidence.slice(0, 120))}</em>` : ''}</li>`
      ).join('')}</ol></div>`
    : '';

  // Has crypto findings?
  const hasCrypto = findings.some(f => f.category === 'crypto');
  const cryptoNote = hasCrypto
    ? `<p style="color:#b45309;background:#fffbeb;border:1px solid #fde68a;padding:10px 14px;border-radius:6px;margin-top:12px;font-size:13px">⚠️ <strong>Web3 / Crypto activity detected.</strong> Review all cryptocurrency-related findings carefully. Wallet drainer patterns or exposed addresses may indicate fraudulent or compromised content.</p>`
    : '';

  return `
<div class="exec-summary">
  <div class="summary-grid">
    <div class="summary-card"><div class="number" style="color:#475569">${total}</div><div class="label">Total</div></div>
    <div class="summary-card"><div class="number" style="color:#ef4444">${critical}</div><div class="label">Critical</div></div>
    <div class="summary-card"><div class="number" style="color:#f97316">${high}</div><div class="label">High</div></div>
    <div class="summary-card"><div class="number" style="color:#eab308">${medium}</div><div class="label">Medium</div></div>
    <div class="summary-card"><div class="number" style="color:#22c55e">${lowInfo}</div><div class="label">Low / Info</div></div>
  </div>
  <p class="exec-statement">${riskStatement}</p>
  ${confRow}
  ${topList}
  ${cryptoNote}
</div>`;
}

function generateRecommendations(findings: any[]): string {
  const recs: string[] = [];
  const has = (id: string) => findings.some((f: any) => f.id === id);
  const hasCat = (cat: string) => findings.some((f: any) => f.category === cat);
  const hasSev = (sev: string) => findings.some((f: any) => f.severity === sev);

  // Generate recommendations based on HIGH/CRITICAL findings first, then others
  // Critical / High first
  if (has('sec-missing-csp')) recs.push('<strong>Implement Content-Security-Policy (CSP)</strong> - Start with a report-only policy and gradually tighten it. CSP is one of the most effective XSS mitigation strategies and should be a top priority.');
  if (has('sec-csp-weak')) recs.push('<strong>Strengthen your Content-Security-Policy</strong> - Remove unsafe-inline, unsafe-eval, and bare wildcard (*) from script-src. Use nonce-based or hash-based allowlisting instead.');
  if (has('sec-cors-misconfigured')) recs.push('<strong>Fix CORS misconfiguration</strong> - Never combine Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true. Use explicit origin allowlists.');
  if (has('sec-missing-hsts')) recs.push('<strong>Enable HTTP Strict Transport Security (HSTS)</strong> - Set max-age to at least one year with includeSubDomains. This prevents SSL stripping attacks and ensures browsers always use HTTPS.');
  if (has('sec-cookie-no-samesite')) recs.push('<strong>Set SameSite attribute on all cookies</strong> - Use SameSite=Strict or SameSite=Lax to prevent CSRF attacks via cross-site cookie transmission.');
  if (has('sec-cookie-no-secure') || has('sec-cookie-no-httponly')) recs.push('<strong>Secure all session cookies</strong> - Add Secure, HttpOnly, and SameSite attributes to all cookies, especially session and authentication cookies.');
  if (has('sec-missing-xframe')) recs.push('<strong>Add X-Frame-Options header</strong> - Set to SAMEORIGIN or DENY to prevent clickjacking attacks.');
  if (has('sec-reverse-tabnapping')) recs.push('<strong>Fix reverse tabnapping</strong> - Add rel="noopener noreferrer" to all links with target="_blank" to prevent the opened page from accessing window.opener.');
  if (has('sec-inline-script-sensitive')) recs.push('<strong>Remove sensitive data from inline scripts</strong> - Move API keys, tokens, and secrets to server-side environment variables.');
  if (has('data-form-no-csrf')) recs.push('<strong>Implement CSRF protection</strong> - Add anti-CSRF tokens to all state-changing forms.');
  if (has('sec-extern-script-no-sri')) recs.push('<strong>Add Subresource Integrity (SRI)</strong> - Generate integrity hashes for all CDN-hosted scripts.');
  if (has('sec-missing-xcontent')) recs.push('<strong>Set X-Content-Type-Options: nosniff</strong> - Prevent MIME-type sniffing which can lead to XSS attacks.');
  if (has('sec-missing-permissions')) recs.push('<strong>Configure Permissions-Policy</strong> - Explicitly disable unused browser APIs (camera, microphone, geolocation) to limit the attack surface.');
  if (has('sec-missing-referrer')) recs.push('<strong>Set a strict Referrer-Policy</strong> - Use strict-origin-when-cross-origin or no-referrer to prevent sensitive URL parameter leakage.');
  if (has('data-form-password-no-autocomplete')) recs.push('<strong>Review password field autocomplete</strong> - Add autocomplete="new-password" to registration/change forms, and consider allowing autocomplete on login forms for password manager compatibility.');
  if (hasCat('crypto')) recs.push('<strong>Audit all cryptocurrency addresses</strong> - Verify each address through blockchain explorers.');
  if (has('data-mixed-content')) recs.push('<strong>Fix mixed content</strong> - Replace all HTTP resources with HTTPS versions on pages served over HTTPS.');
  if (has('info-tech-disclosure') || has('sec-server-version-disclosure')) recs.push('<strong>Reduce technology fingerprinting</strong> - Remove or obfuscate server headers (Server, X-Powered-By) and meta generator tags.');
  if (recs.length === 0) recs.push('<strong>Continue maintaining current security practices</strong> - Regular security audits and keeping dependencies updated are essential.');

  return `<h2>Recommendations</h2><div class="recommendations"><h3>Priority Actions</h3><ol>${recs.map((r) => `<li>${r}</li>`).join('\n')}</ol></div>`;
}

function esc(s: string): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
