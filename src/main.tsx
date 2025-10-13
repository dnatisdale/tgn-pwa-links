// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import ErrorBoundary from "./ErrorBoundary";
import { registerSW } from "virtual:pwa-register";

// --- Service Worker registration (single place) ---
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Tell App to show the "New Version Available" toast
    window.dispatchEvent(new Event("pwa:need-refresh"));
  },
  onOfflineReady() {
    // Optional: show "Ready to work offline"
  },
});

// Expose a refresh function for your UpdateToast "Refresh" button
// (App calls window.__REFRESH_SW__?.() )
window.__REFRESH_SW__ = () => updateSW(true);

// (Optional) build info in console (these are defined in vite.config.ts)
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
