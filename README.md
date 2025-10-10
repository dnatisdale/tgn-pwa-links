
# Thai Good News — Links PWA (Firebase)

**Minimal, bilingual (EN/TH) PWA** to manage, share, and QR-code Gospel URLs.

## Features
- Email login (Firebase Auth) — keeps random edits out
- Cloud data (Firestore) — your links live under your account
- Clean text-only actions (no icon colors)
- QR code per URL (encoded from the URL)
- Share via Web Share API + Email/Facebook/X/WhatsApp fallbacks
- Import (CSV/JSON) and Export (JSON)
- Text size control: Small | Medium | Large
- Filter: All | Thai only
- PWA-ready build

## Quick Start
1) Install Node.js LTS (v18 or v20)
2) In Terminal inside this folder:
```bash
npm install
```
3) Create Firebase project → Web App → copy config into `src/firebase.ts`.
4) In Firebase Console:
   - Authentication → enable **Email/Password**
   - Firestore Database → **Create database**
   - (Optional Rules)
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /users/{userId}/links/{docId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
     ```
5) Run dev server:
```bash
npm run dev
```

## Import formats
- **CSV:** `name,language,url`
- **JSON array:** `[{"name":"…","language":"Thai","url":"https://…"}]`

## Deploy
`npm run build` → deploy `dist/` to Netlify/Vercel/Pages.
