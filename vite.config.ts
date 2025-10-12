// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json";

// Build-time constants (Pacific, 24h, no seconds)
function fmtPacific(date = new Date()) {
  const d = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date); // YYYY-MM-DD
  const t = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date); // HH:mm
  return { d, t };
}
const { d: BUILD_DATE, t: BUILD_TIME } = fmtPacific();

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",      // ← you asked for prompt
      injectRegister: "auto",
      devOptions: { enabled: false },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,        // we’ll show toast & call SKIP_WAITING ourselves
      },
      manifest: {
        name: "Thai Good News",
        short_name: "TGN",
        description: "Clean bilingual PWA to manage name/language/URL records",
        theme_color: "#2D2A4A",    // thai blue
        background_color: "#F4F5F8", // thai white
        icons: [
          { src: "icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ],
        start_url: "./",
        display: "standalone",
        lang: "en",
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version ?? "v0.0.0"),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  // keep JSX automatic; TS must match (see tsconfig step)
  esbuild: { jsx: "automatic" },
});
