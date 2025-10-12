// src/Login.tsx
import React, { useState } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
} from "firebase/auth";
import { t, Lang } from "./i18n";

// save last login ISO to localStorage
function saveLastLogin() {
  localStorage.setItem("tgnLastLoginISO", new Date().toISOString());
}

export default function Login({
  lang,
  onLang,
  onSignedIn,
}: {
  lang: Lang;
  onLang: (l: Lang) => void;
  onSignedIn: () => void;
}) {
  const i = t(lang);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  const go = async (signup: boolean) => {
    setMsg("");
    try {
      if (signup) {
        await createUserWithEmailAndPassword(auth, email, pw);
      } else {
        await signInWithEmailAndPassword(auth, email, pw);
      }
      saveLastLogin();
      onSignedIn();
    } catch (e: any) {
      setMsg(e.message || String(e));
    }
  };

  const guest = async () => {
    setMsg("");
    try {
      await signInAnonymously(auth);
      saveLastLogin();
      onSignedIn();
    } catch (e: any) {
      setMsg(e.message || String(e));
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4">
      <header className="flex items-center justify-between mb-4 header pb-3">
        {/* Logo only (no title) */}
        <img className="logo" src="/logo-square-1024.png" alt="logo" style={{ height: 44 }} />
        <div className="text-sm">
          <button className="linklike" onClick={() => onLang(lang === "en" ? "th" : "en")}>
            {lang === "en" ? "ไทย" : "EN"}
          </button>
        </div>
      </header>

      <h1 className="text-xl font-semibold mb-3">{i.loginTitle}</h1>

      <label className="block text-sm mb-1">{i.email}</label>
      <input
        className="w-full border rounded px-2 py-1 mb-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="block text-sm mb-1">{i.password}</label>
      <input
        className="w-full border rounded px-2 py-1 mb-3"
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />

      <div className="flex gap-4 justify-center">
        <button className="linklike" onClick={() => go(false)}>
          {i.signIn}
        </button>
        <button className="linklike" onClick={() => go(true)}>
          {i.signUp}
        </button>
      </div>

      {/* Centered red 'Continue as guest' */}
      <div className="mt-4 flex justify-center">
        <button className="btn-red" onClick={guest}>
          Continue as guest
        </button>
      </div>

      {msg && <div className="mt-3 text-sm text-red-600 whitespace-pre-wrap">{msg}</div>}
    </div>
  );
}
