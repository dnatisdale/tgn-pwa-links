// src/i18n-provider.tsx

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { dictionary } from './i18n-dictionary'; // dictionary: { en: {...}, th: {...} }

type Lang = keyof typeof dictionary; // e.g. 'en' | 'th'
type Catalog = (typeof dictionary)[Lang];

const catalogs: Record<Lang, Catalog> = dictionary;

type I18nCtx = {
  lang: Lang;
  t: (key: string, fallback?: string) => string;
  setLang: (lang: Lang) => void;
};

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Read saved language or default to 'en'
  const saved = ((): Lang | null => {
    try {
      const v = localStorage.getItem('tgn.lang') as Lang | null;
      return v && catalogs[v] ? v : null;
    } catch {
      return null;
    }
  })();

  const [lang, setLang] = useState<Lang>(saved || 'en');

  useEffect(() => {
    // Keep <html lang="..."> in sync
    document.documentElement.lang = lang;

    try {
      localStorage.setItem('tgn.lang', lang);
    } catch {
      // ignore quota / privacy errors
    }

    // Let listeners know language changed (if anything cares)
    window.dispatchEvent(new CustomEvent('lang:change', { detail: { lang } }));
  }, [lang]);

  const value = useMemo<I18nCtx>(() => {
    return {
      lang,
      t: (key: string, fallback = '') => {
        const bundle = catalogs[lang] || catalogs.en;

        // Look up key in current bundle
        const raw = (bundle as any)[key];

        if (typeof raw === 'string' && raw.trim().length > 0) {
          return raw;
        }

        // Fallback from call site, if provided
        if (fallback && fallback.trim().length > 0) {
          return fallback;
        }

        // As a last resort, return the key itself (useful for debugging)
        return key;
      },
      setLang,
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
