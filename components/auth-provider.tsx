"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth"

import { doc, setDoc, collection } from "firebase/firestore"
import { useRouter } from "next/navigation"
// Define allowed roles
import { UserCredential } from "firebase/auth";
type Role = "user" | "admin" | "superadmin" | "judge" | null


interface AuthContextType {
  user: User | null;
  role: string | null; // Add role to context
  signUp: (email: string, password: string, fullName: string, institution: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>; // Added logout
  signInWithGoogle: () => Promise<UserCredential>; // Added Google sign-in
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        const tokenResult = await currentUser.getIdTokenResult(true)
        const tokenRole = tokenResult.claims.role

        setRole(typeof tokenRole === "string" ? (tokenRole as Role) : null)
      } else {
        setRole(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string, institution: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send verification email
    // await sendEmailVerification(user);
    await sendEmailVerificationFromBackend(user.email!, user.uid); // user.email! asserts it's not null

    // Create user document with isVerified flag
    await setDoc(doc(collection(db, "users"), user.uid), {
      fullName,
      email,
      institution,
      createdAt: new Date().toISOString()
    });
  };

  async function sendEmailVerificationFromBackend(email: string, uid: string): Promise<boolean> {
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/send-verification-email`;
    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, uid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send verification email from backend.');
      }

      const result = await response.json();
      console.log('Backend response for email verification:', result.message);
      return true; // Successfully sent
    } catch (error: any) {
      console.error('Error requesting email verification from backend:', error.message);
      alert(`Failed to send verification email: ${error.message}`);
      // Optionally, handle specific errors (e.g., if already verified)
      return false; // Failed to send
    }
  }


  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // console.log("user verification status", user.emailVerified)

    if (!user.emailVerified) {
      await auth.signOut();
      throw new Error("Please verify your email before signing in.");
    }
  };

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setRole(null)
    router.push("/")
  }

  // Google sign-in function
  const signInWithGoogle = async (): Promise<UserCredential> => {
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
      return result; // Explicitly return UserCredential
    } catch (error: any) {
      let errorMessage = 'Failed to sign in with Google.';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Google sign-in popup was closed.';
      }
      throw new Error(errorMessage);
    }
  };
  // const signInWithGoogle = async () => {
  //   const provider = new GoogleAuthProvider();
  //   try {
  //     const result = await signInWithPopup(auth, provider);
  //     const user = result.user;
  //     // Optionally, create user doc in Firestore if new
  //     const usersCollectionRef = collection(db, "users");
  //     await setDoc(doc(usersCollectionRef, user.uid), {
  //       fullName: user.displayName || '',
  //       email: user.email || '',
  //       institution: '', // Google doesn't provide institution by default
  //       createdAt: new Date().toISOString(),
  //     }, { merge: true });
  //   } catch (error: any) {
  //     let errorMessage = 'Failed to sign in with Google.';
  //     if (error.code === 'auth/popup-closed-by-user') {
  //       errorMessage = 'Google sign-in popup was closed.';
  //     }
  //     throw new Error(errorMessage);
  //   }
  // };

  return (
    <AuthContext.Provider
      value={{ user, role, signUp, signIn, logout, signInWithGoogle, loading }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
