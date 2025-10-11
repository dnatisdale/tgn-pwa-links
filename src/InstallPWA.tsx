// src/InstallPWA.tsx
import React, { useEffect, useState } from "react";

type PWAEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (navigator as any).standalone === true ||
         window.matchMedia?.("(display-mode: standalone)").matches;
}
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallPWA() {
  const [evt, setEvt] = useState<PWAEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setEvt(e as PWAEvent);
    };
    const onAppInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (evt) {
      await evt.prompt();
      try { await evt.userChoice; } finally { setEvt(null); }
    } else {
      // Fallback guidance
      if (isIOS()) {
        alert("iOS: Tap Share (□↑) → Add to Home Screen");
      } else {
        alert("Use your browser menu → Install app / Add to Home Screen");
      }
    }
  };

  const Icon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden style={{ marginRight: 6 }}>
      <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z" fill="#111827"/>
      <path d="M12 7v10M7 12h10" stroke="#DA1A32" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <button className="linklike" onClick={install} aria-label="Install app" title="Install">
      <Icon /> Install
    </button>
  );
}
