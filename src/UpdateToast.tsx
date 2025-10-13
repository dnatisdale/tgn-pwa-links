// src/UpdateToast.tsx
import React, { useEffect, useState } from "react";
import { t, Lang } from "./i18n";

// Let TS know the refresh helper may exist (set in main.tsx)
declare global {
  interface Window {
    __REFRESH_SW__?: (reloadImmediately?: boolean) => void;
  }
}

/**
 * Props are optional:
 * - lang: show labels in EN/TH
 * - show: force visible (otherwise it auto-opens when the SW fires an event)
 * - onRefresh/onSkip: optional callbacks (fall back to default behavior)
 */
type Props = {
  lang: Lang;
  show?: boolean;
  onRefresh?: () => void;
  onSkip?: () => void;
};

export default function UpdateToast({ lang, show, onRefresh, onSkip }: Props) {
  const i = t(lang);
  const [visible, setVisible] = useState<boolean>(!!show);

  // Keep internal state in sync if parent passes a controlled `show`
  useEffect(() => {
    if (typeof show === "boolean") setVisible(show);
  }, [show]);

  // Auto-open when the SW says a new version is ready
  useEffect(() => {
    const onNeed = () => setVisible(true);
    window.addEventListener("pwa:need-refresh", onNeed);
    return () => window.removeEventListener("pwa:need-refresh", onNeed);
  }, []);

  if (!visible) return null;

  const label = lang === "th" ? "มีเวอร์ชันใหม่" : "New Version Available";
  const refreshLabel = lang === "th" ? "รีเฟรช" : "Refresh";
  const skipLabel = lang === "th" ? "ข้าม" : "Skip";

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      // default: ask the service worker to update & reload
      window.__REFRESH_SW__?.(true);
    }
    setVisible(false);
  };

  const handleSkip = () => {
    setVisible(false);
    onSkip?.();
  };

  // Center the text + buttons inside the black bar; width is kept compact
  return (
    <div className="toast" role="status" aria-live="polite">
      <div className="toast-row" style={{ justifyContent: "center", textAlign: "center" }}>
        <span style={{ marginRight: 8 }}>{label}</span>
        <button className="toast-btn" onClick={handleRefresh}>
          {refreshLabel}
        </button>
        <button className="toast-btn ghost" onClick={handleSkip} style={{ marginLeft: 6 }}>
          {skipLabel}
        </button>
      </div>
    </div>
  );
}
