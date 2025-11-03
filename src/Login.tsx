// src/Login.tsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { useI18n } from './i18n-provider';

// gentle grow, text-only (respects Reduce Motion)
const grow =
  'motion-safe:transition-transform motion-safe:duration-150 group-hover:scale-[1.06] group-focus-visible:scale-[1.06] active:scale-[1.06]';

export default function Login() {
  // Safe i18n: never render "undefined" and avoid type mismatch
  const rawT = (() => {
    try {
      return useI18n().t; // typed as (key: keyof Catalog) => string
    } catch {
      return undefined;
    }
  })();

  // expose a lenient t: (k: string) => string
  const t = (k: string) => {
    try {
      return (rawT as any)?.(k) ?? k; // call if present; else echo key
    } catch {
      return k;
    }
  };

  const tOr = (k: string, fb: string) => {
    const v = t(k);
    return (v ?? '').toString().trim() || fb;
  };

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
      localStorage.removeItem('tgn.guest');
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  };
  const continueGuest = () => {
    localStorage.setItem('tgn.guest', '1');
    window.dispatchEvent(new Event('guest:continue'));
    window.location.hash = '#/browse';
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // allow Enter to submit without reloading
    await signIn();
  };

  return (
    <div className="card" style={{ maxWidth: 480, margin: '24px auto', padding: 16 }}>
      <form onSubmit={onSubmit} noValidate>
        {/* Email */}
        <label htmlFor="email" className="block text-sm font-semibold mb-1 not-italic">
          {tOr('email', 'Email')}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={tOr('email', 'Email')}
          autoComplete="username email"
          className="w-full border rounded px-3 py-2 mb-3 not-italic"
          inputMode="email"
          required
        />

        {/* Password */}
        <label htmlFor="password" className="block text-sm font-semibold mb-1 not-italic">
          {tOr('password', 'Password')}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={tOr('password', 'Password')}
          autoComplete="current-password"
          className="w-full border rounded px-3 py-2 mb-3 not-italic"
          required
        />

        {/* Buttons row */}
        <div className="mt-3 grid grid-cols-3 gap-2 md:flex md:flex-wrap md:items-center md:gap-3">
          {/* Sign In */}
          <button
            type="submit"
            className="group btn btn-blue w-full md:w-auto justify-center not-italic"
            aria-label={tOr('signIn', 'Sign In')}
            title={tOr('signIn', 'Sign In')}
          >
            <span className={grow}>{tOr('signIn', 'Sign In')}</span>
          </button>

          {/* Sign Up */}
          <button
            type="button"
            className="group btn btn-red w-full md:w-auto justify-center not-italic"
            onClick={signUp}
            aria-label={tOr('signUp', 'Sign Up')}
            title={tOr('signUp', 'Sign Up')}
          >
            <span className={grow}>{tOr('signUp', 'Sign Up')}</span>
          </button>

          {/* Continue as Guest */}
          <button
            type="button"
            className="group btn btn-blue w-full md:w-auto justify-center not-italic"
            onClick={continueGuest}
            aria-label={tOr('continueAsGuest', 'Continue as Guest')}
            title={tOr('continueAsGuest', 'Continue as Guest')}
          >
            <span className={grow}>{tOr('continueAsGuest', 'Continue as Guest')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
