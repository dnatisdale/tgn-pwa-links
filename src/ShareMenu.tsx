// src/ShareMenu.tsx
import React, { useEffect, useRef, useState } from "react";

// Helper: force https (and add it if missing)
function ensureHttps(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (t.startsWith("https://")) return t;
  if (t.startsWith("http://")) return "https://" + t.slice(7);
  return "https://" + t;
}

type Props = {
  /** All links to share (usually from selected rows). Empty array = disabled */
  urls: string[];
  /** Optional message/title shown in shares */
  title?: string;
  /** Button label (default "Share") */
  label?: string;
};

export default function ShareMenu({ urls, title = "Thai Good News", label = "Share" }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const httpsUrls = urls.map(ensureHttps).filter(Boolean);
  const disabled = httpsUrls.length === 0;

  // Joiners per channel
  const joinNewlines = encodeURIComponent(httpsUrls.join("\n"));
  const joinSpaces   = encodeURIComponent(httpsUrls.join(" "));
  const firstUrl     = encodeURIComponent(httpsUrls[0] || "");
  const titleEnc     = encodeURIComponent(title);

  // Actions
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(httpsUrls.join("\n"));
      alert("Links copied");
      setOpen(false);
    } catch {
      alert("Could not copy");
    }
  };

  const doEmail = () => {
    // mailto – body supports multiple lines
    const body = encodeURIComponent(`${title}\n\n${httpsUrls.join("\n")}`);
    window.location.href = `mailto:?subject=${titleEnc}&body=${body}`;
    setOpen(false);
  };

  const doX = () => {
    // X accepts only one url param; include others in text
    const text = encodeURIComponent(`${title}\n${httpsUrls.join(" ")}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${firstUrl}`, "_blank");
    setOpen(false);
  };

  const doFacebook = () => {
    // Facebook share takes a single URL; use first
    if (!httpsUrls[0]) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${firstUrl}`,
      "_blank",
      "width=560,height=620"
    );
    setOpen(false);
  };

  const doLine = () => {
    // LINE uses one text param; include all links
    window.open(`https://line.me/R/msg/text/?${titleEnc}%0A${joinNewlines}`, "_blank");
    setOpen(false);
  };

  const doWhatsApp = () => {
    // WhatsApp uses one text param; include all links
    window.open(`https://wa.me/?text=${titleEnc}%0A${joinNewlines}`, "_blank");
    setOpen(false);
  };

  const doTelegram = () => {
    // Telegram prefers one url + text; we pack the rest in text
    window.open(
      `https://t.me/share/url?url=${firstUrl}&text=${encodeURIComponent(`${title}\n${httpsUrls.join("\n")}`)}`,
      "_blank"
    );
    setOpen(false);
  };

  // Web Share API (if supported) – shares the whole list as text
  const doNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: httpsUrls.join("\n"),
        });
      } else {
        await doCopy();
      }
    } catch {/* cancelled */}
  };

  return (
    <div className="share-wrap" style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={btnRef}
        className={`btn-red ${disabled ? "btn-disabled" : ""}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        title={disabled ? "Select at least one item" : "Share selected"}
      >
        {/* tiny red Thai-flag style button */}
        {label}
        <span style={{ marginLeft: 8 }}>▾</span>
      </button>

      {open && (
        <div ref={menuRef} className="dropdown">
          <button onClick={doNativeShare} className="drop-item">Share (native)</button>
          <div className="drop-sep" />
          <button onClick={doEmail} className="drop-item">Email</button>
          <button onClick={doFacebook} className="drop-item">Facebook</button>
          <button onClick={doLine} className="drop-item">LINE</button>
          <button onClick={doX} className="drop-item">X</button>
          <button onClick={doWhatsApp} className="drop-item">WhatsApp</button>
          <button onClick={doTelegram} className="drop-item">Telegram</button>
          <div className="drop-sep" />
          <button onClick={doCopy} className="drop-item">Copy links</button>
      )}

      {disabled && (
        <div className="hint-under" style={{ marginTop: 4, textAlign: "center" }}>
          ( Select at least one item )
        </div>
      )}
    </div>
  );
}
