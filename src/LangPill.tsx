// 01 src/LangPill.tsx — matches the Sign-in pill exactly
import React from "react";
import { Lang } from "./i18n";
import { THAI_BLUE, THAI_WHITE } from "./ColorTheme";

type Props = { lang: Lang; onChange: (l: Lang) => void };

export default function LangPill({ lang, onChange }: Props) {
  return (
    <div
      style={{
        display: "inline-flex",
        borderRadius: 9999,
        overflow: "hidden",
        border: `1px solid ${THAI_BLUE}`,
      }}
    >
      <button
        type="button"
        aria-label="English"
        aria-pressed={lang === "en"}
        onClick={() => onChange("en")}
        style={{
          padding: "2px 8px",
          fontSize: 12,
          lineHeight: "16px",
          backgroundColor: lang === "en" ? THAI_BLUE : THAI_WHITE,
          color: lang === "en" ? THAI_WHITE : THAI_BLUE,
          outline: "none",
        }}
      >
        a
      </button>
      <button
        type="button"
        aria-label="Thai"
        aria-pressed={lang === "th"}
        onClick={() => onChange("th")}
        style={{
          padding: "2px 8px",
          fontSize: 12,
          lineHeight: "16px",
          backgroundColor: lang === "th" ? THAI_BLUE : THAI_WHITE,
          color: lang === "th" ? THAI_WHITE : THAI_BLUE,
          outline: "none",
          borderLeft: `1px solid ${THAI_BLUE}`,
        }}
      >
        ก
      </button>
    </div>
  );
}
