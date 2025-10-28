// src/InstallPWA.tsx
import React, { useEffect, useMemo, useState } from 'react';
import type { BeforeInstallPromptEvent } from './types-pwa';

type Props = {
  className?: string; // e.g. "btn btn-red"
  label?: string; // when prompt is available
  disabledLabel?: string; // shown when prompt not yet available
  showIOSHelp?: boolean; // show iOS instruction dialog if prompt not supported
};

// Simple platform checks
function isStandalone(): boolean {
  // PWA already installed?
  // iOS: navigator.standalone; others: matchMedia
  // (cast to any to silence TS for iOS)
  const navAny = navigator as any;
  return !!navAny.standalone || window.matchMedia('(display-mode: standalone)').matches;
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallPWA({
  className = 'btn btn-red',
  label = 'Install',
  disabledLabel = 'Install',
  showIOSHelp = true,
}: Props) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ready, setReady] = useState(false); // whether we’ve seen beforeinstallprompt
  const [installed, setInstalled] = useState(isStandalone());

  // If app is already installed, hide button
  useEffect(() => {
    // Listen for install completion in Chromium
    const onInstalled = () => setInstalled(true);
    window.addEventListener('appinstalled', onInstalled);

    // Also re-evaluate on visibility changes (some browsers update matchMedia late)
    const onVis = () => setInstalled(isStandalone());
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.removeEventListener('appinstalled', onInstalled);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Capture the install prompt so we can trigger it from our button
  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // stop the native mini-infobar
      setDeferred(e as BeforeInstallPromptEvent);
      setReady(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
    return () =>
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
  }, []);

  const iosHelp = useMemo(
    () => "On iPhone/iPad: tap the Share icon, then 'Add to Home Screen'.",
    []
  ); // <-- fixed missing parenthesis

  const onClick = async () => {
    // If we already run as installed, do nothing
    if (installed) return;

    // Chromium path: have a deferred prompt
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice; // "accepted" | "dismissed"
        // The event becomes unusable after the choice
        setDeferred(null);
      } catch {
        // user dismissed — ignore
      }
      return;
    }

    // No deferred prompt (Safari/iOS or not yet eligible)
    if (showIOSHelp && isIOS()) {
      alert(iosHelp);
      return;
    }

    // Generic hint for other platforms
    alert(
      'Install prompt isn’t ready yet.\n\n• Android/Chrome: try again after browsing a bit.\n• iPhone/iPad: tap Share → Add to Home Screen.'
    );
  };

  // Hide the button completely if we’re already installed
  if (installed) return null;

  // Keep the button **enabled** so it never looks faded; show helpful text if not ready
  const text = deferred ? label : disabledLabel;

  return (
    <button
      className={className}
      onClick={onClick}
      // no disabled attribute -> keeps consistent height/color
      aria-label="Install this app"
      title={deferred ? 'Install PWA' : undefined}
    >
      {text}
    </button>
  );
}
