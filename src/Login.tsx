// src/Login.tsx

import { useEffect, useState } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { useI18n } from './i18n-provider';

export default function Login() {
  const { t } = useI18n();
  const auth = getAuth();

  const [mode, setMode] = useState<'idle' | 'signin' | 'signup'>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // Watch auth state so we can show Sign Out if already logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u: User | null) => {
      setIsAuthed(!!u);
    });
    return () => unsub();
  }, [auth]);

  const S = (k: any, fallback: string) => {
    try {
      return t(k as any) || fallback;
    } catch {
      return fallback;
    }
  };

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setMode('idle');
      setEmail('');
      setPassword('');
      window.dispatchEvent(new Event('auth:login'));
    } catch (e: any) {
      setError(e?.message || 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async () => {
    setBusy(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      // you can later attach displayName via updateProfile if needed
      setMode('idle');
      setEmail('');
      setPassword('');
      setDisplayName('');
      window.dispatchEvent(new Event('auth:login'));
    } catch (e: any) {
      setError(e?.message || 'Sign up failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await signOut(auth);
      setMode('idle');
      window.dispatchEvent(new Event('auth:logout'));
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const toggleSignIn = () => setMode((m) => (m === 'signin' ? 'idle' : 'signin'));

  const toggleSignUp = () => setMode((m) => (m === 'signup' ? 'idle' : 'signup'));

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-10 text-center">
      <p className="text-gray-600 mb-6">
        {S('pleaseSignIn', 'Please sign in to use Thai Good News.')}
      </p>

      {/* Main button row */}
      <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
        {isAuthed ? (
          <button
            onClick={handleLogout}
            className="rounded-2xl px-6 py-3 bg-[#A51931] text-white shadow hover:shadow-md disabled:opacity-50"
            disabled={busy}
            type="button"
          >
            {S('logout', 'Sign Out')}
          </button>
        ) : (
          <>
            <button
              onClick={toggleSignIn}
              className="rounded-2xl px-6 py-3 bg-[#2D2A4A] text-white shadow hover:shadow-md"
              type="button"
            >
              {S('signIn', 'Sign In')}
            </button>
            <button
              onClick={toggleSignUp}
              className="rounded-2xl px-6 py-3 bg-[#A51931] text-white shadow hover:shadow-md"
              type="button"
            >
              {S('signUp', 'Sign Up')}
            </button>
          </>
        )}
      </div>

      {/* Collapsible form */}
      {!isAuthed && mode !== 'idle' && (
        <div className="rounded-2xl border border-gray-200 p-5 text-left shadow-sm mx-auto max-w-sm mb-6">
          <h3 className="text-lg font-semibold mb-3">
            {mode === 'signin' ? S('signIn', 'Sign In') : S('signUp', 'Sign Up')}
          </h3>

          {/* Name (signup only, optional) */}
          {mode === 'signup' && (
            <>
              <label className="block text-sm text-gray-600 mb-1">{S('name', 'Name')}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 mb-3 outline-none focus:ring focus:ring-blue-200"
                placeholder={S('name', 'Name')}
              />
            </>
          )}

          {/* Email */}
          <label className="block text-sm text-gray-600 mb-1">{S('email', 'Email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 mb-3 outline-none focus:ring focus:ring-blue-200"
            placeholder={S('phContactEmail', 'Email')}
          />

          {/* Password */}
          <label className="block text-sm text-gray-600 mb-1">{S('password', 'Password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 mb-4 outline-none focus:ring focus:ring-blue-200"
            placeholder={S('password', 'Password')}
          />

          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

          <div className="flex items-center gap-3">
            {mode === 'signin' ? (
              <button
                onClick={handleSignIn}
                disabled={busy || !email || !password}
                className="rounded-2xl px-4 py-2 bg-[#2D2A4A] text-white shadow hover:shadow-md disabled:opacity-50"
                type="button"
              >
                {busy ? S('contactSending', 'Sending…') : S('signIn', 'Sign In')}
              </button>
            ) : (
              <button
                onClick={handleSignUp}
                disabled={busy || !email || !password}
                className="rounded-2xl px-4 py-2 bg-[#A51931] text-white shadow hover:shadow-md disabled:opacity-50"
                type="button"
              >
                {busy ? S('contactSending', 'Sending…') : S('signUp', 'Sign Up')}
              </button>
            )}

            <button
              onClick={() => setMode('idle')}
              className="rounded-xl px-4 py-2 border border-gray-300"
              type="button"
            >
              {S('cancel', 'Cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
