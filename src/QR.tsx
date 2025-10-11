// src/QR.tsx
import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { normalizeHttps } from "./utils";

type Props = { url: string; size?: number };

export default function QR({ url, size = 192 }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const safeUrl = normalizeHttps(url);
    if (!ref.current || !safeUrl) return;

    QRCode.toCanvas(ref.current, safeUrl, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#111111",  // nearly black for good contrast
        light: "#ffffff",
      },
    }).catch(() => {
      // No-op: you could set a fallback message if desired
    });
  }, [url, size]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      aria-label="QR code"
      style={{ borderRadius: 8, background: "#fff" }}
    />
  );
}
