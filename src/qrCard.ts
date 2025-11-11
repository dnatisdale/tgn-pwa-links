// src/qrCard.ts

import QRCode from 'qrcode';

export type CardSize = 'sm' | 'md' | 'lg';
export type CardOrientation = 'portrait' | 'landscape';

type RenderOptions = {
  title: string;
  url: string;
  language?: string;
  size: CardSize;
  orientation: CardOrientation;
};

/**
 * Create a QR card canvas:
 * - QR code at top
 * - Title (bold) under QR
 * - Language label (if provided)
 * - URL under that
 * Text auto-shrinks to fit width.
 */
export async function renderCardCanvas(opts: RenderOptions): Promise<HTMLCanvasElement> {
  const { title, url, language, size, orientation } = opts;

  if (!url) {
    throw new Error('renderCardCanvas: url is required');
  }

  // Base size
  const base = size === 'sm' ? 256 : size === 'lg' ? 512 : 384;
  const isPortrait = orientation === 'portrait';

  const width = isPortrait ? base : Math.round(base * 1.4);
  const height = isPortrait ? Math.round(base * 1.4) : base;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D context not available');
  }
  const context = ctx; // non-null alias for TS

  const margin = Math.round(width * 0.06);
  const qrSize = width - margin * 2;

  // Background
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);

  // Offscreen QR canvas
  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = qrSize;
  qrCanvas.height = qrSize;

  await QRCode.toCanvas(qrCanvas, url, {
    margin: 1,
    width: qrSize,
  });

  // Draw QR centered at top
  const qrX = (width - qrSize) / 2;
  const qrY = margin;
  context.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  // Text area below QR
  let y = qrY + qrSize + Math.round(margin * 0.4);
  const textWidth = width - margin * 2;

  context.textBaseline = 'top';

  function setFont(px: number, bold = false) {
    context.font = `${
      bold ? '600 ' : ''
    }${px}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  }

  function fitAndDraw(
    text: string,
    basePx: number,
    minPx: number,
    color: string,
    bold = false
  ): number {
    if (!text) return 0;

    let fontSize = basePx;
    while (fontSize >= minPx) {
      setFont(fontSize, bold);
      const w = context.measureText(text).width;
      if (w <= textWidth) break;
      fontSize -= 1;
    }

    setFont(fontSize, bold);
    context.fillStyle = color;
    context.fillText(text, margin, y);

    const lineHeight = fontSize + 2;
    y += lineHeight;
    return lineHeight;
  }

  // 1) Title (bold, larger)
  const safeTitle = title || url;
  fitAndDraw(safeTitle, 20, 10, '#111111', true);

  // 2) Language
  if (language) {
    fitAndDraw(language, 14, 8, '#333333', false);
  }

  // 3) URL (full; readable)
  fitAndDraw(url, 12, 7, '#0066cc', false);

  return canvas;
}

// ---------- Utilities ----------

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob from canvas'));
      },
      'image/png',
      0.92
    );
  });
}

/**
 * Try to share the PNG via Web Share API (with file).
 * Returns true if sharing was attempted; false if not supported.
 */
export async function shareCardIfPossible(
  filename: string,
  canvas: HTMLCanvasElement
): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !('share' in navigator)) {
      return false;
    }

    const blob = await canvasToBlob(canvas);
    const file = new File([blob], filename, { type: 'image/png' });
    const nav: any = navigator;

    if (nav.canShare && nav.canShare({ files: [file] })) {
      await nav.share({
        files: [file],
        title: 'Thai Good News',
        text: '',
      });
      return true;
    }

    return false;
  } catch (e) {
    console.error('shareCardIfPossible error', e);
    return false;
  }
}

/**
 * Download the PNG generated from the canvas.
 */
export async function downloadCardPng(filename: string, canvas: HTMLCanvasElement): Promise<void> {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'tgn-card.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Optional: open a preview window with the QR card.
 */
export function openCardPreview(canvas: HTMLCanvasElement): void {
  const dataUrl = canvas.toDataURL('image/png');
  const w = window.open();
  if (!w) return;
  w.document.write(
    `<img src="${dataUrl}" alt="QR Card" style="max-width:100%;height:auto;display:block;margin:0 auto;" />`
  );
}
