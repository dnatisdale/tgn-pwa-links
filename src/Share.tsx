// src/Share.tsx
import React, { useState } from "react";
import { t, Lang } from "./i18n";

type Props = {
  url: string;
  title?: string;
  qrCanvasId?: string; // if provided, we’ll attach a PNG from <canvas id="...">
  lang?: Lang;
};

export default function Share({ url, title = "Thai Good News", qrCanvasId, lang = "en" }: Props) {
  const i = t(lang);
  const [open, setOpen] = useState(false);

  // Try to build an image File from a canvas
  async function getQrFile(): Promise<File | null> {
    if (!qrCanvasId) return null;
    const canvas = document.getElementById(qrCanvasId) as HTMLCanvasElement | null;
    if (!canvas) return null;

    // Paint onto a white canvas to avoid transparent backgrounds in some apps
    const c = document.createElement("canvas");
    c.width = canvas.width;
    c.height = canvas.height;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, c.width, c.height);

    const blob: Blob | null = await new Promise((res) => c.toBlob((b) => res(b), "image/png"));
    if (!blob) return null;
    return new File([blob], "qr.png", { type: "image/png" });
  }

  // Web Share API first; fall back to targeted URLs
  async function webShareOrFallback(kind: "email" | "line" | "facebook" | "x" | "whatsapp" | "telegram") {
    const text = title ? `${title}\n${url}` : url;

    // Try Web Share API (with optional image)
    try {
      const canFiles = "canShare" in navigator && "share" in navigator;
      if (canFiles) {
        const file = await getQrFile(); // may be null
        const shareData: ShareData = { title, text, url: undefined };
        if (file) {
          // some browsers require files array AND omit the url to actually attach the file
          // @ts-ignore
          shareData.files = [file];
        } else {
          // If no file, we can include url directly
          shareData.url = url;
        }
        // @ts-ignore
        if (!file || (navigator.canShare && navigator.canShare({ files: [file] }))) {
          // @ts-ignore
          await navigator.share(shareData);
          return;
        }
      }
    } catch {
      // ignore and fall through
    }

    // Fallback to specific target
    const encUrl = encodeURIComponent(url);
    const encText = encodeURIComponent(text);

    let href = "";
    switch (kind) {
      case "email":
        href = `mailto:?subject=${encodeURIComponent(title || "Link")}&body=${encText}`;
        break;
      case "facebook":
        href = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
        break;
      case "x":
        href = `https://twitter.com/intent/tweet?text=${encText}`;
        break;
      case "whatsapp":
        href = `https://api.whatsapp.com/send?text=${encText}`;
        break;
      case "telegram":
        href = `https://t.me/share/url?url=${encUrl}&text=${encText}`;
        break;
      case "line":
        href = `https://social-plugins.line.me/lineit/share?url=${encUrl}`;
        break;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="share-wrap" style={{ position: "relative", display: "inline-block" }}>
      {/* Thai-flag RED button */}
      <button
        className="btn-red"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {i.share}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="menu"
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 8,
            minWidth: 180,
            zIndex: 20,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
          }}
        >
          <button className="menu-item" onClick={() => webShareOrFallback("email")}>{i.emailShare}</button>
          <button className="menu-item" onClick={() => webShareOrFallback("line")}>LINE</button>
          <button className="menu-item" onClick={() => webShareOrFallback("facebook")}>{i.fbShare}</button>
          <button className="menu-item" onClick={() => webShareOrFallback("x")}>{i.xShare}</button>
          <button className="menu-item" onClick={() => webShareOrFallback("whatsapp")}>{i.waShare}</button>
          <button className="menu-item" onClick={() => webShareOrFallback("telegram")}>{i.tgShare}</button>
        </div>
      )}
    </div>
  );
}
