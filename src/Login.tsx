import React, { useState } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { t, Lang } from "./i18n";

type Props = {
  lang: Lang;
  onLang: (l: Lang) => void;
  onSignedIn: () => void;
};

export default function Login({ lang, onLang, onSignedIn }: Props) {
  const i = t(lang);

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (isSignUp: boolean) => {
    setMsg("");
    if (!email.trim() || !pw.trim()) {
      setMsg(lang === "th" ? "กรอกอีเมลและรหัสผ่าน" : "Please enter email and password.");
      return;
    }
    try {
      setBusy(true);
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), pw);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), pw);
      }
      onSignedIn();
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit(false); // Enter = sign in
  };

  const toggleLang = () => onLang(lang === "en" ? "th" : "en");

  return (
    <div className="max-w-sm mx-auto p-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 header pb-3">
        <div className="font-bold">
          <img className="logo" src="/logo-square-1024.png" alt="logo" /> Thai Good News
        </div>
        <div className="text-sm">
          <button className="linklike" onClick={toggleLang}>
            {lang === "en" ? "ไทย" : "EN"}
          </button>
        </div>
      </header>

      {/* Form */}
      <h1 className="text-xl font-semibold mb-3">{i.loginTitle}</h1>

      <label className="block text-sm mb-1" htmlFor="email">
        {i.email}
      </label>
      <input
        id="email"
        className="w-full border rounded px-2 py-1 mb-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        onKeyDown={onKey}
        disabled={busy}
      />

      <label className="block text-sm mb-1" htmlFor="password">
        {i.password}
      </label>
      <input
        id="password"
        className="w-full border rounded px-2 py-1 mb-3"
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        autoComplete="current-password"
        onKeyDown={onKey}
        disabled={busy}
      />

      <div className="flex gap-4">
        <button className="linklike" onClick={() => submit(false)} disabled={busy}>
          {i.signIn}
        </button>
        <button className="linklike" onClick={() => submit(true)} disabled={busy}>
          {i.signUp}
        </button>
      </div>

      {msg && (
        <div className="mt-3 text-sm text-red-600 whitespace-pre-wrap">
          {msg}
        </div>
      )}
    </div>
  );
}
