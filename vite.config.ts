import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// These two constants are computed at build time.
const APP_VERSION = `v${process.env.npm_package_version}`;
const BUILD_DATE = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

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
        ]
      }
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
  }
});
