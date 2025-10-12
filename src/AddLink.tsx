// src/AddLink.tsx
import React, { useState } from "react";
import { strings, type Lang } from "./i18n";

type Props = { lang: Lang };

function toHttps(raw: string): string {
  let u = (raw || "").trim();
  if (!u) return "";
  if (u.startsWith("//")) u = "https:" + u;
  if (u.startsWith("http://")) u = "https://" + u.slice(7);
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  // force https only
  u = u.replace(/^http:\/\//i, "https://");
  return u;
}

export default function AddLink({ lang }: Props) {
  const t = strings[lang];
  const [name, setName] = useState("");
  const [language, setLanguage] = useState(lang === "th" ? "th" : "en");
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fixed = toHttps(url);
    try {
      const ok = fixed.startsWith("https://");
      if (!ok) throw new Error("invalid");
      // TODO: save to Firestore later; for now, just show success
      setMsg(`Saved: ${name} → ${fixed}`);
      setUrl(fixed);
    } catch {
      setMsg(t.tipInvalid);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-3">{t.add}</h1>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">{t.name}</label>
          <input className="w-full border rounded-lg h-9 px-2" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">{t.language}</label>
          <select className="w-full border rounded-lg h-9 px-2" value={language} onChange={e=>setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="th">ไทย</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">{t.url}</label>
          <input className="w-full border rounded-lg h-9 px-2" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com" />
        </div>
        <div className="flex gap-2">
          <button className="btn btn-blue" type="submit">{t.saveSignIn}</button>
        </div>
        {msg && <div className="text-sm opacity-80">{msg}</div>}
      </form>
    </div>
  );
}
