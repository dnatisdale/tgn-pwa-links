// src/qrCard.ts
import QRCode from 'qrcode';

// ---------- Public Types ----------
export type CardOrientation = 'portrait' | 'landscape';
export type CardSize = 'sm' | 'md' | 'lg';

// ---------- Utilities you already had ----------
export function sanitizeFilename(s: string) {
  return s.replace(/[^\w\d\-_.]+/g, '_').slice(0, 120);
}

// ---------- Internal helpers ----------
const SIZE_MAP: Record<CardSize, { w: number; h: number }> = {
  sm: { w: 600, h: 900 }, // portrait base
  md: { w: 900, h: 1350 },
  lg: { w: 1200, h: 1800 },
};

function dimsFor(size: CardSize, orientation: CardOrientation) {
  const base = SIZE_MAP[size];
  return orientation === 'portrait' ? { w: base.w, h: base.h } : { w: base.h, h: base.w }; // swap for landscape
}

function withDpr(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2)); // cap at 2x to keep files reasonable
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  // For offscreen canvases we don’t set style.width/height.
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = (text || '').split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width <= maxWidth) line = test;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function makeQrCanvas(url: string, px: number) {
  const c = document.createElement('canvas');
  await QRCode.toCanvas(c, url, {
    width: px,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  });
  return c;
}

async function cardToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png', 0.92));
}

// ---------- New, primary entry: render a business-card PNG on canvas ----------
export async function renderCardCanvas(opts: {
  title: string;
  url: string;
  size?: CardSize; // 'sm' | 'md' | 'lg'
  orientation?: CardOrientation; // 'portrait' | 'landscape'
  bg?: string; // background color
  titleColor?: string;
  urlColor?: string;
  fontFamily?: string; // defaults to Krub → system fallbacks
}) {
  const {
    title,
    url,
    size = 'md',
    orientation = 'portrait',
    bg = '#ffffff',
    titleColor = '#111111',
    urlColor = '#111111',
    fontFamily = '"Krub", system-ui, "Segoe UI", "Noto Sans Thai", Arial, sans-serif',
  } = opts;

  const { w, h } = dimsFor(size, orientation);
  const canvas = document.createElement('canvas');
  const ctx = withDpr(canvas, w, h);
  ctx.imageSmoothingQuality = 'high';

  // Ensure fonts render before measuring
  try {
    await (document as any).fonts?.ready;
    await (document as any).fonts?.load(`600 ${Math.round(h * 0.06)}px ${fontFamily}`);
  } catch {}

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Layout metrics
  const pad = Math.round(h * 0.06);
  const gap = Math.round(h * 0.03);
  const titleSize = Math.round(h * 0.06);
  const urlSize = Math.round(h * 0.038);
  const qrBox = Math.min(w - pad * 2, Math.round(h * 0.46)); // square

  // Title
  ctx.fillStyle = titleColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${titleSize}px ${fontFamily}`;
  const titleLines = wrapText(ctx, title || '(no title)', w - pad * 2);
  const titleBlockH = titleLines.length * (titleSize * 1.2);
  titleLines.forEach((line, i) => {
    const y = pad + i * (titleSize * 1.2) + titleSize / 2;
    ctx.fillText(line, w / 2, y);
  });

  // QR
  const qrTop = pad + titleBlockH + gap;
  const qrCanvas = await makeQrCanvas(url, qrBox - 32);
  const qrX = (w - qrCanvas.width) / 2;
  ctx.drawImage(qrCanvas, qrX, qrTop);

  // URL
  const urlTop = qrTop + qrCanvas.height + gap;
  ctx.fillStyle = urlColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${urlSize}px ${fontFamily}`;
  const pretty = url.replace(/^https?:\/\//i, ''); // cleaner
  const urlLines = wrapText(ctx, pretty, w - pad * 2);
  urlLines.forEach((line, i) => {
    const y = urlTop + i * (urlSize * 1.25) + urlSize / 2;
    ctx.fillText(line, w / 2, y);
  });

  return canvas;
}

// ---------- One-click actions (PNG) ----------
export async function downloadCardPng(filenameBase: string, canvas: HTMLCanvasElement) {
  const blob = await cardToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filenameBase?.endsWith('.png') ? filenameBase : `${filenameBase || 'card'}.png`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyCardToClipboard(canvas: HTMLCanvasElement) {
  const blob = await cardToBlob(canvas);
  if ('ClipboardItem' in window) {
    const item = new (window as any).ClipboardItem({ 'image/png': blob });
    await (navigator.clipboard as any).write([item]);
  } else {
    throw new Error('Clipboard images not supported in this browser.');
  }
}

export async function shareCardIfPossible(
  filename: string,
  canvas: HTMLCanvasElement
): Promise<boolean> {
  // Basic feature detection
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  const hasShare = !!nav?.share;
  const hasCanShare = !!nav?.canShare;

  if (!hasShare || !hasCanShare) {
    return false;
  }

  // Get PNG blob from canvas
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) {
        reject(new Error('Failed to create PNG blob from canvas'));
      } else {
        resolve(b);
      }
    }, 'image/png');
  });

  const file = new File([blob], filename, { type: 'image/png' });

  if (!nav.canShare({ files: [file] })) {
    return false;
  }

  try {
    await nav.share({
      files: [file],
      title: filename,
    });
    return true;
  } catch {
    // If user cancels or it fails, just report false so caller can fall back
    return false;
  }
}

export async function openCardPreview(canvas: HTMLCanvasElement) {
  const dataUrl = canvas.toDataURL('image/png');
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(
      `<img src="${dataUrl}" style="display:block;margin:24px auto;max-width:95%;height:auto;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.15)" />`
    );
  }
}

// ---------- Back-compat: your old API name (now QR optional) ----------
/**
 * Legacy-style helper (keeps your old call site working).
 * If qrCanvasId is provided and exists, we’ll draw that QR.
 * Otherwise, we generate the QR ourselves.
 * Exports a PNG (not JPEG) per your new requirement.
 */
export async function downloadQrCard(opts: {
  qrCanvasId?: string; // optional now
  title?: string;
  name?: string; // unused visually, but used to build filename if present
  url: string;
  bg?: string;
  textColor?: string;
  size?: CardSize;
  orientation?: CardOrientation;
}) {
  const {
    qrCanvasId,
    title = 'Thai Good News',
    name,
    url,
    bg = '#ffffff',
    textColor = '#111111',
    size = 'md',
    orientation = 'portrait',
  } = opts;

  const canvas = document.createElement('canvas');
  const { w, h } = dimsFor(size, orientation);
  const ctx = withDpr(canvas, w, h);
  ctx.imageSmoothingQuality = 'high';

  // Fonts
  const fontFamily = '"Krub", system-ui, "Segoe UI", "Noto Sans Thai", Arial, sans-serif';
  try {
    await (document as any).fonts?.ready;
    await (document as any).fonts?.load(`600 ${Math.round(h * 0.06)}px ${fontFamily}`);
  } catch {}

  // BG
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Layout
  const pad = Math.round(h * 0.06);
  const gap = Math.round(h * 0.03);
  const titleSize = Math.round(h * 0.06);
  const urlSize = Math.round(h * 0.038);
  const qrBox = Math.min(w - pad * 2, Math.round(h * 0.46));

  // Title
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${titleSize}px ${fontFamily}`;
  const titleLines = wrapText(ctx, title, w - pad * 2);
  const titleBlockH = titleLines.length * (titleSize * 1.2);
  titleLines.forEach((line, i) => {
    const y = pad + i * (titleSize * 1.2) + titleSize / 2;
    ctx.fillText(line, w / 2, y);
  });

  // QR (use provided canvas if found, else generate)
  const qrTop = pad + titleBlockH + gap;
  let qrCanvas: HTMLCanvasElement | null = null;

  if (qrCanvasId) {
    const el = document.getElementById(qrCanvasId);
    // Make sure it's actually a canvas element
    if (el instanceof HTMLCanvasElement) {
      qrCanvas = el;
    }
  }

  if (!qrCanvas) {
    // Fallback: generate QR ourselves
    qrCanvas = await makeQrCanvas(url, qrBox - 32);
  }

  const qrX = (w - qrCanvas.width) / 2;
  ctx.drawImage(qrCanvas, qrX, qrTop);

  // URL
  ctx.fillStyle = textColor;
  ctx.font = `500 ${urlSize}px ${fontFamily}`;
  const pretty = url.replace(/^https?:\/\//i, '');
  const urlTop = qrTop + qrCanvas.height + gap;
  const urlLines = wrapText(ctx, pretty, w - pad * 2);
  urlLines.forEach((line, i) => {
    const y = urlTop + i * (urlSize * 1.25) + urlSize / 2;
    ctx.fillText(line, w / 2, y);
  });

  // Download PNG
  const baseName =
    sanitizeFilename(
      name?.trim() ||
        (() => {
          try {
            const u = new URL(url);
            return `${u.hostname}${u.pathname}`.replace(/\/$/, '');
          } catch {
            return 'card';
          }
        })()
    ) || 'card';

  await downloadCardPng(baseName, canvas);
}
