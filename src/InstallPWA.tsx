// src/InstallPWA.tsx
import React, { useEffect, useState } from "react";
import { t, tr, Lang } from "./i18n";

declare global {
  interface Window {
    __tgnUpdateSW?: (reload?: boolean) => void;
  }
}
type Props = { lang: Lang; className?: string };
export default function InstallPWA({ lang, className }: Props){
  const [promptEvent, setPromptEvent] = React.useState<any>(null);
   const t = strings[lang];

   React.useEffect(() => {
     const handler = (e: any) => {
       e.preventDefault();
       setPromptEvent(e);
     };
     window.addEventListener('beforeinstallprompt', handler);
     return () => window.removeEventListener('beforeinstallprompt', handler);
   }, []);

   const onClick = async () => {
     if (promptEvent) {
       await promptEvent.prompt();
       setPromptEvent(null);
     } else if ((window as any).__tgnUpdateSW) {
       (window as any).__tgnUpdateSW();
     }
   };

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
  <button
    className={`btn ${className ?? 'btn-red'}`}
    onClick={onClick}
  >
    {t.installPwa}
  </button>
+  );
 }}
