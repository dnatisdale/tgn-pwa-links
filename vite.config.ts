// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json" with { type: "json" };
import crypto from "node:crypto";

/* ============== Helpers (LA time + short build id) ============== */
function laPrettyNow(): string {
  const tz = "America/Los_Angeles";
  const d = new Date();
  const mdy = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, month: "long", day: "numeric", year: "numeric",
  }).format(d);
  const hm = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true,
  }).format(d).replace(" AM", "AM").replace(" PM", "PM");
  return `${mdy} | ${hm}`;
}
function laDate(): string {
  const tz = "America/Los_Angeles";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, month: "long", day: "numeric", year: "numeric",
  }).format(new Date());
}
function laTime(): string {
  const tz = "America/Los_Angeles";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date()).replace(" AM", "AM").replace(" PM", "PM");
}
function buildId7(): string {
  try {
    const { execSync } = require("node:child_process");
    const g = execSync("git rev-parse --short=7 HEAD").toString().trim();
    if (g) return g;
  } catch {}
  const seed = `${Date.now()}-${Math.random()}`;
  return crypto.createHash("sha1").update(seed).digest("hex").slice(0, 7);
}

/* =========================== Config ============================= */
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        // allow bigger files if they slip in (but we ignore heavy folders below)
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8 MiB
        globPatterns: ["**/*.{js,css,html,ico,svg,webp,png}"],
        // do NOT precache banners or screenshots (they'll still load normally)
        globIgnores: ["**/banners/**", "**/screenshots/**"],
      },
      includeAssets: ["/favicon.ico"],
      manifest: {
        name: "Thai Good News",
        short_name: "TGN",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#F4F5F8",
        theme_color: "#2D2A4A",

        // ICONS — keep as PNG; fix warning by using "maskable" (not "any maskable")
        icons: [
          { src: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ],

        // SCREENSHOTS — your new WebP files (put them in public/screenshots/)
        screenshots: [
          {
            src: "/screenshots/home-wide-1280x720.webp",
            sizes: "1280x720",
            type: "image/webp",
            form_factor: "wide",
            label: "Home (wide)"
          },
          {
            src: "/screenshots/home-tall-720x1280.webp",
            sizes: "720x1280",
            type: "image/webp",
            form_factor: "narrow",
            label: "Home (mobile)"
          }
        ],
      },
    }),
  ],
  define: {
    __APP_VERSION__:  JSON.stringify(pkg.version),
    __BUILD_PRETTY__: JSON.stringify(laPrettyNow()),
    __BUILD_ID__:     JSON.stringify(buildId7()),
    // Back-compat fields some components use:
    __BUILD_DATE__:   JSON.stringify(laDate()),
    __BUILD_TIME__:   JSON.stringify(laTime()),
  },
});
