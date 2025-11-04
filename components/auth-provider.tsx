"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  UserCredential,
} from "firebase/auth"

import { doc, setDoc, collection, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

type Role = "user" | "admin" | "superadmin" | "judge" | null

interface AuthContextType {
  user: User | null
  fullName: string | null
  role: string | null;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    institution: string,
    extra: {
      gender: "male" | "female" | "prefer_not_to_say"
      city: string
      province: string
      majors: string
      category: "Uni Students" | "Professional"
      linkedin?: string
      bio?: string
      consent: boolean
    }
  ) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signInWithGoogle: () => Promise<UserCredential>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState<string | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const data = userSnap.data()
        setFullName(data.fullName || null)
        // setRole(data.role || "user")
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        // Try to get role from token claims first
        try {
          const tokenResult = await currentUser.getIdTokenResult(true)
          const tokenRole = tokenResult.claims.role
          setRole(typeof tokenRole === "string" ? (tokenRole as Role) : null)
        } catch (error) {
          console.error("Error getting token role:", error)
        }

        // Fetch full profile from Firestore (fullName and role from db)
        await fetchUserProfile(currentUser.uid)
      } else {
        setFullName(null)
        setRole(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    institution: string,
    extra: {
      gender: "male" | "female" | "prefer_not_to_say"
      city: string
      province: string
      majors: string
      category: "Uni Students" | "Professional"
      linkedin?: string
      bio?: string
      consent: boolean
    }
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Send verification email
    await sendEmailVerificationFromBackend(user.email!, user.uid)

    // Create user document with fullName and institution
    await setDoc(doc(collection(db, "users"), user.uid), {
      fullName,
      email,
      institution,
      gender: extra.gender,
      city: extra.city,
      province: extra.province,
      majors: extra.majors,
      category: extra.category,
      linkedin: extra.linkedin || "",
      bio: extra.bio || "",
      consent: !!extra.consent,
      createdAt: new Date().toISOString(),
    })

    // Cache the full name immediately
    setFullName(fullName)
  }

  async function sendEmailVerificationFromBackend(email: string, uid: string): Promise<boolean> {
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/send-verification-email`
    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, uid }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to send verification email from backend.")
      }

      const result = await response.json()
      console.log("Backend response for email verification:", result.message)
      return true
    } catch (error: any) {
      console.error("Error requesting email verification from backend:", error.message)
      // alert(`Failed to send verification email: ${error.message}`)
      return false
    }
  }

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    if (!user.emailVerified) {
      await auth.signOut()
      throw new Error("Please verify your email before signing in.")
    }

    // Fetch user profile on sign in
    await fetchUserProfile(user.uid)
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setFullName(null)
    setRole(null)
    router.push("/")
  }

  const signInWithGoogle = async (): Promise<UserCredential> => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Create or update user doc in Firestore
      const usersCollectionRef = collection(db, "users")
      await setDoc(
        doc(usersCollectionRef, user.uid),
        {
          fullName: user.displayName || "",
          email: user.email || "",
          institution: "", // Google doesn't provide institution by default
          gender: "prefer_not_to_say",
          city: "",
          province: "",
          majors: "",
          category: "Uni Students",
          linkedin: user.providerData?.[0]?.providerId?.includes("google") ? "" : "",
          bio: "",
          consent: false,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      )

      // Cache the full name immediately
      setFullName(user.displayName || "")

      return result
    } catch (error: any) {
      let errorMessage = "Failed to sign in with Google."
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Google sign-in popup was closed."
      }
      throw new Error(errorMessage)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, fullName, role, signUp, signIn, logout, signInWithGoogle, loading }}
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