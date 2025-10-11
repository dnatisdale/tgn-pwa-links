// src/ShareButtons.tsx
import React from "react";
import { t, Lang } from "./i18n";
import { normalizeHttps } from "./utils";

type Props = { lang: Lang; url: string; name?: string };

const RED = "#DA1A32"; // Thai flag red
const Sym: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: RED, fontSize: 12, lineHeight: 1, marginRight: 6 }}>{children}</span>
);

export default function ShareButtons({ lang, url, name = "" }: Props) {
  const i = t(lang);
  const safeUrl = normalizeHttps(url);
  const text = name ? `${name}` : "Link";

  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const doWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: name || "Link", text: name || "", url: safeUrl });
        return;
      } catch {
        /* user canceled or not supported */
      }
    }
    // Fallback: copy
    try {
      await navigator.clipboard.writeText(safeUrl);
      alert(lang === "th" ? "คัดลอกลิงก์แล้ว" : "Link copied!");
    } catch {
      open(safeUrl);
    }
  };

  const mailTo = () => {
    const subject = encodeURIComponent(text);
    const body = encodeURIComponent(`${text}\n${safeUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareLine = () =>
    open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(safeUrl)}`);

  const shareFacebook = () =>
    open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(safeUrl)}`);

  const shareX = () =>
    open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(safeUrl)}&text=${encodeURIComponent(text)}`);

  const shareWhatsApp = () =>
    open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${safeUrl}`)}`);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(safeUrl); // ✅ copies the real URL
      alert(lang === "th" ? "คัดลอกลิงก์แล้ว" : "Link copied!");
    } catch {
      open(safeUrl);
    }
  };

  const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...rest }) => (
    <button className="linklike" {...rest}>
      {children}
    </button>
  );

  return (
    <div className="share-block">
      <div className="share-row">
        <Btn onClick={doWebShare}><Sym>◆</Sym>{lang === "th" ? "แชร์" : "Share"}</Btn>
        <Btn onClick={mailTo}><Sym>◆</Sym>Email</Btn>
        <Btn onClick={shareLine}><Sym>◆</Sym>LINE</Btn>
        <Btn onClick={shareFacebook}><Sym>◆</Sym>Facebook</Btn>
        <Btn onClick={shareX}><Sym>◆</Sym>X</Btn>
        <Btn onClick={shareWhatsApp}><Sym>◆</Sym>WhatsApp</Btn>
        <Btn onClick={copyLink}><Sym>◆</Sym>{lang === "th" ? "คัดลอก" : "Copy"}</Btn>
      </div>
    </div>
  );
}
