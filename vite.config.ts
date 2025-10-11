// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json" assert { type: "json" };  // <-- add this

const now = new Date();
const BUILD_DATE = now.toISOString().slice(0, 10);  // YYYY-MM-DD
const BUILD_TIME = now.toTimeString().slice(0, 8);  // HH:MM:SS
const APP_VERSION = `v${pkg.version}`;              // <-- use package.json

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.ico", "robots.txt"],
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
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
});
