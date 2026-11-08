"use client";

import { useApp } from "@/context/AppContext";
import { Language } from "@/lib/translations";
import { Globe } from "lucide-react";

export default function LanguageSelector({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useApp();

  return (
    <div
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs ${className}`}
    >
      <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
        aria-label="Select Language"
      >
        <option value="en" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          EN - English
        </option>
        <option value="fr" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          FR - Français
        </option>
        <option value="ar" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          AR - العربية
        </option>
      </select>
    </div>
  );
}
