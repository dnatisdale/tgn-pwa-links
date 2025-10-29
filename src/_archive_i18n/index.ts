// src/i18n/index.ts
export type Lang = "en" | "th";

// IMPORTANT: keep these JSON files in the same folder
import en from "./en.json";
import th from "./th.json";

const dict = { en, th } as const;

// Simple getter: returns the language dictionary
export const t = (lang: Lang) => dict[lang];

// Safer getter with fallback + interpolation + dev warning
export function tr<K extends keyof typeof en>(
  lang: Lang,
  key: K,
  params?: Record<string, string | number>
): string {
  const base = String(en[key] ?? key);          // fallback base (English)
  const raw  = (dict[lang] as any)[key] ?? base; // current language (or fallback)

  if (import.meta.env.DEV && (dict[lang] as any)[key] === undefined) {
    // this logs only in dev — helps you find missing keys
    // eslint-disable-next-line no-console
    console.warn(`[i18n] Missing key "${String(key)}" in ${lang}. Using English fallback.`);
  }

  return replaceParams(String(raw), params);
}

function replaceParams(s: string, params?: Record<string, string | number>) {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}
