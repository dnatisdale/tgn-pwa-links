// usePWAInstall.ts
import { useEffect, useState } from 'react';

type BIPEvent = Event & { prompt: () => Promise<void> };

export function usePWAInstall() {
  const [promptEvent, setPromptEvent] = useState<BIPEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BIPEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const canInstall = !!promptEvent;

  const install = async () => {
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
    } finally {
      setPromptEvent(null);
    }
  };

  return { canInstall, install };
}
