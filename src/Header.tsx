// src/Header.tsx
import React from 'react';
import Banner from './Banner';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import InstallPWA from './InstallPWA';
import LangPill from './LangPill';
import LogoutButton from './LogoutButton';
import { useI18n } from './i18n-provider';

export default function Header() {
  const { t } = useI18n?.() ?? { t: (s: string) => s };
  const [isAuthed, setIsAuthed] = React.useState(false);

  React.useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setIsAuthed(!!u);
      // console.log("[auth]", u?.email ?? "guest");
    });
    return () => unsub();
  }, []);

  return (
    <header className="relative w-full">
      {/* Top-right controls */}
      <div className="absolute top-2 right-3 z-50 flex items-center gap-2">
        <LangPill />
        <InstallPWA className="btn btn-red" label={t('install')} disabledLabel={t('install')} />
        {isAuthed && <Logout Button className="btn btn-blue">{t('logout')}</LogoutButton>}
      </div>

      {/* Add a bit of top padding on small screens so buttons don't overlap the banner */}
      <div className="pt-10 md:pt-0">
        <Banner />
      </div>
    </header>
  );
}
