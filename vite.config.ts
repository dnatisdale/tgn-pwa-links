// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "fs";

// --- robust version/date/time from package.json ---
function readPkgVersion(): string {
  try {
    const json = readFileSync(new URL("./package.json", import.meta.url), "utf-8");
    const pkg = JSON.parse(json);
    return `v${pkg.version || "0.0.0"}`;
  } catch {
    return `v${process.env.npm_package_version || "0.0.0"}`;
  }
}
const APP_VERSION = readPkgVersion();
const now = new Date();
const BUILD_DATE = now.toISOString().slice(0, 10);   // YYYY-MM-DD
const BUILD_TIME = now.toTimeString().slice(0, 8);    // HH:MM:SS

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      devOptions: {
        enabled: true,          // <— show a Service Worker on localhost
        type: "module",
      },
      includeAssets: ["robots.txt"], // favicon optional per your choice
      manifest: {
        name: "Thai Good News",
        short_name: "TGN",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0f2454",
        icons: [
          { src: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/pwa-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      // Safer SPA navigation (especially useful on Netlify)
      workbox: {
        navigateFallback: "index.html",
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
});
