'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Coins, Database, ScanSearch, FileCode, ShieldCheck, Server, Wifi, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { useScan } from '@/hooks/use-scan';
import { Header } from '@/components/dashboard/Header';
import { ScanInput } from '@/components/dashboard/ScanInput';
import { ResultTabs } from '@/components/dashboard/ResultTabs';
import { ScanHistory } from '@/components/dashboard/ScanHistory';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

function ScanAnimation() {
  const { t } = useI18n();
  const steps = [
    { icon: Server, label: t('stepHeaders'), key: 'headers' },
    { icon: ShieldCheck, label: t('stepCookies'), key: 'cookies' },
    { icon: FileCode, label: t('stepDom'), key: 'dom' },
    { icon: Wifi, label: t('stepWeb3'), key: 'web3' },
    { icon: FileCode, label: t('stepJsAnalysis'), key: 'js' },
    { icon: ScanSearch, label: t('stepReport'), key: 'report' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto mt-10">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4">
        {/* Animated radar */}
        <div className="flex items-center justify-center">
          <div className="relative h-20 w-20">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-emerald-500/40"
              animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Shield className="h-8 w-8 text-emerald-400" />
              </motion.div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm font-medium text-emerald-400">
          {t('scanProgress')}
        </p>

        {/* Steps list */}
        <div className="space-y-2">
          {steps.map((step, i) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.5, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
              >
                <step.icon className="h-4 w-4 text-emerald-500/70" />
              </motion.div>
              <span className="text-xs text-muted-foreground">{step.label}</span>
              {i < steps.length - 1 && (
                <motion.div
                  className="ml-auto"
                  animate={{ opacity: [0, 1] }}
                  transition={{ delay: (i + 1) * 0.5, duration: 0.3 }}
                >
                  <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { t, locale } = useI18n();
  const { loading, result, history, scanUrl, clearHistory, selectHistoryItem, forceRescan, scanDemo } = useScan();
  const resultRef = useRef<HTMLDivElement>(null);
  const prevLocaleRef = useRef(locale);
  const depthRef = useRef<string>('single');

  // Auto re-scan when locale changes if there are existing results
  useEffect(() => {
    if (prevLocaleRef.current !== locale && result) {
      prevLocaleRef.current = locale;
      scanUrl(result.url, locale, depthRef.current);
    } else {
      prevLocaleRef.current = locale;
    }
  }, [locale]); // intentionally only depend on locale

  const handleScan = (url: string, depth?: string) => {
    if (depth) depthRef.current = depth;
    scanUrl(url, locale, depth || depthRef.current);
  };

  const handleSelectHistory = (item: Parameters<typeof selectHistoryItem>[0]) => {
    selectHistoryItem(item);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/30">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '64px 64px',
              }}
            />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Logo icon */}
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <Shield className="h-8 w-8 text-emerald-500" />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
                {t('appName')}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t('subtitle')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <ScanInput onScan={handleScan} loading={loading} />
            </motion.div>

            {/* Scan Animation */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <ScanAnimation />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.section
              ref={resultRef}
              key="results"
              className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
              {...fadeIn}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Results */}
                <div className="lg:col-span-9">
                  <ResultTabs result={result} onRescan={(url) => forceRescan(url, depthRef.current)} loading={loading} />
                </div>

                {/* Sidebar - Scan History */}
                <div className="lg:col-span-3">
                  <div className="sticky top-20">
                    <ScanHistory
                      history={history}
                      onSelect={handleSelectHistory}
                      onClear={clearHistory}
                      currentScanId={result.id}
                    />
                  </div>
                </div>
              </div>
            </motion.section>
          ) : !loading ? (
            /* Empty State */
            <motion.section
              key="empty"
              className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
              {...fadeIn}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-9">
                  <div className="rounded-xl border border-border/30 border-dashed bg-card/20 p-12 text-center">
                    <motion.div
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                      className="space-y-6"
                    >
                      <motion.div variants={staggerItem} className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                        <ScanSearch className="h-8 w-8 text-muted-foreground/40" />
                      </motion.div>
                      <motion.div variants={staggerItem}>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('emptyTitle')}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-2">
                          {t('emptyDesc')}
                        </p>
                      </motion.div>

                      {/* Feature cards - now localized */}
                      <motion.div
                        variants={staggerItem}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6"
                      >
                        <FeatureCard
                          icon={Lock}
                          title={t('featSecurity')}
                          description={t('featSecurityDesc')}
                          color="text-orange-400"
                          bgColor="bg-orange-500/10"
                          ring="ring-orange-500/15"
                        />
                        <FeatureCard
                          icon={Coins}
                          title={t('featWeb3')}
                          description={t('featWeb3Desc')}
                          color="text-amber-400"
                          bgColor="bg-amber-500/10"
                          ring="ring-amber-500/15"
                        />
                        <FeatureCard
                          icon={Database}
                          title={t('featData')}
                          description={t('featDataDesc')}
                          color="text-pink-400"
                          bgColor="bg-pink-500/10"
                          ring="ring-pink-500/15"
                        />
                      </motion.div>

                      {/* Demo scan button */}
                      <motion.div variants={staggerItem} className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={loading}
                          onClick={() => {
                            scanDemo().then(() => {
                              setTimeout(() => {
                                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }, 200);
                            });
                          }}
                          className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                        >
                          <FlaskConical className="h-4 w-4" />
                          {locale === 'uk' ? 'Сканувати демо-сторінку' : locale === 'ru' ? 'Сканировать демо-страницу' : 'Try Demo Scan'}
                        </Button>
                        <p className="text-[11px] text-muted-foreground/50 mt-1.5">
                          {locale === 'uk' ? 'Спеціально підготовлена сторінка з типовими вразливостями' : locale === 'ru' ? 'Специально подготовленная страница с типичными уязвимостями' : 'A purpose-built page with common vulnerabilities to showcase scanner capabilities'}
                        </p>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>

                {/* Sidebar - History (always visible) */}
                <div className="lg:col-span-3">
                  <div className="sticky top-20">
                    <ScanHistory
                      history={history}
                      onSelect={handleSelectHistory}
                      onClear={clearHistory}
                    />
                  </div>
                </div>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Footer - localized */}
      <footer className="mt-auto border-t border-border/30 bg-background/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-emerald-500/60" />
              <span>SecureScope &mdash; {t('subtitle')}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
              <span>{t('builtFor')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Feature Card Sub-component */
function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  bgColor,
  ring,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  ring: string;
}) {
  return (
    <div className="group rounded-xl border border-border/40 bg-card/30 p-4 transition-all duration-200 hover:border-border/60 hover:bg-card/50">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgColor} ring-1 ${ring} mb-3`}>
        <Icon className={`h-4.5 w-4.5 ${color}`} />
      </div>
      <h3 className="text-xs font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
