// src/Share.tsx
import React from 'react';
import { useI18n } from './i18n-provider';

export type ShareProps = {
  url: string;
  title?: string;
  /** Optional: id of a QR <canvas> (for future use) */
  qrCanvasId?: string;
};

const grow =
  'motion-safe:transition-transform motion-safe:duration-150 group-hover:scale-[1.06] group-focus-visible:scale-[1.06] active:scale-[1.06]';

export default function Share({ url, title = 'Link' }: ShareProps) {
  const { t } = useI18n();

  const webShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
      } catch {
        /* cancelled */
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
      {/* Share button: red pill, grows text on hover/focus/press */}
      <button
        className="group btn btn-red"
        style={{ borderRadius: 9999, padding: '8px 16px', fontWeight: 600 }}
        onClick={webShare}
        type="button"
      >
        <span className={grow}>{t('share')}</span>
      </button>

      {/* Copy link: linklike text only grows */}
      <button className="group linklike" onClick={copy} type="button">
        <span className={grow}>{t('copyLink')}</span>
      </button>
    </div>
  );
}
