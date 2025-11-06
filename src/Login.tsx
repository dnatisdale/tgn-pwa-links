// src/Login.tsx
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig'; // if your auth export is in a different file, adjust this import
import { useI18n } from './i18n-provider';

export default function Login() {
  // ---- i18n ----
  const { t } = useI18n();
  const tOr = (k: string, fb: string) => {
    try {
      const v = (t(k) ?? '').toString().trim();
      return v || fb;
    } catch {
      return fb;
    }
  };

  // ---- tiny text grow (applied to inner <span>) ----
  const grow =
    'motion-safe:transition-transform motion-safe:duration-150 group-hover:scale-[1.06] group-focus-visible:scale-[1.06] active:scale-[1.06]';

  // ---- form state ----
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // ---- actions ----
  const signIn = async () => {
    try {
      setBusy(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      window.location.hash = '#/browse';
    } catch (err) {
      console.error('signin failed:', err);
      alert(tOr('signinFailed', 'Could not sign in. Please check email/password.'));
    } finally {
      setBusy(false);
    }
  };

  const signUp = async () => {
    try {
      setBusy(true);
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      window.location.hash = '#/browse';
    } catch (err) {
      console.error('signup failed:', err);
      alert(tOr('signupFailed', 'Could not sign up. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  // keep name EXACTLY "continueGuest" to match your codebase
  const continueGuest = async () => {
    try {
      setBusy(true);
      localStorage.setItem('tgn.guest', '1');
      window.dispatchEvent(new Event('guest:continue'));
      window.location.hash = '#/browse';
    } finally {
      setBusy(false);
    }
  };

  // ---- Enter to submit ----
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn();
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 text-center">
      {/* You can keep your Banner in Header; this page only shows the form area */}
      <p className="mt-4 text-gray-600 italic">{tOr('pleaseSignIn', 'Please sign in.')}</p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-3 mx-auto max-w-md">
        {/* Email */}
        <label className="block text-left">
          <span className="sr-only">{tOr('email', 'Email')}</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={tOr('email', 'Email')}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[#2D2A4A]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            required
          />
        </label>

        {/* Password */}
        <label className="block text-left">
          <span className="sr-only">{tOr('password', 'Password')}</span>
          <input
            type="password"
            autoComplete="current-password"
            placeholder={tOr('password', 'Password')}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[#2D2A4A]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            required
          />
        </label>

        {/* Buttons */}
        <div className="mt-3 grid grid-cols-3 gap-2 md:flex md:flex-wrap md:items-center md:gap-3">
          {/* Sign In = submit so Enter works */}
          <button
            type="submit"
            className="group btn btn-blue w-full md:w-auto justify-center not-italic disabled:opacity-60"
            disabled={busy}
            aria-label={tOr('signIn', 'Sign In')}
            title={tOr('signIn', 'Sign In')}
          >
            <span className={grow}>
              {busy ? `${tOr('signIn', 'Sign In')}…` : tOr('signIn', 'Sign In')}
            </span>
          </button>

          <button
            type="button"
            className="group btn btn-red w-full md:w-auto justify-center not-italic disabled:opacity-60"
            onClick={signUp}
            disabled={busy}
            aria-label={tOr('signUp', 'Sign Up')}
            title={tOr('signUp', 'Sign Up')}
          >
            <span className={grow}>
              {busy ? `${tOr('signUp', 'Sign Up')}…` : tOr('signUp', 'Sign Up')}
            </span>
          </button>

          <button
            type="button"
            className="group btn btn-blue w-full md:w-auto justify-center not-italic disabled:opacity-60"
            onClick={continueGuest}
            disabled={busy}
            aria-label={tOr('continueAsGuest', 'Continue as Guest')}
            title={tOr('continueAsGuest', 'Continue as Guest')}
          >
            <span className={grow}>
              {busy
                ? `${tOr('continueAsGuest', 'Continue as Guest')}…`
                : tOr('continueAsGuest', 'Continue as Guest')}
            </span>
          </button>
        </div>
      </form>
    </main>
  );
}
