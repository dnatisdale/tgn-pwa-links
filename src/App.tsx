// src/App.tsx — Simplified root linking to AppMain with working topbar & logout

import React, { useEffect, useState } from 'react';
import AppMain from './components/AppMain';
import Login from './Login';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import UpdateToast from './UpdateToast';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [guestMode, setGuestMode] = useState(localStorage.getItem('tgn.guest') === '1');
  const [showUpdate, setShowUpdate] = useState(false);

  // Firebase Auth listener
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  // PWA update
  useEffect(() => {
    const onNeed = () => setShowUpdate(true);
    window.addEventListener('pwa:need-refresh', onNeed);
    return () => window.removeEventListener('pwa:need-refresh', onNeed);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('tgn.guest');
    setGuestMode(false);
  };

  if (!user && !guestMode) {
    return <Login />;
  }

  return (
    <>
      <AppMain user={user} onLogout={handleLogout} />
      <UpdateToast
        show={showUpdate}
        onRefresh={() => {
          (window as any).__REFRESH_SW__?.();
          setShowUpdate(false);
        }}
        onSkip={() => setShowUpdate(false)}
      />
    </>
  );
}
