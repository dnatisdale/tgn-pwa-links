// src/AddLink.tsx
import React from "react";
import { strings, type Lang } from "./i18n";

type Props = { lang: Lang };

type Row = { name: string; language: string; url: string };

// Force https and tidy common cases
function toHttps(raw: string): string {
  if (!raw) return "";
  let s = raw.trim();
  if (s.startsWith("//")) s = "https:" + s;
  if (s.startsWith("http://")) s = "https://" + s.slice("http://".length);
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  return s;
}

function isValidHttpsUrl(u: string): boolean {
  try {
    const x = new URL(u);
    return x.protocol === "https:" && !!x.host;
  } catch {
    return false;
  }
}

export default function AddLink({ lang }: Props) {
  const t = strings[lang];

  const [form, setForm] = React.useState<Row>({
    name: "",
    language: lang === "th" ? "th" : "en",
    url: "",
  });
  const [msg, setMsg] = React.useState<string>("");

  function onChange<K extends keyof Row>(key: K, val: Row[K]) {
    setForm((f) => ({ ...f, [key]: String(val) }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fixedUrl = toHttps(form.url);
    const cleaned: Row = {
      name: form.name.trim(),
      language: form.language.trim(),
      url: fixedUrl,
    };

    if (!cleaned.name || !cleaned.language || !isValidHttpsUrl(cleaned.url)) {
      setMsg(t.tipInvalid);
      return;
    }

    // For now, just confirm. You can wire Firestore add here later.
    setMsg(`${t.add}: ${cleaned.name} → ${cleaned.url}`);
    // Reset URL only (keep name/lang handy for next add)
    setForm((f) => ({ ...f, url: "" }));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t.add}</h1>

      <form className="space-y-3 max-w-md" onSubmit={onSubmit}>
        <label className="block">
          <div className="text-sm mb-1">{t.name}</div>
          <input
            className="w-full p-2 border rounded"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="John"
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">{t.language}</div>
          <input
            className="w-full p-2 border rounded"
            value={form.language}
            onChange={(e) => onChange("language", e.target.value)}
            placeholder={lang === "th" ? "th" : "en"}
          />
        </label>

        <label className="block">
          <div className="text-sm mb-1">{t.url}</div>
          <input
            className="w-full p-2 border rounded"
            value={form.url}
            onChange={(e) => onChange("url", e.target.value)}
            placeholder="https://example.com"
            inputMode="url"
          />
          {/* Show inline tip if URL is present but not valid https */}
          {form.url.trim() !== "" && !isValidHttpsUrl(toHttps(form.url)) && (
            <div className="text-xs text-red-700 mt-1">{t.tipInvalid}</div>
          )}
        </label>

        <div className="flex gap-2 items-center">
          <button className="btn btn-blue" type="submit">
            {t.add}
          </button>
          {msg && <div className="text-sm">{msg}</div>}
        </div>

        {/* Required tip text for failures */}
        <div className="text-xs opacity-80">{t.tipInvalid}</div>
      </form>
    </div>
  );
}
