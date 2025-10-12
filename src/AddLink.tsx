// src/AddLink.tsx
import React, { useState } from "react";
import { t, tr, Lang } from "./i18n";
import { auth, db } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// helper: ensure https (auto-add if missing), reject http and invalid
function toHttpsOrNull(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // If user typed http:// — reject (only secure allowed)
  if (/^http:\/\//i.test(raw)) return null;

  // If no scheme, prepend https://
  const withScheme = /^(https?:)?\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const u = new URL(withScheme);
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

type Props = { lang: Lang };

export default function AddLink({ lang }: Props) {
  const i = t(lang);

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in first.");
      return;
    }

    const nameTrim = name.trim();
    const languageTrim = language.trim();
    const urlHttps = toHttpsOrNull(url);

    if (!nameTrim) {
      alert(lang === "th" ? "กรุณากรอกชื่อเรื่อง" : "Please enter a name");
      return;
    }
    if (!urlHttps) {
      alert(
        lang === "th"
          ? "ลิงก์ต้องเป็น https:// เท่านั้น หรือพิมพ์โดยไม่ต้องใส่ https://"
          : "URL must be secure (https). You can type it with or without https://"
      );
      return;
    }

    try {
      setSaving(true);
      await addDoc(collection(db, "users", user.uid, "links"), {
        name: nameTrim,
        language: languageTrim,
        url: urlHttps,
        createdAt: serverTimestamp(),
      });
      // clear form
      setName("");
      setLanguage("");
      setUrl("");
      alert(lang === "th" ? "บันทึกแล้ว" : "Saved");
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md">
      {/* Name */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={i.name}               // label inside the field
        aria-label={i.name}
        className="w-full border rounded px-3 py-2 mb-3"
      />

      {/* Language */}
      <input
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        placeholder={i.language}           // label inside the field
        aria-label={i.language}
        className="w-full border rounded px-3 py-2 mb-3"
      />

      {/* URL (https optional; we’ll normalize and enforce https) */}
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={i.url}                // uses your new “https optional” text
        aria-label={i.url}
        className="w-full border rounded px-3 py-2 mb-1"
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
        {lang === "th"
          ? "จะเพิ่ม https:// ให้อัตโนมัติ และไม่อนุญาต http://"
          : "We’ll add https:// for you automatically; http:// is not allowed."}
      </div>

      {/* Thai-flag RED Save button */}
      <button
        onClick={onSave}
        disabled={saving}
        className="btn-red"
        style={{
          background: "#a51931",   // Thai red
          color: "#fff",
          borderRadius: 8,
          padding: "10px 16px",
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
        }}
      >
        {saving ? (lang === "th" ? "กำลังบันทึก…" : "Saving…") : i.save}
      </button>
    </div>
  );
}
