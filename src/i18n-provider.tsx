// src/i18n-provider.tsx  (Option B version)
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { dictionary, type I18nKey } from './i18n-dictionary';

type Lang = keyof typeof dictionary; // 'en' | 'th'
type Catalog = typeof dictionary.en; // shape of one language bundle

const catalogs: Record<Lang, Catalog> = dictionary;

type I18nCtx = {
  lang: Lang;
  t: (key: I18nKey) => string;
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
