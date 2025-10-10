
import React, { useState } from "react";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { t, Lang } from "./i18n";

export default function Login({ lang, onLang, onSignedIn }:{ lang:Lang; onLang:(l:Lang)=>void; onSignedIn:()=>void }) {
  const i = t(lang);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  const go = async (signup:boolean) => {
    setMsg("");
    try {
      if (signup) await createUserWithEmailAndPassword(auth, email, pw);
      else await signInWithEmailAndPassword(auth, email, pw);
      onSignedIn();
    } catch (e:any) {
      setMsg(e.message || String(e));
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4">
      <header className="flex items-center justify-between mb-4 header pb-3">
        <div className="font-bold">Thai Good News</div>
        <div className="text-sm">
          <button className="linklike" onClick={()=>onLang(lang==="en"?"th":"en")}>{lang==="en"?"ไทย":"EN"}</button>
        </div>
      </header>
      <h1 className="text-xl font-semibold mb-3">{i.loginTitle}</h1>
      <label className="block text-sm mb-1">{i.email}</label>
      <input className="w-full border rounded px-2 py-1 mb-3" value={email} onChange={e=>setEmail(e.target.value)} />
      <label className="block text-sm mb-1">{i.password}</label>
      <input className="w-full border rounded px-2 py-1 mb-3" type="password" value={pw} onChange={e=>setPw(e.target.value)} />
      <div className="flex gap-4">
        <button className="linklike" onClick={()=>go(false)}>{i.signIn}</button>
        <button className="linklike" onClick={()=>go(true)}>{i.signUp}</button>
      </div>
      {msg && <div className="mt-3 text-sm text-red-600 whitespace-pre-wrap">{msg}</div>}
    </div>
  );
}
