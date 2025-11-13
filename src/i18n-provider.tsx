// src/i18n-provider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { dictionary } from './i18n-dictionary'; // { en: {...}, th: {...} }

type Lang = 'en' | 'th';
type Catalog = (typeof dictionary)[Lang];

const catalogs: Record<Lang, Catalog> = dictionary;

type I18nCtx = {
  // canonical key used everywhere
  lang: Lang;

  // translator helper
  t: (key: string, fallback?: string) => string;

  // explicit setter and a simple flip (so Header can call toggleLanguage)
  setLang: (lang: Lang) => void;
  toggleLanguage: () => void;

  // optional alias for older files
  uiLang: Lang;
};

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // read saved or default to English
  const saved = (() => {
    try {
      const raw = localStorage.getItem('tgn.lang') as Lang | null;
      return raw === 'th' || raw === 'en' ? raw : null;
    } catch {
      return null;
    }
  })();

  const [lang, setLang] = useState<Lang>(saved ?? 'en');

  useEffect(() => {
    // keep <html lang="..."> in sync, so screen readers & browser UI follow
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('tgn.lang', lang);
    } catch {
      /* ignore */
    }
    // (optional) notify listeners
    window.dispatchEvent(new CustomEvent('lang:change', { detail: { lang } }));
  }, [lang]);

  const value = useMemo<I18nCtx>(() => {
    const t = (key: string, fallback = '') => {
      const bundle = catalogs[lang] || catalogs.en;
      const val = (bundle as any)[key];
      if (typeof val === 'string' && val.trim()) return val;
      return fallback || key;
    };

    const toggleLanguage = () => setLang((prev) => (prev === 'en' ? 'th' : 'en'));

    return { lang, t, setLang, toggleLanguage, uiLang: lang };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
