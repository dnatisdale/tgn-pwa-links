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
      color: { dark: "#111111", light: "#ffffff" },
    }).catch(() => {});
  }, [url, size]);

  // centered container
  return (
    <div className="qr-center">
      <canvas
        ref={ref}
        width={size}
        height={size}
        aria-label="QR code"
        style={{ borderRadius: 8, background: "#fff" }}
      />
    </div>
  );
}
