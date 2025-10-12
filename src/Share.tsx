// src/Share.tsx
import React, { useState } from "react";

type Props = {
  url: string;
  title?: string;
  qrCanvasId?: string;
  /** Button style: 'red' | 'blue' | 'link' */
  variant?: "red" | "blue" | "link";
};

export default function Share({
  url,
  title = "Link",
  qrCanvasId,
  variant = "red",
}: Props) {
  const [open, setOpen] = useState(false);

  const btnClass =
    variant === "red" ? "btn-red" : variant === "blue" ? "btn-blue" : "linklike";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied");
    } catch {
      alert("Copy failed");
    }
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
      } catch {
        /* user canceled or unsupported payload */
      }
    } else {
      copyLink();
    }
  }

  // Build a data URL for the QR image if present
  function qrDataUrl(): string | null {
    if (!qrCanvasId) return null;
    const el = document.getElementById(qrCanvasId) as HTMLCanvasElement | null;
    if (!el) return null;
    try {
      return el.toDataURL("image/png");
    } catch {
      return null;
    }
  }

  function mailtoHref() {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${title}\n${url}`);
    return `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div className="relative inline-block">
      <button className={btnClass} onClick={() => setOpen((v) => !v)}>
        Share
      </button>

      {open && (
        <div
          className="menu"
          style={{
            position: "absolute",
            zIndex: 20,
            marginTop: 8,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            minWidth: 220,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            padding: 8,
          }}
          onMouseLeave={() => setOpen(false)}
        >
          <button className="menu-item" onClick={shareNative}>
            System Share (best)
          </button>

          <a className="menu-item" href={mailtoHref()} onClick={() => setOpen(false)}>
            Email link
          </a>

          <button
            className="menu-item"
            onClick={() => {
              window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                "_blank",
                "noopener,noreferrer"
              );
              setOpen(false);
            }}
          >
            Facebook
          </button>

          <button
            className="menu-item"
            onClick={() => {
              window.open(
                `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
                "_blank",
                "noopener,noreferrer"
              );
              setOpen(false);
            }}
          >
            X / Twitter
          </button>

          <button className="menu-item" onClick={copyLink}>
            Copy link
          </button>

          {/* Attach QR image in a new tab (user can save from there) */}
          {qrCanvasId && (
            <button
              className="menu-item"
              onClick={() => {
                const data = qrDataUrl();
                if (!data) {
                  alert("QR image not available");
                  return;
                }
                const w = window.open();
                if (w) {
                  w.document.write(
                    `<img src="${data}" alt="QR" style="max-width:100%;height:auto"/>`
                  );
                }
                setOpen(false);
              }}
            >
              Open QR image
            </button>
          )}
        </div>
      )}
    </div>
  );
}
