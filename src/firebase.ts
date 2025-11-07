// src/firebase.ts
// FIREBASE INIT — single app instance, shared auth/db (ESM + Vite + Firebase v10)

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

// Vite envs (must start with VITE_)
const firebase = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // optional if you enabled GA4 in Firebase:
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ✅ Single app instance no matter how many times this file is imported
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebase);

// ✅ Shared instances (always import these from './firebase')
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// (Optional) Analytics — only if supported, and only in the browser
export let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  isSupported()
    .then((ok) => {
      if (ok) analytics = getAnalytics(app);
    })
    .catch(() => {
      /* ignore analytics errors */
    });
}
