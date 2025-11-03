// src/InstallPWA.tsx
import React from 'react';

type Props = {
  className?: string;
  label?: string;
  disabledLabel?: string;
};

const grow =
  'motion-safe:transition-transform motion-safe:duration-150 group-hover:scale-[1.06] group-focus-visible:scale-[1.06] active:scale-[1.06]';

export default function InstallPWA({
  className = '',
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
    } catch {}
  };

  const canInstall = !!prompt && !installed;

  return (
    <button
      type="button"
      onClick={canInstall ? doInstall : undefined}
      disabled={!canInstall}
      // 👇 EXACTLY like your ADD chip: Thai-red bg, black border, rounded-xl, same text size/weight
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
