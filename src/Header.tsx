// src/Header.tsx
import React from 'react';
import Banner from './Banner';
import InstallPWA from './InstallPWA';
import LangPill from './LangPill';
import LogoutButton from './LogoutButton';
import { useI18n } from './i18n-provider';

// ✅ Use the same auth instance you export from firebase.ts
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const exitGuestAndShowLogin = () => {
  localStorage.removeItem('tgn.guest');
  // tell App to flip guestMode=false
  window.dispatchEvent(new Event('guest:exit'));
  // optional: send them to the start
  window.location.hash = '#/browse';
};

export default function Header() {
  const { t } = useI18n?.() ?? { t: (s: string) => s };
  const [isAuthed, setIsAuthed] = React.useState(false);
  const [isGuest, setIsGuest] = React.useState(
    typeof localStorage !== 'undefined' && localStorage.getItem('tgn.guest') === '1'
  );

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setIsAuthed(!!u);
      setIsGuest(localStorage.getItem('tgn.guest') === '1');
    });

    const onGuest = () => setIsGuest(true);
    window.addEventListener('guest:continue', onGuest);

    return () => {
      unsub();
      window.removeEventListener('guest:continue', onGuest);
    };
  }, []);

  return (
    <header className="relative w-full">
      {/* Top-right controls */}
      <div className="absolute top-2 right-3 z-50 flex items-center gap-2">
        <LangPill />
        <InstallPWA className="btn btn-red" label={t('install')} disabledLabel={t('install')} />

        {/* Only show Log Out button when user is authenticated (not guest) */}
        {isAuthed && <LogoutButton className="btn btn-blue">{t('logout')}</LogoutButton>}
      </div>

      <Banner />
      {/* <TopTabs /> */}
    </header>
  );
}
