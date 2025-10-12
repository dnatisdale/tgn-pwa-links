
// src/Login.tsx
import React, { useState } from "react";
import { Lang, t } from "./i18n";
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
  const i = t(lang);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      localStorage.setItem("tgnLastLoginISO", new Date().toISOString());
      onSignedIn();
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      localStorage.setItem("tgnLastLoginISO", new Date().toISOString());
      onSignedIn();
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  }

  async function handleGuest() {
    try {
      await signInAnonymously(auth);
      localStorage.setItem("tgnLastLoginISO", new Date().toISOString());
      onSignedIn();
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        {/* header row: title + language switcher (a / ก) */}
        <div className="auth-header">
          <h2 className="auth-title">
            {mode === "signin" ? i.loginTitle : i.signUp}
          </h2>

          <div className="lang-toggle" aria-label="Language">
            <button
              className={lang === "en" ? "lgbtn active" : "lgbtn"}
              onClick={() => onLang("en")}
              title="English"
              aria-label="English"
              type="button"
            >
              a
            </button>
            <button
              className={lang === "th" ? "lgbtn active" : "lgbtn"}
              onClick={() => onLang("th")}
              title="ไทย"
              aria-label="Thai"
              type="button"
            >
              ก
            </button>
          </div>
        </div>

        {/* form */}
        <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp}>
          <div className="field">
            <label className="block mb-1">{i.email}</label>
            <input
              className="border rounded px-2 py-1 w-full"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="field mt-3">
            <label className="block mb-1">{i.password}</label>
            <input
              className="border rounded px-2 py-1 w-full"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            {mode === "signin" ? (
              <button type="submit" className="btn-blue">
                {i.signIn}
              </button>
            ) : (
              <button type="submit" className="btn-red">
                {i.signUp}
              </button>
            )}

            <button
              type="button"
              className="linklike"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? i.signUp : i.signIn}
            </button>
          </div>
        </form>

        {/* centered guest button */}
        <div className="mt-4" style={{ display: "flex", justifyContent: "center" }}>
          <button type="button" className="btn-red" onClick={handleGuest}>
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
