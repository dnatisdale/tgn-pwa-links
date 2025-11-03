// src/InstallPWA.tsx
import React from 'react';

type Props = {
  className?: string;
  label?: string; // shown when install is available
  disabledLabel?: string; // shown when not available / already installed
};

const grow =
  'motion-safe:transition-transform motion-safe:duration-150 group-hover:scale-[1.06] group-focus-visible:scale-[1.06] active:scale-[1.06]';

export default function InstallPWA({
  className = 'btn btn-red',
  label = 'Install',
  disabledLabel = 'Install',
}: Props) {
  const [prompt, setPrompt] = React.useState<any>(null);
  const [installed, setInstalled] = React.useState(false);

  React.useEffect(() => {
    const onBeforeInstall = (e: any) => {
      e.preventDefault();
      setPrompt(e);
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
      /* user canceled */
    }
  };

  const canInstall = !!prompt && !installed;

  return (
    <button
      type="button"
      onClick={canInstall ? doInstall : undefined}
      disabled={!canInstall}
      className={`group ${className}`}
      title={canInstall ? label : disabledLabel}
      style={{ borderRadius: 12, fontWeight: 600, padding: '6px 12px' }}
    >
      <span className={grow}>{canInstall ? label : disabledLabel}</span>
    </button>
  );
}
