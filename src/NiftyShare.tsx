import React, { useEffect, useState } from "react";
import { normalizeHttps } from "./utils";

type Props = {
  url: string;       // the saved link (will be normalized to https)
  title?: string;    // optional label/text for email/X/etc.
  buttonLabel?: string; // default: "Share"
};

const RED = "#a51931"; // Thai flag red

export default function NiftyShare({ url, title = "Check this out!", buttonLabel = "Share" }: Props) {
  const [open, setOpen] = useState(false);
  const safeUrl = normalizeHttps(url);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(safeUrl); alert("URL copied to clipboard!"); }
    catch (err) { console.error("Copy failed", err); }
  };

  const emailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(safeUrl)}`;
  const fbHref    = `https://facebook.com/sharer.php?u=${encodeURIComponent(safeUrl)}`;
  const xHref     = `https://twitter.com/share?url=${encodeURIComponent(safeUrl)}&text=${encodeURIComponent(title)}`;
  const waHref    = `https://wa.me/?text=${encodeURIComponent(`${title} ${safeUrl}`)}`;

  return (
    <>
      {/* Trigger button */}
      <button
        className="linklike"
        onClick={() => setOpen(true)}
        style={{ backgroundColor: "#2d2a4b", color: "#fff", padding: "8px 12px", borderRadius: 6 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15"
             style={{ fill: "#fff", marginRight: 6, verticalAlign: "middle" }}>
          <path d="M8.99 1.02A1 1 0 008.44 1.875V3.75H5.156C2.309 3.75 0 6.06 0 8.906c0 3.32 2.387 4.8 2.938 5.1.071.038.153.056.234.056.32 0 .578-.261.578-.578 0-.219-.125-.422-.29-.57-.274-.262-.649-.773-.649-1.664 0-1.554 1.258-2.812 2.813-2.812h2.812v1.875c0 .367.219.707.555.855.344.148.734.09 1.007-.16l4.688-4.218c.199-.175.312-.429.312-.695 0-.266-.11-.52-.313-.696L10 1.176a.999.999 0 00-1.01-.156z"/>
        </svg>
        {buttonLabel}
      </button>

      {/* Popup */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.49)",
            display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", padding: 20, borderRadius: 10, width: 340, boxShadow: "0 3px 10px rgba(0,0,0,.2)", position: "relative" }}
          >
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{ position: "absolute", right: 10, top: 10, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", cursor: "pointer" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                   viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div style={{ fontWeight: 700, paddingBottom: 10, textAlign: "center", color: "#000" }}>Share</div>

            <ul style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", listStyle: "none", padding: 0, margin: 0 }}>
              {/* Copy */}
              <li style={{ width: "48%", marginBottom: 10 }}>
                <button onClick={copy} style={{ display: "flex", alignItems: "center", width: "100%", fontSize: 16, background: "transparent", border: "none", cursor: "pointer", color: "#000" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                       viewBox="0 0 24 24" fill={RED} style={{ marginRight: 10 }}>
                    <path d="M13.723 18.654l-3.61 3.609c-2.316 2.315-6.063 2.315-8.378 0-1.12-1.118-1.735-2.606-1.735-4.188 0-1.582.615-3.07 1.734-4.189l4.866-4.865c2.355-2.355 6.114-2.262 8.377 0 .453.453.81.973 1.089 1.527l-1.593 1.592c-.18-.613-.5-1.189-.964-1.652-1.448-1.448-3.93-1.51-5.439-.001L6.69 8.04l-4.867 4.865c-1.5 1.499-1.5 3.941 0 5.44 1.517 1.517 3.958 1.488 5.442 0l2.425-2.424c.993.284 1.791.335 2.654.284z"/>
                  </svg>
                  <span>Copy URL</span>
                </button>
              </li>

              {/* Email */}
              <li style={{ width: "48%", marginBottom: 10 }}>
                <a href={emailHref} style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "#000", fontSize: 16 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                       viewBox="0 0 24 24" fill={RED} style={{ marginRight: 10 }}>
                    <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  <span>Email</span>
                </a>
              </li>

              {/* Facebook */}
              <li style={{ width: "48%", marginBottom: 10 }}>
                <a href={fbHref} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "#000", fontSize: 16 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                       viewBox="0 0 24 24" fill={RED} style={{ marginRight: 10 }}>
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.378 14.192 5 15.115 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z"/>
                  </svg>
                  <span>Facebook</span>
                </a>
              </li>

              {/* X */}
              <li style={{ width: "48%", marginBottom: 10 }}>
                <a href={xHref} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "#000", fontSize: 16 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                       viewBox="0 0 24 24" fill={RED} style={{ marginRight: 10 }}>
                    <path d="M17.5 4h-2.2l-3.4 4.4L8.3 4H4l6.1 8.1L4.3 20h2.2l3.9-5.1L15.7 20H20l-6.3-8.4L17.5 4z"/>
                  </svg>
                  <span>X</span>
                </a>
              </li>

              {/* WhatsApp */}
              <li style={{ width: "48%", marginBottom: 10 }}>
                <a href={waHref} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "#000", fontSize: 16 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                       viewBox="0 0 24 24" fill={RED} style={{ marginRight: 10 }}>
                    <path d="M20 12.1a8 8 0 0 1-12 6.9L4 20l1-3.8a8 8 0 1 1 15-4.1zM7.7 8.6c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3s-.9.9-.9 2.1.9 2.5 1 2.7 1.8 2.8 4.5 3.9c2.2.9 2.6.8 3 .7.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2s-.1-.3-.3-.4-.5-.3-1-.5-1.5-.7-1.7-.8-.4-.1-.6.1-.7.8-.8 1-.3.1-.5.1-.5 0-1-.5c-.5-.5-1-1.3-1.1-1.5s0-.3.1-.4c.1-.1.3-.4.4-.6.1-.2.2-.4.3-.6.1-.2.1-.3 0-.4-.1-.1-.5-1.2-.7-1.6z"/>
                  </svg>
                  <span>WhatsApp</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
