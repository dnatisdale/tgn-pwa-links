// src/Login.tsx
import React, { useState } from "react";
import { strings, type Lang } from "./i18n";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";

type Props = {
  lang: Lang;
  onLang: (l: Lang) => void;
  onSignedIn: () => void;
};

export default function Login({ lang, onLang, onSignedIn }: Props) {
  const t = strings[lang];
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function doSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await signInWithEmailAndPassword(auth, email, pw);
      onSignedIn();
    } catch (e: any) {
      setErr(e?.message || "Sign-in failed");
    }
  }

  async function doGuest() {
    setErr(null);
    try {
      await signInAnonymously(auth);
      onSignedIn();
    } catch (e: any) {
      setErr(e?.message || "Guest sign-in failed");
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-3">{t.signIn}</h1>

      <div className="flex items-center gap-2 mb-3">
        <button className="btn btn-white" onClick={() => onLang(lang === "en" ? "th" : "en")}>a/ก</button>
      </div>

      <form onSubmit={doSignIn} className="space-y-3">
        <div>
          <input className="w-full border rounded-lg h-9 px-2" type="email" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <input className="w-full border rounded-lg h-9 px-2" type="password" placeholder="password" value={pw} onChange={e=>setPw(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="btn btn-red" type="submit">{t.saveSignIn}</button>
          <button className="btn btn-white" type="button" onClick={doGuest}>{t.continueGuest}</button>
        </div>
        {err && <div className="text-sm text-red-700">{err}</div>}
      </form>
    </div>
  );
}
