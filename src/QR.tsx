import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function QR({ url, size = 160 }:{ url:string; size?:number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    // Render at 2x for retina sharpness
    const target = size;
    const renderSize = target * 2;
    canvasRef.current.width = renderSize;
    canvasRef.current.height = renderSize;
    QRCode.toCanvas(canvasRef.current, url, { margin: 1, width: renderSize });
  }, [url, size]);

  const downloadPNG = () => {
    if (!canvasRef.current) return;
    // Export a big 1024px PNG for printing/screens
    const tmp = document.createElement("canvas");
    tmp.width = 1024; tmp.height = 1024;
    QRCode.toCanvas(tmp, url, { margin: 1, width: 1024 }, () => {
      const a = document.createElement("a");
      a.href = tmp.toDataURL("image/png");
      a.download = "qr.png";
      a.click();
    });
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, imageRendering: "pixelated" }}
        aria-label="QR code"
      />
      <div className="text-sm mt-1">
        <button className="linklike" onClick={downloadPNG}>Download QR</button>
      </div>
    </div>
  );
}
