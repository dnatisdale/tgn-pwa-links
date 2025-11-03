// src/Share.tsx
import React from 'react';
import { useI18n } from './i18n-provider';

export type ShareProps = {
  url: string;
  title?: string;
  /** Optional: id of an existing <canvas> that holds a QR image (for future use) */
  qrCanvasId?: string;
};

export default function Share({ url, title = 'Link', qrCanvasId }: ShareProps) {
  const { t } = useI18n();

  const webShare = async () => {
    // (optional) if you ever need the canvas, you can read it like this:
    // const qrCanvas = qrCanvasId
    //   ? (document.getElementById(qrCanvasId) as HTMLCanvasElement | null)
    //   : null;

    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
      } catch {
        /* user canceled or share failed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      alert(t('urlCopied'));
    } catch {
      /* clipboard blocked */
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert(t('urlCopied'));
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="flex items-center gap-8">
      <button
        className="btn btn-red"
        style={{ borderRadius: 9999, padding: '8px 16px', fontWeight: 600 }}
        onClick={webShare}
      >
        {t('share')}
      </button>

      <button className="linklike" onClick={copy}>
        {t('copyLink')}
      </button>
    </div>
  );
}
