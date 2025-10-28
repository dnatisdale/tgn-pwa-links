// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// ===== Build meta (no package.json import) =====
const APP_VERSION = process.env.APP_VERSION || process.env.npm_package_version || '0.0.0';

const BUILD_TIME_PST = new Date().toLocaleString('en-US', {
  timeZone: 'America/Los_Angeles',
});
// ==============================================

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [], // add files under /public if you want to precache specific assets
      manifest: {
        name: 'Thai Good News',
        short_name: 'TGN',
        description: 'Offline-capable bilingual URL library with QR sharing',
        theme_color: '#2D2A4A',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        icons: [
          // Make sure these paths exist under /public/icons/
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // sensible defaults; you can tweak later
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff2}'],
      },
      devOptions: {
        enabled: true, // allow PWA in dev for testing the register
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_TIME_PST__: JSON.stringify(BUILD_TIME_PST),
    __BUILD_ID__: JSON.stringify(process.env.BUILD_ID ?? ''),
    __BUILD_DATE__: JSON.stringify(process.env.BUILD_DATE ?? ''),
    __BUILD_TIME__: JSON.stringify(process.env.BUILD_TIME ?? ''),
    __BUILD_PRETTY__: JSON.stringify(process.env.BUILD_PRETTY ?? ''),
  },
});
