// src/main.tsx — React + PWA without top-level await
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// (1) Optional: help TS know about the helper we put on window
declare global {
  interface Window {
    __REFRESH_SW__?: (reload?: boolean) => void;
  }
}

// (2) PWA register (dynamic, guarded, no top-level await)
(function loadPWA() {
  // vite provides this virtual module
  // @ts-ignore
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true, // <— important: register right away in preview/production
        onNeedRefresh() {
          // tell the UI to show the blue “New version” card
          window.dispatchEvent(new Event("pwa:need-refresh"));
        },
        onOfflineReady() {
          // optional: toast “Ready to work offline”
        },
      });

      // “Open” button calls this to activate the waiting SW and reload
      window.__REFRESH_SW__ = () => updateSW(true);

      // When the new SW takes control, reload to fresh assets
      navigator.serviceWorker?.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    })
    .catch((e) => {
      console.warn("PWA register skipped:", e);
    });
})();

// (3) Mount React
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
