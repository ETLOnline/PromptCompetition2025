"use client"

import React, { createContext, useContext } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useUserProfile } from "@/hooks/useUserProfile"
import type { Role } from "@/types/auth"

interface AuthContextType {
  user: any | null
  fullName: string | null
  role: Role | null
  logout: () => Promise<void>
  loading: boolean
  profileError: string | null
  refetchProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut } = useClerk()
  
  // Use new Firestore-based user profile hook
  const { userProfile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useUserProfile()

  const logout = async () => {
    await signOut()
    router.push("/")
  }

  // Determine loading state - wait for both Clerk and Firestore
  const loading = !isLoaded || profileLoading

  return (
    <AuthContext.Provider
      value={{ 
        user: clerkUser, 
        fullName: userProfile?.fullName || null,
        role: userProfile?.role || null,
        logout, 
        loading,
        profileError,
        refetchProfile
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