// src/AddLink.tsx
import React, { useState } from "react";
import { t, Lang } from "./i18n";
import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toHttpsOrNull } from "./url";

export default function AddLink({ lang }: { lang: Lang }) {
  const i = t(lang);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");

  const save = async () => {
    setMsg("");

    const httpsUrl = toHttpsOrNull(url);
    if (!httpsUrl) {
      setMsg("URL must be a valid https:// address (no http).");
      return;
    }

    if (!auth.currentUser) {
      setMsg("Not signed in.");
      return;
    }

    try {
      const col = collection(db, "users", auth.currentUser.uid, "links");
      await addDoc(col, {
        name: name.trim(),
        language: language.trim(),
        url: httpsUrl,
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
      <input className="w-full border rounded px-2 py-1 mb-3" value={name}
        onChange={e => setName(e.target.value)} />

      <label className="block text-sm mb-1">{i.language}</label>
      <input className="w-full border rounded px-2 py-1 mb-3" value={language}
        onChange={e => setLanguage(e.target.value)} placeholder="Thai, Karen, Hmong, ..." />

      <label className="block text-sm mb-1">{i.url} <span className="text-xs" style={{color:"#6b7280"}}>(https only)</span></label>
      <input className="w-full border rounded px-2 py-1 mb-3" value={url}
        onChange={e => setUrl(e.target.value)} placeholder="example.com/page or https://example.com/page" />

      <button className="linklike" onClick={save}>{i.save}</button>
      {msg && <div className="mt-2 text-sm">{msg}</div>}
    </div>
  );
}
