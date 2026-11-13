"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { locale } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-brand-teal dark:hover:text-brand-teal transition-all duration-200 shadow-2xs hover:shadow-xs flex items-center justify-center"
      title={
        theme === "dark"
          ? locale === "th"
            ? "เปลี่ยนเป็นโหมดสว่าง"
            : "Switch to Light Mode"
          : locale === "th"
          ? "เปลี่ยนเป็นโหมดมืด"
          : "Switch to Dark Mode"
      }
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
      ) : (
        <Moon className="w-4 h-4 text-brand-navy" />
      )}
    </button>
  );
}
