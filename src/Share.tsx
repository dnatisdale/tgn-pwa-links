// src/Share.tsx
import React from "react";
import { normalizeHttps } from "./utils";

function enc(s: string) { return encodeURIComponent(s); }

export default function Share({
  url,
  title,
  qrCanvasId,
}: { url: string; title?: string; qrCanvasId?: string }) {
  const href = normalizeHttps(url) || url;

  const copy = async () => {
    try { await navigator.clipboard.writeText(href); alert("Link copied"); }
    catch { alert("Copy failed"); }
  };

  const downloadQR = () => {
    if (!qrCanvasId) return;
    const c = document.getElementById(qrCanvasId) as HTMLCanvasElement | null;
    if (!c) return alert("QR not ready yet");
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `${title || "qr"}.png`;
    a.click();
  };

  const mail    = `mailto:?subject=${enc(title || "Link")}&body=${enc(href)}`;
  const lineURL = `https://line.me/R/msg/text/?${enc((title || "") + " " + href)}`;
  const fbURL   = `https://www.facebook.com/sharer/sharer.php?u=${enc(href)}`;
  const xURL    = `https://twitter.com/intent/tweet?url=${enc(href)}&text=${enc(title || "")}`;
  const waURL   = `https://wa.me/?text=${enc((title || "") + " " + href)}`;
  const tgURL   = `https://t.me/share/url?url=${enc(href)}&text=${enc(title || "")}`;

  return (
    <div className="share-center">
      <div className="share-row">
        <a className="underline" href={mail}>Email</a>
        <a className="underline" href={lineURL} target="_blank" rel="noreferrer">LINE</a>
        <a className="underline" href={fbURL}   target="_blank" rel="noreferrer">Facebook</a>
        <a className="underline" href={xURL}    target="_blank" rel="noreferrer">X</a>
        <a className="underline" href={waURL}   target="_blank" rel="noreferrer">WhatsApp</a>
        <a className="underline" href={tgURL}   target="_blank" rel="noreferrer">Telegram</a>
        <button className="linklike" onClick={copy}>Copy link</button>
        <button className="linklike" onClick={downloadQR}>Download QR</button>
      </div>
    </div>
  );
}
