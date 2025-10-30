// src/Login.tsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { useI18n } from './i18n-provider';

export default function Login() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  };
  const signUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  };

  const continueGuest = () => {
    localStorage.setItem('tgn.guest', '1');
    window.dispatchEvent(new Event('guest:continue'));
    window.location.hash = '#/browse';
  };

  return (
    <div className="card" style={{ maxWidth: 480, margin: '24px auto', padding: 16 }}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('email')}
        className="w-full border rounded px-3 py-2 mb-3"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t('password')}
        type="password"
        className="w-full border rounded px-3 py-2 mb-3"
      />

      {/* Buttons row */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button className="btn btn-blue" onClick={signIn /* or handleSignIn */}>
          {t('signin') /* or t('signIn') */}
        </button>

        <button className="btn btn-red" onClick={signUp /* or handleSignUp */}>
          {t('signup') /* or t('signUp') */}
        </button>

        {/* Continue as Guest — thai-blue and on the same row */}
        <button className="btn btn-blue" onClick={continueGuest /* or handleContinueAsGuest */}>
          {t('continueAsGuest')}
        </button>
      </div>
    </div>
  );
}
