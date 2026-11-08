"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { translations, Language, TranslationKey } from "@/lib/translations";

interface AppContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  dir: "ltr" | "rtl";
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("workpulse_theme") as "light" | "dark" | null;
      if (savedTheme === "dark" || savedTheme === "light") {
        setThemeState(savedTheme);
        if (savedTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setThemeState("dark");
        document.documentElement.classList.add("dark");
      }

      const savedLang = localStorage.getItem("workpulse_lang") as Language | null;
      if (savedLang && (savedLang === "en" || savedLang === "fr" || savedLang === "ar")) {
        setLanguageState(savedLang);
        document.documentElement.setAttribute("lang", savedLang);
        document.documentElement.setAttribute("dir", savedLang === "ar" ? "rtl" : "ltr");
      }
    } catch (e) {
      console.error("Failed to read theme/language from localStorage", e);
    } finally {
      setMounted(true);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem("workpulse_theme", next);
      } catch (e) {
        console.error(e);
      }
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("workpulse_lang", lang);
    } catch (e) {
      console.error(e);
    }
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  }, []);

  const dir: "ltr" | "rtl" = language === "ar" ? "rtl" : "ltr";

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = translations[language] || translations.en;
      return dict[key] || translations.en[key] || key;
    },
    [language]
  );

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        language,
        setLanguage,
        t,
        dir,
      }}
    >
      <div className={mounted ? "" : "opacity-0 transition-opacity duration-150"}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
