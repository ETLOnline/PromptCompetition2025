"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth"
import { doc, setDoc, collection } from "firebase/firestore"
import { useRouter } from "next/navigation"
// Define allowed roles
type Role = "user" | "admin" | "superadmin" | "judge" | null

interface AuthContextType {
  user: User | null
  role: Role
  signUp: (email: string, password: string, fullName: string, institution: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  loading: boolean
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
        console.log("🧠 Token claims:", tokenResult.claims);

        setRole(typeof tokenRole === "string" ? (tokenRole as Role) : null)

        // console.log("🎯 Logged in with role:", tokenRole)
      } else {
        setRole(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string, institution: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    await setDoc(doc(collection(db, "users"), user.uid), {
      fullName,
      email,
      institution,
      createdAt: new Date().toISOString(),
    })
  }

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setRole(null)
    router.push("/")
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    await setDoc(
      doc(collection(db, "users"), user.uid),
      {
        fullName: user.displayName || "",
        email: user.email || "",
        institution: "",
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    )
  }

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
