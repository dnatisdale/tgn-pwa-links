// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "fs";
import { execSync } from "child_process";

// ---- Build tag (automatic) ----
// Priority: Netlify COMMIT_REF -> git rev-parse -> package.json version -> 'local-dev'
function buildTag(): string {
  const envSha = process.env.COMMIT_REF; // Netlify provides this
  if (envSha) return `@${envSha.slice(0, 7)}`;
  try {
    const sha = execSync("git rev-parse --short HEAD").toString().trim();
    if (sha) return `@${sha}`;
  } catch {}
  try {
    const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));
    if (pkg?.version) return `v${pkg.version}`;
  } catch {}
  return "local-dev";
}

const TAG = buildTag();
const now = new Date();
const BUILD_DATE = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles", year: "numeric", month: "long", day: "numeric"
}).format(now);             // e.g., "October 11, 2025"
const BUILD_TIME = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles", hour12: false, hour: "2-digit", minute: "2-digit"
}).format(now);             // e.g., "14:52"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["robots.txt"],
      manifest: {
        name: "Thai Good News",
        short_name: "TGN",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0f2454",
        icons: [
          { src: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/pwa-512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(TAG),        // now a commit tag like "@a1b2c3d"
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),  // PT, full month day year
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),  // PT, 24h, no seconds
  },
});
