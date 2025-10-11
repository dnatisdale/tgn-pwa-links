// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json" assert { type: "json" };

// Robust version resolution: use package.json, fallback if needed
const APP_VERSION = `v${pkg?.version ?? "0.0.0"}`;

// Build timestamp in America/Los_Angeles (PT)
const now = new Date();
const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
const BUILD_DATE = `${parts.year}-${parts.month}-${parts.day}`;
const BUILD_TIME = `${parts.hour}:${parts.minute}:${parts.second} PT`;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Thai Good News",
        short_name: "TGN",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2D2A4A",
        icons: [
          { src: "/icons/app-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/app-icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/app-icon-1024.png", sizes: "1024x1024", type: "image/png", purpose: "any maskable" }
        ],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
});
