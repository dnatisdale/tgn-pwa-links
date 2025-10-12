// src/firebase.ts
// Minimal Firebase v9 setup; replace with your own config
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY || "REPLACE_ME",
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN || "REPLACE_ME",
  projectId: import.meta.env.VITE_FB_PROJECT_ID || "REPLACE_ME",
  appId: import.meta.env.VITE_FB_APP_ID || "REPLACE_ME"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
