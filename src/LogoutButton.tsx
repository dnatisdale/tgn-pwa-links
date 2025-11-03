// src/LogoutButton.tsx
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

const grow =
  'motion-safe:transition-transform motion-safe:duration-150 group-hover:scale-[1.06] group-focus-visible:scale-[1.06] active:scale-[1.06]';

export default function LogoutButton({ className = 'btn btn-blue', children }: Props) {
  const [busy, setBusy] = React.useState(false);
  const label = children ?? 'Log Out';

  const handleLogout = async () => {
    try {
      setBusy(true);
      await signOut(auth);
      localStorage.removeItem('tgn.guest');
      window.location.hash = '#/';
    } catch (err) {
      console.error('Logout failed:', err);
      alert('Could not log out. Please try again.');
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
      title={typeof label === 'string' ? label : 'Log Out'}
    >
      <span className={grow}>{busy && typeof label === 'string' ? `${label}…` : label}</span>
    </button>
  );
}
