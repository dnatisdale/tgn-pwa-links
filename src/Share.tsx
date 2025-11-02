import React from 'react';
import { useI18n } from './i18n-provider';

type Props = { url: string; title?: string };

export default function Share({ url, title = 'Link' }: Props) {
  const { t } = useI18n();

  const webShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
      } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      alert(t('urlCopied'));
    } catch {}
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert(t('urlCopied'));
    } catch {}
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
