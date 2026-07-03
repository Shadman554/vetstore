import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Language, translate, setI18nRefreshCallback } from "./i18n-core";

export type { Language };

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("kid-store-lang");
    return (saved as Language) || "EN";
  });
  const [, setRevision] = useState(0);

  useEffect(() => {
    setI18nRefreshCallback(() => setRevision((r) => r + 1));
    return () => { setI18nRefreshCallback(() => {}); };
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("kid-store-lang", newLang);
  };

  const isRtl = lang === "AR" || lang === "KU";

  useEffect(() => {
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang.toLowerCase();
  }, [lang, isRtl]);

  const t = (key: string, params?: Record<string, string | number>) =>
    translate(key, lang, params);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRtl }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
