import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Use the plain helper (not the /react one)
import { registerSW } from "virtual:pwa-register";

// Dispatch small events so App can show the toast
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent("pwa:need-refresh"));
  },
  onOfflineReady() {
    // optional: window.dispatchEvent(new CustomEvent("pwa:offline-ready"));
  },
});

// Expose a refresher for the App's toast button
// Calling this triggers the new service worker to take control
// and reloads the page
// (we read it in App via window.__REFRESH_SW__?.())
(window as any).__REFRESH_SW__ = () => updateSW(true);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
