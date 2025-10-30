// src/Header.tsx
import React from 'react';
import Banner from './Banner';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import InstallPWA from './InstallPWA';
import LangPill from './LangPill';
import LogoutButton from './LogoutButton';
import { useI18n } from './i18n-provider';
{
  /* import Banner from './Banner'; */
}

export default function Header() {
  const { t } = useI18n();
  const [isAuthed, setIsAuthed] = React.useState(false);

  React.useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setIsAuthed(Boolean(u)));
    return () => unsub();
  }, []);

  return (
    // src/Header.tsx (inside the component's return)
    <header className="relative w-full">
      {/* Top-right controls (absolute) */}
      <div className="absolute top-2 right-3 z-50 flex items-center gap-2">
        <LangPill />
        <InstallPWA
          className="btn btn-red install-pwa"
          label={t('install')}
          disabledLabel={t('install')}
        />
        {isAuthed ? <LogoutButton className="btn btn-blue">{t('logout')}</LogoutButton> : null}
      </div>

      {/* Banner below; add small top padding on mobile to avoid overlap */}
      <div className="pt-10 md:pt-0">
        <Banner />
      </div>
    </header>
  );
}
