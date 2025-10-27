// src/Share.tsx
import React, { useState } from 'react';

/**
 * Props:
 *  - url: the https link to share
 *  - title: optional title for message
 *  - qrCanvasId: if provided, we will try to attach the QR image (from <canvas id=...>)
 */
export default function Share({
  url,
  title = 'Thai Good News',
  qrCanvasId,
}: {
  url: string;
  title?: string;
  qrCanvasId?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function getQrFile(): Promise<File | null> {
    if (!qrCanvasId) return null;
    const canvas = document.getElementById(qrCanvasId) as HTMLCanvasElement | null;
    if (!canvas) return null;

    // make a ~300–400 KB PNG by controlling pixel size and quality (canvas.toBlob controls quality for JPEG; PNG is lossless)
    // if your canvas is large, we can downscale to keep file smaller:
    const MAX = 512;
    const w = canvas.width,
      h = canvas.height;
    const scale = Math.min(1, MAX / Math.max(w, h));
    let outCanvas = canvas;

    if (scale < 1) {
      const c = document.createElement('canvas');
      c.width = Math.round(w * scale);
      c.height = Math.round(h * scale);
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(canvas, 0, 0, c.width, c.height);
      outCanvas = c;
    }

    const blob: Blob | null = await new Promise((res) =>
      outCanvas.toBlob((b) => res(b), 'image/png')
    );
    if (!blob) return null;

    // Use URL-friendly name (use hostname if possible)
    let namePart = 'qr';
    try {
      const u = new URL(url);
      namePart = (u.hostname + u.pathname).replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
      if (!namePart) namePart = 'qr';
    } catch {
      // ignore
    }

    return new File([blob], `${namePart}.png`, { type: 'image/png' });
  }

  async function doWebShare() {
    setBusy(true);
    try {
      const files: File[] = [];
      const qr = await getQrFile();
      if (qr) files.push(qr);

      const shareData: ShareData = {
        title,
        text: `${title}\n${url}`,
        url, // some platforms use this field too
        files: files.length ? files : undefined,
      };

      // Can this platform share files?
      // If files present, we must check navigator.canShare({files})
      if (
        shareData.files &&
        navigator.canShare &&
        !navigator.canShare({ files: shareData.files })
      ) {
        // fall back without files
        delete shareData.files;
      }

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to mailto (no attachments allowed via mailto)
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(`${title}\n${url}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }
    } catch {
      // swallow user-cancel or errors
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied');
    } catch {
      alert('Copy failed');
    }
  }

  return (
    <div className="share-center">
      <div className="share-row">
        {/* Red Share button (dropdown look optional; we just do a single button now) */}
        <button className="btn-red" onClick={doWebShare} disabled={busy} title="Share QR + link">
          {busy ? 'Sharing…' : 'Share'}
        </button>

        {/* Fallback helpers visible always */}
        <button className="linklike" onClick={copyLink} title="Copy link">
          Copy link
        </button>

        {/* Let user download the QR image (so they can attach to email manually) */}
        {qrCanvasId && (
          <button
            className="linklike"
            onClick={async () => {
              const qr = await getQrFile();
              if (!qr) return;
              const a = document.createElement('a');
              a.href = URL.createObjectURL(qr);
              a.download = qr.name;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
            title="Download QR Image"
          >
            Download QR image
          </button>
        )}
      </div>
    </div>
  );
}
