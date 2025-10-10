
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJOIrS7vyauFUW7zUjuJoBxHigZHkKcWw",
  authDomain: "web-app-a1fc0.firebaseapp.com",
  projectId: "web-app-a1fc0",
  storageBucket: "web-app-a1fc0.firebasestorage.app",
  messagingSenderId: "284479469883",
  appId: "1:284479469883:web:9fdcbc1c78f36cff36df1e",
  measurementId: "G-P41MKP7HJE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
