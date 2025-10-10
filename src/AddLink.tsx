import React, { useState } from "react";
import { t, Lang } from "./i18n";
import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/** Force URLs to be https://
 * - "http://example.com"  -> "https://example.com"
 * - "example.com"         -> "https://example.com"
 * - trims spaces; leaves other schemes alone (but we block non-https below)
 */
function normalizeHttps(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";

  if (/^http:\/\//i.test(raw)) return "https://" + raw.slice(7);
  if (!/^https?:\/\//i.test(raw)) return "https://" + raw;

  // ensure http->https even if user typed it strangely
  return raw.replace(/^http:\/\//i, "https://");
}

export default function AddLink({ lang }: { lang: Lang }) {
  const i = t(lang);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");

  const save = async () => {
    setMsg("");

    // normalize to https
    const fixedUrl = normalizeHttps(url);
    // reject anything that still isn't https:// (e.g., mailto:, ftp:, empty)
    if (!fixedUrl.toLowerCase().startsWith("https://")) {
      setMsg(lang === "th" ? "ลิงก์ต้องเริ่มด้วย https://" : "URL must start with https://");
      return;
    }
    if (!auth.currentUser) {
      setMsg(lang === "th" ? "ยังไม่ได้เข้าสู่ระบบ" : "Not signed in.");
      return;
    }

    try {
      // reflect the fix in the input so user sees the https:// version
      setUrl(fixedUrl);

      const col = collection(db, "users", auth.currentUser.uid, "links");
      await addDoc(col, {
        name: name.trim(),
        language: language.trim(),
        url: fixedUrl,
        createdAt: serverTimestamp(),
      });

      setName("");
      setLanguage("");
      setUrl("");
      setMsg(lang === "th" ? "บันทึกแล้ว" : "Saved");
    } catch (e: any) {
      setMsg(e.message || String(e));
    }
  };

  return (
    <div className="max-w-md p-3">
      <label className="block text-sm mb-1">{i.name}</label>
      <input
        className="w-full border rounded px-2 py-1 mb-3"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label className="block text-sm mb-1">{i.language}</label>
      <input
        className="w-full border rounded px-2 py-1 mb-3"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        placeholder="Thai, Karen, Hmong, ..."
      />

      <label className="block text-sm mb-1">{i.url}</label>
      <input
        className="w-full border rounded px-2 py-1 mb-3"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://5fish.mobi/..."
        inputMode="url"
        autoComplete="url"
      />

      <button className="linklike" onClick={save}>
        {i.save}
      </button>

      {msg && <div className="mt-2 text-sm">{msg}</div>}
    </div>
  );
}
