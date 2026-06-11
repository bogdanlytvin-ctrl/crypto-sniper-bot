// Quick functional test — run: node test-scan.mjs
// Tests the scan API endpoint with 3 different sites

const BASE = 'http://localhost:3000';

const tests = [
  { url: 'https://httpbin.org', label: 'httpbin (plain HTTP test site)', depth: 'single' },
  { url: 'https://example.com', label: 'example.com (minimal static site)', depth: 'single' },
  { url: 'https://github.com', label: 'github.com (major HTTPS site)', depth: 'single' },
];

async function runScan(url, depth = 'single') {
  const res = await fetch(`${BASE}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, depth, locale: 'en' }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  for (const { url, label, depth } of tests) {
    process.stdout.write(`\n🔍 Scanning ${label}...\n`);
    const start = Date.now();
    try {
      const result = await runScan(url, depth);
      const ms = Date.now() - start;
      const { riskScore, findings } = result;
      const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
      for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;

      console.log(`  ✅ Score: ${riskScore}/100  (${ms}ms)`);
      console.log(`  Findings: C=${counts.critical} H=${counts.high} M=${counts.medium} L=${counts.low} I=${counts.info}`);
      if (findings.length > 0) {
        console.log(`  Top findings:`);
        for (const f of findings.slice(0, 5)) {
          console.log(`    [${f.severity.toUpperCase()}] ${f.id}: ${f.title}`);
        }
      }
    } catch (e) {
      console.error(`  ❌ ERROR: ${e.message}`);
    }
  }
  console.log('\nDone.');
}

main().catch(console.error);
