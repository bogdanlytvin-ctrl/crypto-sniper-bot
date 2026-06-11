import type { ScanFinding } from './types';
import type { Locale } from '@/lib/i18n/translations';
import {
  CRYPTO_ETH_ADDRESS,
  CRYPTO_BTC_ADDRESS,
  WEB3_SEED_PHRASE,
  WEB3_CLIPBOARD_HIJACK,
  WEB3_ETHEREUM_OVERRIDE,
  WEB3_WALLET_DRAINER,
  entryToFinding,
} from './knowledge-base';

// Ethereum address regex (EIP-55 checksum format: 0x + 40 hex chars)
const ETH_ADDRESS_PATTERN = /0x[a-fA-F0-9]{40}/g;

// Bitcoin address regex (Legacy: 1/3 + base58, Bech32: bc1 + alphanumeric)
const BTC_LEGACY_PATTERN = /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g;
const BTC_BECH32_PATTERN = /\bbc1[a-zA-HJ-NP-Z0-9]{25,90}\b/g;

export interface Web3Detection {
  ethAddresses: string[];
  btcAddresses: string[];
  findings: ScanFinding[];
  patterns: Web3Pattern[];
}

export interface Web3Pattern {
  type: 'address_reuse' | 'embedded_wallet' | 'suspicious_placement' | 'hidden_element' | 'script_embedding' | 'suspicious_repetition' | 'data_attribute_embedding';
  severity: 'medium' | 'high';
  description: string;
  details: string;
  page?: string;
}

// Localized evidence messages
const ev = {
  ethDetected: (n: number, l: Locale) =>
    l === 'uk' ? `Виявлено ${n} Ethereum-адресу(и)`
    : l === 'ru' ? `Обнаружено ${n} Ethereum-адрес(ов)`
    : `Detected ${n} Ethereum address(es)`,

  ethDetails: (addrs: string, l: Locale) =>
    l === 'uk' ? `Ethereum-адреси на сторінці: ${addrs}`
    : l === 'ru' ? `Ethereum-адреса на странице: ${addrs}`
    : `Ethereum addresses found on page: ${addrs}`,

  btcDetected: (n: number, l: Locale) =>
    l === 'uk' ? `Виявлено ${n} Bitcoin-адресу(и)`
    : l === 'ru' ? `Обнаружено ${n} Bitcoin-адрес(ов)`
    : `Detected ${n} Bitcoin address(es)`,

  btcDetails: (addrs: string, l: Locale) =>
    l === 'uk' ? `Bitcoin-адреси на сторінці: ${addrs}`
    : l === 'ru' ? `Bitcoin-адреса на странице: ${addrs}`
    : `Bitcoin addresses found on page: ${addrs}`,

  addressReuse: (n: number, l: Locale) =>
    l === 'uk' ? `Адреса(и) використовуються на ${n} сторінках — можливий ризик відстеження`
    : l === 'ru' ? `Адреса(а) используется на ${n} страницах — возможный риск отслеживания`
    : `Address(es) reused across ${n} pages — potential tracking risk`,

  addressReuseDetails: (addrs: string, l: Locale) =>
    l === 'uk' ? `Одна й та сама крипто-адреса на декількох сторінках може бути ознакою відстеження користувачів або монетизації трафіку. Адреси: ${addrs}`
    : l === 'ru' ? `Один и тот же крипто-адрес на нескольких страницах может быть признаком отслеживания пользователей или монетизации трафика. Адреса: ${addrs}`
    : `Same crypto address across multiple pages may indicate user tracking or traffic monetization. Addresses: ${addrs}`,

  embeddedWallet: (l: Locale) =>
    l === 'uk' ? 'Вбудовані гаманці в скриптах'
    : l === 'ru' ? 'Встроенные кошельки в скриптах'
    : 'Embedded wallets in scripts',

  embeddedWalletDetails: (evidence: string, l: Locale) =>
    l === 'uk' ? `Виявлено адреси гаманців, вбудовані в JavaScript-код: ${evidence}. Це може бути ознакою автоматизованої системи збору пожертв або потенційно підозрілою активністю.`
    : l === 'ru' ? `Обнаружены адреса кошельков, встроенные в JavaScript-код: ${evidence}. Это может быть признаком автоматизированной системы сбора пожертвований или потенциально подозрительной активности.`
    : `Wallet addresses embedded in JavaScript code: ${evidence}. This could indicate an automated donation collection system or potentially suspicious activity.`,

  hiddenElement: (l: Locale) =>
    l === 'uk' ? 'Крипто-адреси в прихованих елементах'
    : l === 'ru' ? 'Крипто-адреса в скрытых элементах'
    : 'Crypto addresses in hidden elements',

  hiddenElementDetails: (evidence: string, l: Locale) =>
    l === 'uk' ? `Крипто-адреси знайдені в HTML-елементах з атрибутами приховування (display:none, visibility:hidden): ${evidence}. Це може бути ознакою шахрайського контенту.`
    : l === 'ru' ? `Крипто-адреса найдены в HTML-элементах с атрибутами скрытия (display:none, visibility:hidden): ${evidence}. Это может быть признаком мошеннического контента.`
    : `Crypto addresses found in HTML elements with hiding attributes (display:none, visibility:hidden): ${evidence}. This may indicate fraudulent content.`,

  scriptEmbedding: (l: Locale) =>
    l === 'uk' ? 'Адреси, вбудовані в динамічні скрипти'
    : l === 'ru' ? 'Адреса, встроенные в динамические скрипты'
    : 'Addresses embedded in dynamic scripts',

  scriptEmbeddingDetails: (evidence: string, l: Locale) =>
    l === 'uk' ? `Крипто-адреси знайдені в inline-скриптах з динамічною логікою: ${evidence}. Це може вказувати на автоматичне перенаправлення платежів або підміну адрес.`
    : l === 'ru' ? `Крипто-адреса найдены в inline-скриптах с динамической логикой: ${evidence}. Это может указывать на автоматическое перенаправление платежей или подмену адрес.`
    : `Crypto addresses found in inline scripts with dynamic logic: ${evidence}. This may indicate automatic payment redirection or address substitution.`,

  suspiciousRepetition: (l: Locale) =>
    l === 'uk' ? 'Підозріле повторення крипто-адреси на сторінці'
    : l === 'ru' ? 'Подозрительное повторение крипто-адреса на странице'
    : 'Suspicious repetition of crypto address on page',

  suspiciousRepetitionDetails: (addr: string, count: number, l: Locale) =>
    l === 'uk' ? `Крипто-адреса ${addr} зустрічається ${count} разів на одній сторінці. Підозріле повторення може вказувати на спробу маніпуляції користувачем або шахрайство.`
    : l === 'ru' ? `Крипто-адрес ${addr} встречается ${count} раз на одной странице. Подозрительное повторение может указывать на попытку манипуляции пользователем или мошенничество.`
    : `Crypto address ${addr} appears ${count} times on a single page. Suspicious repetition may indicate user manipulation or fraud.`,

  dataAttributeEmbedding: (l: Locale) =>
    l === 'uk' ? 'Крипто-адреса в data-атрибутах'
    : l === 'ru' ? 'Крипто-адрес в data-атрибутах'
    : 'Crypto address in data attributes',

  dataAttributeEmbeddingDetails: (addr: string, l: Locale) =>
    l === 'uk' ? `Крипто-адреса ${addr} знайдена в HTML data-атрибуті. Це може бути використано для відстеження користувачів або автоматичного заповнення адрес.`
    : l === 'ru' ? `Крипто-адрес ${addr} найден в HTML data-атрибуте. Это может использоваться для отслеживания пользователей или автоматического заполнения адрес.`
    : `Crypto address ${addr} found in an HTML data attribute. This may be used for user tracking or automatic address population.`,

  hiddenInputDetails: (addr: string, l: Locale) =>
    l === 'uk' ? `Крипто-адреса ${addr} знайдена в прихованому полі форми (<input type="hidden">). Це може використовуватися для підміни адреси платежу.`
    : l === 'ru' ? `Крипто-адрес ${addr} найден в скрытом поле формы (<input type="hidden">). Это может использоваться для подмены адреса платежа.`
    : `Crypto address ${addr} found in a hidden form field (<input type="hidden">). This may be used to substitute payment addresses.`,

  blacklistIndicator: (l: Locale) =>
    l === 'uk' ? 'Ознаки шахрайської крипто-адреси'
    : l === 'ru' ? 'Признаки мошеннического крипто-адреса'
    : 'Potential scam crypto address indicator',

  blacklistIndicatorDetails: (addr: string, reason: string, l: Locale) =>
    l === 'uk' ? `Адреса ${addr} має ознаки шахрайства: ${reason}. Рекомендується перевірити цю адресу через блокчейн-експлорер перед будь-якими транзакціями.`
    : l === 'ru' ? `Адрес ${addr} имеет признаки мошенничества: ${reason}. Рекомендуется проверить этот адрес через блокчейн-эксплорер перед любыми транзакциями.`
    : `Address ${addr} shows scam indicators: ${reason}. It is recommended to verify this address through a blockchain explorer before any transactions.`,

  seedPhraseFound: (l: Locale) =>
    l === 'uk' ? 'Виявлено потенційну seed-фразу (мнемонічний ключ)'
    : l === 'ru' ? 'Обнаружена потенциальная seed-фраза (мнемонический ключ)'
    : 'Potential seed phrase (mnemonic) detected',

  seedPhraseDetails: (snippet: string, l: Locale) =>
    l === 'uk' ? `Знайдено послідовність слів, що схожа на BIP39 seed-фразу (12/24 слова): "${snippet}". Якщо це справжня фраза відновлення — вона компрометована.`
    : l === 'ru' ? `Найдена последовательность слов, похожая на BIP39 seed-фразу (12/24 слова): "${snippet}". Если это настоящая фраза восстановления — она скомпрометирована.`
    : `Found a word sequence matching a BIP39 mnemonic pattern (12/24 words): "${snippet}". If this is a real recovery phrase, it is compromised.`,

  clipboardHijack: (l: Locale) =>
    l === 'uk' ? 'Виявлено можливе перехоплення буфера обміну'
    : l === 'ru' ? 'Обнаружен возможный перехват буфера обмена'
    : 'Possible clipboard hijacking detected',

  clipboardHijackDetails: (pattern: string, l: Locale) =>
    l === 'uk' ? `Знайдено JavaScript-код, що маніпулює буфером обміну: "${pattern}". Зловмисники використовують це для підміни крипто-адрес при копіюванні.`
    : l === 'ru' ? `Найден JavaScript-код, манипулирующий буфером обмена: "${pattern}". Злоумышленники используют это для подмены крипто-адресов при копировании.`
    : `Found JavaScript code manipulating the clipboard: "${pattern}". Attackers use this to swap crypto addresses when users copy-paste.`,

  ethereumOverride: (l: Locale) =>
    l === 'uk' ? 'Виявлено перевизначення window.ethereum'
    : l === 'ru' ? 'Обнаружено переопределение window.ethereum'
    : 'window.ethereum provider override detected',

  ethereumOverrideDetails: (snippet: string, l: Locale) =>
    l === 'uk' ? `Знайдено перевизначення window.ethereum: "${snippet}". Це може підмінити легітимний MetaMask/Phantom провайдер шкідливим.`
    : l === 'ru' ? `Найдено переопределение window.ethereum: "${snippet}". Это может подменить легитимный MetaMask/Phantom провайдер вредоносным.`
    : `Found window.ethereum override: "${snippet}". This may replace a legitimate MetaMask/Phantom provider with a malicious one.`,

  walletDrainer: (l: Locale) =>
    l === 'uk' ? 'Виявлено патерни wallet drainer'
    : l === 'ru' ? 'Обнаружены паттерны wallet drainer'
    : 'Wallet drainer patterns detected',

  walletDrainerDetails: (pattern: string, l: Locale) =>
    l === 'uk' ? `Знайдено небезпечний Web3-виклик: "${pattern}". Wallet drainer-и використовують необмежені approve/setApprovalForAll для викрадення всіх токенів з гаманця.`
    : l === 'ru' ? `Найден опасный Web3-вызов: "${pattern}". Wallet drainer-ы используют неограниченные approve/setApprovalForAll для кражи всех токенов из кошелька.`
    : `Found dangerous Web3 call: "${pattern}". Wallet drainers use unlimited approve/setApprovalForAll calls to steal all tokens from a wallet.`,
};

export function detectWeb3(content: string, locale: Locale = 'en', pageUrl?: string): Web3Detection {
  const ethMatches = content.match(ETH_ADDRESS_PATTERN) || [];
  const btcLegacyMatches = content.match(BTC_LEGACY_PATTERN) || [];
  const btcBech32Matches = content.match(BTC_BECH32_PATTERN) || [];

  // Deduplicate
  const ethAddresses = [...new Set(ethMatches.map((a) => a.toLowerCase()))];
  const btcAddresses = [...new Set([
    ...btcLegacyMatches,
    ...btcBech32Matches.map(a => a.toLowerCase()),
  ])];

  // Filter likely false positives
  const filteredEthAddresses = filterFalsePositives(content, ethAddresses);
  const filteredBtcAddresses = filterFalsePositives(content, btcAddresses);

  const findings: ScanFinding[] = [];
  const patterns: Web3Pattern[] = [];

  if (filteredEthAddresses.length > 0) {
    const finding = entryToFinding(CRYPTO_ETH_ADDRESS, {
      evidence: ev.ethDetected(filteredEthAddresses.length, locale),
      details: ev.ethDetails(filteredEthAddresses.map((a) => a.slice(0, 10) + '...' + a.slice(-6)).join(', '), locale),
    }, locale);
    findings.push(finding);
  }

  if (filteredBtcAddresses.length > 0) {
    const finding = entryToFinding(CRYPTO_BTC_ADDRESS, {
      evidence: ev.btcDetected(filteredBtcAddresses.length, locale),
      details: ev.btcDetails(filteredBtcAddresses.map((a) => a.slice(0, 8) + '...' + a.slice(-4)).join(', '), locale),
    }, locale);
    findings.push(finding);
  }

  // Pattern detection
  const allAddresses = [...filteredEthAddresses, ...filteredBtcAddresses];
  const detectedPatterns = detectPatterns(content, allAddresses, locale, pageUrl);
  patterns.push(...detectedPatterns);

  // Web3 security threat detection
  findings.push(...detectSeedPhrases(content, locale));
  findings.push(...detectClipboardHijacking(content, locale));
  findings.push(...detectEthereumOverride(content, locale));
  findings.push(...detectWalletDrainer(content, locale));

  return {
    ethAddresses: filteredEthAddresses,
    btcAddresses: filteredBtcAddresses,
    findings,
    patterns,
  };
}

// Detect suspicious patterns for crypto addresses
function detectPatterns(content: string, addresses: string[], locale: Locale, pageUrl?: string): Web3Pattern[] {
  const patterns: Web3Pattern[] = [];
  const seenTypes = new Set<string>();

  for (const addr of addresses) {
    // Case-insensitive search — addresses are lowercased but content may have mixed case (EIP-55)
    const idx = content.toLowerCase().indexOf(addr);
    if (idx === -1) continue;

    const contextBefore = content.slice(Math.max(0, idx - 200), idx);
    const contextAfter = content.slice(idx + addr.length, idx + addr.length + 100);

    // Check: hidden element (display:none, visibility:hidden)
    const hiddenPattern = /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0|height\s*:\s*0|overflow\s*:\s*hidden/i;
    if (hiddenPattern.test(contextBefore)) {
      if (!seenTypes.has('hidden_element')) {
        seenTypes.add('hidden_element');
        patterns.push({
          type: 'hidden_element',
          severity: 'high',
          description: ev.hiddenElement(locale),
          details: ev.hiddenElementDetails(addr.slice(0, 10) + '...' + addr.slice(-6), locale),
          page: pageUrl,
        });
      }
    }

    // Check: embedded in script with dynamic assignment (wallet variable)
    const scriptPattern = /(?:const|let|var|wallet|address|recipient|to|destination)\s*[=:]\s*["'`]/i;
    if (scriptPattern.test(contextBefore)) {
      if (!seenTypes.has('embedded_wallet')) {
        seenTypes.add('embedded_wallet');
        patterns.push({
          type: 'embedded_wallet',
          severity: 'medium',
          description: ev.embeddedWallet(locale),
          details: ev.embeddedWalletDetails(addr.slice(0, 10) + '...' + addr.slice(-6), locale),
          page: pageUrl,
        });
      }
    }

    // Check: in script with dynamic manipulation (innerHTML, append, replace)
    const dynamicPattern = /innerHTML|appendChild|insertAdjacentHTML|replaceWith|textContent\s*=/i;
    if (dynamicPattern.test(contextBefore) || dynamicPattern.test(contextAfter)) {
      if (!seenTypes.has('script_embedding')) {
        seenTypes.add('script_embedding');
        patterns.push({
          type: 'script_embedding',
          severity: 'high',
          description: ev.scriptEmbedding(locale),
          details: ev.scriptEmbeddingDetails(addr.slice(0, 10) + '...' + addr.slice(-6), locale),
          page: pageUrl,
        });
      }
    }

    // Check: address in data-* attribute
    const dataAttrPattern = /data-[a-z-]+\s*=\s*["'][^"']*$/i;
    if (dataAttrPattern.test(contextBefore) || /data-[a-z-]+\s*=\s*["'][^"']*$/.test(content.slice(idx - 50, idx))) {
      // Look for data-* attribute specifically containing the address
      const widerContext = content.slice(Math.max(0, idx - 100), idx + addr.length + 20);
      const dataAttrMatch = widerContext.match(/data-[a-z][a-z0-9-]*\s*=\s*["'][^"']*\b0x[a-fA-F0-9]{40}\b/i);
      if (dataAttrMatch || /^\s*data-[a-z]/i.test(contextBefore.trim().slice(-30))) {
        if (!seenTypes.has('data_attribute_embedding')) {
          seenTypes.add('data_attribute_embedding');
          patterns.push({
            type: 'data_attribute_embedding',
            severity: 'medium',
            description: ev.dataAttributeEmbedding(locale),
            details: ev.dataAttributeEmbeddingDetails(addr.slice(0, 10) + '...' + addr.slice(-6), locale),
            page: pageUrl,
          });
        }
      }
    }

    // Check: address in form hidden field
    const hiddenInputPattern = /<input[^>]+type\s*=\s*["']hidden["'][^>]*value\s*=\s*["'][^"']*$/i;
    if (hiddenInputPattern.test(contextBefore)) {
      const widerContext = content.slice(Math.max(0, idx - 150), idx + addr.length + 10);
      if (/<input[^>]+type\s*=\s*["']hidden["'][^>]+value\s*=\s*["'][^"']*\b0x[a-fA-F0-9]{40}\b/i.test(widerContext)) {
        if (!seenTypes.has('hidden_input_address')) {
          seenTypes.add('hidden_input_address');
          patterns.push({
            type: 'data_attribute_embedding',
            severity: 'high',
            description: ev.hiddenElement(locale),
            details: ev.hiddenInputDetails(addr.slice(0, 10) + '...' + addr.slice(-6), locale),
            page: pageUrl,
          });
        }
      }
    }
  }

  // Check: suspicious repetition — same address 3+ times on same page
  for (const addr of addresses) {
    const regex = new RegExp(escapeRegex(addr), 'gi');
    const matches = content.toLowerCase().match(regex) || [];
    if (matches && matches.length >= 3) {
      if (!seenTypes.has('suspicious_repetition')) {
        seenTypes.add('suspicious_repetition');
        patterns.push({
          type: 'suspicious_repetition',
          severity: 'high',
          description: ev.suspiciousRepetition(locale),
          details: ev.suspiciousRepetitionDetails(addr.slice(0, 10) + '...' + addr.slice(-6), matches.length, locale),
          page: pageUrl,
        });
      }
      break; // only flag once per page
    }
  }

  // Check: multiple addresses in a single script block
  const scriptBlockPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptBlockPattern.exec(content)) !== null) {
    const scriptContent = scriptMatch[1];
    const ethInScript = scriptContent.match(ETH_ADDRESS_PATTERN) || [];
    const btcInScript = scriptContent.match(BTC_LEGACY_PATTERN) || [];
    const btcBech32InScript = scriptContent.match(BTC_BECH32_PATTERN) || [];
    const allInScript = [...ethInScript, ...btcInScript, ...btcBech32InScript];
    const uniqueInScript = new Set(allInScript.map((a) => a.toLowerCase()));
    if (uniqueInScript.size >= 2) {
      // Already flagged by embedded_wallet or script_embedding — add additional context
      if (!seenTypes.has('script_embedding')) {
        seenTypes.add('script_embedding');
        const addrList = [...uniqueInScript].slice(0, 3).map((a) => a.slice(0, 10) + '...' + a.slice(-6)).join(', ');
        patterns.push({
          type: 'script_embedding',
          severity: 'high',
          description: ev.scriptEmbedding(locale),
          details: ev.scriptEmbeddingDetails(addrList, locale),
          page: pageUrl,
        });
      }
      break; // only flag once
    }
  }

  return patterns;
}

// Escape special regex characters in a string
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Check for address reuse across multiple pages
export function detectAddressReuse(
  pageResults: Array<{ url: string; ethAddresses: string[]; btcAddresses: string[] }>,
  locale: Locale = 'en'
): ScanFinding[] {
  const findings: ScanFinding[] = [];

  // Track address -> pages mapping
  const ethPageMap = new Map<string, string[]>();
  const btcPageMap = new Map<string, string[]>();

  for (const page of pageResults) {
    for (const addr of page.ethAddresses) {
      const key = addr.toLowerCase();
      if (!ethPageMap.has(key)) ethPageMap.set(key, []);
      ethPageMap.get(key)!.push(page.url);
    }
    for (const addr of page.btcAddresses) {
      const normalizedAddr = addr.toLowerCase();
      if (!btcPageMap.has(normalizedAddr)) btcPageMap.set(normalizedAddr, []);
      btcPageMap.get(normalizedAddr)!.push(page.url);
    }
  }

  // Find addresses that appear on 2+ pages
  const reusedEth = [...ethPageMap.entries()].filter(([, pages]) => pages.length >= 2);
  const reusedBtc = [...btcPageMap.entries()].filter(([, pages]) => pages.length >= 2);

  const allReused = [
    ...reusedEth.map(([addr, pages]) => ({ address: addr, type: 'ETH' as const, pages })),
    ...reusedBtc.map(([addr, pages]) => ({ address: addr, type: 'BTC' as const, pages })),
  ];

  if (allReused.length > 0) {
    // Use the provided locale instead of hardcoded 'en'
    const addrList = allReused.map((r) => `${r.type}:${r.address.slice(0, 10)}...`).join(', ');
    const maxPages = Math.max(...allReused.map((r) => r.pages.length));

    findings.push({
      id: 'crypto-address-reuse',
      title: locale === 'uk' ? 'Виявлено повторне використання криптоадреси'
        : locale === 'ru' ? 'Обнаружено повторное использование криптоадреса'
        : 'Crypto Address Reuse Detected',
      category: 'crypto',
      severity: allReused.some((r) => r.pages.length >= 3) ? 'high' : 'medium',
      explanation: ev.addressReuse(maxPages, locale),
      howToFix: locale === 'uk'
        ? 'Переконайтеся, що використання тієї ж адреси на кількох сторінках є навмисним. Якщо це система пожертв, розгляньте генерацію унікальних адрес для кожної транзакції.'
        : locale === 'ru'
        ? 'Убедитесь, что использование одного и того же адреса на нескольких страницах является намеренным. Если это система пожертвований, рассмотрите генерацию уникальных адресов для каждой транзакции.'
        : 'Ensure that using the same address across multiple pages is intentional. If this is a donation system, consider generating unique addresses per transaction. If addresses should not be on these pages, investigate for compromised scripts or content.',
      impact: locale === 'uk'
        ? 'Використання тієї ж криптоадреси на кількох сторінках може дозволити відстеження користувачів через блокчейн. У фішингових сценаріях повторні адреси можуть вказувати на систематичну спробу збору криптовалюти.'
        : locale === 'ru'
        ? 'Использование одного и того же криптоадреса на нескольких страницах может позволить отслеживание пользователей через блокчейн. В фишинговых сценариях повторяющиеся адреса могут указывать на систематическую попытку сбора криптовалюты.'
        : 'Reusing the same crypto address across multiple pages can enable blockchain-based user tracking. Anyone monitoring the blockchain can correlate visits to different pages by the same user. In phishing scenarios, repeated addresses may indicate a systematic attempt to collect cryptocurrency from multiple entry points.',
      exploitScenario: locale === 'uk'
        ? 'Ta сама криптоадреса з\'являється на кількох сторінках цього сайту. Цей патерн може вказувати на відстеження користувачів через блокчейн-аналіз, оскільки кожен візит можна корелювати під час надсилання коштів.'
        : locale === 'ru'
        ? 'Один и тот же криптоадрес появляется на нескольких страницах этого сайта. Этот паттерн может указывать на отслеживание пользователей через блокчейн-анализ, поскольку каждый визит можно коррелировать при отправке средств.'
        : 'The same cryptocurrency address appears on multiple pages of this site. This pattern could indicate user tracking through blockchain analysis, as each visit can be correlated when funds are sent. In phishing or scam scenarios, attackers often reuse addresses across multiple fraudulent pages to consolidate stolen funds. Verify the legitimacy of each page displaying the address independently.',
      evidence: ev.addressReuse(maxPages, locale),
      details: ev.addressReuseDetails(addrList, locale),
      references: [
        { label: 'Blockchain Analysis', url: 'https://www.chainalysis.com/' },
      ],
    });
  }

  // Run blacklist checks for ETH addresses that appear on multiple pages
  for (const [addr, pages] of reusedEth) {
    const blacklistFinding = checkAddressBlacklist(addr, pages.length);
    if (blacklistFinding) {
      findings.push(blacklistFinding);
    }
  }

  return findings;
}

// Check ETH address against public APIs for scam indicators
function checkAddressBlacklist(address: string, pageCount: number): ScanFinding | null {
  try {
    // Check if address appears on many pages — combined with zero-tx heuristic
    // We don't actually fetch the API here to avoid slowing down scans;
    // instead we flag addresses that appear on 3+ pages as suspicious
    if (pageCount >= 3) {
      return {
        id: 'blacklist_indicator',
        title: 'Potential Scam Address: Multi-Page Presence',
        category: 'crypto',
        severity: 'high',
        explanation: `Ethereum address ${address.slice(0, 10)}...${address.slice(-6)} appears on ${pageCount} different pages. Legitimate donation or payment addresses typically appear on a single, well-defined page. Presence across multiple pages may indicate a systematic attempt to collect cryptocurrency from multiple entry points.`,
        howToFix: 'Verify the legitimacy of this address by checking it on a blockchain explorer (e.g., Etherscan). Compare it with the officially published address of the entity. If the address appears in places where it should not be, investigate for compromised scripts or content injection.',
        impact: `If this address is used fraudulently, users who send funds to it will lose their cryptocurrency with no recourse. Addresses appearing on multiple pages of a site often indicate either user tracking through blockchain analysis or a systematic collection effort. This is a common pattern in cryptocurrency scam operations.`,
        exploitScenario: `This Ethereum address appears on ${pageCount} pages. In a scam scenario, an attacker may have injected this address into multiple pages through compromised CMS content, third-party scripts, or a supply chain attack. Users visiting different pages are directed to send cryptocurrency to the same attacker-controlled address. Since blockchain transactions are irreversible, victims cannot recover their funds.`,
        evidence: `Address ${address.slice(0, 10)}...${address.slice(-6)} found on ${pageCount} pages`,
        details: `Multi-page presence of a single crypto address is a known indicator of potential scam operations. The address may be legitimate, but the pattern warrants independent verification.`,
        references: [
          { label: 'Etherscan', url: `https://etherscan.io/address/${address}` },
          { label: 'Chainalysis Crypto Scam Indicators', url: 'https://www.chainalysis.com/' },
        ],
      };
    }
  } catch {
    // Never fail the scan due to blacklist check errors
  }
  return null;
}

// Async blacklist check via public API (for future use or optional enhancement)
export async function checkAddressBlacklistAsync(address: string): Promise<{ isSuspicious: boolean; reason: string } | null> {
  try {
    const apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&offset=1`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json() as { status: string; result: unknown[] | string };

    if (data.status === '1' && Array.isArray(data.result)) {
      const txCount = data.result.length;
      if (txCount === 0) {
        return {
          isSuspicious: true,
          reason: 'Zero transaction history detected — this address has never been used on-chain. Combined with its presence on a website, this could indicate a newly created scam address.',
        };
      }
    }

    return null;
  } catch {
    // API unavailable, rate-limited, or network error — never fail the scan
    return null;
  }
}

// BIP39 English word list subset — most common/unique words to reduce false positives
// Full list has 2048 words; we use 200 high-entropy representative words for pattern matching
const BIP39_WORDS = new Set([
  'abandon','ability','able','about','above','absent','absorb','abstract','absurd','abuse',
  'access','accident','account','accuse','achieve','acid','acoustic','acquire','across','action',
  'actor','actual','adapt','address','adjust','admit','adult','advance','advice','aerobic',
  'afford','afraid','again','agent','agree','ahead','aim','airport','aisle','alarm',
  'album','alcohol','alert','alien','alley','allow','almost','alone','alpha','already',
  'alter','always','amateur','amazing','among','amount','amused','analyst','anchor',
  'ancient','anger','angle','angry','animal','ankle','announce','annual','another','answer',
  'antenna','antique','anxiety','arena','argue','armed','armor','army','around','arrange',
  'arrest','arrive','arrow','artefact','artist','artwork','aspect','assault','asset','assist',
  'assume','asthma','athlete','atom','attack','attend','attitude','attract','auction','audit',
  'august','aunt','author','average','avocado','aware','awesome','awful','awkward','bacon',
  'balance','balcony','ball','bamboo','banana','banner','barely','bargain','barrel','basic',
  'basket','battle','beauty','because','become','beef','before','behave','behind','believe',
  'below','bench','benefit','best','betray','better','between','beyond','bicycle','bind',
  'biology','bird','birth','bitter','black','blade','blame','blanket','blast','bleak',
  'bless','blind','blood','blossom','blouse','blue','blur','blush','board','boat',
  'body','boil','bomb','bone','bonus','book','boost','border','boring','borrow',
  'bounce','brain','brand','brave','bridge','brief','bright','bring','brisk','broken',
  'bronze','brown','brush','bubble','buddy','budget','buffalo','build','bulb','bulk',
  'bullet','bundle','bunker','burden','burger','burst','buyer','buzz','cabbage','cabin',
  'cable','cactus','cage','camel','camera','canyon','capable','capital','captain','carbon',
  'careful','carry','casual','catalog','catch','category','cattle','caught','cause','caution',
  'cave','ceiling','celery','cement','census','century','cereal','certain','chair','champion',
  'change','chaos','chapter','charge','chase','cheap','check','cheese','chef','cherry',
  'chest','chicken','chief','child','chimney','choice','choose','chronic','churn','cigar',
  'cinnamon','circle','citizen','civil','claim','clap','clarify','claw','clay','clean',
  'clerk','clever','click','client','cliff','climb','clinic','clip','clock','clog',
  'close','cloth','cloud','clown','club','clump','cluster','clutch','coach','coil',
  'coin','collect','color','column','combine','common','company','concert','conduct','confirm',
  'congress','connect','consider','control','convince','cook','cool','copper','copy','coral',
  'core','corn','correct','cotton','couch','country','couple','course','cousin','cover',
  'coyote','crack','cradle','craft','crane','crash','crazy','cream','credit','creek',
  'crew','cricket','crisp','critic','cross','crouch','crowd','crucial','cruel','crush',
  'crypto','crystal','cube','culture','custom','cycle','dad','damage','danger','daughter',
  'debris','decide','declare','delay','deliver','demand','deny','depend','describe','desert',
  'destroy','detect','device','devote','diagram','diamond','diesel','differ','digital','dignity',
  'dilemma','dinner','dinosaur','direct','discover','disease','divorce','dizzy','doctor','dog',
  'domain','donate','donkey','donor','door','dose','double','dove','draft','dragon',
  'drama','drastic','drift','drink','drive','drop','drum','duck','dump','dune',
  'during','dust','dutch','duty','dwarf','dynamic','eager','eagle','early','earn',
  'earth','easily','east','elegant','elevator','elite','else','embark','embody','embrace',
  'emerge','emotion','employ','empower','empty','enable','enact','endless','endorse','enemy',
  'engage','engine','enhance','enjoy','enlist','enough','enrich','ensure','enter','entire',
  'entry','equal','escape','estate','evidence','evil','evolved','exact','example','excess',
  'exchange','excite','exclude','exhaust','exhibit','exile','exist','exotic','expand','expire',
  'explain','expose','express','extend','extra','fabric','face','faculty','faint','faith',
  'falcon','family','fancy','fantasy','fault','feature','federal','fiber','fiction','figure',
  'file','filter','final','finger','finish','fiscal','fitness','flight','floor','flower',
  'fluid','foam','focus','forest','forget','fortune','forward','fossil','fragile','frame',
  'frequent','fresh','friend','fringe','frog','front','frozen','fruit','fuel','funny',
  'furnace','fury','garage','garden','garlic','garment','gesture','ghost','giant','gift',
  'giggle','giraffe','glacier','glance','glare','glass','glide','glimpse','gloom','glove',
  'glue','goat','goddess','gold','grace','grain','grand','grape','gravity','great',
  'grid','grief','grit','grocery','group','grow','grunt','guard','guess','guide',
  'guilt','guitar','habit','hamster','hand','happy','harsh','harvest','health','heavy',
  'hedgehog','height','hello','helmet','helpful','hero','hidden','high','hint','hobby',
  'hockey','hollow','honey','hood','hope','horn','horse','hospital','hotel','hour',
  'hover','hurdle','husband','hybrid','identify','idle','ignore','image','imitate','immune',
  'impulse','inbox','income','increase','index','indicate','indoor','industry','infant','inflict',
  'inform','inhale','inner','innocent','input','inquiry','insane','insect','inside','inspire',
  'install','intact','interest','invest','invite','iron','island','ivory','jacket','jaguar',
  'jewel','join','journey','judge','jump','jungle','junior','ketchup','kingdom','kitchen',
  'knife','lady','lamp','language','laptop','large','later','laughter','launch','lawn',
  'lawsuit','layer','lazy','leader','learn','legal','legend','lemon','level','lion',
  'liquid','list','lizard','loan','lobster','local','logic','lonely','long','loop',
  'loss','loud','love','loyal','lumber','lunch','luxury','lyrics','mad','mail',
  'mammal','mango','mansion','manual','maple','mask','master','match','material','math',
  'matter','maximum','maze','measure','media','melody','memory','message','metal','method',
  'middle','milk','minimum','miracle','miss','mixture','mobile','modify','mom','monitor',
  'monkey','monster','month','moon','moral','motion','motor','mountain','move','movie',
  'much','muffin','mule','multiply','muscle','museum','mushroom','music','must','mutual',
  'myself','mystery','naive','nature','near','neck','negative','neglect','neither','nephew',
  'nest','never','news','next','nice','night','noble','noise','nominee','noodle',
  'normal','north','notable','novel','nuclear','number','nurse','object','oblige','obscure',
  'obtain','ocean','october','odor','offense','offer','often','olive','olympic','omit',
  'once','option','orange','orbit','orchard','order','ordinary','orphan','ostrich','other',
  'outdoor','outside','oval','owner','oyster','ozone','paddle','panel','panic','panther',
  'parent','park','parrot','party','pass','patch','patient','patrol','pause','peace',
  'pear','peasant','pelican','penalty','pencil','people','pepper','perfect','permit','person',
  'phase','phone','photo','phrase','piano','picnic','piece','pigeon','pilot','pink',
  'pipe','pitch','pizza','pluck','poem','point','polar','police','pond','pool',
  'position','possible','potato','poverty','powder','power','practice','praise','predict','prefer',
  'prepare','present','pretty','prevent','pride','primary','print','priority','problem','process',
  'produce','profit','program','project','promote','protect','proud','provide','public','pulse',
  'pumpkin','pupil','puppy','puzzle','qualify','quantum','quarter','question','quick','quit',
  'quote','rabbit','raccoon','radar','radio','rage','railway','rain','raise','rally',
  'ranch','random','range','rapid','rare','rate','rather','raven','razor','ready',
  'rebel','rebuild','recall','receive','recipe','record','recycle','reduce','reflect','reform',
  'refuse','region','regret','relief','remind','remove','render','renew','replace','report',
  'require','rescue','resign','resist','require','respect','response','result','retire','rewind',
  'rhythm','rich','right','rigid','ring','riot','ripple','rival','river','road',
  'robot','robust','rocket','romance','roof','rookie','round','royal','rubber','rude',
  'sadness','sail','salad','salmon','salon','sand','satisfy','sauce','sausage','save',
  'scale','scene','school','science','scissors','scorpion','scout','screen','script','search',
  'season','seat','secret','section','select','sell','seminar','senior','series','service',
  'setup','seven','shadow','shaft','shallow','share','shed','shell','sheriff','shield',
  'shift','shine','ship','shiver','shoot','short','shoulder','shrug','siege',
  'silver','similar','simple','since','sister','situate','sketch','skill','skin','skirt',
  'skull','slender','slice','slide','slight','slogan','slot','slush','small','smart',
  'smile','smoke','smooth','snack','snake','snow','soap','soccer','social','sock',
  'solar','soldier','solid','solution','solve','someone','song','soon','sorry','south',
  'spatial','special','speed','spider','spoil','spray','spread','spring','square','stable',
  'staff','stage','stairs','stamp','start','state','stay','steak','steel','stem',
  'step','stereo','stick','still','sting','stock','stomach','stone','store','storm',
  'story','stove','strategy','street','strike','strong','struggle','student','stuff','stumble',
  'style','subject','submit','subway','success','sudden','sugar','suggest','suit','sunny',
  'super','supply','supreme','surface','surge','suspect','sustain','swallow','swamp','swap',
  'swear','sweet','swift','swing','symbol','table','tackle','tag','tail','talent',
  'tank','tape','target','taste','teach','team','tell','tenant','that','theme',
  'theory','there','they','thing','three','thumb','tiger','tiny','tired','title',
  'toast','together','toilet','token','toss','total','tourist','toward','tower','town',
  'track','trade','traffic','tragic','train','transfer','trash','travel','tray','treat',
  'tree','trend','tribe','trick','trigger','trim','trouble','truck','truly','trumpet',
  'trust','truth','tube','tuition','tumble','tunnel','turkey','turtle','typical','ugly',
  'umbrella','unable','uncle','uncover','under','undo','unhappy','unique','unit','universe',
  'update','upgrade','uphold','urge','usage','usual','utility','vacant','vacuum','vague',
  'valid','valley','valve','vanish','vapor','various','vault','vehicle','velvet','vendor',
  'venture','verify','victim','victory','video','view','village','vintage','violin','virtual',
  'visa','visit','visual','vital','vivid','vocal','voice','volcano','volume','vote',
  'voyage','wage','wagon','walk','wallet','wand','warfare','warm','warrior','waste',
  'water','wave','wealth','weapon','weather','web','wedding','weekend','weird','welcome',
  'winter','wire','wisdom','witness','woman','wonder','wood','word','world','worry',
  'wrap','wreck','wrestle','wrist','write','yard','year','yellow','young','zebra',
  'zero','zone','zoo',
]);

// Context patterns that indicate documentation/example text — not real exposures
const SEED_SAFE_CONTEXT_PATTERNS = [
  /example|sample|demo|test|dummy|mock|placeholder/i,
  /like[:\s]+\w|such as|for instance|e\.g\.|i\.e\./i,
  /do not|don't|never share|keep.*secret|protect.*phrase/i,
  /what.*seed phrase|how.*seed phrase|about.*mnemonic/i,
  /recovery phrase.*look|phrase.*consist|12.word|24.word/i,
  /enter your.*phrase|type your.*phrase|paste your.*phrase/i,
];

// Well-known test seed phrases that should never be flagged as real exposures
const KNOWN_TEST_PHRASES = new Set([
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  'health health health health health health health health health health health health',
  'test test test test test test test test test test test junk',
  'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong',
  'legal winner thank year wave sausage worth useful legal winner thank yellow',
  'letter advice cage absurd amount doctor acoustic avoid letter advice cage above',
]);

// Detect BIP39 seed phrases (12 or 24 consecutive BIP39 words)
// Only flags when found in credential-like contexts, not in prose documentation.
function detectSeedPhrases(content: string, locale: Locale): ScanFinding[] {
  const findings: ScanFinding[] = [];

  // Strategy 1: Look in <script> tags (highest confidence — code context)
  const scriptBlocks: string[] = [];
  const scriptPattern = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let sm: RegExpExecArray | null;
  while ((sm = scriptPattern.exec(content)) !== null) {
    scriptBlocks.push(sm[1]);
  }

  // Strategy 2: Look in form input values and data attributes
  const inputValues: string[] = [];
  const inputPattern = /(?:value|data-[a-z-]+|placeholder)\s*=\s*["']([^"']{20,})["']/gi;
  let im: RegExpExecArray | null;
  while ((im = inputPattern.exec(content)) !== null) {
    inputValues.push(im[1]);
  }

  // Strategy 3: Look in <code> and <pre> blocks (documentation code examples — lower confidence)
  const codeBlocks: string[] = [];
  const codePattern = /<(?:code|pre)[^>]*>([\s\S]*?)<\/(?:code|pre)>/gi;
  let cm: RegExpExecArray | null;
  while ((cm = codePattern.exec(content)) !== null) {
    codeBlocks.push(cm[1].replace(/<[^>]+>/g, ' '));
  }

  const checkBlock = (text: string, isCodeBlock: boolean): string | null => {
    const words = text.toLowerCase().match(/\b[a-z]{3,12}\b/g) || [];
    let consecutive = 0;
    let startIdx = 0;

    for (let i = 0; i < words.length; i++) {
      if (BIP39_WORDS.has(words[i])) {
        if (consecutive === 0) startIdx = i;
        consecutive++;
        if (consecutive >= 12) {
          const phrase = words.slice(startIdx, startIdx + 12).join(' ');

          // Skip if this is a well-known test phrase
          if (KNOWN_TEST_PHRASES.has(phrase)) return null;

          // Skip if all words are the same (test/placeholder like "health health health")
          const uniqueWords = new Set(phrase.split(' '));
          if (uniqueWords.size <= 3) return null;

          // For code blocks, require stricter context — must look like an assignment or string literal
          if (isCodeBlock) {
            const surroundingContext = text.slice(
              Math.max(0, text.toLowerCase().indexOf(phrase) - 100),
              text.toLowerCase().indexOf(phrase) + phrase.length + 50
            );
            // Must be in a string assignment context or JSON-like structure
            if (!/(=|:|")\s*['"`]/.test(surroundingContext) && !SEED_SAFE_CONTEXT_PATTERNS.some(p => p.test(surroundingContext))) {
              return null;
            }
            // If context says it's an example, skip
            if (SEED_SAFE_CONTEXT_PATTERNS.some(p => p.test(surroundingContext))) return null;
          }

          return phrase;
        }
      } else {
        consecutive = 0;
      }
    }
    return null;
  };

  // Check script blocks (high confidence)
  for (const block of scriptBlocks) {
    const phrase = checkBlock(block, false);
    if (phrase) {
      const snippet = phrase.split(' ').slice(0, 4).join(' ') + ' ...';
      const finding = entryToFinding(WEB3_SEED_PHRASE, {
        evidence: ev.seedPhraseFound(locale),
        details: ev.seedPhraseDetails(snippet, locale),
      }, locale);
      finding.severity = 'critical';
      findings.push(finding);
      return findings; // one is enough
    }
  }

  // Check input values (high confidence)
  for (const val of inputValues) {
    const phrase = checkBlock(val, false);
    if (phrase) {
      const snippet = phrase.split(' ').slice(0, 4).join(' ') + ' ...';
      const finding = entryToFinding(WEB3_SEED_PHRASE, {
        evidence: ev.seedPhraseFound(locale),
        details: ev.seedPhraseDetails(snippet, locale),
      }, locale);
      finding.severity = 'critical';
      findings.push(finding);
      return findings;
    }
  }

  // Check code blocks (medium confidence — lower severity since could be docs)
  for (const block of codeBlocks) {
    const phrase = checkBlock(block, true);
    if (phrase) {
      const snippet = phrase.split(' ').slice(0, 4).join(' ') + ' ...';
      const finding = entryToFinding(WEB3_SEED_PHRASE, {
        evidence: ev.seedPhraseFound(locale),
        details: ev.seedPhraseDetails(snippet, locale),
      }, locale);
      finding.severity = 'high'; // lower than critical since it's in code/pre block
      findings.push(finding);
      return findings;
    }
  }

  return findings;
}

// Detect clipboard hijacking patterns in JS
function detectClipboardHijacking(content: string, locale: Locale): ScanFinding[] {
  const CLIPBOARD_PATTERNS: Array<{ regex: RegExp; label: string }> = [
    { regex: /addEventListener\s*\(\s*['"]copy['"]/i, label: 'addEventListener("copy")' },
    { regex: /addEventListener\s*\(\s*['"]cut['"]/i, label: 'addEventListener("cut")' },
    { regex: /clipboardData\s*\.\s*setData\s*\(/i, label: 'clipboardData.setData()' },
    { regex: /navigator\s*\.\s*clipboard\s*\.\s*writeText\s*\(/i, label: 'navigator.clipboard.writeText()' },
    { regex: /navigator\s*\.\s*clipboard\s*\.\s*write\s*\(/i, label: 'navigator.clipboard.write()' },
    { regex: /document\s*\.\s*execCommand\s*\(\s*['"]copy['"]/i, label: 'document.execCommand("copy")' },
  ];

  for (const { regex, label } of CLIPBOARD_PATTERNS) {
    if (regex.test(content)) {
      // Heuristic: only flag if clipboard code is near a crypto address pattern
      const idx = content.search(regex);
      const context = content.slice(Math.max(0, idx - 300), idx + 300);
      const hasAddress = /0x[a-fA-F0-9]{40}/.test(context)
        || /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/.test(context)
        || /\bbc1[a-zA-HJ-NP-Z0-9]{25,90}\b/.test(context)
        || /wallet|address|crypto|eth|btc|bitcoin|ethereum/i.test(context);
      if (hasAddress) {
        return [entryToFinding(WEB3_CLIPBOARD_HIJACK, {
          evidence: ev.clipboardHijack(locale),
          details: ev.clipboardHijackDetails(label, locale),
        }, locale)];
      }
    }
  }

  return [];
}

// Detect window.ethereum provider override
function detectEthereumOverride(content: string, locale: Locale): ScanFinding[] {
  const OVERRIDE_PATTERNS: RegExp[] = [
    /window\s*\.\s*ethereum\s*=(?!=)/i,
    /window\s*\[\s*['"]ethereum['"]\s*\]\s*=(?!=)/i,
    /Object\.defineProperty\s*\(\s*window\s*,\s*['"]ethereum['"]/i,
    /globalThis\s*\.\s*ethereum\s*=(?!=)/i,
  ];

  for (const pattern of OVERRIDE_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      const snippet = match[0].slice(0, 60);
      return [entryToFinding(WEB3_ETHEREUM_OVERRIDE, {
        evidence: ev.ethereumOverride(locale),
        details: ev.ethereumOverrideDetails(snippet, locale),
      }, locale)];
    }
  }

  return [];
}

// Detect wallet drainer patterns (unlimited approve, setApprovalForAll, permit2, transferFrom)
function detectWalletDrainer(content: string, locale: Locale): ScanFinding[] {
  const DRAINER_PATTERNS: Array<{ regex: RegExp; label: string }> = [
    {
      regex: /approve\s*\([^)]*(?:0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff|MAX_UINT256|MaxUint256|ethers\.constants\.MaxUint256|BigNumber\.from\(['"]0xff)/i,
      label: 'approve(MAX_UINT256)',
    },
    {
      regex: /setApprovalForAll\s*\([^)]*true/i,
      label: 'setApprovalForAll(operator, true)',
    },
    {
      regex: /permit2\s*\.\s*(?:approve|transferFrom|permitTransferFrom)/i,
      label: 'permit2.approve/transferFrom',
    },
    {
      regex: /permitTransferFrom\s*\(/i,
      label: 'permitTransferFrom()',
    },
    {
      regex: /increaseAllowance\s*\([^)]*(?:0xffffffff|MAX_UINT|MaxUint)/i,
      label: 'increaseAllowance(MAX_UINT)',
    },
    {
      // transferFrom called with dynamic address parameters (not a static whitelist)
      regex: /transferFrom\s*\(\s*(?:from|owner|sender|_from)\s*,\s*(?:to|recipient|_to|attacker)/i,
      label: 'transferFrom(victim → attacker)',
    },
    {
      regex: /signTypedData(?:_v4)?\s*\([^)]*spender/i,
      label: 'signTypedData with spender (permit signature)',
    },
  ];

  for (const { regex, label } of DRAINER_PATTERNS) {
    if (regex.test(content)) {
      return [entryToFinding(WEB3_WALLET_DRAINER, {
        evidence: ev.walletDrainer(locale),
        details: ev.walletDrainerDetails(label, locale),
      }, locale)];
    }
  }

  return [];
}

function filterFalsePositives(html: string, addresses: string[]): string[] {
  return addresses.filter((address) => {
    // Filter: BTC legacy addresses that look like content hashes (MD5/SHA-1/SHA-256).
    // Real Bitcoin Base58 addresses MUST contain uppercase letters (the Base58 alphabet
    // includes A-Z except O, I, L). Pure lowercase-hex strings (0-9a-f only) are
    // content-addressed hashes (MD5, SHA-1 truncated, asset fingerprints, etc.).
    // ETH addresses start with 0x so they are never caught by this check.
    if (!address.startsWith('0x') && !address.startsWith('bc1')) {
      if (/^[0-9a-f]+$/.test(address)) return false;
    }

    const idx = html.toLowerCase().indexOf(address.toLowerCase());
    if (idx === -1) return true;

    const contextBefore = html.slice(Math.max(0, idx - 100), idx);
    const contextAfter = html.slice(idx + address.length, idx + address.length + 50);

    if (contextBefore.match(/color\s*:\s*$/)) return false;
    if (contextBefore.match(/background\s*:\s*$/)) return false;
    if (contextAfter.match(/^\s*[,}\]]/) && contextBefore.match(/"test"?\s*:\s*$/)) return false;

    // Filter: inside data: URI (base64-encoded images, SVGs, etc.)
    if (contextBefore.match(/data:[a-zA-Z0-9/+\-.]+[,;]/)) return false;

    // Filter: inside long base64/alphanumeric sequences (> 80 chars without spaces)
    // Real crypto addresses are standalone, not part of long encoded data
    const precedingAlnum = contextBefore.match(/[a-zA-Z0-9+/=]{20,}$/);
    if (precedingAlnum && precedingAlnum[0].length >= 20) return false;
    const followingAlnum = contextAfter.match(/^[a-zA-Z0-9+/=]{20,}/);
    if (followingAlnum && followingAlnum[0].length >= 20) return false;

    // Filter: inside JSON string values that look like encoded data
    if (contextBefore.match(/["'][a-zA-Z0-9+/=]{15,}$/) && contextAfter.match(/^[a-zA-Z0-9+/=]+["']/)) return false;

    return true;
  });
}

// Validate Bitcoin Bech32 address format
export function isValidBtcBech32(address: string): boolean {
  if (!address.startsWith('bc1')) return false;
  const data = address.slice(3);
  return /^[a-zA-HJ-NP-Z0-9]{25,90}$/.test(data);
}

// Validate Bitcoin legacy address (basic checksum validation)
export function isValidBtcLegacy(address: string): boolean {
  if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return false;
  return address.length >= 26 && address.length <= 35;
}
