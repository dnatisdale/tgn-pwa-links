// src/Header.tsx
import React from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import InstallPWA from './InstallPWA';
import LangPill from './LangPill';
import LogoutButton from './LogoutButton';
import { useI18n } from './i18n-provider';
import Banner from './Banner';

export default function Header() {
  const { t } = useI18n();
  const [isAuthed, setIsAuthed] = React.useState(false);

  React.useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setIsAuthed(Boolean(u)));
    return () => unsub();
  }, []);

  return (
    <header className="w-full">
      {/* Banner on top */}
      {/* <Banner /> */}

      {/* Controls row BELOW banner, aligned right */}
      <div className="max-w-5xl mx-auto px-3 py-2 flex items-center justify-end gap-2">
        <LangPill />
        <InstallPWA
          className="btn btn-red install-pwa"
          label={t('install')}
          disabledLabel={t('install')}
        />
        {isAuthed ? <LogoutButton className="btn btn-blue">{t('logout')}</LogoutButton> : null}
      </div>
    </header>
  );
}
