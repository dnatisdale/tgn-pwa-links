// src/LogoutButton.tsx
import React from 'react';
import { getAuth, signOut } from 'firebase/auth';

export default function LogoutButton({ className }: { className?: string }) {
  const [busy, setBusy] = React.useState(false);

  const handleLogout = async () => {
    try {
      setBusy(true);
      const auth = getAuth(); // uses the default app you initialize in firebase.ts
      await signOut(auth);
      // Optional: reload or route to login page
      window.location.reload();
    } catch (err) {
      console.error('Logout failed', err);
      setBusy(false);
      alert('Could not log out. Please try again.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className}
      disabled={busy}
      style={{
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid #000',
        fontWeight: 600,
        cursor: busy ? 'not-allowed' : 'pointer',
      }}
      title="Log out"
    >
      {busy ? 'Logging out…' : 'Log Out'}
    </button>
  );
}
