// src/InstallPWA.tsx
import React from "react";
import { strings, type Lang } from "./i18n";

type Props = { lang: Lang; className?: string };

export default function InstallPWA({ lang, className }: Props) {
  const [promptEvent, setPromptEvent] = React.useState<any | null>(null);
  const t = strings[lang];

  // Capture the install prompt event once, and clean up on unmount.
  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener("beforeinstallprompt", handler as any);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  const onClick = async () => {
    try {
      if (promptEvent) {
        await promptEvent.prompt();
        // After prompting, the event can't be used again.
        setPromptEvent(null);
        return;
      }
      // Fallback: if no prompt available, try updating SW if exposed.
      const update = (window as any).__tgnUpdateSW;
      if (typeof update === "function") {
        update();
      }
    } catch {
      // keep it silent for now (simplest behavior)
    }
  };

  return (
    <button className={`btn ${className ?? "btn-red"}`} onClick={onClick}>
      {t.installPwa}
    </button>
  );
}
