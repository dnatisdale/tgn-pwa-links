// src/InstallPWA.tsx
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  /** Your theme classes; defaults to Thai-red button */
  className?: string;
  /** Label when install is available */
  labelReady?: string;
  /** Label while waiting (event not fired yet) */
  labelWaiting?: string;
  /** If true, actually disables the button while waiting; default: false (keeps it clickable so it doesn’t look faded) */
  disableWhenNotReady?: boolean;
  /** Optional: called after the user accepts/dismisses the prompt */
  onChoice?: (outcome: "accepted" | "dismissed") => void;
};

/** Chrome’s non-standard event shape */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneNow() {
  // iOS Safari
  if ((window.navigator as any).standalone) return true;
  // PWA installed on other platforms
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  return false;
}

export default function InstallPWA({
  className = "btn btn-red",
  labelReady = "Install",
  labelWaiting = "Install",
  disableWhenNotReady = false,
  onChoice,
}: Props) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(isStandaloneNow());

  // Listen for the prompt event once and keep it for later
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault(); // prevent auto-banner
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // If app becomes installed while we’re open (Chrome on desktop/mobile)
    const onAppInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  // Also re-check standalone status when the tab becomes visible (some browsers update late)
  useEffect(() => {
    const onVis = () => setInstalled(isStandaloneNow());
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const ready = useMemo(() => !!deferred, [deferred]);

  if (installed) return null; // already installed — hide button

  const onClick = async () => {
    if (!ready) {
      // Keep button enabled so it’s not visually dim; give a friendly nudge
      alert(
        "Install isn’t available yet.\n\nTip: Open this site from your browser (not inside another app), " +
          "use HTTPS, and interact with the page a bit. The install prompt will appear when ready."
      );
      return;
    }
    try {
      await deferred!.prompt();
      const { outcome } = await deferred!.userChoice;
      onChoice?.(outcome);
      // After prompting, many browsers invalidate the event
      setDeferred(null);
    } catch {
      // user dismissed; ignore
    }
  };

  const actuallyDisabled = disableWhenNotReady && !ready;

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={actuallyDisabled}
      aria-disabled={actuallyDisabled}
      data-ready={ready ? "true" : "false"}
      title={!ready && !actuallyDisabled ? "Install not ready yet" : undefined}
    >
      {ready ? labelReady : labelWaiting}
    </button>
  );
}
