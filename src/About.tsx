// src/About.tsx
import React from "react";
import { Lang, t } from "./i18n";

export default function About({ lang }: { lang: Lang }) {
  const i = t(lang);
  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">{i.about}</h2>
      <p className="text-sm leading-6">
        Thai Good News — a simple PWA to collect, share, and print QR codes and links in Thai and English.
      </p>
    </section>
  );
}
