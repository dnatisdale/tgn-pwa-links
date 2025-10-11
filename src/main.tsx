// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// (Optional) See build info in the console for quick debugging
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_TIME__: string;
if (typeof __APP_VERSION__ !== "undefined") {
  // Example: v0.3.2 — 2025-10-10 14:22:03 PT
  console.log(`${__APP_VERSION__} — ${__BUILD_DATE__} ${__BUILD_TIME__}`);
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found. Check your index.html.");
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
