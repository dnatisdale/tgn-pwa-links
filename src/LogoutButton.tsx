// src/LogoutButton.tsx
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useI18n } from './i18n-provider';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

const grow =
  'motion-safe:transition-transform motion-safe:duration-150 group-hover:scale-[1.06] group-focus-visible:scale-[1.06] active:scale-[1.06]';

export default function LogoutButton({ className = 'btn btn-blue', children }: Props) {
  const [busy, setBusy] = React.useState(false);

  // safe translator + tiny fallback, same idea as Login.tsx
  const rawT = (() => {
    try {
      return useI18n().t as (k: string) => string;
    } catch {
      return undefined;
    }
  })();
  const t = (k: string) => {
    try {
      return rawT?.(k) ?? k;
    } catch {
      return k;
    }
  };
  const tOr = (k: string, fb: string) => {
    const v = (t(k) ?? '').toString().trim();
    return v || fb;
  };

  const defaultLabel = tOr('logout', 'Log Out');

  const handleLogout = async () => {
    try {
      setBusy(true);
      await signOut(auth);
      localStorage.removeItem('tgn.guest');
      window.location.hash = '#/';
    } catch (err) {
      console.error('Logout failed:', err);
      alert(tOr('logoutFailed', 'Could not log out. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`group ${className}`}
      disabled={busy}
      style={{ padding: '6px 12px', borderRadius: 12, fontWeight: 600 }}
      aria-label={defaultLabel}
      title={defaultLabel}
    >
      <span className={grow}>{children ?? (busy ? `${defaultLabel}…` : defaultLabel)}</span>
    </button>
  );
}
