// src/Header.tsx
import React, { useEffect, useState } from 'react';
import Banner from './Banner';
import LangPill from './LangPill';
import LogoutButton from './LogoutButton';
import { useI18n } from './i18n-provider';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { usePWAInstall } from './usePWAInstall'; // ✅ new hook

export default function Header() {
  const { t } = useI18n?.() ?? { t: (s: string) => s };
  const [isAuthed, setIsAuthed] = useState(false);
  const { canInstall, install } = usePWAInstall();

  // ✅ Track authentication state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setIsAuthed(!!user));
    return () => unsub();
  }, []);

  return (
    <header className="relative w-full">
      {/* --- Top-right controls --- */}
      <div className="absolute top-2 right-3 z-50 flex items-center gap-2">
        {/* Language pill */}
        <LangPill />

        {/* Install PWA button */}
        {canInstall && (
          <button onClick={install} className="btn btn-red" title={t('install')}>
            {t('install')}
          </button>
        )}

        {/* Logout button (only when logged in) */}
        {isAuthed && <LogoutButton className="btn btn-blue">{t('logout')}</LogoutButton>}
      </div>

      {/* --- Banner --- */}
      <Banner />
    </header>
  );
}
