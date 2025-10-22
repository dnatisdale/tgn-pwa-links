// src/QR.tsx
import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { normalizeHttps } from "./url";

type Props = {
  url: string;
  size?: number;           // default 192
  idForDownload?: string;  // optional: adds id to the canvas so Share can "Download QR"
};

export default function QR({ url, size = 192, idForDownload }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const safeUrl = normalizeHttps(url) ?? "";
    const canvas = ref.current;
    if (!canvas || !safeUrl) return;

    QRCode.toCanvas(canvas, safeUrl, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#ffffff" },
    }).catch((err) => {
      console.error("QR render failed:", err);
    });
  }, [url, size]);

  return (
    <div className="qr-center">
      <canvas
        ref={ref}
        {...(idForDownload ? { id: idForDownload } : {})}
        width={size}
        height={size}
        aria-label="QR code"
        style={{ borderRadius: 8, background: "#fff" }}
      />
    </div>
  );
}
