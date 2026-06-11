'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface ScanFinding {
  id: string;
  title: string;
  category: 'security' | 'data-exposure' | 'crypto';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence?: 'low' | 'medium' | 'high' | 'verified';
  originalSeverity?: string;
  explanation: string;
  howToFix: string;
  impact: string;
  exploitScenario?: string;
  references: { label: string; url: string }[];
  evidence?: string;
  details?: string;
  sourcePage?: string;
  riskAdjustment?: {
    reason: string;
    from: string;
    to: string;
  };
}

export interface RiskAdjustment {
  findingId: string;
  reason: string;
  originalSeverity: string;
  adjustedSeverity: string;
  relatedFindings: string[];
}

export interface ScanSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  byCategory: Record<string, number>;
}

export interface ScanMeta {
  statusCode: number;
  contentType: string;
  web3Addresses: { type: string; address: string; pages?: string[] }[];
  forms: number;
  inputs: number;
}

export interface CrawlInfo {
  pagesAttempted: number;
  pagesScanned: number;
  pagesFailed: number;
  depth: number;
  urls: string[];
}

export interface ScanResult {
  id: string;
  url: string;
  status: string;
  findings: ScanFinding[];
  riskScore: number;
  riskAdjustments: RiskAdjustment[];
  metadata: {
    timestamp: string;
    duration: number;
    summary: ScanSummary;
    depth: string;
    meta: ScanMeta;
    crawl?: CrawlInfo;
  };
}

export interface HistoryItem {
  id: string;
  url: string;
  riskScore: number;
  summary: ScanSummary | null;
  createdAt: string;
  completedAt: string | null;
  findings?: ScanFinding[];
}

interface ScanState {
  loading: boolean;
  result: ScanResult | null;
  error: string | null;
  history: HistoryItem[];
  historyLoading: boolean;
}

function getStoredLocale(): string {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem('securescope-locale');
    if (stored && ['en', 'uk', 'ru'].includes(stored)) {
      return stored;
    }
  } catch {}
  return 'en';
}

export function useScan() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<ScanState>({
    loading: false,
    result: null,
    error: null,
    history: [],
    historyLoading: false,
  });

  const lastLocaleRef = useRef<string>(getStoredLocale());

  const loadHistory = useCallback(async () => {
    setState((prev) => ({ ...prev, historyLoading: true }));
    try {
      const response = await fetch('/api/scan/history');
      const data = await response.json();
      setState((prev) => ({
        ...prev,
        historyLoading: false,
        history: data.scans || [],
      }));
    } catch {
      setState((prev) => ({ ...prev, historyLoading: false }));
    }
  }, []);

  const scanUrl = useCallback(async (url: string, locale: string = 'en', depth?: string, force?: boolean) => {
    lastLocaleRef.current = locale;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, locale, depth: depth || 'single', force: force || false }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      const result: ScanResult = {
        id: data.id,
        url: data.url,
        status: data.status,
        findings: data.findings,
        riskScore: data.riskScore,
        riskAdjustments: data.riskAdjustments || [],
        metadata: data.metadata,
      };

      setState((prev) => ({ ...prev, loading: false, result }));

      // Reload history after scan
      loadHistory();
      return result;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'An error occurred';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return null;
    }
  }, [loadHistory]);

  const clearHistory = useCallback(async () => {
    try {
      await fetch('/api/scan/history', { method: 'DELETE', headers: { 'x-confirm-delete': 'true' } });
      setState((prev) => ({ ...prev, history: [], result: null }));
    } catch {
      // silently fail
    }
  }, []);

  const selectHistoryItem = useCallback(
    async (item: HistoryItem) => {
      if (item.findings && item.findings.length > 0) {
        const result: ScanResult = {
          id: item.id,
          url: item.url,
          status: 'completed',
          findings: item.findings,
          riskScore: item.riskScore,
          riskAdjustments: [],
          metadata: {
            timestamp: item.createdAt,
            duration: 0,
            summary: item.summary || {
              total: 0,
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
              info: 0,
              byCategory: {},
            },
            depth: 'single',
            meta: {
              statusCode: 200,
              contentType: '',
              web3Addresses: [],
              forms: 0,
              inputs: 0,
            },
          },
        };
        setState((prev) => ({ ...prev, result }));
      } else {
        // Re-scan the URL to get full results
        setState((prev) => ({ ...prev, loading: true }));
        try {
          const response = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: item.url, locale: lastLocaleRef.current }),
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Scan failed');
          }

          setState((prev) => ({
            ...prev,
            loading: false,
            result: {
              id: data.id,
              url: data.url,
              status: data.status,
              findings: data.findings,
              riskScore: data.riskScore,
              riskAdjustments: data.riskAdjustments || [],
              metadata: data.metadata,
            },
          }));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'An error occurred';
          setState((prev) => ({ ...prev, loading: false, error: message }));
        }
      }
    },
    []
  );

  useEffect(() => {
    // Initialize locale from localStorage
    lastLocaleRef.current = getStoredLocale();
    loadHistory();
  }, [loadHistory]);

  const forceRescan = useCallback((url: string, depth?: string) => {
    scanUrl(url, lastLocaleRef.current, depth, true);
  }, [scanUrl]);

  const scanDemo = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const response = await fetch('/api/demo-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Demo scan failed');
      const result: ScanResult = {
        id: data.id,
        url: data.url,
        status: data.status,
        findings: data.findings,
        riskScore: data.riskScore,
        riskAdjustments: data.riskAdjustments || [],
        metadata: data.metadata,
      };
      setState((prev) => ({ ...prev, loading: false, result }));
      loadHistory();
      return result;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'An error occurred';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return null;
    }
  }, [loadHistory]);

  return {
    ...state,
    scanUrl,
    loadHistory,
    clearHistory,
    selectHistoryItem,
    forceRescan,
    scanDemo,
  };
}
