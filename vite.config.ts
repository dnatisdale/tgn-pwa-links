// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// ---- Build metadata (safe even if not on git) ----
function gitShort() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}
const now = new Date();
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
const APP_VERSION = pkg.version ?? '0.0.0';
const BUILD_ID = process.env.NETLIFY_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_SHA || gitShort();
const BUILD_DATE = now.toISOString().slice(0, 10); // YYYY-MM-DD
const BUILD_TIME = now.toTimeString().slice(0, 8); // HH:MM:SS
const BUILD_PRETTY = true;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Thai Good News',
        short_name: 'TGN',
        start_url: '/',
        display: 'standalone',
        background_color: '#F4F5F8',
        theme_color: '#2D2A4A',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],

  // 👇 alias lives at top level (NOT inside manifest)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  // 👇 THIS is the correct place to define globals (property, not function)
  define: {
    __APP_VERSION__: JSON.stringify(String(APP_VERSION ?? '')),
    __BUILD_PRETTY__: JSON.stringify(String(BUILD_PRETTY ?? '')),
    __BUILD_ID__: JSON.stringify(String(BUILD_ID ?? '')),
    __BUILD_DATE__: JSON.stringify(String(BUILD_DATE ?? '')),
    __BUILD_TIME__: JSON.stringify(String(BUILD_TIME ?? '')),
  },
});
