// src/LogoutButton.tsx
import React from 'react';
import { getAuth, signOut } from 'firebase/auth';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export default function LogoutButton({ className = 'btn btn-blue', children }: Props) {
  const [busy, setBusy] = React.useState(false);

  const handleLogout = async () => {
    try {
      setBusy(true);
      await signOut(getAuth());
      // clean up any guest flag
      localStorage.removeItem('tgn.guest');
      // simple navigate home (adjust if you have a router)
      window.location.hash = '#/';
    } catch (err) {
      console.error('Logout failed:', err);
      alert('Could not log out. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const label = children ?? 'Log Out';

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className}
      disabled={busy}
      style={{ padding: '6px 12px', borderRadius: 12, fontWeight: 600 }}
      title={typeof label === 'string' ? label : 'Log Out'}
    >
      {busy ? (typeof label === 'string' ? `${label}…` : label) : label}
    </button>
  );
}
