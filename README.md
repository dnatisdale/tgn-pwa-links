See in-app comments. Paste Firebase config, enable Auth+Firestore, build & deploy.
# Thai Good News (TGN) — PWA

A simple, fast PWA to collect and share language-tagged links with QR codes. Built with **Vite + React**, **vite-plugin-pwa**, and **Firebase (Auth + Firestore)**. Deployed on **Netlify**.

## Features

- Email sign-in (Firebase Auth)
- Add links (HTTPS enforced; `http://` auto-fixed to `https://`)
- Browse with search + Thai-only filter
- QR codes (click to enlarge), copy URL, share to Email / LINE / Facebook / X / WhatsApp / Telegram, download QR
- Import (CSV / JSON / paste box), **Undo last import**
- Export (CSV / **PDF**, Print)
- Text size slider (applies globally)
- PWA: service worker + install (with iOS fallback)
- Footer shows `vX.Y.Z — YYYY-MM-DD HH:MM:SS`

## Quick start

```bash
# 0) Node 18+ recommended
node -v

# 1) Install dependencies
npm install

# 2) Configure Firebase
#   Edit src/firebase.ts with your Web SDK config (Project settings → General → Web app).
#   DO NOT put service account or admin keys here.

# 3) Dev server (SW enabled in dev)
npm run dev
# open http://localhost:5173

# 4) Build + preview production build locally
npm run build
npm run preview


.
├─ public/
│  ├─ banner-2400x600.png
│  └─ icons/
│     ├─ pwa-192.png
│     └─ pwa-512.png
├─ src/
│  ├─ AddLink.tsx
│  ├─ App.tsx
│  ├─ ErrorBoundary.tsx
│  ├─ ImportExport.tsx
│  ├─ InstallPWA.tsx
│  ├─ IOSInstallHint.tsx
│  ├─ Login.tsx
│  ├─ QR.tsx
│  ├─ Share.tsx
│  ├─ firebase.ts
│  ├─ i18n.ts
│  ├─ main.tsx
│  ├─ styles.css
│  ├─ utils.ts
│  └─ vite-pwa.d.ts
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
