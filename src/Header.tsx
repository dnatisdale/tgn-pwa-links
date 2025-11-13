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
};

type HeaderProps = {
  onOpenSidebar?: () => void;
};

export default function Header({ onOpenSidebar }: HeaderProps) {
  const { t } = useI18n();
  const [isAuthed, setIsAuthed] = React.useState(false);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthed(!!user);
    });
    return () => unsub();
  }, []);

  return (
    <header className="relative w-full">
      {/* Top row: logo / title + optional sidebar button */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Optional hamburger to open the language sidebar */}
          {onOpenSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm hover:bg-gray-100"
            >
              <span className="sr-only">Open language filter</span>
              {/* simple 3-line hamburger */}
              <span className="flex flex-col gap-[3px]">
                <span className="h-[2px] w-4 bg-gray-700 rounded-full" />
                <span className="h-[2px] w-4 bg-gray-700 rounded-full" />
                <span className="h-[2px] w-4 bg-gray-700 rounded-full" />
              </span>
            </button>
          )}

          <div className="text-left">
            <div className="text-lg font-semibold leading-tight">Thai Good News</div>
            <div className="text-xs text-gray-500 leading-tight">
              Audio library • bilingual (TH / EN)
            </div>
          </div>
        </div>

        {/* Top-right controls */}
        <div className="flex items-center gap-2">
          <LangPill />

          {/* Install = Thai-red */}
          <InstallPWA
            className="px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm bg-[#A51931] text-white hover:bg-[#8b1629] disabled:opacity-50 disabled:cursor-not-allowed"
            label={t('install')}
            disabledLabel={t('install')}
          />

          {/* If authed: show Log Out (Thai-blue); if guest, nothing here */}
          {isAuthed && (
            <LogoutButton className="px-4 py-1.5 rounded-full text-sm font-semibold border border-[#2D2A4A] text-[#2D2A4A] hover:bg-[#2D2A4A] hover:text-white">
              {t('logout')}
            </LogoutButton>
          )}
        </div>
      </div>

      {/* Big graphic banner just under the header controls */}
      <div className="mt-1">
        <Banner />
      </div>
    </header>
  );
}
