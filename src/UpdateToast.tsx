// src/UpdateToast.tsx — provider-based (no lang prop)
import React from 'react';
import { useI18n } from './i18n-provider';

type Props = {
  show: boolean;
  onRefresh: () => void;
  onSkip: () => void;
};

export default function UpdateToast({ show, onRefresh, onSkip }: Props) {
  const { t } = useI18n();
  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('updateAvailable')}
      className="update-card"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 60,
        background: '#2D2A4A',
        color: 'white',
        borderRadius: 14,
        boxShadow: '0 10px 24px rgba(0,0,0,0.20)',
        width: 'min(280px, 80vw)',
        minHeight: 120,
        padding: 14,
        display: 'grid',
        alignContent: 'space-between',
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 16 }}>{t('updateAvailable')}</div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onSkip}
          className="btn"
          style={{
            background: 'transparent',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.7)',
            borderRadius: 9999,
            padding: '6px 12px',
            fontWeight: 600,
          }}
        >
          {t('close')}
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="btn btn-red"
          style={{ borderRadius: 9999, padding: '6px 12px', fontWeight: 700 }}
        >
          {t('refresh')}
        </button>
      </div>
    </div>
  );
}
