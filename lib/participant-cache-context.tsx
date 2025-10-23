//participant-cache-context.tsx
"use client"

import { createContext, useState, ReactNode } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ParticipantCache {
  [key: string]: {
    exists: boolean
    timestamp: number
  }
}

interface ParticipantData {
  exists: boolean
  submissions?: number
  completedChallenges?: string[]
}

interface ParticipantCacheContextType {
  cache: ParticipantCache
  checkParticipant: (competitionId: string, userId: string) => Promise<boolean>
  checkParticipantAndGetData: (competitionId: string, userId: string) => Promise<ParticipantData>
  clearCache: (competitionId?: string, userId?: string) => void
  clearCompetitionCache: (competitionId: string) => void
}

export const ParticipantCacheContext = createContext<ParticipantCacheContextType>({
  cache: {},
  checkParticipant: async () => false,
  checkParticipantAndGetData: async () => ({ exists: false }),
  clearCache: () => {},
  clearCompetitionCache: () => {},
})

export const ParticipantCacheProvider = ({ children }: { children: ReactNode }) => {
  const [cache, setCache] = useState<ParticipantCache>({})
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const checkParticipant = async (competitionId: string, userId: string): Promise<boolean> => {
    const cacheKey = `${competitionId}-${userId}`
    const cached = cache[cacheKey]

    // Return cached result if valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("Using cached participant status for:", cacheKey)
      return cached.exists
    }

    // Fetch from Firestore
    try {
      console.log("Fetching participant status from Firestore for:", cacheKey)
      const participantRef = doc(db, "competitions", competitionId, "participants", userId)
      const participantSnap = await getDoc(participantRef)
      const exists = participantSnap.exists()

      // Update cache
      setCache((prev) => ({
        ...prev,
        [cacheKey]: { exists, timestamp: Date.now() },
      }))

      return exists
    } catch (error) {
      console.error("Error checking participant:", error)
      throw error
    }
  }

  const checkParticipantAndGetData = async (competitionId: string, userId: string): Promise<ParticipantData> => {
    const cacheKey = `${competitionId}-${userId}`
    const cached = cache[cacheKey]

    // Return cached result if valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("Using cached participant data for:", cacheKey)
      return { exists: cached.exists }
    }

    // Fetch from Firestore
    try {
      console.log("Fetching participant data from Firestore for:", cacheKey)
      const participantRef = doc(db, "competitions", competitionId, "participants", userId)
      const participantSnap = await getDoc(participantRef)
      const exists = participantSnap.exists()

      let participantData: ParticipantData = { exists }

      if (exists && participantSnap.exists()) {
        const data = participantSnap.data()
        participantData = {
          exists: true,
          submissions: data.challengesCompleted || 0,
          completedChallenges: data.completedChallenges || []
        }
      }

      // Update cache
      setCache((prev) => ({
        ...prev,
        [cacheKey]: { exists, timestamp: Date.now() },
      }))

      return participantData
    } catch (error) {
      console.error("Error checking participant and getting data:", error)
      throw error
    }
  }

  const clearCache = (competitionId?: string, userId?: string) => {
    if (competitionId && userId) {
      // Clear specific entry
      const cacheKey = `${competitionId}-${userId}`
      console.log("Clearing cache for:", cacheKey)
      setCache((prev) => {
        const newCache = { ...prev }
        delete newCache[cacheKey]
        return newCache
      })
    } else {
      // Clear all cache
      console.log("Clearing all participant cache")
      setCache({})
    }
  }

  const clearCompetitionCache = (competitionId: string) => {
    // Clear cache for all users in a specific competition
    console.log("Clearing all cache for competition:", competitionId)
    setCache((prev) => {
      const newCache = { ...prev }
      Object.keys(newCache).forEach((key) => {
        if (key.startsWith(`${competitionId}-`)) {
          delete newCache[key]
        }
      })
      return newCache
    })
  }

  return (
    <ParticipantCacheContext.Provider value={{ cache, checkParticipant, checkParticipantAndGetData, clearCache, clearCompetitionCache }}>
      {children}
    </ParticipantCacheContext.Provider>
  )
}