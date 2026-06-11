import { NextResponse } from 'next/server';

// Demo target page — intentionally misconfigured to showcase scanner capabilities.
// This is NOT a real attack surface; all "secrets" are fake test values.
const DEMO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AcmeCorp DeFi — Demo Scan Target</title>
  <!-- SecureScope Demo: this page contains intentional security issues for demonstration -->
</head>
<body>

<!-- DEMO ISSUE #1: Ethereum address in HTML comment -->
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

  <!-- DEMO ISSUE #2: Iframe without sandbox -->
  <section>
    <h2>Live Price Feed</h2>
    <iframe src="https://widget.coinstats.app/coins" width="600" height="400"></iframe>
  </section>

  <section>
    <h2>Token Approval</h2>
    <p>To use the platform, approve token spending.</p>
    <button onclick="approveMax()">Approve Max</button>
  </section>
</main>

<footer>
  <p>Built with Love by AcmeCorp</p>
  <a href="https://github.com/example/acmecorp" target="_blank">Source Code</a>
</footer>

<script>
  // DEMO ISSUE #3: Hardcoded API key
  const apiKey = "sk-proj_demo_test_key_abcdef1234567890ABCDEF";
  const analyticsToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_payload.demo_sig";

  // DEMO ISSUE #4: Sensitive data in localStorage
  function connectWallet() {
    localStorage.setItem('authToken', 'demo_auth_token_xyz789');
    localStorage.setItem('privateKey', 'user_session_private_ref');
    console.log("Wallet connected");
  }

  // DEMO ISSUE #5: Wallet drainer pattern — approve MAX_UINT256
  function approveMax() {
    const MAX_UINT256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
    console.log("Approving MAX_UINT256:", MAX_UINT256);
    // contract.approve(spenderAddress, MAX_UINT256);
  }

  // DEMO ISSUE #6: window.ethereum override
  if (typeof window !== 'undefined') {
    window.ethereum = window.ethereum || {};
    window.ethereum.request = async function(args) {
      return null;
    };
  }

  // DEMO ISSUE #7: Clipboard hijacking
  document.addEventListener('copy', function(e) {
    const selected = window.getSelection().toString();
    if (selected.match(/^0x[a-fA-F0-9]{40}$/)) {
      e.clipboardData.setData('text/plain', selected);
      e.preventDefault();
    }
  });

  // DEMO ISSUE #8: eval usage
  function runDynamic(code) {
    return eval(code);
  }
</script>

</body>
</html>`;

export async function GET() {
  return new NextResponse(DEMO_HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Intentionally missing security headers for demo purposes:
      // No Content-Security-Policy
      // No Strict-Transport-Security
      // No X-Frame-Options
      // No X-Content-Type-Options
      // No Referrer-Policy
      'Server': 'Apache/2.4.41 (Ubuntu)',
      'X-Powered-By': 'PHP/7.4.3',
      'Cache-Control': 'no-store',
    },
  });
}
