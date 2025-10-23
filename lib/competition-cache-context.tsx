//competition-cache-context.tsx
"use client"

import { createContext, useState, ReactNode } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface CompetitionData {
  title: string
  startDeadline: Date
  endDeadline: Date
  ChallengeCount?: number
}

interface CompetitionCache {
  [key: string]: {
    data: CompetitionData
    timestamp: number
  }
}

interface CompetitionCacheContextType {
  cache: CompetitionCache
  getCompetitionMetadata: (competitionId: string) => Promise<CompetitionData | null>
  clearCache: (competitionId?: string) => void
}

export const CompetitionCacheContext = createContext<CompetitionCacheContextType>({
  cache: {},
  getCompetitionMetadata: async () => null,
  clearCache: () => {},
})

export const CompetitionCacheProvider = ({ children }: { children: ReactNode }) => {
  const [cache, setCache] = useState<CompetitionCache>({})
  const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

  const getCompetitionMetadata = async (competitionId: string): Promise<CompetitionData | null> => {
    const cached = cache[competitionId]

    // Return cached result if valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("Using cached competition metadata for:", competitionId)
      return cached.data
    }

    // Fetch from Firestore
    try {
      console.log("Fetching competition metadata from Firestore for:", competitionId)
      const competitionRef = doc(db, "competitions", competitionId)
      const competitionSnap = await getDoc(competitionRef)
      
      if (!competitionSnap.exists()) {
        console.log("Competition document not found for:", competitionId)
        return null
      }

      const competitionData = competitionSnap.data()
      const metadata: CompetitionData = {
        title: competitionData.title || "",
        startDeadline: competitionData.startDeadline?.toDate?.() ?? new Date(competitionData.startDeadline),
        endDeadline: competitionData.endDeadline?.toDate?.() ?? new Date(competitionData.endDeadline),
        ChallengeCount: competitionData.ChallengeCount
      }

      // Update cache
      setCache((prev) => ({
        ...prev,
        [competitionId]: { data: metadata, timestamp: Date.now() },
      }))

      return metadata
    } catch (error) {
      console.error("Error fetching competition metadata:", error)
      throw error
    }
  }

  const clearCache = (competitionId?: string) => {
    if (competitionId) {
      // Clear specific entry
      console.log("Clearing competition cache for:", competitionId)
      setCache((prev) => {
        const newCache = { ...prev }
        delete newCache[competitionId]
        return newCache
      })
    } else {
      // Clear all cache
      console.log("Clearing all competition cache")
      setCache({})
    }
  }

  return (
    <CompetitionCacheContext.Provider value={{ cache, getCompetitionMetadata, clearCache }}>
      {children}
    </CompetitionCacheContext.Provider>
  )
}
