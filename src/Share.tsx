import React from "react";
import { normalizeHttps } from "./utils";

type Props = {
  url: string;          // the user's saved link
  title?: string;       // optional title used in share text
  qrCanvasId?: string;  // OPTIONAL: if you render <canvas id="qr-123">, pass "qr-123" to enable "Download QR"
};

const RED = "#DA1A32";
const ICON = (d: string) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill={RED} aria-hidden>
    <path d={d} />
  </svg>
);

const I = {
  Share: ICON("M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .36 1.43L8.9 9.14A3 3 0 0 0 6 8a3 3 0 1 0 2.64 4.36l6.53 3.74A3 3 0 1 0 16 18a3 3 0 0 0 .38-1.47l-6.5-3.73A3 3 0 0 0 10 12c0-.36-.06-.71-.18-1.03l6.48-3.71A3 3 0 0 0 18 8Z"),
  Email: ICON("M2 5h20v14H2V5zm10 6L4 7v10h16V7l-8 4z"),
  FB: ICON("M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.378 14.192 5 15.115 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z"),
  LINE: ICON("M12 4c-5 0-9 3.1-9 7 0 3.6 3.5 6.5 8 6.9v2.1c0 .3.3.5.6.3l3-2c3.7-.9 6.4-3.5 6.4-7.3 0-3.9-4-7-9-7z"),
  X: ICON("M17.5 4h-2.2l-3.4 4.4L8.3 4H4l6.1 8.1L4.3 20h2.2l3.9-5.1L15.7 20H20l-6.3-8.4L17.5 4z"),
  WA: ICON("M20 12.1a8 8 0 0 1-12 6.9L4 20l1-3.8a8 8 0 1 1 15-4.1zM7.7 8.6c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3s-.9.9-.9 2.1.9 2.5 1 2.7 1.8 2.8 4.5 3.9c2.2.9 2.6.8 3 .7.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2s-.1-.3-.3-.4-.5-.3-1-.5-1.5-.7-1.7-.8-.4-.1-.6.1-.7.8-.8 1-.3.1-.5.1-.5 0-1-.5c-.5-.5-1-1.3-1.1-1.5s0-.3.1-.4c.1-.1.3-.4.4-.6.1-.2.2-.4.3-.6.1-.2.1-.3 0-.4-.1-.1-.5-1.2-.7-1.6z"),
  TG: ICON("M9.035 15.523l-.37 5.223c.53 0 .76-.23 1.034-.505l2.48-2.38 5.136 3.77c.94.52 1.61.25 1.87-.87l3.39-15.88h.001c.3-1.4-.51-1.95-1.42-1.6L1.13 9.7C-.22 10.23-.2 11.01.9 11.35l5.2 1.62L19.3 6.37c.6-.37 1.14-.16.69.22z"),
  Copy: ICON("M8 8h10v10H8V8zm-2 2H4V4h10v2H6v4z"),
  DL: ICON("M12 3v9l3.5-3.5 1.5 1.5-6 6-6-6 1.5-1.5L10 12V3h2zm-8 14h16v2H4z"),
};

export default function Share({ url, title = "Link", qrCanvasId }: Props) {
  const safeUrl = normalizeHttps(url);
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const doWebShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, text: title, url: safeUrl }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(safeUrl); alert("Link copied!"); }
    catch { open(safeUrl); }
  };

  const emailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n${safeUrl}`)}`;
  const fbHref    = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(safeUrl)}`;
  const xHref     = `https://twitter.com/intent/tweet?url=${encodeURIComponent(safeUrl)}&text=${encodeURIComponent(title)}`;
  const waHref    = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${safeUrl}`)}`;
  const lineHref  = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(safeUrl)}`;
  const tgHref    = `https://t.me/share/url?url=${encodeURIComponent(safeUrl)}&text=${encodeURIComponent(title)}`;

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(safeUrl); alert("Link copied!"); }
    catch { open(safeUrl); }
  };

  const downloadQR = () => {
    if (!qrCanvasId) return;
    const canvas = document.getElementById(qrCanvasId) as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "qr.png";
    a.click();
  };

  const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...rest }) => (
    <button className="linklike" {...rest} />
  );

  return (
    <div className="share-center">
      <div className="share-row">
        <Btn onClick={doWebShare} aria-label="Share">{I.Share} Share</Btn>
        <a className="linklike" href={emailHref}>{I.Email} Email</a>
        <Btn onClick={() => open(lineHref)} aria-label="LINE">{I.LINE} LINE</Btn>
        <Btn onClick={() => open(fbHref)} aria-label="Facebook">{I.FB} Facebook</Btn>
        <Btn onClick={() => open(xHref)} aria-label="X">{I.X} X</Btn>
        <Btn onClick={() => open(waHref)} aria-label="WhatsApp">{I.WA} WhatsApp</Btn>
        <Btn onClick={() => open(tgHref)} aria-label="Telegram">{I.TG} Telegram</Btn>
        <Btn onClick={copyLink} aria-label="Copy">{I.Copy} Copy</Btn>
        {qrCanvasId && <Btn onClick={downloadQR} aria-label="Download QR">{I.DL} Download QR</Btn>}
      </div>
    </div>
  );
}
