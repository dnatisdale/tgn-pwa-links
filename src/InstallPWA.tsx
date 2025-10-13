// src/InstallPWA.tsx
import React, { useEffect, useState } from "react";

type Props = {
  className?: string;
  label?: string;
  disabledLabel?: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallPWA({
  className = "btn btn-red",
  label = "Install",
  disabledLabel = "Install",
}: Props) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setSupported(true);
    };

    // Some browsers won’t fire the event until criteria are met.
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const onClick = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
      // After the choice is made, most browsers invalidate the event
      setDeferred(null);
    } catch {
      // user cancelled — ignore
    }
  };

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={!deferred}
      title={!deferred && supported ? "Not ready yet" : undefined}
    >
      {deferred ? label : disabledLabel}
    </button>
  );
}
