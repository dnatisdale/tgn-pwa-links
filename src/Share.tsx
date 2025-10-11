// src/Share.tsx
import React, { useState } from "react";
import { normalizeHttps } from "./utils";

function enc(s: string) { return encodeURIComponent(s); }

export default function Share({
  url,
  title,
}: { url: string; title?: string }) {
  const [open, setOpen] = useState(false);
  const href = normalizeHttps(url) || url;

  const doWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title || "Link", url: href });
        setOpen(false);
        return;
      } catch {}
    }
    // if not supported, fall through; menu provides options
    setOpen(v => !v);
  };

  const mail    = `mailto:?subject=${enc(title || "Link")}&body=${enc(href)}`;
  const lineURL = `https://line.me/R/msg/text/?${enc((title || "") + " " + href)}`;
  const fbURL   = `https://www.facebook.com/sharer/sharer.php?u=${enc(href)}`;
  const xURL    = `https://twitter.com/intent/tweet?url=${enc(href)}&text=${enc(title || "")}`;
  const waURL   = `https://wa.me/?text=${enc((title || "") + " " + href)}`;
  const tgURL   = `https://t.me/share/url?url=${enc(href)}&text=${enc(title || "")}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(href); alert("Link copied"); }
    catch { alert("Copy failed"); }
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button className="linklike" onClick={doWebShare}>
        Share ▾
      </button>

      {open && (
        <div
          className="absolute z-10 mt-2 border rounded bg-white shadow p-2 text-sm"
          style={{ minWidth: 200 }}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-2 py-1 text-gray-500">Share via</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 px-2 pb-2">
            <a className="underline" href={mail}>Email</a>
            <a className="underline" href={lineURL} target="_blank" rel="noreferrer">LINE</a>
            <a className="underline" href={fbURL}   target="_blank" rel="noreferrer">Facebook</a>
            <a className="underline" href={xURL}    target="_blank" rel="noreferrer">X</a>
            <a className="underline" href={waURL}   target="_blank" rel="noreferrer">WhatsApp</a>
            <a className="underline" href={tgURL}   target="_blank" rel="noreferrer">Telegram</a>
            <button className="linklike" onClick={copy}>Copy link</button>
          </div>
        </div>
      )}
    </div>
  );
}
