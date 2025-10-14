// firebase.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCNQYXYpTocoU7XWnPKEz7OUkmf6fHTgPY",
  authDomain: "thai-good-news-app.firebaseapp.com",
  databaseURL: "https://thai-good-news-app-default-rtdb.firebaseio.com",
  projectId: "thai-good-news-app",
  storageBucket: "thai-good-news-app.firebasestorage.app",
  messagingSenderId: "536885866848",
  appId: "1:536885866848:web:f8250a6f1bb4ca7cea2e05"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  console.warn('IndexedDB persistence failed:', err);
});
