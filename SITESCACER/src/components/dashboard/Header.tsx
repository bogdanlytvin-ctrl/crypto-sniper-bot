'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Globe, Sun, Moon, Info } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useI18n, SUPPORTED_LOCALES, type Locale } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  uk: '🇺🇦',
  ru: '🇷🇺',
};

const localeLabels: Record<Locale, string> = {
  en: 'English',
  uk: 'Українська',
  ru: 'Русский',
};

export function Header() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const pathname = usePathname();
  const isAbout = pathname === '/about';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <Shield className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span suppressHydrationWarning className="text-base font-bold tracking-tight text-foreground">
              {t('appName')}
            </span>
            <span suppressHydrationWarning className="hidden text-[11px] leading-none text-muted-foreground sm:block">
              {t('subtitle')}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link href="/about">
            <Button
              variant="ghost"
              size="sm"
              translate="no"
              className={`gap-1.5 text-xs font-medium ${isAbout ? 'text-emerald-400 bg-emerald-500/10' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Info className="h-3.5 w-3.5" />
              <span suppressHydrationWarning translate="no">
                {locale === 'uk' ? 'Можливості' : locale === 'ru' ? 'Возможности' : 'Features'}
              </span>
            </Button>
          </Link>
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground"
                aria-label="Switch language"
                translate="no"
              >
                <Globe className="h-4 w-4" />
                <span suppressHydrationWarning className="hidden text-xs font-medium sm:inline" translate="no">
                  {localeFlags[locale]} {localeLabels[locale]}
                </span>
                <span suppressHydrationWarning className="text-sm sm:hidden" translate="no">{localeFlags[locale]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44" translate="no">
              {SUPPORTED_LOCALES.map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={
                    locale === loc
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                >
                  <span className="mr-2">{localeFlags[loc]}</span>
                  {localeLabels[loc]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            translate="no"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </header>
  );
}
