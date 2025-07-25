// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA-MrBeWy7ZCora3S-PZtrHfKrn2hcJ-Xc",
  authDomain: "enlightentech-a2046.firebaseapp.com",
  projectId: "enlightentech-a2046",
  storageBucket: "enlightentech-a2046.firebasestorage.app",
  messagingSenderId: "940035486063",
  appId: "1:940035486063:web:e6164eb1b7ae6992c4f89a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;