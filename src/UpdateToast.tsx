// 01 src/UpdateToast.tsx — Thai blue card with "Open" / "Skip"
import React from "react";
import { Lang } from "./i18n";

type Props = {
  lang: Lang;
  show: boolean;
  onRefresh: () => void; // called when user taps "Open"
  onSkip: () => void; // called when user taps "Skip"
};

export default function UpdateToast({ lang, show, onRefresh, onSkip }: Props) {
  if (!show) return null;

  const L = {
    title: lang === "th" ? "มีเวอร์ชันใหม่" : "New Version",
    open: lang === "th" ? "เปิด" : "Refresh",
    skip: lang === "th" ? "ข้าม" : "Skip",
  };

  // ~2in x ~1in look on normal desktop DPI; responsive on small screens
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={L.title}
      className="update-card"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 60,
        background: "#2D2A4A", // Thai Blue
        color: "white",
        borderRadius: 14,
        boxShadow: "0 10px 24px rgba(0,0,0,0.20)",
        width: "min(280px, 80vw)", // ~1.9–2.3in wide depending on DPI
        minHeight: 120, // ~1in tall feel
        padding: 14,
        display: "grid",
        alignContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 16 }}>{L.title}</div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        {/* Skip — subtle outline */}
        <button
          type="button"
          onClick={onSkip}
          className="btn"
          style={{
            background: "transparent",
            color: "white",
            border: "1px solid rgba(255,255,255,0.7)",
            borderRadius: 9999,
            padding: "6px 12px",
            fontWeight: 600,
          }}
        >
          {L.skip}
        </button>

        {/* Open — primary red (matches Install/Share style) */}
        <button
          type="button"
          onClick={onRefresh}
          className="btn btn-red"
          style={{
            borderRadius: 9999,
            padding: "6px 12px",
            fontWeight: 700,
          }}
        >
          {L.open}
        </button>
      </div>
    </div>
  );
}
