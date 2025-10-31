// src/ShareMenu.tsx
import React from 'react';

type ShareMenuProps = {
  url?: string;
  title?: string;
  onClose?: () => void;
};

export default function ShareMenu({
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = typeof document !== 'undefined' ? document.title : 'Thai Good News',
  onClose,
}: ShareMenuProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const tryNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      alert('Native share not available on this device.');
    } catch (e) {
      console.warn('Share cancelled or failed:', e);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Share menu"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: 'min(520px, 92vw)',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,.2)',
          overflow: 'hidden',
          border: '1px solid #000',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 12,
            background: '#2D2A4A', // Thai blue
            color: '#F4F5F8',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18 }}>Share</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: '1px solid #000',
              background: '#F4F5F8',
              color: '#000',
              borderRadius: 8,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16 }}>
          <div
            style={{
              marginBottom: 12,
              fontSize: 14,
              wordBreak: 'break-all',
              color: '#333',
            }}
          >
            <strong>Title:</strong> {title}
            <br />
            <strong>URL:</strong> {url}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noreferrer"
              style={btnLinkStyle}
            >
              Share on Facebook
            </a>

            <a
              href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
              target="_blank"
              rel="noreferrer"
              style={btnLinkStyle}
            >
              Share on X/Twitter
            </a>

            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
              target="_blank"
              rel="noreferrer"
              style={btnLinkStyle}
            >
              Share on LinkedIn
            </a>

            <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} style={btnLinkStyle}>
              Share by Email
            </a>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={tryNativeShare} style={btnStyleBlue}>
              Native Share
            </button>
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(url)
                  .then(() => alert('Copied!'))
                  .catch(() => alert('Copy failed'));
              }}
              style={btnStyleRed}
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const btnLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  textAlign: 'center',
  textDecoration: 'none',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #000',
  background: '#F4F5F8',
  color: '#000',
  fontSize: 14,
};

const btnStyleBlue: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #000',
  background: '#2D2A4A', // Thai blue
  color: '#F4F5F8',
  cursor: 'pointer',
  fontSize: 14,
};

const btnStyleRed: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #000',
  background: '#A51931', // Thai red
  color: '#F4F5F8',
  cursor: 'pointer',
  fontSize: 34,
};
