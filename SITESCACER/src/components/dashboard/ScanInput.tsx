'use client';

import { useState, useCallback } from 'react';
import { Shield, Loader2, Search, Layers } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ScanInputProps {
  onScan: (url: string, depth?: string) => void;
  loading: boolean;
}

export function ScanInput({ onScan, loading }: ScanInputProps) {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState<string>('single');
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const isValidUrl = useCallback((str: string): boolean => {
    try {
      const parsed = new URL(str);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmed = url.trim();
      if (!trimmed) {
        setError(t('invalidUrl'));
        return;
      }

      if (!isValidUrl(trimmed)) {
        setError(t('invalidUrl'));
        return;
      }

      onScan(trimmed, depth);
    },
    [url, depth, isValidUrl, onScan, t]
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative flex flex-col gap-3 sm:flex-row sm:gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t('scanPlaceholder')}
              className="h-12 pl-10 pr-4 text-sm font-mono bg-card border-border/60 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 shadow-lg shadow-black/5"
              disabled={loading}
              autoComplete="url"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:shadow-emerald-500/25 disabled:opacity-50 sm:w-auto w-full"
            translate="no"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span suppressHydrationWarning>{t('scanning')}</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                <span suppressHydrationWarning>{t('scanButton')}</span>
              </>
            )}
          </Button>
        </div>

        {/* Depth selector */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{t('scanDepth')}</span>
          </div>
          <ToggleGroup
            type="single"
            value={depth}
            onValueChange={(val) => {
              if (val) setDepth(val);
            }}
            className="gap-1"
            disabled={loading}
          >
            <ToggleGroupItem
              value="single"
              size="sm"
              className="h-7 px-3 text-xs data-[state=on]:bg-emerald-600/15 data-[state=on]:text-emerald-400 data-[state=on]:border-emerald-500/30"
            >
              {t('depthSingle')}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="multi"
              size="sm"
              className="h-7 px-3 text-xs data-[state=on]:bg-emerald-600/15 data-[state=on]:text-emerald-400 data-[state=on]:border-emerald-500/30"
            >
              {t('depthMulti')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {error && (
          <p className="text-sm text-red-400 flex items-center gap-1.5 pl-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" />
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
