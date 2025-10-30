import React from 'react';
import { getAuth, signOut } from 'firebase/auth';

// src/LogoutButton.tsx
import React from 'react';
import { getAuth, signOut } from 'firebase/auth';

export default function LogoutButton({
  className = '',
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const onClick = async () => {
    try {
      await signOut(getAuth());
      // clean up any guest flags too
      localStorage.removeItem('tgn.guest');
      // optional: navigate home
      window.location.hash = '#/';
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <button className={className || 'btn btn-blue'} onClick={onClick}>
      {children || 'Log out'}
    </button>
  );
}

export default function LogoutButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = React.useState(false);
  const handleLogout = async () => {
    try {
      setBusy(true);
      await signOut(getAuth());
      window.location.reload();
    } catch (err) {
      console.error('Logout failed', err);
      setBusy(false);
      alert('Could not log out. Please try again.');
    }
  };
  const label = children ?? 'Log Out';
  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className}
      disabled={busy}
      style={{ padding: '6px 10px', borderRadius: 12, border: '1px solid #000', fontWeight: 600 }}
      title={typeof label === 'string' ? label : 'Log Out'}
    >
      {busy ? `${typeof label === 'string' ? label : 'Log Out'}…` : label}
    </button>
  );
}
