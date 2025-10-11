// src/DownloadQRButton.tsx
import React from "react";
import { downloadQrCard } from "./qrCard";

export default function DownloadQRButton({
  qrCanvasId, url, name, title,
}: { qrCanvasId: string; url: string; name?: string; title?: string }) {
  return (
    <button
      className="linklike"
      onClick={() => downloadQrCard({ qrCanvasId, url, name, title })}
      title="Download QR card (image with title/name/url)"
    >
      Download QR card
    </button>
  );
}
