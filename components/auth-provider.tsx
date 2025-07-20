"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, collection } from 'firebase/firestore';
import { signOut } from "firebase/auth";

// Define the shape of the auth context
interface AuthContextType {
  user: User | null;
  role: string | null; // Add role to context

  signUp: (email: string, password: string, fullName: string, institution: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>; // Added logout
  signInWithGoogle: () => Promise<void>; // Added Google sign-in
  loading: boolean;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null); // Add role state
  const [loading, setLoading] = useState(true);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Get custom claims (role) from ID token
        const tokenResult = await currentUser.getIdTokenResult(true); // force refresh
        setRole(typeof tokenResult.claims.role === 'string' ? tokenResult.claims.role : null);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sign-up function
  const signUp = async (email: string, password: string, fullName: string, institution: string) => {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // console.log('hello');
      // console.log(db);

// Now your addDocumentWithSpecificId function will work!
async function addDocumentWithSpecificId() {
try {
// 'db' is now correctly the FirebaseFirestore instance
const usersCollectionRef = collection(db, "users");

// Create a document reference with a specific ID, then set the data
await setDoc(doc(usersCollectionRef, user.uid), {
  fullName,
  email,
  institution,
  createdAt: new Date().toISOString(),
});

// console.log("Document successfully written with ID: ", user.uid);
} catch (e) {
console.error("Error writing document: ", e);
}
}

// Call the function to test
addDocumentWithSpecificId();        

      // console.log('hello2');

    } catch (error: any) {
      // Map Firebase error codes to user-friendly messages
      let errorMessage = 'Failed to sign up. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Database access denied. Please check Firestore rules.';
      }
      throw new Error(errorMessage);
    }
  };

  // Sign-in function
  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      }
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Google sign-in function
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Optionally, create user doc in Firestore if new
      const usersCollectionRef = collection(db, "users");
      await setDoc(doc(usersCollectionRef, user.uid), {
        fullName: user.displayName || '',
        email: user.email || '',
        institution: '', // Google doesn't provide institution by default
        createdAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error: any) {
      let errorMessage = 'Failed to sign in with Google.';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Google sign-in popup was closed.';
      }
      throw new Error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, signUp, signIn, logout, signInWithGoogle, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};