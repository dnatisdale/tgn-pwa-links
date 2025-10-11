import React from "react";
import { t, Lang } from "./i18n";
import { normalizeHttps } from "./utils";

type Props = { lang: Lang; url: string; name?: string };

const RED = "#DA1A32"; // Thai flag red

// tiny red symbol
const Dot: React.FC = () => (
  <span style={{ color: RED, fontSize: 12, marginRight: 6 }}>●</span>
);

const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...rest }) => (
  <button className="linklike" {...rest}>{children}</button>
);

export default function ShareButtons({ lang, url, name = "" }: Props) {
  const i = t(lang);
  const safeUrl = normalizeHttps(url);          // ✅ always the real saved URL
  const text = name ? `${name}` : "Link";

  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const doWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: name || "Link", text: name || "", url: safeUrl });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(safeUrl);
      alert(lang === "th" ? "คัดลอกลิงก์แล้ว" : "Link copied!");
    } catch { open(safeUrl); }
  };

  const mailTo       = () => (window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n${safeUrl}`)}`);
  const shareLine    = () => open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(safeUrl)}`);
  const shareFB      = () => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(safeUrl)}`);
  const shareX       = () => open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(safeUrl)}&text=${encodeURIComponent(text)}`);
  const shareWhats   = () => open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${safeUrl}`)}`);
  const copyLink     = async () => {
    try { await navigator.clipboard.writeText(safeUrl); alert(lang === "th" ? "คัดลอกลิงก์แล้ว" : "Link copied!"); }
    catch { open(safeUrl); }
  };

  return (
    <div className="share-center">
      <div className="share-row">
        <Btn onClick={doWebShare}><Dot />{lang === "th" ? "แชร์" : "Share"}</Btn>
        <Btn onClick={mailTo}><Dot />Email</Btn>
        <Btn onClick={shareLine}><Dot />LINE</Btn>
        <Btn onClick={shareFB}><Dot />Facebook</Btn>
        <Btn onClick={shareX}><Dot />X</Btn> {/* X only */}
        <Btn onClick={shareWhats}><Dot />WhatsApp</Btn>
        <Btn onClick={copyLink}><Dot />{lang === "th" ? "คัดลอก" : "Copy"}</Btn>
      </div>
    </div>
  );
}
