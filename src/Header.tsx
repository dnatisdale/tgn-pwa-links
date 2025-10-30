// src/Header.tsx
import React from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import InstallPWA from './InstallPWA';
import LangPill from './LangPill';
import LogoutButton from './LogoutButton';
import { useI18n } from './i18n-provider';
import Banner from './Banner'; // ✅ add this

export default function Header() {
  const { t } = useI18n();
  const [isAuthed, setIsAuthed] = React.useState(false);

  React.useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setIsAuthed(Boolean(u)));
    return () => unsub();
  }, []);

  return (
    <header className="tgn-header" style={{ position: 'relative' }}>
      {' '}
      {/* ✅ make it a positioning context */}
      {/* LEFT: responsive banner */}
      <div className="tgn-header-left">
        <Banner /> {/* ✅ actually render the banner */}
      </div>
      {/* RIGHT: LangPill + Install + (Log Out if authed) */}
      <div
        className="tgn-header-right"
        style={{
          position: 'absolute',
          top: 8,
          right: 10,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          zIndex: 40, // sit above banner
        }}
      >
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
