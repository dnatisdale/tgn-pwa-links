// vite.config.ts
// Clean build meta injection (no package.json import needed)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Version source of truth: CI override -> npm package version -> fallback
const APP_VERSION = process.env.APP_VERSION || process.env.npm_package_version || '0.0.0';

// Pacific build timestamp string
const BUILD_TIME_PST = new Date().toLocaleString('en-US', {
  timeZone: 'America/Los_Angeles',
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_TIME_PST__: JSON.stringify(BUILD_TIME_PST),

    // Optional extras (safe defaults if you later use them)
    __BUILD_ID__: JSON.stringify(process.env.BUILD_ID ?? ''),
    __BUILD_DATE__: JSON.stringify(process.env.BUILD_DATE ?? ''),
    __BUILD_TIME__: JSON.stringify(process.env.BUILD_TIME ?? ''),
    __BUILD_PRETTY__: JSON.stringify(process.env.BUILD_PRETTY ?? ''),
  },
});
