"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { uk } from "./uk";
import { en } from "./en";
import type { Translations } from "./uk";

type Language = "uk" | "en";

interface LanguageContextValue {
  language: Language;
  translations: Translations;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const translationsMap: Record<Language, Translations> = {
  uk,
  en,
};

const STORAGE_KEY = "omg-language";

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "uk";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "uk" || stored === "en") return stored;
  } catch {
    // localStorage not available
  }
  return "uk";
}

function persistLanguage(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // localStorage not available
  }
  document.documentElement.lang = lang;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const hasHydrated = useRef(false);

  // Sync document lang attribute on mount and persist initial choice
  useEffect(() => {
    persistLanguage(language);
    hasHydrated.current = true;
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (hasHydrated.current) {
      persistLanguage(lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === "uk" ? "en" : "uk";
      if (hasHydrated.current) {
        persistLanguage(next);
      }
      return next;
    });
  }, []);

  const translations = useMemo(
    () => translationsMap[language],
    [language]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      translations,
      setLanguage,
      toggleLanguage,
    }),
    [language, translations, setLanguage, toggleLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
