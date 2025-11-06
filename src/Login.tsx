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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false); // controls Sign Out visibility

  // watch auth (3 lines)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u: User | null) => setIsAuthed(!!u));
    return () => unsub();
  }, [auth]);

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setMode('idle');
      setEmail('');
      setPassword('');
    } catch (e: any) {
      setError(e.message || 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async () => {
    setBusy(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      setMode('idle');
      setEmail('');
      setPassword('');
    } catch (e: any) {
      setError(e.message || 'Sign up failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await signOut(auth);
    } finally {
      setBusy(false);
    }
  };

  // safe i18n helper
  const S = (k: any, fallback: string) => {
    try {
      return t(k as any);
    } catch {
      return fallback;
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-10 text-center">
      <p className="text-gray-600 mb-6">{S('pleaseSignIn', 'Please sign in.')}</p>

      {/* ---- AUTH FORM CARD (appears when mode is 'signin' or 'signup') ---- */}
      {mode !== 'idle' && (
        <div className="rounded-2xl border border-gray-200 p-5 text-left shadow-sm mx-auto max-w-sm mb-6">
          <h3 className="text-lg font-semibold mb-3">
            {mode === 'signin' ? S('signIn', 'Sign In') : S('signUp', 'Sign Up')}
          </h3>

          <label className="block text-sm text-gray-600 mb-1">{S('email', 'Email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 mb-3 outline-none focus:ring focus:ring-blue-200"
            placeholder={S('phContactEmail', 'Email')}
          />

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
            {/* Action button: Sign In or Sign Up */}
            {mode === 'signin' ? (
              <button
                onClick={handleSignIn}
                disabled={busy || !email || !password}
                // Use Thai-red for the primary action button inside the card
                className="rounded-xl px-4 py-2 bg-[#A51931] text-white shadow hover:shadow-md disabled:opacity-50"
                type="button"
              >
                {busy ? S('contactSending', 'Sending...') : S('signIn', 'Sign In')}
              </button>
            ) : (
              <button
                onClick={handleSignUp}
                disabled={busy || !email || !password}
                className="rounded-xl px-4 py-2 bg-[#A51931] text-white shadow hover:shadow-md disabled:opacity-50"
                type="button"
              >
                {busy ? S('contactSending', 'Sending...') : S('signUp', 'Sign Up')}
              </button>
            )}

            {/* Cancel button */}
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

      {/* ---- MAIN BUTTON ROW (Sign In/Up, Sign Out, Continue as Guest) ---- */}
      {/* This row replaces the multiple messy blocks in your previous code. */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {/* --- 1. Sign In / Log Out Section --- */}
        {isAuthed ? (
          // If authed, show Log Out (Thai-red, as requested)
          <button
            onClick={handleLogout}
            className="rounded-2xl px-6 py-3 bg-[#A51931] text-white shadow hover:shadow-md disabled:opacity-50"
            disabled={busy}
            type="button"
          >
            {S('logout', 'Log Out')}
          </button>
        ) : (
          // If NOT authed, show Sign In and Sign Up (to open the card above)
          <>
            {/* Sign In (Thai-blue, matches screenshot) */}
            <button
              onClick={() => setMode(mode === 'signin' ? 'idle' : 'signin')}
              className="rounded-2xl px-6 py-3 bg-[#2D2A4A] text-white shadow hover:shadow-md"
              type="button"
            >
              {S('signIn', 'Sign In')}
            </button>

            {/* Sign Up (Thai-red, matches screenshot) */}
            <button
              onClick={() => setMode(mode === 'signup' ? 'idle' : 'signup')}
              className="rounded-2xl px-6 py-3 bg-[#A51931] text-white shadow hover:shadow-md"
              type="button"
            >
              {S('signUp', 'Sign Up')}
            </button>
          </>
        )}

        {/* --- 2. Continue as Guest Button (Thai-blue, matches screenshot) --- */}
        <a
          href="#/browse"
          // This event tells the app to set guest mode and navigate
          onClick={() => window.dispatchEvent(new Event('guest:continue'))}
          className="inline-block rounded-2xl px-6 py-3 bg-[#2D2A4A] text-white shadow hover:shadow-md"
        >
          {S('continueAsGuest', 'Continue as Guest')}
        </a>
      </div>
    </div>
  );
}
