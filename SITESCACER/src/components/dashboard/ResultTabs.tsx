'use client';

import { Shield, Lock, Coins, Database, RefreshCw, AlertTriangle, CheckCircle2, AlertCircle, Info, BookOpen } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RiskScore } from './RiskScore';
import { StatsCards } from './StatsCards';
import { FindingsList, ExportReportButton } from './FindingsList';
import type { ScanResult, ScanFinding } from '@/hooks/use-scan';

interface ResultTabsProps {
  result: ScanResult;
  onRescan?: (url: string) => void;
  loading?: boolean;
}

function ExecutiveSummary({ findings, riskScore }: { findings: ScanFinding[]; riskScore: number }) {
  const { locale } = useI18n();

  const critical = findings.filter(f => f.severity === 'critical');
  const high = findings.filter(f => f.severity === 'high');
  const medium = findings.filter(f => f.severity === 'medium');

  const topFindings = [...critical, ...high, ...medium].slice(0, 3);

  // Estimate fix time in minutes
  const fixMinutes = critical.length * 30 + high.length * 20 + medium.length * 10;
  const fixLabel = fixMinutes === 0
    ? (locale === 'uk' ? 'Не потрібно' : locale === 'ru' ? 'Не требуется' : 'None needed')
    : fixMinutes < 60
    ? (locale === 'uk' ? `~${fixMinutes} хв` : locale === 'ru' ? `~${fixMinutes} мин` : `~${fixMinutes} min`)
    : (locale === 'uk' ? `~${Math.round(fixMinutes / 60)} год` : locale === 'ru' ? `~${Math.round(fixMinutes / 60)} ч` : `~${Math.round(fixMinutes / 60)}h`);

  const verdict =
    riskScore >= 80 ? { label: locale === 'uk' ? 'Критичний ризик' : locale === 'ru' ? 'Критический риск' : 'Critical Risk', color: 'text-red-400', icon: AlertTriangle, bg: 'bg-red-500/10 border-red-500/20' } :
    riskScore >= 60 ? { label: locale === 'uk' ? 'Високий ризик' : locale === 'ru' ? 'Высокий риск' : 'High Risk', color: 'text-orange-400', icon: AlertCircle, bg: 'bg-orange-500/10 border-orange-500/20' } :
    riskScore >= 35 ? { label: locale === 'uk' ? 'Середній ризик' : locale === 'ru' ? 'Средний риск' : 'Medium Risk', color: 'text-yellow-400', icon: AlertCircle, bg: 'bg-yellow-500/10 border-yellow-500/20' } :
    { label: locale === 'uk' ? 'Низький ризик' : locale === 'ru' ? 'Низкий риск' : 'Low Risk', color: 'text-emerald-400', icon: CheckCircle2, bg: 'bg-emerald-500/10 border-emerald-500/20' };

  const VerdictIcon = verdict.icon;

  const summaryTitle = locale === 'uk' ? 'Резюме для керівника' : locale === 'ru' ? 'Краткий вывод для руководителя' : 'Executive Summary';
  const estimatedFixLabel = locale === 'uk' ? 'Оціночний час усунення' : locale === 'ru' ? 'Время на устранение' : 'Estimated fix time';
  const topIssuesLabel = locale === 'uk' ? 'Основні загрози' : locale === 'ru' ? 'Основные угрозы' : 'Key Issues';
  const noIssuesLabel = locale === 'uk' ? 'Критичних або серйозних загроз не виявлено.' : locale === 'ru' ? 'Критических или серьёзных угроз не обнаружено.' : 'No critical or high-severity issues found.';

  return (
    <div className={`rounded-xl border p-5 ${verdict.bg} mb-6`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{summaryTitle}</h3>
          <div className="flex items-center gap-2">
            <VerdictIcon className={`h-5 w-5 ${verdict.color}`} />
            <span className={`text-lg font-bold ${verdict.color}`}>{riskScore}/100 — {verdict.label}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">{estimatedFixLabel}</p>
          <p className="text-sm font-semibold text-foreground">{fixLabel}</p>
        </div>
      </div>

      {/* Severity distribution bar */}
      {findings.length > 0 && (() => {
        const total = findings.length;
        const crit = findings.filter(f => f.severity === 'critical').length;
        const hi = findings.filter(f => f.severity === 'high').length;
        const med = findings.filter(f => f.severity === 'medium').length;
        const lo = findings.filter(f => f.severity === 'low' || f.severity === 'info').length;
        const pct = (n: number) => total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`;
        return (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1.5">
              {locale === 'uk' ? 'Розподіл знахідок' : locale === 'ru' ? 'Распределение находок' : 'Finding distribution'}
            </p>
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
              {crit > 0 && <div className="bg-red-500" style={{ width: pct(crit) }} title={`Critical: ${crit}`} />}
              {hi > 0  && <div className="bg-orange-500" style={{ width: pct(hi) }} title={`High: ${hi}`} />}
              {med > 0 && <div className="bg-yellow-400" style={{ width: pct(med) }} title={`Medium: ${med}`} />}
              {lo > 0  && <div className="bg-emerald-500" style={{ width: pct(lo) }} title={`Low/Info: ${lo}`} />}
            </div>
            <div className="flex gap-3 mt-1.5 flex-wrap">
              {crit > 0 && <span className="text-[10px] text-red-400 font-medium">● Critical {crit}</span>}
              {hi > 0   && <span className="text-[10px] text-orange-400 font-medium">● High {hi}</span>}
              {med > 0  && <span className="text-[10px] text-yellow-400 font-medium">● Medium {med}</span>}
              {lo > 0   && <span className="text-[10px] text-emerald-400 font-medium">● Low/Info {lo}</span>}
            </div>
          </div>
        );
      })()}

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">{topIssuesLabel}:</p>
        {topFindings.length === 0 ? (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> {noIssuesLabel}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {topFindings.map(f => {
              const severityColors: Record<string, string> = {
                critical: 'text-red-400',
                high: 'text-orange-400',
                medium: 'text-yellow-400',
              };
              return (
                <li key={f.id} className="flex items-start gap-2 text-xs">
                  <Info className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${severityColors[f.severity] || 'text-muted-foreground'}`} />
                  <span className="text-foreground/80">{f.title}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

const OWASP_COLORS: Record<string, string> = {
  'A01': 'text-red-400 bg-red-500/10 border-red-500/20',
  'A02': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'A03': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'A04': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'A05': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'A06': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'A07': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  'A08': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  'A09': 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  'A10': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

function OwaspTab({ findings }: { findings: ScanFinding[] }) {
  const { locale } = useI18n();

  const grouped: Record<string, ScanFinding[]> = {};
  for (const f of findings) {
    const cat = (f as ScanFinding & { owaspCategory?: string }).owaspCategory || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  }

  const sortedCategories = Object.entries(grouped).sort((a, b) => {
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    const maxSev = (arr: ScanFinding[]) => Math.min(...arr.map(f => sevOrder[f.severity] ?? 5));
    return maxSev(a[1]) - maxSev(b[1]);
  });

  const label = locale === 'uk' ? 'знахідок' : locale === 'ru' ? 'находок' : 'findings';

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {locale === 'uk'
          ? 'Знахідки згруповані за категоріями OWASP Top 10 2021'
          : locale === 'ru'
          ? 'Находки сгруппированы по категориям OWASP Top 10 2021'
          : 'Findings grouped by OWASP Top 10 2021 category'}
      </p>
      {sortedCategories.map(([cat, catFindings]) => {
        const codeMatch = cat.match(/^(A\d{2})/);
        const code = codeMatch?.[1] || 'A05';
        const colorClass = OWASP_COLORS[code] || OWASP_COLORS['A05'];
        return (
          <div key={cat} className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colorClass}`}>{code}</span>
              <h3 className="text-sm font-semibold text-foreground">{cat.replace(/^A\d{2}:\d{4}\s*-\s*/, '')}</h3>
              <span className="ml-auto text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {catFindings.length} {label}
              </span>
            </div>
            <FindingsList findings={catFindings} showCategory={true} />
          </div>
        );
      })}
    </div>
  );
}

export function ResultTabs({ result, onRescan, loading }: ResultTabsProps) {
  const { t } = useI18n();

  const { findings, metadata } = result;
  const summary = metadata?.summary;

  const securityFindings = findings.filter((f) => f.category === 'security');
  const cryptoFindings = findings.filter((f) => f.category === 'crypto');
  const dataFindings = findings.filter((f) => f.category === 'data-exposure');

  return (
    <Tabs defaultValue="overview" className="w-full">
      <div className="flex items-center justify-between mb-3">
        <TabsList className="bg-muted/60 border border-border/40 h-10 p-1">
        <TabsTrigger
          value="overview"
          className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-3"
        >
          <Shield className="h-3.5 w-3.5" />
          {t('tabOverview')}
        </TabsTrigger>
        <TabsTrigger
          value="security"
          className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-3"
        >
          <Lock className="h-3.5 w-3.5" />
          {t('tabSecurity')}
          {securityFindings.length > 0 && (
            <span className="ml-0.5 text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0 rounded-full font-semibold">
              {securityFindings.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="crypto"
          className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-3"
        >
          <Coins className="h-3.5 w-3.5" />
          {t('tabCrypto')}
          {cryptoFindings.length > 0 && (
            <span className="ml-0.5 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0 rounded-full font-semibold">
              {cryptoFindings.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="data"
          className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-3"
        >
          <Database className="h-3.5 w-3.5" />
          {t('tabData')}
          {dataFindings.length > 0 && (
            <span className="ml-0.5 text-[10px] bg-pink-500/20 text-pink-400 px-1.5 py-0 rounded-full font-semibold">
              {dataFindings.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="owasp"
          className="gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-3"
        >
          <BookOpen className="h-3.5 w-3.5" />
          OWASP
        </TabsTrigger>
      </TabsList>

        {onRescan && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRescan(result.url)}
            disabled={loading}
            className="h-8 gap-1.5 text-xs border-border/50 hover:border-emerald-500/40 hover:text-emerald-400"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('reScan')}
          </Button>
        )}
      </div>

      {/* Overview Tab */}
      <TabsContent value="overview" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left - Risk Score + Meta */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-xl border border-border/50 bg-card/40 p-6 backdrop-blur-sm">
              <RiskScore score={result.riskScore} size={180} strokeWidth={10} />
            </div>

            {/* Meta Info */}
            <div className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('targetUrl')}
              </h3>
              <p className="text-sm font-mono text-emerald-400 break-all leading-relaxed">
                {result.url}
              </p>

              {metadata?.duration > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{t('scanDuration')}:</span>
                  <span className="font-mono text-foreground">
                    {(metadata.duration / 1000).toFixed(1)}{t('sec')}
                  </span>
                </div>
              )}

              {metadata?.meta && (
                <div className="pt-2 border-t border-border/30 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('metaStatus')}</span>
                    <span className="font-mono text-foreground">
                      {metadata.meta.statusCode}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('metaContentType')}</span>
                    <span className="font-mono text-foreground text-right max-w-[60%] truncate">
                      {metadata.meta.contentType}
                    </span>
                  </div>
                  {metadata.meta.forms > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('metaForms')}</span>
                      <span className="font-mono text-foreground">{metadata.meta.forms}</span>
                    </div>
                  )}
                  {metadata.meta.inputs > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('metaInputs')}</span>
                      <span className="font-mono text-foreground">{metadata.meta.inputs}</span>
                    </div>
                  )}
                  {metadata.crawl && metadata.crawl.pagesScanned > 1 && (
                    <div className="pt-2 border-t border-border/30 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-400 font-medium">{t('pagesScanned')}</span>
                        <span className="font-mono text-foreground">{metadata.crawl.pagesScanned}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{t('crawlDepth')}</span>
                        <span className="font-mono text-foreground">{metadata.crawl.depth}</span>
                      </div>
                    </div>
                  )}
                  {metadata.meta.web3Addresses && metadata.meta.web3Addresses.length > 0 && (
                    <div className="pt-2 border-t border-border/30">
                      <span className="text-xs text-muted-foreground block mb-1">{t('metaWeb3Addresses')}</span>
                      {metadata.meta.web3Addresses.map((addr, i) => (
                        <p key={i} className="text-xs font-mono text-amber-400">
                          {addr.type}: {addr.address.slice(0, 10)}...{addr.address.slice(-6)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right - Executive Summary + Stats + Findings */}
          <div className="lg:col-span-8 space-y-6">
            <ExecutiveSummary findings={findings} riskScore={result.riskScore} />
            <StatsCards summary={summary} />

            <div className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('findings')} ({findings.length})
                </h3>
                <ExportReportButton findings={findings} url={result.url} riskScore={result.riskScore} scanId={result.id} />
              </div>
              <FindingsList findings={findings} showCategory={true} />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Security Tab */}
      <TabsContent value="security" className="mt-6">
        <div className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-foreground">
              {t('categorySecurity')}
            </h3>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              {securityFindings.length} {t('findings').toLowerCase()}
            </span>
          </div>
          <FindingsList findings={securityFindings} showCategory={false} />
        </div>
      </TabsContent>

      {/* Crypto Tab */}
      <TabsContent value="crypto" className="mt-6">
        <div className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground">
              {t('categoryCrypto')}
            </h3>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              {cryptoFindings.length} {t('findings').toLowerCase()}
            </span>
          </div>
          <FindingsList findings={cryptoFindings} showCategory={false} />
        </div>
      </TabsContent>

      {/* Data Tab */}
      <TabsContent value="data" className="mt-6">
        <div className="rounded-xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-4 w-4 text-pink-400" />
            <h3 className="text-sm font-semibold text-foreground">
              {t('categoryDataExposure')}
            </h3>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              {dataFindings.length} {t('findings').toLowerCase()}
            </span>
          </div>
          <FindingsList findings={dataFindings} showCategory={false} />
        </div>
      </TabsContent>

      {/* OWASP Tab */}
      <TabsContent value="owasp" className="mt-6">
        <OwaspTab findings={findings} />
      </TabsContent>
    </Tabs>
  );
}
