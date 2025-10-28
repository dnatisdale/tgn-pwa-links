// src/LangPill.tsx
import React from 'react';
export type Lang = 'en' | 'th';

type Props = {
  className?: string;
  lang?: Lang;
  onLang?: (next: Lang) => void;
  signedIn?: boolean;
};

export default function LangPill({ className = '', lang, onLang }: Props) {
  const [innerLang, setInnerLang] = React.useState<Lang>(() => {
    const l = document.documentElement.lang?.toLowerCase();
    return l === 'th' ? 'th' : 'en';
  });
  const isControlled = typeof lang !== 'undefined';
  const value: Lang = isControlled ? (lang as Lang) : innerLang;

  const toggle = () => {
    const next: Lang = value === 'en' ? 'th' : 'en';
    if (!isControlled) setInnerLang(next);
    onLang?.(next);
    document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent('lang:change', { detail: { lang: next } }));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`langpill ${value === 'en' ? 'langpill--en' : 'langpill--th'} ${className}`}
      aria-label="Toggle language (English/Thai)"
      title="Toggle language (English/Thai)"
    >
      <span className={`opt opt-en ${value === 'en' ? 'active' : 'inactive'}`}>a</span>
      <span className={`opt opt-th ${value === 'th' ? 'active' : 'inactive'}`}>ก</span>
    </button>
  );
}
