import React, { useEffect, useState } from "react";

type PWAEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPWA() {
  const [evt, setEvt] = useState<PWAEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setEvt(e as PWAEvent);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    try {
      await evt.userChoice;
    } finally {
      setEvt(null);
      setCanInstall(false);
    }
  };

  // iOS Safari doesn’t fire this event (use “Share → Add to Home Screen” there)
  if (!canInstall) return null;

  return (
    <button className="linklike" onClick={install} aria-label="Install app">
      ◆ Install
    </button>
  );
}
