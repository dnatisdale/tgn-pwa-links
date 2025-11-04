// src/LangPill.tsx
import React from 'react';
import { useI18n } from './i18n-provider';

export default function LangPill() {
  const { lang, setLang } = useI18n(); // assumes your provider exposes these

  const makeBtn = (code: 'en' | 'th', label: string, aria: string) => (
    <button
      type="button"
      onClick={() => setLang(code)}
      className={`opt ${lang === code ? 'is-active' : ''}`}
      aria-pressed={lang === code}
      aria-label={aria}
      title={aria}
    >
      <span>{label}</span>
    </button>
  );

  return (
    <div className="langpill" role="group" aria-label="Language">
      {makeBtn('en', 'a', 'English')}
      {makeBtn('th', 'ก', 'ภาษาไทย')}
    </div>
  );
}
