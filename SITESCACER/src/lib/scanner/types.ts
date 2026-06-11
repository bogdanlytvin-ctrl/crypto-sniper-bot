// Types for the scanner
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Category = 'security' | 'data-exposure' | 'crypto';
export type Confidence = 'low' | 'medium' | 'high' | 'verified';

export interface ScanFinding {
  id: string;
  title: string;
  category: Category;
  severity: Severity;
  confidence?: Confidence; // filled by entryToFinding or scanner.ts post-processing (default: 'medium')
  originalSeverity?: Severity; // before risk engine adjustment
  explanation: string;
  howToFix: string;
  impact: string;
  exploitScenario?: string; // "How it can be exploited" section
  references: { label: string; url: string }[];
  evidence?: string;
  details?: string;
  sourcePage?: string; // URL of the page where this was found (multi-page scans)
  riskAdjustment?: {
    reason: string;
    from: Severity;
    to: Severity;
  };
  owaspCategory?: string; // e.g., 'A03:2021-Injection', 'A05:2021-Security Misconfiguration'
}

export interface RiskAdjustment {
  findingId: string;
  reason: string;
  originalSeverity: Severity;
  adjustedSeverity: Severity;
  relatedFindings: string[];
}

export interface CrawlStats {
  pagesAttempted: number;
  pagesScanned: number;
  pagesFailed: number;
  depth: number;
  urls: string[];
}

export interface ScanResult {
  url: string;
  timestamp: string;
  duration: number; // ms
  riskScore: number;
  findings: ScanFinding[];
  riskAdjustments: RiskAdjustment[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    byCategory: Record<Category, number>;
    byOwasp: Record<string, number>;
  };
  meta: {
    statusCode: number;
    contentType: string;
    headers: Record<string, string>;
    cookies: string[];
    web3Addresses: { type: 'ETH' | 'BTC'; address: string; pages?: string[] }[];
    forms: number;
    inputs: number;
    scripts: string[];
    technologies: TechDetection[];
  };
  crawl?: CrawlStats;
}

export interface TechDetection {
  category: 'server' | 'framework' | 'cms' | 'cdn' | 'library' | 'analytics' | 'language';
  name: string;
  version?: string;
  evidence: string;
}

export interface ScanJob {
  id: string;
  url: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  progress: number;
  result?: ScanResult;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

// Page data from crawler
export interface CrawledPage {
  url: string;
  body: string;
  headers: Record<string, string>;
  setCookies: string[];
  statusCode: number;
  contentType: string;
}
