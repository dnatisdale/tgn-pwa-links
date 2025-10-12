// src/AddLink.tsx
import React, { useState } from "react";
import { t, Lang } from "./i18n";
import { db, auth } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toHttpsOrNull as toHttps } from "./url";

export default function AddLink({ lang }: { lang: Lang }) {
  const i = t(lang);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");

  const save = async () => {
    setMsg("");
    if (!auth.currentUser) {
      setMsg("Not signed in.");
      return;
    }
    const https = toHttps(url); // accepts with or without https, ensures https://
    if (!https) {
      setMsg("Please enter a valid URL (https only).");
      return;
    }
    try {
      const col = collection(db, "users", auth.currentUser.uid, "links");
      await addDoc(col, {
        name: name.trim(),
        language: language.trim(),
        url: https,
        createdAt: serverTimestamp(),
      });
      setName(""); setLanguage(""); setUrl("");
      setMsg(lang === "th" ? "บันทึกแล้ว" : "Saved");
    } catch (e: any) {
      setMsg(e.message || String(e));
    }
  };

  return (
    <div className="max-w-md p-3 space-y-3">
      {/* Name */}
      <div>
        <label className="block text-sm mb-1">{i.name}</label>
        <input
          className="w-full border rounded px-2 py-1"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder=""
        />
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm mb-1">{i.language}</label>
        <input
          className="w-full border rounded px-2 py-1"
          value={language}
          onChange={e => setLanguage(e.target.value)}
          placeholder="Thai, Karen, Hmong, …"
        />
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm mb-1">{i.url}</label>
        <input
          className="w-full border rounded px-2 py-1"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="URL (https:// not required)"
        />
      </div>

      <button className="btn-red" onClick={save}>{i.save}</button>
      {msg && <div className="mt-2 text-sm">{msg}</div>}
    </div>
  );
}
