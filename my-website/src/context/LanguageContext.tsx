"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Locale, translations, TranslationKeys } from "@/locales";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("th");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("together_go_lang") as Locale | null;
      if (saved === "th" || saved === "en") {
        setLocaleState(saved);
      } else {
        // Detect browser language default
        const browserLang = navigator.language.startsWith("th") ? "th" : "en";
        setLocaleState(browserLang);
      }
    } catch {
      // ignore SSR or localstorage errors
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("together_go_lang", newLocale);
      document.documentElement.lang = newLocale;
    } catch {
      // ignore
    }
  };

  const toggleLocale = () => {
    setLocale(locale === "th" ? "en" : "th");
  };

  const t = translations[locale] || translations.th;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
