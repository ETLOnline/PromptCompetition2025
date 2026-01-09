//participant-cache-context.tsx
"use client"

import { createContext, ReactNode } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"


interface ParticipantData {
  exists: boolean
  submissions?: number
  completedChallenges?: string[]
}


interface ParticipantCacheContextType {
  checkParticipant: (competitionId: string, userId: string) => Promise<boolean>
  checkParticipantAndGetData: (competitionId: string, userId: string) => Promise<ParticipantData>
}


export const ParticipantCacheContext = createContext<ParticipantCacheContextType>({
  checkParticipant: async () => false,
  checkParticipantAndGetData: async () => ({ exists: false }),
})


export const ParticipantCacheProvider = ({ children }: { children: ReactNode }) => {
  const checkParticipant = async (competitionId: string, userId: string): Promise<boolean> => {
    try {
      // console.log("Fetching participant status from Firestore for:", `${competitionId}-${userId}`)
      const participantRef = doc(db, "competitions", competitionId, "participants", userId)
      const participantSnap = await getDoc(participantRef)
      return participantSnap.exists()
    } catch (error) {
      console.error("Error checking participant:", error)
      throw error
    }
  }

  const checkParticipantAndGetData = async (competitionId: string, userId: string): Promise<ParticipantData> => {
    try {
      // console.log("Fetching participant data from Firestore for:", `${competitionId}-${userId}`)
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

      return participantData
    } catch (error) {
      console.error("Error checking participant and getting data:", error)
      throw error
    }
  }

  return (
    <ParticipantCacheContext.Provider value={{ checkParticipant, checkParticipantAndGetData }}>
      {children}
    </ParticipantCacheContext.Provider>
  )
}