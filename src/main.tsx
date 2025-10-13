import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import ErrorBoundary from "./ErrorBoundary";
import { registerSW } from 'virtual:pwa-register';

// Register the service worker and surface a refresh function for the app
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // tell App to show the “New Version Available” toast
    window.dispatchEvent(new Event('pwa:need-refresh'));
  },
  onOfflineReady() {
    // optional: you could show “Ready to work offline”
  },
});

// App calls this when user clicks Refresh
window.__REFRESH_SW__ = () => {
  // true => skipWaiting + reload when new SW is ready
  updateSW(true);
};

// inside src/main.tsx (top-level file)
(function safePWA() {
  if (!("serviceWorker" in navigator)) return;
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        onNeedRefresh() { window.dispatchEvent(new CustomEvent("tgn-sw-update")); },
        onOfflineReady() { /* optional */ },
      });
      // @ts-ignore
      window.__tgnUpdateSW = updateSW;
    })
    .catch(() => {});
})();

declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_TIME__: string;
console.log(`${__APP_VERSION__} — ${__BUILD_DATE__} ${__BUILD_TIME__}`);

const container = document.getElementById("root");
if (!container) throw new Error("#root not found");
createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
