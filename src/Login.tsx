// src/Login.tsx
import React, { useState } from "react";
import { t, Lang } from "./i18n";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from "firebase/auth";
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
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
  <button
    className={lang === "en" ? "lgbtn active" : "lgbtn"}
    onClick={() => onLang("en")}
    aria-label="English"
  >
    a
  </button>
  <button
    className={lang === "th" ? "lgbtn active" : "lgbtn"}
    onClick={() => onLang("th")}
    aria-label="Thai"
  >
    ก
  </button>
</div>

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

         <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 10 }}>
  <button className="btn btn-blue" type="button" onClick={onSignIn}>
    {lang === "th" ? "เข้าสู่ระบบ" : "Sign in"}
  </button>
  <button className="btn btn-red" type="button" onClick={onSignUp}>
    {lang === "th" ? "สมัคร" : "Sign up"}
  </button>
  <button
    className="btn btn-blue ghost"
    type="button"
    onClick={async () => {
      try {
        await signInAnonymously(auth);
      } catch (e: any) {
        alert(e?.message || String(e));
      }
    }}
  >
    {lang === "th" ? "เข้าแบบผู้เยี่ยมชม" : "Continue as guest"}
  </button>
</div>
          </div>
        </div>
      </div>
    </div>
  );
}
