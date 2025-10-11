// src/qrCard.ts
// Create a QR "card" image from an existing QR <canvas>, add name + url text,
// and trigger download with a URL-based filename.
// We export JPEG (~0.85 quality) to keep size ~300–400 KB.
export function sanitizeFilename(s: string) {
  return s.replace(/[^\w\d\-_.]+/g, "_").slice(0, 120);
}

export async function downloadQrCard(opts: {
  qrCanvasId: string;         // id of the <canvas> rendered by <QR/>
  title?: string;             // optional small title line (e.g., project or app)
  name?: string;              // main name
  url: string;                // destination url (already https)
  bg?: string;                // background color
  textColor?: string;         // text color
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
  if (!qrCanvas) {
    alert("QR not ready yet");
    return;
  }

  // Card layout (tuned for ~300–400 KB at quality 0.85)
  const CARD_W = 800;              // px
  const CARD_H = 1000;             // px
  const PADDING = 40;
  const QR_TARGET = 640;           // px square
  const LINE = 28;                 // line height for body text

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Title (small)
  ctx.fillStyle = textColor;
  ctx.font = "bold 20px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(title, PADDING, PADDING);

  // Name (prominent)
  ctx.font = "bold 36px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  const nameY = PADDING + 34;
  wrapText(ctx, name || url, PADDING, nameY, CARD_W - PADDING * 2, 40);

  // Draw QR centered
  // Scale the original QR to our target size for crisp output.
  const qrX = (CARD_W - QR_TARGET) / 2;
  const qrY = 260;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrCanvas, qrX, qrY, QR_TARGET, QR_TARGET);

  // URL (under QR)
  ctx.imageSmoothingEnabled = true;
  ctx.font = "bold 22px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(url, CARD_W / 2, qrY + QR_TARGET + 24);

  // Export JPEG (~0.85 keeps size down; typically 250–380 KB for this layout)
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

  // Filename from URL (host + path)
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

// simple text wrap
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
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
