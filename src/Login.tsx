// 01 src/Login.tsx — clean, pill matches sign-in, no stray text
import React, { useState } from 'react'; // 02
import { Lang } from './i18n'; // 03
import { auth } from './firebase'; // 04
import LangPill from './LangPill'; // 05
import {
  signInWithEmailAndPassword, // 06
  createUserWithEmailAndPassword, // 07
  signInAnonymously, // 08
} from 'firebase/auth'; // 09

type Props = {
  // 10
  lang: Lang; // 11
  onLang: (l: Lang) => void; // 12
  onSignedIn?: () => void; // 13
}; // 14

export default function Login({ lang, onLang, onSignedIn }: Props) {
  // 15
  const [email, setEmail] = useState(''); // 16
  const [pass, setPass] = useState(''); // 17
  const [busy, setBusy] = useState(false); // 18

  const L = {
    // 19
    title: lang === 'th' ? 'เข้าสู่ระบบด้วยอีเมล' : 'Sign in with Email', // 20
    emailPh: lang === 'th' ? 'อีเมล' : 'Email', // 21
    passPh: lang === 'th' ? 'รหัสผ่าน' : 'Password', // 22
    signIn: lang === 'th' ? 'เข้าสู่ระบบ' : 'Sign In', // 23
    signUp: lang === 'th' ? 'สมัคร' : 'Sign Up', // 24
    guest: lang === 'th' ? 'เข้าแบบผู้เยี่ยมชม' : 'Continue as Guest', // 25
  }; // 26

  async function onSignIn() {
    // 27
    setBusy(true); // 28
    try {
      // 29
      await signInWithEmailAndPassword(auth, email.trim(), pass); // 30
      localStorage.setItem('tgnLastLoginISO', new Date().toISOString()); // 31
      onSignedIn?.(); // 32
    } catch (e: any) {
      // 33
      alert(e?.message || String(e)); // 34
    } finally {
      // 35
      setBusy(false); // 36
    } // 37
  } // 38

  async function onSignUp() {
    // 39
    setBusy(true); // 40
    try {
      // 41
      await createUserWithEmailAndPassword(auth, email.trim(), pass); // 42
      localStorage.setItem('tgnLastLoginISO', new Date().toISOString()); // 43
      onSignedIn?.(); // 44
    } catch (e: any) {
      // 45
      alert(e?.message || String(e)); // 46
    } finally {
      // 47
      setBusy(false); // 48
    } // 49
  } // 50

  async function onGuest() {
    // 51
    setBusy(true); // 52
    try {
      // 53
      await signInAnonymously(auth); // 54
      localStorage.setItem('tgnLastLoginISO', new Date().toISOString()); // 55
      onSignedIn?.(); // 56
    } catch (e: any) {
      // 57
      alert(e?.message || String(e)); // 58
    } finally {
      // 59
      setBusy(false); // 60
    } // 61
  } // 62

  return (
    // 63
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 420,
          maxWidth: '90vw',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 20,
          background: '#fff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        {/* 2) TITLE */}
        <h2 className="text-lg font-semibold" style={{ marginBottom: 14 }}>
          {L.title}
        </h2>

        {/* 3) INPUTS */}
        <div style={{ display: 'grid', gap: 10 }}>
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

        {/* 4) BUTTONS */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginTop: 12,
          }}
        >
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
  ); // 64
}
