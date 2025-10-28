//competition-cache-context.tsx
"use client"

import { createContext, ReactNode } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"


interface CompetitionData {
  title: string
  startDeadline: Date
  endDeadline: Date
  ChallengeCount?: number
}




interface CompetitionCacheContextType {
  getCompetitionMetadata: (competitionId: string) => Promise<CompetitionData | null>
}


export const CompetitionCacheContext = createContext<CompetitionCacheContextType>({
  getCompetitionMetadata: async () => null,
})


export const CompetitionCacheProvider = ({ children }: { children: ReactNode }) => {
  const getCompetitionMetadata = async (competitionId: string): Promise<CompetitionData | null> => {
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

      return metadata
    } catch (error) {
      console.error("Error fetching competition metadata:", error)
      throw error
    }
  }

  return (
    <CompetitionCacheContext.Provider value={{ getCompetitionMetadata }}>
      {children}
    </CompetitionCacheContext.Provider>
  )
}
