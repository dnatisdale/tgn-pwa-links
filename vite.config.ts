// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { execSync } from 'node:child_process';

// --- Build metadata (safe even on Netlify without git) ---
function gitShort() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}
const now = new Date();
const BUILD_ID = process.env.NETLIFY_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_SHA || gitShort();
const BUILD_DATE = now.toISOString().slice(0, 10); // YYYY-MM-DD
const BUILD_TIME = now.toTimeString().slice(0, 8); // HH:MM:SS
const BUILD_PRETTY = true; // your toggle

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

  // 👇 make @ point to /src
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  // 👇 inject constants for use in app code
  define: {
    __BUILD_PRETTY__: JSON.stringify(BUILD_PRETTY),
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
});
