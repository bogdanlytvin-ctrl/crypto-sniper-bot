import type { ScanFinding } from './types';

// Maps finding IDs to OWASP Top 10 2021 categories.
// Format: "AXX:2021 - Category Name" (matches report OWASP_DESCRIPTIONS keys)
// Some findings map to multiple OWASP categories; the most relevant is chosen.
const OWASP_MAP: Record<string, string> = {
  // A01 - Broken Access Control
  'data-form-no-csrf': 'A01:2021 - Broken Access Control',
  'sec-missing-xframe': 'A01:2021 - Broken Access Control',

  // A03 - Injection
  'sec-inline-script-sensitive': 'A03:2021 - Injection',
  'sec-potential-xss': 'A03:2021 - Injection',
  'sec-potential-sqli': 'A03:2021 - Injection',

  // A04 - Insecure Design
  'sec-exposed-api-endpoints': 'A04:2021 - Insecure Design',

  // A05 - Security Misconfiguration
  'sec-missing-csp': 'A05:2021 - Security Misconfiguration',
  'sec-missing-hsts': 'A05:2021 - Security Misconfiguration',
  'sec-missing-xcontent': 'A05:2021 - Security Misconfiguration',
  'sec-missing-referrer': 'A05:2021 - Security Misconfiguration',
  'sec-missing-permissions': 'A05:2021 - Security Misconfiguration',
  'sec-cookie-no-samesite': 'A05:2021 - Security Misconfiguration',
  'sec-extern-script-no-sri': 'A05:2021 - Security Misconfiguration',
  'info-tech-disclosure': 'A05:2021 - Security Misconfiguration',
  'data-phone-exposed': 'A05:2021 - Security Misconfiguration',
  'data-email-exposed': 'A05:2021 - Security Misconfiguration',
  'data-mixed-content': 'A05:2021 - Security Misconfiguration',
  'data-ssl-expired': 'A05:2021 - Security Misconfiguration',
  'data-ssl-weak': 'A05:2021 - Security Misconfiguration',

  // A06 - Vulnerable and Outdated Components
  'sec-outdated-lib': 'A06:2021 - Vulnerable and Outdated Components',
  'sec-known-cve': 'A06:2021 - Vulnerable and Outdated Components',

  // A07 - Identification and Authentication Failures
  'sec-cookie-no-secure': 'A07:2021 - Identification and Authentication Failures',
  'sec-cookie-no-httponly': 'A07:2021 - Identification and Authentication Failures',
  'form-password-no-autocomplete': 'A07:2021 - Identification and Authentication Failures',

  // A08 - Software and Data Integrity Failures
  'sec-open-redirect': 'A08:2021 - Software and Data Integrity Failures',

  // A09 - Security Logging and Monitoring Failures

  // A10 - Server-Side Request Forgery (SSRF)

  // Additional info-level finding mappings
  'info-open-redirect': 'A08:2021 - Software and Data Integrity Failures',
  'info-internal-ip': 'A01:2021 - Broken Access Control',
  'info-phone-leakage': 'A05:2021 - Security Misconfiguration',
  'info-email-leakage': 'A05:2021 - Security Misconfiguration',
  'sec-password-autocomplete': 'A07:2021 - Identification and Authentication Failures',

  // A02 - Cryptographic Failures (only for crypto-specific findings)
  'crypto-eth-address': 'A02:2021 - Cryptographic Failures',
  'crypto-btc-address': 'A02:2021 - Cryptographic Failures',
  'crypto-pattern': 'A02:2021 - Cryptographic Failures',
  'crypto-address-reuse': 'A02:2021 - Cryptographic Failures',
  'data-ssn-exposed': 'A02:2021 - Cryptographic Failures',
  'data-api-key': 'A02:2021 - Cryptographic Failures',
  'data-private-key': 'A02:2021 - Cryptographic Failures',

  // New findings — first audit pass
  'sec-cors-misconfigured': 'A05:2021 - Security Misconfiguration',
  'sec-csp-weak': 'A05:2021 - Security Misconfiguration',
  'sec-server-version-disclosure': 'A05:2021 - Security Misconfiguration',
  'sec-xpoweredby-version-disclosure': 'A05:2021 - Security Misconfiguration',
  'sec-sensitive-path-exposed': 'A05:2021 - Security Misconfiguration',
  'sec-http-trace-enabled': 'A05:2021 - Security Misconfiguration',
  'sec-http-no-https-redirect': 'A05:2021 - Security Misconfiguration',

  // New findings — second audit pass
  'sec-hardcoded-api-key': 'A02:2021 - Cryptographic Failures',
  'sec-localstorage-sensitive': 'A02:2021 - Cryptographic Failures',
  'sec-reverse-tabnapping': 'A08:2021 - Software and Data Integrity Failures',
  'sec-iframe-no-sandbox': 'A05:2021 - Security Misconfiguration',
  'sec-form-external-action': 'A01:2021 - Broken Access Control',
  'crypto-seed-phrase-exposed': 'A02:2021 - Cryptographic Failures',
  'crypto-clipboard-hijack': 'A08:2021 - Software and Data Integrity Failures',
  'crypto-ethereum-provider-override': 'A08:2021 - Software and Data Integrity Failures',
  'crypto-wallet-drainer': 'A08:2021 - Software and Data Integrity Failures',
  'info-stack-trace-exposed': 'A05:2021 - Security Misconfiguration',
  'info-robots-sensitive-paths': 'A05:2021 - Security Misconfiguration',
  'blacklist_indicator': 'A02:2021 - Cryptographic Failures',
};

export function mapToOwasp(findingId: string): string | undefined {
  return OWASP_MAP[findingId];
}

// Apply OWASP mapping to all findings
export function applyOwaspMapping(findings: ScanFinding[]): void {
  for (const f of findings) {
    if (!f.owaspCategory) {
      f.owaspCategory = mapToOwasp(f.id) || undefined;
    }
  }
}

// Get OWASP summary (how many findings per category)
export function getOwaspSummary(findings: ScanFinding[]): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const f of findings) {
    if (f.owaspCategory) {
      summary[f.owaspCategory] = (summary[f.owaspCategory] || 0) + 1;
    }
  }
  return summary;
}
