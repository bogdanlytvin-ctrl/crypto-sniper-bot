'use client';

import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Info,
  XCircle,
} from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import type { ScanSummary } from '@/hooks/use-scan';

interface StatsCardsProps {
  summary: ScanSummary | null;
}

export function StatsCards({ summary }: StatsCardsProps) {
  const { t } = useI18n();

  const cards = [
    {
      label: t('totalFindings'),
      value: summary?.total ?? 0,
      icon: Info,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      ringColor: 'ring-sky-500/20',
    },
    {
      label: t('criticalIssues'),
      value: summary?.critical ?? 0,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      ringColor: 'ring-red-500/20',
    },
    {
      label: t('highIssues'),
      value: summary?.high ?? 0,
      icon: AlertTriangle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      ringColor: 'ring-orange-500/20',
    },
    {
      label: t('mediumIssues'),
      value: summary?.medium ?? 0,
      icon: ShieldAlert,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      ringColor: 'ring-yellow-500/20',
    },
    {
      label: t('lowIssues'),
      value: summary?.low ?? 0,
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      ringColor: 'ring-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-card/80"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.bgColor} ring-1 ${card.ringColor}`}
              >
                <Icon className={`h-4.5 w-4.5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
                  {card.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">
                  {card.label}
                </p>
              </div>
            </div>
            {/* Subtle gradient accent on hover */}
            <div
              className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${card.color}`}
            />
          </div>
        );
      })}
    </div>
  );
}
