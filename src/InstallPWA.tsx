// src/InstallPWA.tsx
import React from 'react';

type Props = {
  className?: string;
  label?: string;
  disabledLabel?: string;
};

export default function InstallPWA({
  className = '',
  label = 'Install',
  disabledLabel = 'Install',
}: Props) {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [canInstall, setCanInstall] = React.useState(false);
  const [installed, setInstalled] = React.useState(false);

  // Detect installed
  const checkInstalled = React.useCallback(() => {
    const isStandalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      // @ts-ignore iOS
      (window.navigator as any).standalone === true;
    setInstalled(isStandalone);
  }, []);

  React.useEffect(() => {
    checkInstalled();

    const beforeHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as any);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', beforeHandler as any);

    const appInstalledHandler = () => {
      setInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeHandler as any);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, [checkInstalled]);

  const onClick = async () => {
    // iOS: show tip
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isiOS && isSafari) {
      alert('บน iPhone/iPad: กด Share → Add to Home Screen เพื่อติดตั้งแอปค่ะ');
      return;
    }

    if (!deferredPrompt) return;
    await (deferredPrompt as any).prompt();
    try {
      await (deferredPrompt as any).userChoice;
    } finally {
      setDeferredPrompt(null);
      setCanInstall(false);
      // Install may complete -> appinstalled event will setInstalled(true)
    }
  };

  // Hide if already installed
  if (installed) return null;

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={!canInstall}
      title={canInstall ? label : disabledLabel}
      aria-disabled={!canInstall}
      style={{ minWidth: 92 }}
    >
      {label}
    </button>
  );
}
