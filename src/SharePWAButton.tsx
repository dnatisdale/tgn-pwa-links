import React from "react";

type Props = {
  title?: string;
  url?: string;     // defaults to current origin
  color?: "blue" | "red"; // blue per your last request; set to "red" if you want red
};

export default function SharePWAButton({
  title = "Thai Good News",
  url,
  color = "blue",
}: Props) {
  const shareUrl = url || window.location.origin;

  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard");
      }
    } catch {
      // user cancelled or share failed; no-op
    }
  };

  // Use your Tailwind/utility class if you have it; otherwise the inline style is a safe fallback.
  const className = color === "red" ? "btn-red" : "btn-blue";
  const style =
    color === "red"
      ? { background: "#A51931", color: "#fff", padding: "6px 12px", borderRadius: 8 }
      : { background: "#0F2454", color: "#fff", padding: "6px 12px", borderRadius: 8 };

  return (
    <button className={className} style={style} onClick={onShare} title="Share this app">
      Share
    </button>
  );
}
