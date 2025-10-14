// src/Login.tsx
import React, { useState } from "react";
import { t, Lang } from "./i18n";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

type Props = {
  lang: Lang;
  onLang: (l: Lang) => void;
  onSignedIn: () => void;
};

export default function Login({ lang, onLang, onSignedIn }: Props) {
  const i = t(lang);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSignIn() {
    setErr(null);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      localStorage.setItem("tgnLastLoginISO", new Date().toISOString());
      onSignedIn();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onSignUp() {
    setErr(null);
    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      localStorage.setItem("tgnLastLoginISO", new Date().toISOString());
      onSignedIn();
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        {/* header with a/ก language toggle */}
        <div className="auth-header">
          <h1 className="auth-title">{i.loginTitle}</h1>
          <div className="lang-toggle" aria-label="Language">
            <button
              className={lang === "en" ? "lgbtn active" : "lgbtn"}
              onClick={() => onLang("en")}
              title="English"
              aria-label="English"
            >
              a
            </button>
            <button
              className={lang === "th" ? "lgbtn active" : "lgbtn"}
              onClick={() => onLang("th")}
              title="ไทย"
              aria-label="Thai"
            >
              ก
            </button>
          </div>
        </div>

        {/* form */}
        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={i.email}               // << inside the box
            className="border rounded px-3 py-2 w-full"
            autoComplete="email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={i.password}            // << inside the box
            className="border rounded px-3 py-2 w-full"
            autoComplete="current-password"
          />

          {err && <div style={{ color: "#A51931", fontSize: 12 }}>{err}</div>}

          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-blue" onClick={onSignIn} disabled={busy}>
              {i.signIn}
            </button>
            <button className="btn btn-red" onClick={onSignUp} disabled={busy}>
              {i.signUp}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
