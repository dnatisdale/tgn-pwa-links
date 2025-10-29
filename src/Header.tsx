// src/Header.tsx
import React from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import InstallPWA from './InstallPWA';
import LangPill from './LangPill';
import LogoutButton from './LogoutButton';
import { useI18n } from './i18n-provider'; // <<— add

export default function Header() {
  const { t } = useI18n();
  const [isAuthed, setIsAuthed] = React.useState(false);

  React.useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setIsAuthed(Boolean(u)));
    return () => unsub();
  }, []);

  return (
    <header className="tgn-header">
      <div className="tgn-header-left">
        <picture>
          <source media="(min-width:1280px)" srcSet="/banners/tgn-banner-2400x600.png?v=1" />
          <source media="(min-width:700px)" srcSet="/banners/tgn-banner-1200x300.png?v=1" />
          <img
            src="/banners/tgn-banner-600x150.png?v=1"
            alt="Thai Good News"
            className="tgn-banner-img"
          />
        </picture>
      </div>

      {/* Overlay: upper-right */}
      <div className="action-cluster">
        {/* LangPill on the LEFT of Install */}
        <LangPill className="langpill" />

        {/* RIGHT stack: Install (top) with Logout (below) */}
        <div className="action-right-stack">
          <InstallPWA
            className="btn btn-red install-pwa"
            label={t('install')}
            disabledLabel={t('install')}
          />
          {isAuthed ? <LogoutButton className="btn btn-blue">{t('logout')}</LogoutButton> : null}
        </div>
      </div>
    </header>
  );
}
