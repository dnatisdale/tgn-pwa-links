// src/LangPill.tsx
import React from 'react';
import { useI18n } from './i18n-provider';

export type Lang = 'en' | 'th';

export default function LangPill({
  className = '',
  onLang,
}: {
  className?: string;
  onLang?: (next: Lang) => void;
}) {
  const { lang, setLang } = useI18n();
  const next: Lang = lang === 'en' ? 'th' : 'en';

  const toggle = () => {
    setLang(next);
    onLang?.(next); // if parent passed a handler, keep it notified
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`langpill ${lang === 'en' ? 'langpill--en' : 'langpill--th'} ${className}`}
      aria-label="Toggle language (English/Thai)"
      title="Toggle language (English/Thai)"
    >
      <span className={`opt opt-en ${lang === 'en' ? 'active' : 'inactive'}`}>a</span>
      <span className={`opt opt-th ${lang === 'th' ? 'active' : 'inactive'}`}>ก</span>
    </button>
  );
}
