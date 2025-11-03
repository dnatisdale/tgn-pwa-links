// src/LogoutButton.tsx
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export default function LogoutButton({ className = 'btn btn-blue', children }: Props) {
  const [busy, setBusy] = React.useState(false);

  const handleLogout = async () => {
    try {
      setBusy(true);
      await signOut(auth); // ✅ use the shared instance
      localStorage.removeItem('tgn.guest'); // clear guest flag
      window.location.hash = '#/'; // simple navigate home
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
