// src/DownloadQRButton.tsx
import React from 'react';
import { downloadQrCard } from './qrCard';

export default function DownloadQRButton({
  qrCanvasId,
  url,
  name,
  title,
}: {
  qrCanvasId: string;
  url: string;
  name?: string;
  title?: string;
}) {
  return (
    <button
      className={`group btn btn-blue not-italic ${
        !selectedRows.length ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={batchDownload}
      disabled={!selectedRows.length}
    >
      <span className="motion-safe:transition-transform motion-safe:duration-150 group-hover:scale-[1.06] group-focus-visible:scale-[1.06] active:scale-[1.06]">
        {tOr('downloadQRCards', 'Download QR cards')} ({selectedRows.length})
      </span>
    </button>
  );
}
