// src/qrCard.ts
export function sanitizeFilename(s: string) {
  return s.replace(/[^\w\d\-_.]+/g, "_").slice(0, 120);
}

export async function downloadQrCard(opts: {
  qrCanvasId: string;         // the <canvas id="..."> from the QR
  title?: string;
  name?: string;
  url: string;
  bg?: string;
  textColor?: string;
}) {
  const {
    qrCanvasId,
    title = "Thai Good News",
    name = "",
    url,
    bg = "#ffffff",
    textColor = "#111111",
  } = opts;

  const qrCanvas = document.getElementById(qrCanvasId) as HTMLCanvasElement | null;
  if (!qrCanvas) { alert("QR not ready yet"); return; }

  // card size + layout
  const CARD_W = 800;
  const CARD_H = 1000;
  const PADDING = 40;
  const QR_TARGET = 640;   // final QR size

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W; canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, CARD_W, CARD_H);

  // title
  ctx.fillStyle = textColor;
  ctx.font = "bold 20px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(title, PADDING, PADDING);

  // name
  ctx.font = "bold 36px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  wrapText(ctx, name || url, PADDING, PADDING + 34, CARD_W - PADDING * 2, 40);

  // QR centered
  const qrX = (CARD_W - QR_TARGET) / 2;
  const qrY = 260;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrCanvas, qrX, qrY, QR_TARGET, QR_TARGET);

  // URL under QR
  ctx.imageSmoothingEnabled = true;
  ctx.font = "bold 22px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(url, CARD_W / 2, qrY + QR_TARGET + 24);

  // save as JPEG (keeps ~300–400 KB)
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  const a = document.createElement("a");
  try {
    const u = new URL(url);
    const base = sanitizeFilename(`${u.hostname}${u.pathname}`.replace(/\/$/, "") || "qr");
    a.download = `${base}.jpg`;
  } catch {
    a.download = `${sanitizeFilename(url)}.jpg`;
  }
  a.href = dataUrl;
  a.click();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  maxWidth: number,
  lineHeight: number
) {
  if (!text) return;
  const words = text.split(/\s+/);
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line ? line + " " + words[n] : words[n];
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, y);
}
