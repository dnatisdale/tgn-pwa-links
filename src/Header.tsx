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

// src/Header.tsx  (replace the component body)
export default function Header() {
  const { t } = useI18n();
  const [isAuthed, setIsAuthed] = React.useState<boolean>(false);

  React.useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setIsAuthed(!!u);
      // console.log('[auth] user', u ? u.email : 'guest');
    });
    return () => unsub();
  }, []);

  return (
    <header className="relative w-full">
      {/* Top-right controls (always visible) */}
      <div className="absolute top-2 right-3 z-50 flex items-center gap-2">
        <LangPill />
        <InstallPWA
          className="btn btn-red install-pwa"
          label={t('install')}
          disabledLabel={t('install')}
        />
        {isAuthed && <LogoutButton className="btn btn-blue">{t('logout')}</LogoutButton>}
      </div>

      {/* Keep banner below; add padding so buttons don’t overlap on small screens */}
      <div className="pt-10 md:pt-0">
        <Banner />
      </div>
    </header>
  );
}
