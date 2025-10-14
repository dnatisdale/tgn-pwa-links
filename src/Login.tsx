// src/Login.tsx
import React, { useState } from "react";
import { Lang } from "./i18n";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
} from "firebase/auth";

type Props = {
  lang: Lang;
  onLang: (l: Lang) => void;
};

export default function Login({ lang, onLang }: Props) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  const L = {
    title: lang === "th" ? "เข้าสู่ระบบด้วยอีเมล" : "Sign in with Email",
    emailPh: lang === "th" ? "อีเมล" : "Email",
    passPh: lang === "th" ? "รหัสผ่าน" : "Password",
    signIn: lang === "th" ? "เข้าสู่ระบบ" : "Sign in",
    signUp: lang === "th" ? "สมัคร" : "Sign up",
    guest: lang === "th" ? "เข้าแบบผู้เยี่ยมชม" : "Continue as guest",
  };

  async function onSignIn() {
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      localStorage.setItem("tgnLastLoginISO", new Date().toISOString());
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onSignUp() {
    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pass);
      localStorage.setItem("tgnLastLoginISO", new Date().toISOString());
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onGuest() {
    setBusy(true);
    try {
      await signInAnonymously(auth);
      localStorage.setItem("tgnLastLoginISO", new Date().toISOString());
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 420,
          maxWidth: "90vw",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 20,
          background: "#fff",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        {/* a / ก language toggle in the card corner */}
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

        <h2 className="text-lg font-semibold" style={{ marginBottom: 14 }}>
          {L.title}
        </h2>

        {/* inputs with placeholders (no separate labels) */}
        <div style={{ display: "grid", gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={L.emailPh}
            className="border rounded px-3 py-2"
            autoComplete="email"
          />
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder={L.passPh}
            className="border rounded px-3 py-2"
            autoComplete="current-password"
          />
        </div>

        {/* centered buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 12 }}>
          <button className="btn btn-blue" onClick={onSignIn} disabled={busy}>
            {L.signIn}
          </button>
          <button className="btn btn-red" onClick={onSignUp} disabled={busy}>
            {L.signUp}
          </button>
          <button className="btn btn-blue ghost" onClick={onGuest} disabled={busy}>
            {L.guest}
          </button>
        </div>
      </div>
    </div>
  );
}
