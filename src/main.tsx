// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import ErrorBoundary from "./ErrorBoundary";
import { registerSW } from "virtual:pwa-register";

// Make TS happy if other files reference this
declare global {
  interface Window {
    __REFRESH_SW__?: (reloadImmediately?: boolean) => void;
  }
}

// --- Service Worker registration (single place) ---
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Tell the app/toast to show the "New Version" bar
    window.dispatchEvent(new Event("pwa:need-refresh"));
  },
  onOfflineReady() {
    // Optional: show "Ready to work offline"
  },
});

// App / UpdateToast will call this to refresh + reload
window.__REFRESH_SW__ = (reload = true) => updateSW(reload);

// (Optional) build info in console (defined in vite.config.ts via `define`)
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
