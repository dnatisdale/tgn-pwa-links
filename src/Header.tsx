// src/Header.tsx — top header: Banner (left) | Install · LangPill · Logout (right)
// Logout only shows when signedIn=true
import React from 'react';
import InstallPWA from './InstallPWA';
import LangPill from './LangPill';
import LogoutButton from './LogoutButton';
import { Lang } from './i18n';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

type Props = {
  lang: Lang;
  onLang: (l: Lang) => void;
  signedIn: boolean; // NEW: controls whether "Log Out" appears
};

export default function Header({ lang, onLang, signedIn }: Props) {
  async function onLogout() {
    try {
      await signOut(auth);
      window.location.hash = '#/browse';
    } catch (e) {
      alert(String(e));
    }
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        {/* LEFT: responsive banner */}
        {/* Banner with WebP + PNG fallback */}
        {/*  <picture>*/}
        {/* <source srcSet="/banners/Banner" type="image/webp" />*/}
        {/* <img*/}
        {/*  src="/banners/banner-1280x720.png"*/}
        {/*  alt="Thai Good News"*/}
        {/*  style={{ maxWidth: 680, width: '100%', height: 'auto' }}*/}
        {/*  loading="eager"*/}
        {/*  decoding="async"*/}
        {/*  />*/}
        {/* </picture>*/}

        {/* ...inside the header right cluster... */}
        <div className="tgn-header-right">
          <LangPill
            lang={'en'}
            onChange={function (l: Lang): void {
              throw new Error('Function not implemented.');
            }}
          />
          <InstallPWA className="langpill" label="Install" disabledLabel="Install" />
          <LogoutButton className="langpill" />
        </div>
        <div className="site-header__actions">
          <LangPill lang={lang} onChange={onLang} />
          <InstallPWA
            className="btn btn-red"
            label={lang === 'th' ? 'ติดตั้ง' : 'Install'}
            disabledLabel={lang === 'th' ? 'ติดตั้ง' : 'Install'}
          />
          {signedIn && (
            <button className="btn btn-blue ghost" onClick={onLogout}>
              {lang === 'th' ? 'ออกจากระบบ' : 'Log Out'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
