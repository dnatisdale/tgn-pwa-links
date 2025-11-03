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

  const showLogout = isAuthed || isGuest;

  return (
    <header className="relative w-full">
      {/* Top-right controls */}
      <div className="absolute top-2 right-3 z-50 flex items-center gap-2">
        <LangPill />
        <InstallPWA className="btn btn-red" label={t('install')} disabledLabel={t('install')} />
        <div className="absolute top-2 right-3 z-50 flex items-center gap-2">
          <LangPill />
          <InstallPWA className="btn btn-red" label={t('install')} disabledLabel={t('install')} />

          {/* If guest: show Sign in; if authed: show Log Out */}
          {isGuest ? (
            <button
              type="button"
              onClick={exitGuestAndShowLogin}
              className="group btn btn-blue"
              title={t('signIn')}
              style={{ padding: '6px 12px', borderRadius: 12, fontWeight: 600 }}
            >
              <span className="motion-safe:transition-transform motion-safe:duration-150 group-hover:scale-[1.06] group-focus-visible:scale-[1.06] active:scale-[1.06]">
                {t('signIn')}
              </span>
            </button>
          ) : (
            showLogout && <LogoutButton className="btn btn-blue">{t('logout')}</LogoutButton>
          )}
        </div>
      </div>

      {/* Add a bit of top padding on small screens so buttons don't overlap the banner */}
      <div className="pt-10 md:pt-0">
        <Banner />
      </div>
    </header>
  );
}
