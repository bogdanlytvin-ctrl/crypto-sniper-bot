import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');
const SCAN_LOG_DIR = path.join(LOGS_DIR, 'scans');
const API_LOG_FILE = path.join(LOGS_DIR, 'api.log');

// Ensure log directories exist
function ensureDirs(): void {
  try {
    if (!fs.existsSync(SCAN_LOG_DIR)) {
      fs.mkdirSync(SCAN_LOG_DIR, { recursive: true });
    }
  } catch {
    // Ignore errors (e.g., read-only filesystem)
  }
}

// Format timestamp for filenames
function timestampForFile(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

// Format timestamp for log lines
function timestampForLine(): string {
  return new Date().toISOString();
}

export interface ScanLogEntry {
  timestamp: string;
  scanId: string;
  url: string;
  locale: string;
  depth: string;
  status: 'scanning' | 'completed' | 'failed';
  riskScore?: number;
  findingsCount?: number;
  duration?: number;
  summary?: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  findings?: unknown[];
  riskAdjustments?: unknown[];
  metadata?: Record<string, unknown>;
  error?: string;
}

/**
 * Save a completed scan result as a JSON log file.
 * Each scan gets its own file for easy per-scan review.
 */
export function saveScanLog(entry: ScanLogEntry): string {
  ensureDirs();

  const filename = `${entry.scanId}_${timestampForFile()}.json`;
  const filepath = path.join(SCAN_LOG_DIR, filename);

  try {
    fs.writeFileSync(filepath, JSON.stringify(entry, null, 2), 'utf-8');
  } catch {
    // Ignore write errors
  }

  // Also append a one-line summary to api.log
  const summary = entry.status === 'completed'
    ? `[SCAN] ${entry.url} | score:${entry.riskScore} | findings:${entry.findingsCount} | duration:${entry.duration}ms | locale:${entry.locale}`
    : `[SCAN-FAIL] ${entry.url} | error: ${entry.error || 'unknown'}`;

  appendToApiLog(summary);

  return filepath;
}

export interface ApiLogEntry {
  timestamp: string;
  method: string;
  path: string;
  status: number;
  duration?: number;
  ip?: string;
  error?: string;
  body?: Record<string, unknown>;
}

/**
 * Log an API request/response to api.log
 */
export function logApiRequest(entry: ApiLogEntry): void {
  ensureDirs();

  const line = `[API] ${entry.method} ${entry.path} | status:${entry.status} | duration:${entry.duration || 0}ms | ip:${entry.ip || '-'}${entry.error ? ` | error: ${entry.error}` : ''}`;

  appendToApiLog(line);
}

function appendToApiLog(line: string): void {
  try {
    const entry = `${timestampForLine()} ${line}\n`;
    fs.appendFileSync(API_LOG_FILE, entry, 'utf-8');
  } catch {
    // Ignore write errors
  }
}

/**
 * Get the N most recent scan log files.
 */
export function getRecentScanLogs(limit: number = 20): ScanLogEntry[] {
  ensureDirs();

  try {
    const files = fs.readdirSync(SCAN_LOG_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);

    return files.map(f => {
      try {
        const content = fs.readFileSync(path.join(SCAN_LOG_DIR, f), 'utf-8');
        return JSON.parse(content) as ScanLogEntry;
      } catch {
        return null;
      }
    }).filter((e): e is ScanLogEntry => e !== null);
  } catch {
    return [];
  }
}

/**
 * Get all lines from api.log (last N lines)
 */
export function getApiLogLines(limit: number = 100): string[] {
  ensureDirs();

  try {
    if (!fs.existsSync(API_LOG_FILE)) return [];

    const content = fs.readFileSync(API_LOG_FILE, 'utf-8');
    const lines = content.trim().split('\n');
    return lines.slice(-limit);
  } catch {
    return [];
  }
}

/**
 * Log a general message
 */
export function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  ensureDirs();
  const line = `[${level.toUpperCase()}] ${timestampForLine()} ${message}\n`;
  try {
    fs.appendFileSync(API_LOG_FILE, line, 'utf-8');
  } catch {
    // Ignore
  }
}
