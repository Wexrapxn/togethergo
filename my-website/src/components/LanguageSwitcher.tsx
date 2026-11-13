"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export function LanguageSwitcher({ compact: _compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="inline-flex items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700 rounded-full p-0.5 shadow-xs">
      <button
        type="button"
        onClick={() => setLocale("th")}
        className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
          locale === "th"
            ? "bg-brand-navy dark:bg-brand-teal text-white shadow-xs"
            : "text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white"
        }`}
        title="ภาษาไทย (Thai)"
      >
        TH
      </button>

      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
          locale === "en"
            ? "bg-brand-navy dark:bg-brand-teal text-white shadow-xs"
            : "text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white"
        }`}
        title="English"
      >
        EN
      </button>
    </div>
  );
}
