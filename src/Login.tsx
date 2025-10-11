import React, { useState } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { t, Lang } from "./i18n";

type Props = { lang: Lang; onLang: (l: Lang) => void; onSignedIn: () => void };

export default function Login({ lang, onLang, onSignedIn }: Props) {
  const i = t(lang);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    if (e.key === "Enter") submit(false);
  };

  const forgot = async () => {
    setMsg("");
    if (!email.trim()) {
      setMsg(lang === "th" ? "กรอกอีเมลเพื่อรีเซ็ตรหัสผ่าน" : "Enter your email to reset password.");
      return;
    }
    try {
      setBusy(true);
      await sendPasswordResetEmail(auth, email.trim());
      setMsg(lang === "th" ? "ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว" : "Password reset email sent.");
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4">
      {/* Header: bigger logo only (no title text) */}
      <header className="flex items-center justify-between mb-4 header pb-3">
        <div className="font-bold">
          {/* Increase size here (e.g., 48px). Adjust up/down as you like. */}
          <img
            src="/logo-square-1024.png"
            alt="App logo"
            style={{ height: 48, borderRadius: 8, verticalAlign: "middle" }}
          />
        </div>
        <div className="text-sm">
          <button className="linklike" onClick={() => onLang(lang === "en" ? "th" : "en")}>
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
      <div className="flex items-center gap-2 mb-3">
        <input
          id="password"
          className="w-full border rounded px-2 py-1"
          type={showPw ? "text" : "password"}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="current-password"
          onKeyDown={onKey}
          disabled={busy}
        />
        <button className="linklike" onClick={() => setShowPw((v) => !v)} disabled={busy}>
          {showPw ? (lang === "th" ? "ซ่อน" : "Hide") : (lang === "th" ? "แสดง" : "Show")}
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <button className="linklike" onClick={() => submit(false)} disabled={busy}>
          {i.signIn}
        </button>
        <button className="linklike" onClick={() => submit(true)} disabled={busy}>
          {i.signUp}
        </button>
        <button className="linklike" onClick={forgot} disabled={busy}>
          {lang === "th" ? "ลืมรหัสผ่าน?" : "Forgot password?"}
        </button>
      </div>

      {msg && <div className="mt-3 text-sm text-red-600 whitespace-pre-wrap">{msg}</div>}
    </div>
  );
}
