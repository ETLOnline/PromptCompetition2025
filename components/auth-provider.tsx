"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

type Role = "participant" | "admin" | "superadmin" | "judge" | null

interface AuthContextType {
  user: any | null
  fullName: string | null
  role: Role
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut } = useClerk()
  
  const [fullName, setFullName] = useState<string | null>(null)
  const [role, setRole] = useState<Role>(null)

  useEffect(() => {
    if (isLoaded && clerkUser) {
      // Get full name from Clerk user
      setFullName(clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null)
      
      // Get role from Clerk public metadata
      const publicMetadata = clerkUser.publicMetadata as { role?: Role } | undefined
      setRole(publicMetadata?.role || null)
    } else if (isLoaded && !clerkUser) {
      setFullName(null)
      setRole(null)
    }
  }, [isLoaded, clerkUser])

  const logout = async () => {
    await signOut()
    setFullName(null)
    setRole(null)
    router.push("/")
  }

  return (
    <AuthContext.Provider
      value={{ 
        user: clerkUser, 
        fullName, 
        role, 
        logout, 
        loading: !isLoaded 
      }}
    >
      {children}
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