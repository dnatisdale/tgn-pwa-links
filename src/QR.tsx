
import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function QR({ url }:{ url:string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(ref.current, url, { margin: 1, width: 140 });
  }, [url]);
  return <canvas ref={ref} aria-label="QR code" />;
}
