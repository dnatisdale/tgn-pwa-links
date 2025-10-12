// src/InstallPWA.tsx
import React, { useEffect, useState } from "react";

declare global {
  interface Window {
    __tgnUpdateSW?: (reload?: boolean) => void;
  }
}

export default function InstallPWA() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: any) => {
      e.preventDefault();
      setPromptEvent(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall as any);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall as any);
  }, []);

  async function doInstall() {
    try {
      if (promptEvent) {
        await promptEvent.prompt();
        await promptEvent.userChoice;
        setPromptEvent(null);
        setCanInstall(false);
      } else if ((navigator as any).standalone === false) {
        alert("On iPhone/iPad: Share → Add to Home Screen");
      } else {
        alert("If your browser supports it, an install prompt will show here.");
      }
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  return (
    <button className="btn-red" onClick={doInstall} aria-label="Install app">
      Install
    </button>
  );
}
