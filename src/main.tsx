import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import ErrorBoundary from "./ErrorBoundary";

/* Safe PWA update wiring: dynamic import with catch */
(function safePWA() {
  // only try in browsers that support SW
  if (!("serviceWorker" in navigator)) return;
  // dynamic import so dev won't crash if plugin is missing
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        onNeedRefresh() {
          window.dispatchEvent(new CustomEvent("tgn-sw-update"));
        },
        onOfflineReady() {
          // Optional: show "Ready to work offline"
        },
      });
      // @ts-ignore
      window.__tgnUpdateSW = updateSW;
    })
    .catch(() => {
      // ignore: plugin not active in this build, or dev with no PWA
    });
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
