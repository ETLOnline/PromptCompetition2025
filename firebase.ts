// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'; // Import for Firebase Authentication
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Your web app's Firebase configuration
// Firebase config from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyA-MrBeWy7ZCora3S-PZtrHfKrn2hcJ-Xc",
  authDomain: "enlightentech-a2046.firebaseapp.com",
  projectId: "enlightentech-a2046",
  storageBucket: "enlightentech-a2046.firebasestorage.app",
  messagingSenderId: "940035486063",
  appId: "1:940035486063:web:e6164eb1b7ae6992c4f89a",
  
// FIREBASE_ADMIN_UID="6yFsKc8SzrZqepMDsySPenL3bK83"
}; 

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export authenticated services
export const auth = getAuth(app); // This gives us the Auth instance
export const db = getFirestore(app); // This gives us the Firestore instance (for user profiles)

// You can export the app instance itself if needed elsewhere
export default app;