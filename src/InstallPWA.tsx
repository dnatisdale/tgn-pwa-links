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
    const onBeforeInstall = (e: Event) => { e.preventDefault(); setEvt(e as PWAEvent); };
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
      if (isIOS()) alert("iOS: Tap Share (□↑) → Add to Home Screen");
      else alert("Use your browser menu → Install app / Add to Home Screen");
    }
  };

  return (
    <button className="linklike" onClick={install} aria-label="Install app" title="Install">
      Install
    </button>
  );
}
