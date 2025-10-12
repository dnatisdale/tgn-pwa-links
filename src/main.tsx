// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { registerSW } from "virtual:pwa-register";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);

// Safe PWA registration with update events
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // allow App to react
    (window as any).__tgnOnNeedRefresh?.();
    // also dispatch a custom event for any listener
    window.dispatchEvent(new CustomEvent("tgn-sw-update"));
  },
  onRegistered(r) {
    // expose manual updater
    (window as any).__tgnUpdateSW = async () => {
      try {
        await r?.update();
      } catch {}
      location.reload();
    };
  }
});
