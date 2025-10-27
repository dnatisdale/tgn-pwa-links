// src/components/HeaderBanner.tsx
import bannerUrl from '@/assets/banner-1200x300.png';

export default function HeaderBanner() {
  const handleLoad: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const img = e.currentTarget;
    console.log('Banner OK:', img.naturalWidth, 'x', img.naturalHeight, ' -> ', img.src);
  };

  const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const img = e.currentTarget;
    console.warn('Banner FAILED to load. Tried URL:', img.src);
    img.alt = 'Banner failed to load (check src/assets/banner-1200x300.png)';
    img.style.display = 'none'; // hide broken icon
    const box = img.parentElement as HTMLElement | null;
    if (box) {
      box.innerHTML = `
        <div style="
          width:100%;max-width:1200px;min-height:120px;
          display:flex;align-items:center;justify-content:center;
          border:1px dashed #c00;border-radius:12px;background:#fff7f7;color:#900;
          font:14px/1.3 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
          Banner image not found.<br/>
          Expected at: <code>src/assets/banner-1200x300.png</code>
        </div>`;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: 120, // gives it a body so it can't be “invisible”
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F4F5F8',
        borderBottom: '1px solid #000',
      }}
    >
      <img
        src={bannerUrl}
        alt="Thai Good News Banner"
        style={{
          display: 'block',
          width: '100%',
          maxWidth: 1200,
          height: 'auto',
          objectFit: 'contain',
        }}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
