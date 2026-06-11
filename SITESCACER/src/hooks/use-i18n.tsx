'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { t as translate, type Locale, SUPPORTED_LOCALES } from '@/lib/i18n/translations';

type TranslationKey = Parameters<typeof translate>[1];

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  mounted: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem('securescope-locale');
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch {}
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // IMPORTANT: Always start with 'en' to match server-side render.
  // Reading localStorage during useState init would cause a hydration mismatch
  // because the server always renders with 'en' (no localStorage).
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  // Read the saved locale only after mount (client-side only, after hydration)
  useEffect(() => {
    const stored = getStoredLocale();
    setLocaleState(stored);
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('securescope-locale', newLocale);
    } catch {}
    // Update document lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
  }, []);

  // Always return 'en' translation until mounted to match server-side render.
  // React 19 Strict Mode preserves state across double-mount, so locale may
  // already be 'ru'/'uk' during hydration — using 'en' prevents the mismatch.
  const t = useCallback(
    (key: TranslationKey) => translate(mounted ? locale : 'en', key),
    [locale, mounted]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, mounted }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export { SUPPORTED_LOCALES };
export type { Locale, TranslationKey };
