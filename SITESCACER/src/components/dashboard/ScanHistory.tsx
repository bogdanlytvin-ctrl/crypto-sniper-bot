'use client';

import { Clock, Trash2, Shield } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { HistoryItem } from '@/hooks/use-scan';

interface ScanHistoryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  currentScanId?: string;
}

function getRiskBadgeColor(score: number): string {
  if (score <= 30) return 'text-emerald-400 bg-emerald-500/10';
  if (score <= 60) return 'text-yellow-400 bg-yellow-500/10';
  if (score <= 80) return 'text-orange-400 bg-orange-500/10';
  return 'text-red-400 bg-red-500/10';
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs}s`;
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function truncateUrl(url: string, maxLen: number = 40): string {
  try {
    const parsed = new URL(url);
    const display = parsed.hostname + parsed.pathname;
    if (display.length > maxLen) {
      return display.substring(0, maxLen) + '...';
    }
    return display;
  } catch {
    return url.length > maxLen ? url.substring(0, maxLen) + '...' : url;
  }
}

export function ScanHistory({ history, onSelect, onClear, currentScanId }: ScanHistoryProps) {
  const { t } = useI18n();

  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/40 p-6 text-center">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">{t('noHistory')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{t('scanHistory')}</h3>
          <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
            {history.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-red-400 gap-1"
          onClick={onClear}
        >
          <Trash2 className="h-3 w-3" />
          {t('deleteHistory')}
        </Button>
      </div>

      <ScrollArea className="max-h-96">
        <div className="p-2">
          {history.map((item, index) => {
            const isActive = item.id === currentScanId;
            return (
              <div key={item.id}>
                {index > 0 && <Separator className="opacity-40 my-1" />}
                <button
                  onClick={() => onSelect(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group ${
                    isActive
                      ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                    <Shield className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate font-mono">
                      {truncateUrl(item.url)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-md ${getRiskBadgeColor(item.riskScore)}`}
                  >
                    {item.riskScore}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
