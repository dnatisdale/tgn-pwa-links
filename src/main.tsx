// src/main.tsx — React + PWA registration
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles.css';

declare global {
  interface Window {
    __REFRESH_SW__?: (reload?: boolean) => void;
  }
}

(async () => {
  try {
    // vite provides this virtual module via vite-plugin-pwa
    // @ts-ignore — virtual import resolved by Vite
    const { registerSW } = await import('virtual:pwa-register');

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        window.dispatchEvent(new Event('pwa:need-refresh'));
      },
      onOfflineReady() {
        // optional toast "Ready to work offline"
      },
    });

    window.__REFRESH_SW__ = () => updateSW(true);

    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  } catch (e) {
    console.warn('PWA register skipped:', e);
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
