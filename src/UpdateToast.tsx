// src/UpdateToast.tsx
import React from "react";
import { t, Lang } from "./i18n";

type Props = {
  lang: Lang;
  show: boolean;
  onRefresh: () => void;
  onSkip:   () => void;
};

export default function UpdateToast({ lang, show, onRefresh, onSkip }: Props) {
  if (!show) return null;
  const i = t(lang);

  return (
    <div
      className="toast"
      role="status"
      aria-live="polite"
      style={{
        background: "#111827",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: 10,
        boxShadow: "0 6px 24px rgba(0,0,0,.25)",
        left: "50%",
        bottom: 20,
        transform: "translateX(-50%)",
        position: "fixed",
        zIndex: 50,
        minWidth: 260,
        textAlign: "center",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        New Version Available
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
        <button className="toast-btn" onClick={onRefresh}>
          refresh
        </button>
        <button className="toast-btn ghost" onClick={onSkip}>
          skip
        </button>
      </div>
    </div>
  );
}
