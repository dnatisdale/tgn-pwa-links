// src/InstallPWA.tsx
// ✅ Custom Thai-red “Install” button for your PWA header

import React, { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt?: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

interface InstallPWAProps {
  className?: string;
  label?: string;
  disabledLabel?: string;
}

export default function InstallPWA({
  className = '',
  label = 'Install',
  disabledLabel = 'Installed',
}: InstallPWAProps) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const doInstall = async () => {
    if (!prompt) return;
    try {
      await prompt.prompt?.();
      await prompt.userChoice;
      setPrompt(null);
    } catch {
      // silently ignore
    }
  };

  const canInstall = !!prompt && !installed;

  const grow = 'whitespace-nowrap transition-transform group-hover:scale-[1.03]';

  return (
    <button
      type="button"
      onClick={canInstall ? doInstall : undefined}
      disabled={!canInstall}
      // Thai-red button: same visual language as your ADD bar
      className={[
        'group inline-flex items-center justify-center select-none not-italic',
        'font-semibold text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2',
        'rounded-xl border border-black',
        canInstall ? 'bg-[#A51931] text-white' : 'bg-[#A51931] text-white opacity-95',
        className,
      ].join(' ')}
      title={canInstall ? label : disabledLabel}
    >
      <span className={grow}>{canInstall ? label : disabledLabel}</span>
    </button>
  );
}

// end of src/InstallPWA.tsx
