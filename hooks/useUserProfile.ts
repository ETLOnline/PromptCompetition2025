"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { db } from "@/lib/firebase"
import { doc, getDoc, onSnapshot } from "firebase/firestore"
import type { UserDocument } from "@/types/auth"

interface UseUserProfileReturn {
  userProfile: UserDocument | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and cache user profile from Firestore
 * Uses real-time updates when possible and falls back to one-time fetch
 */
export function useUserProfile(): UseUserProfileReturn {
  const { user: clerkUser, isLoaded } = useUser()
  const [userProfile, setUserProfile] = useState<UserDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserProfile = async (uid: string) => {
    try {
      setError(null)
      const userDoc = await getDoc(doc(db, "users", uid))
      
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserDocument)
      } else {
        setUserProfile(null)
      }
    } catch (err) {
      console.error("Error fetching user profile:", err)
      setError("Failed to load user profile")
      setUserProfile(null)
    }
  }

  const refetch = async () => {
    if (!clerkUser?.id) return
    setLoading(true)
    await fetchUserProfile(clerkUser.id)
    setLoading(false)
  }

  useEffect(() => {
    if (!isLoaded) return

    if (!clerkUser) {
      setUserProfile(null)
      setLoading(false)
      return
    }

    const uid = clerkUser.id
    let unsubscribe: (() => void) | null = null

    const setupProfileListener = async () => {
      try {
        setError(null)
        
        // Set up real-time listener for user profile
        unsubscribe = onSnapshot(
          doc(db, "users", uid),
          (doc) => {
            if (doc.exists()) {
              setUserProfile(doc.data() as UserDocument)
            } else {
              setUserProfile(null)
            }
            setLoading(false)
          },
          (err) => {
            console.error("Error listening to user profile:", err)
            setError("Failed to load user profile")
            setLoading(false)
            
            // Fallback to one-time fetch
            fetchUserProfile(uid)
          }
        )
      } catch (err) {
        console.error("Error setting up profile listener:", err)
        setError("Failed to load user profile")
        setLoading(false)
        
        // Fallback to one-time fetch
        await fetchUserProfile(uid)
      }
    }

    setupProfileListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [isLoaded, clerkUser])

  return {
    userProfile,
    loading,
    error,
    refetch
  }
}