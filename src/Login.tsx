// src/Login.tsx
import React, { useState } from "react";
import { t, Lang } from "./i18n";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
} from "firebase/auth";

type Props = {
  lang: Lang;
  onLang: (l: Lang) => void;
  onSignedIn: () => void;
};

export default function Login({ lang, onLang, onSignedIn }: Props) {
  // ✅ always derive the translations from lang
  const i = t(lang);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function doSignIn() {
    try {
      setBusy(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      localStorage.setItem("tgnLastLoginISO", new Date().toISOString());
      onSignedIn();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doSignUp() {
    try {
      setBusy(true);
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      localStorage.setItem("tgnLastLoginISO", new Date().toISOString());
      onSignedIn();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function continueAsGuest() {
    try {
      setBusy(true);
      await signInAnonymously(auth);
      localStorage.setItem("tgnLastLoginISO", new Date().toISOString());
      onSignedIn();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">{i.loginTitle}</h2>

          {/* tiny language toggle “a / ก” */}
          <div className="lang-toggle" role="group" aria-label="Language">
            <button
              className={`lgbtn ${lang === "en" ? "active" : ""}`}
              onClick={() => onLang("en")}
              type="button"
            >
              a
            </button>
            <button
              className={`lgbtn ${lang === "th" ? "active" : ""}`}
              onClick={() => onLang("th")}
              type="button"
            >
              ก
            </button>
          </div>
        </div>

        <label className="block mb-2 text-sm">{i.email}</label>
        <input
          className="border rounded w-full px-3 py-2 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
        />

        <label className="block mb-2 text-sm">{i.password}</label>
        <input
          className="border rounded w-full px-3 py-2 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
        />

        <div className="flex items-center gap-2">
          <button className="btn-red" onClick={doSignIn} disabled={busy}>
            {i.signIn}
          </button>
          <button className="btn-blue" onClick={doSignUp} disabled={busy}>
            {i.signUp}
          </button>
          <button className="btn-blue" onClick={continueAsGuest} disabled={busy}>
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
