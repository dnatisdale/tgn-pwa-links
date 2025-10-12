// vite.config.ts (root)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

function formatPacific() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const str = fmt.format(new Date());           // "YYYY-MM-DD, HH:MM"
  const [date, time] = str.split(", ");
  return { date, time };
}
const { date: BUILD_DATE, time: BUILD_TIME } = formatPacific();
const APP_VERSION = `v${process.env.npm_package_version || "0.0.0"}`;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      strategies: "generateSW",
      devOptions: { enabled: false }, // keep SW off in dev for fewer warnings
      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "robots.txt",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "Thai Good News",
        short_name: "TGN",
        description: "Thai Good News - simple PWA for sharing links and QR",
        start_url: "/",
        display: "standalone",
        background_color: "#F4F5F8", // Thai white
        theme_color: "#A51931",      // Thai red
        icons: [
          { src: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/pwa-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // what to include in the precache:
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],

        // 1) Raise the file-size cap (optional but future-proof)
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB

        // 2) And/or ignore your giant banner so it’s not precached
        globIgnores: ["**/banner-2400x600.png"],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
});
