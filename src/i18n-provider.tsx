import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { en, th } from './i18n-dictionary';

export type Lang = 'en' | 'th';
type Catalog = typeof en;

// Single source of truth (no duplicate "catalog" anymore)
const catalogs: Record<Lang, Catalog> = { en, th };

type I18nCtx = {
  lang: Lang;
  t: (key: keyof Catalog) => string;
  setLang: (lang: Lang) => void;
};

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const initial = (localStorage.getItem('tgn.lang') as Lang) || 'en';
  const [lang, setLang] = useState<Lang>(initial);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('tgn.lang', lang);
    window.dispatchEvent(new CustomEvent('lang:change', { detail: { lang } }));
  }, [lang]);

  const value = useMemo<I18nCtx>(() => {
    return {
      lang,
      t: (key) => catalogs[lang][key],
      setLang,
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return { t: ctx.t, lang: ctx.lang, setLang: ctx.setLang };
}
