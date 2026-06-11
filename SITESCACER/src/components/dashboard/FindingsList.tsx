'use client';

import { useState } from 'react';
import { ExternalLink, AlertTriangle, Info, XCircle, ShieldAlert, Copy, Check, FileDown, AlertOctagon, Globe, Zap } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { ScanFinding } from '@/hooks/use-scan';

interface FindingsListProps {
  findings: ScanFinding[];
  showCategory?: boolean;
}

const severityConfig = {
  critical: {
    color: 'bg-red-500/10 text-red-400 border-red-500/20 ring-red-500/10',
    icon: XCircle,
    dot: 'bg-red-500',
    glow: 'shadow-red-500/5',
  },
  high: {
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20 ring-orange-500/10',
    icon: AlertTriangle,
    dot: 'bg-orange-500',
    glow: 'shadow-orange-500/5',
  },
  medium: {
    color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 ring-yellow-500/10',
    icon: ShieldAlert,
    dot: 'bg-yellow-500',
    glow: 'shadow-yellow-500/5',
  },
  low: {
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ring-emerald-500/10',
    icon: Info,
    dot: 'bg-emerald-500',
    glow: 'shadow-emerald-500/5',
  },
  info: {
    color: 'bg-sky-500/10 text-sky-400 border-sky-500/20 ring-sky-500/10',
    icon: Info,
    dot: 'bg-sky-500',
    glow: 'shadow-sky-500/5',
  },
};

const categoryConfig: Record<string, string> = {
  security: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'data-exposure': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  crypto: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const confidenceConfig: Record<string, { label: string; color: string; title: string }> = {
  verified: { label: '✓ Verified', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', title: 'Cryptographically or format-verified finding' },
  high:     { label: '↑ High',     color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',           title: 'Directly confirmed from HTTP response or DOM' },
  medium:   { label: '~ Medium',   color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',  title: 'Heuristic detection — review recommended' },
  low:      { label: '↓ Low',      color: 'bg-muted text-muted-foreground border-border',            title: 'Pattern-based detection — may need manual verification' },
};

const severityTranslationKey: Record<string, string> = {
  critical: 'severityCritical',
  high: 'severityHigh',
  medium: 'severityMedium',
  low: 'severityLow',
  info: 'severityInfo',
};

const categoryTranslationKey: Record<string, string> = {
  security: 'categorySecurity',
  'data-exposure': 'categoryDataExposure',
  crypto: 'categoryCrypto',
};

function getSeverityOrder(severity: string): number {
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  return order[severity] ?? 5;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400">{t('copied')}</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {label}
        </>
      )}
    </Button>
  );
}

export function ExportReportButton({ findings, url, riskScore, scanId }: { findings: ScanFinding[]; url: string; riskScore: number; scanId?: string }) {
  const { t } = useI18n();

  const handleExportTxt = () => {
    const lines = [
      t('reportTitle'),
      `================================`,
      `URL: ${url}`,
      `${t('reportScore')}: ${riskScore}/100`,
      `${t('reportDate')}: ${new Date().toISOString()}`,
      `${t('reportFindings')}: ${findings.length}`,
      ``,
      `--- ${t('reportFindings').toUpperCase()} ---`,
      ``,
    ];

    for (const f of findings) {
      lines.push(`[${f.severity.toUpperCase()}] ${f.title}`);
      lines.push(`${t('reportCategory')}: ${f.category}`);
      if (f.sourcePage) lines.push(`${t('reportSourcePage')}: ${f.sourcePage}`);
      if (f.evidence) lines.push(`${t('reportEvidence')}: ${f.evidence}`);
      lines.push(``);
      lines.push(`${t('reportExplanation')}:`);
      lines.push(f.explanation);
      lines.push(``);
      if (f.exploitScenario) {
        lines.push(`${t('reportExploitation')}:`);
        lines.push(f.exploitScenario);
        lines.push(``);
      }
      lines.push(`${t('reportImpact')}:`);
      lines.push(f.impact);
      lines.push(``);
      lines.push(`${t('reportHowToFix')}:`);
      lines.push(f.howToFix);
      if (f.riskAdjustment) {
        lines.push(``);
        lines.push(`[${t('reportRiskEscalation')}] ${f.riskAdjustment.from} -> ${f.riskAdjustment.to}`);
        lines.push(f.riskAdjustment.reason);
      }
      if (f.references?.length) {
        lines.push(``);
        lines.push(`${t('reportReferences')}:`);
        f.references.forEach((r) => lines.push(`  - ${r.label}: ${r.url}`));
      }
      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `securescope-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportPdf = async () => {
    if (scanId) {
      // Use server-side professional report generation
      try {
        const response = await fetch(`/api/report?scanId=${encodeURIComponent(scanId)}&format=pdf`);
        if (!response.ok) throw new Error('Failed to generate report');
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `securescope-${new Date().toISOString().slice(0, 10)}.html`;
        link.click();
        URL.revokeObjectURL(link.href);
      } catch {
        // Fallback to client-side generation
        generateClientPdf();
      }
    } else {
      generateClientPdf();
    }
  };

  const handleExportJson = async () => {
    if (scanId) {
      try {
        const response = await fetch(`/api/report?scanId=${encodeURIComponent(scanId)}&format=json`);
        if (!response.ok) throw new Error('Failed to generate report');
        const json = await response.json();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `securescope-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
      } catch {
        // Fallback: minimal client-side JSON
        const minimal = { url, riskScore, findingsCount: findings.length, findings: findings.map(f => ({ title: f.title, severity: f.severity, category: f.category })) };
        const blob = new Blob([JSON.stringify(minimal, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `securescope-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    }
  };

  const generateClientPdf = () => {
    // HTML entity escaping to prevent XSS when opening the downloaded HTML
    const esc = (s: string) => s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    let htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SecureScope Report - ${esc(url)}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:800px;margin:0 auto;padding:40px 20px;color:#1a1a2e;line-height:1.6}
h1{color:#10b981;border-bottom:3px solid #10b981;padding-bottom:10px}
h2{color:#ef4444;margin-top:30px}
h3{color:#f59e0b;margin-top:20px}
.meta{color:#64748b;font-size:14px}
.finding{border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:12px 0;page-break-inside:avoid}
.finding.critical{border-left:4px solid #ef4444}.finding.high{border-left:4px solid #f97316}.finding.medium{border-left:4px solid #eab308}.finding.low{border-left:4px solid #22c55e}.finding.info{border-left:4px solid #0ea5e9}
.severity{display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;color:#fff}
.severity.critical{background:#ef4444}.severity.high{background:#f97316}.severity.medium{background:#eab308}.severity.low{background:#22c55e}.severity.info{background:#0ea5e9}
.evidence{font-family:monospace;font-size:12px;color:#64748b;background:#f8fafc;padding:8px;border-radius:4px;margin:8px 0;word-break:break-all}
.section{background:#f8fafc;padding:12px;border-radius:6px;margin:8px 0}
.exploit{background:#fef2f2;border:1px solid #fecaca;padding:12px;border-radius:6px;color:#991b1b;margin:8px 0}
.escalation{background:#fffbeb;border:1px solid #fde68a;padding:12px;border-radius:6px;margin:8px 0}
.score{font-size:48px;font-weight:bold;color:${riskScore > 60 ? '#ef4444' : riskScore > 30 ? '#f59e0b' : '#10b981'}}
.score-label{font-size:14px;color:#64748b;text-transform:uppercase}
@media print{body{padding:20px}.finding{break-inside:avoid}}
</style></head><body>
<h1>${esc(t('reportTitle'))}</h1>
<div class="meta"><p><strong>${t('reportTarget')}:</strong> ${esc(url)}</p><p><strong>${t('reportDate')}:</strong> ${new Date().toISOString()}</p><p><strong>${t('reportScore')}:</strong> <span class="score">${riskScore}</span><span class="score-label">/100</span></p><p><strong>${t('reportTotalFindings')}:</strong> ${findings.length}</p></div>${(() => {
  // Extract technology hints from evidence strings in fallback
  const techPatterns: string[] = [];
  const techRegex = /(nginx|apache|cloudflare|express|react|next\.js|vue|angular|wordpress|drupal|joomla|jquery|bootstrap|tailwind|firebase|aws|azure|gcp|google analytics|matomo|php|python|ruby|node\.js|django|flask|laravel|spring|rails)/i;
  for (const f of findings) {
    if (f.evidence && techRegex.test(f.evidence)) {
      const matches = f.evidence.match(techRegex);
      if (matches) {
        for (const m of matches) {
          const name = m.charAt(0).toUpperCase() + m.slice(1);
          if (!techPatterns.includes(name)) techPatterns.push(name);
        }
      }
    }
  }
  if (techPatterns.length > 0) {
    return `<div class="meta" style="margin-top:12px"><p><strong>Technologies Detected:</strong> ${techPatterns.map(n => esc(n)).join(', ')}</p><p style="font-size:11px;color:#94a3b8">* Technology detection limited in offline report. Use server-generated report for full details.</p></div>`;
  }
  return '';
})()}<h2>Findings</h2>`;
    for (const f of findings) {
      htmlContent += `<div class="finding ${esc(f.severity)}"><h3><span class="severity ${esc(f.severity)}">${esc(f.severity.toUpperCase())}</span> ${esc(f.title)}</h3><p><strong>Category:</strong> ${esc(f.category)}${f.sourcePage ? ` | <strong>Page:</strong> ${esc(f.sourcePage)}` : ''}</p>${f.evidence ? `<div class="evidence">${esc(f.evidence)}</div>` : ''}<div class="section"><strong>Explanation:</strong><br>${esc(f.explanation)}</div><div class="exploit"><strong>Possible Impact:</strong><br>${esc(f.exploitScenario || 'N/A')}</div><div class="section"><strong>Impact:</strong><br>${esc(f.impact)}</div><div class="section"><strong>How to Fix:</strong><br>${esc(f.howToFix)}</div>${f.riskAdjustment ? `<div class="escalation"><strong>Risk Escalated:</strong> ${esc(f.riskAdjustment.from)} &rarr; ${esc(f.riskAdjustment.to)}<br><em>${esc(f.riskAdjustment.reason)}</em></div>` : ''}</div>`;
    }
    htmlContent += `<footer style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;text-align:center">${esc(t('reportGeneratedBy'))}<br>${new Date().toISOString()}</footer></body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `securescope-${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExportPdf}
        className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2"
      >
        <FileDown className="h-3 w-3" />
        {t('downloadPdf')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExportJson}
        className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2"
      >
        <FileDown className="h-3 w-3" />
        {t('exportJson')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExportTxt}
        className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2"
      >
        <FileDown className="h-3 w-3" />
        {t('exportTxt')}
      </Button>
    </div>
  );
}

export function FindingsList({ findings, showCategory = true }: FindingsListProps) {
  const { t } = useI18n();

  if (!findings || findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20 mb-4">
          <ShieldAlert className="h-7 w-7 text-emerald-500" />
        </div>
        <p className="text-sm text-muted-foreground">{t('noFindings')}</p>
      </div>
    );
  }

  const sorted = [...findings].sort(
    (a, b) => getSeverityOrder(a.severity) - getSeverityOrder(b.severity)
  );

  return (
    <Accordion type="multiple" className="w-full">
      {sorted.map((finding, index) => {
        const severity = severityConfig[finding.severity] || severityConfig.info;
        const SeverityIcon = severity.icon;

        return (
          <AccordionItem
            key={`${finding.id}-${index}`}
            value={`${finding.id}-${index}`}
            className={`border-border/40 bg-card/50 rounded-lg px-1 mb-2 backdrop-blur-sm shadow-sm ${severity.glow}`}
          >
            <AccordionTrigger className="hover:no-underline py-3.5 px-2 group">
              <div className="flex items-start gap-3 flex-1 text-left">
                <div className="flex h-7 w-7 shrink-0 mt-0.5 items-center justify-center rounded-md bg-muted/50">
                  <SeverityIcon className={`h-4 w-4 ${severity.color.split(' ')[1]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-5 font-semibold border ${severity.color}`}
                    >
                      {t(severityTranslationKey[finding.severity] as Parameters<typeof t>[0])}
                    </Badge>
                    {showCategory && finding.category && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-5 font-medium border ${categoryConfig[finding.category] || 'bg-muted text-muted-foreground border-muted'}`}
                      >
                        {t(categoryTranslationKey[finding.category] as Parameters<typeof t>[0])}
                      </Badge>
                    )}
                    {finding.confidence && confidenceConfig[finding.confidence] && (
                      <Badge
                        variant="outline"
                        title={confidenceConfig[finding.confidence].title}
                        className={`text-[10px] px-1.5 py-0 h-5 font-medium border ${confidenceConfig[finding.confidence].color}`}
                      >
                        {confidenceConfig[finding.confidence].label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug pr-2">
                    {finding.title}
                  </p>
                  {finding.riskAdjustment && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                      <Zap className="h-3 w-3" />
                      {t('aiInsight')}
                    </span>
                  )}
                  {finding.evidence && (
                    <p className="text-xs text-muted-foreground/70 mt-1 font-mono truncate max-w-full">
                      {finding.evidence}
                    </p>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 pb-4 pt-0">
              <div className="space-y-4 ml-10 border-l-2 border-border/30 pl-4">
                {finding.explanation && (
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                      {t('explanation')}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {finding.explanation}
                    </p>
                  </div>
                )}

                {finding.impact && (
                  <div>
                    <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1.5">
                      {t('impact')}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {finding.impact}
                    </p>
                  </div>
                )}

                {finding.howToFix && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                        {t('howToFix')}
                      </h4>
                      <CopyButton text={finding.howToFix} label={t('copyFix')} />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {finding.howToFix}
                    </p>
                  </div>
                )}

                {finding.details && (
                  <div>
                    <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1.5">
                      {t('details')}
                    </h4>
                    <pre className="text-xs text-muted-foreground font-mono bg-muted/50 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words">
                      {finding.details}
                    </pre>
                  </div>
                )}

                {finding.exploitScenario && (
                  <div>
                    <h4 className="text-xs font-semibold text-red-400/90 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <AlertOctagon className="h-3.5 w-3.5" />
                      {t('exploitScenario')}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                      {finding.exploitScenario}
                    </p>
                  </div>
                )}

                {finding.riskAdjustment && (
                  <div>
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      {t('riskEscalated')}
                    </h4>
                    <div className="text-sm text-muted-foreground leading-relaxed bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{t('riskOriginal')}:</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-muted">{finding.riskAdjustment.from}</Badge>
                        <span className="text-amber-400">&rarr;</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-amber-500/30 text-amber-400">{finding.riskAdjustment.to}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{finding.riskAdjustment.reason}</p>
                    </div>
                  </div>
                )}

                {finding.sourcePage && finding.sourcePage !== finding.title && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                    <Globe className="h-3 w-3" />
                    <span>{t('sourcePage')}: {finding.sourcePage}</span>
                  </div>
                )}

                {finding.references && finding.references.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      {t('references')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {finding.references.map((ref, refIdx) => (
                        <a
                          key={refIdx}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/5 hover:bg-emerald-500/10 px-2.5 py-1.5 rounded-md ring-1 ring-emerald-500/10"
                        >
                          {ref.label}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
