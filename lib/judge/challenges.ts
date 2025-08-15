import type { Challenge } from "@/types/judge-submission"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function fetchChallenge(competitionId: string, challengeId: string): Promise<Challenge | null> {
  try {
    const challengeDocRef = doc(db, "competitions", competitionId, "challenges", challengeId)
    const challengeDoc = await getDoc(challengeDocRef)

    if (!challengeDoc.exists()) {
      return null
    }

    const data = challengeDoc.data()
    return {
      id: challengeDoc.id,
      title: data.title,
      description: data.description,
      problemStatement: data.problemStatement || data.description,
      guidelines: data.guidelines,
      rubric: data.rubric || [],
      maxScore: data.maxScore || 100,
      competitionId: data.competitionId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  } catch (error) {
    console.error("Error fetching challenge:", error)
    throw new Error("Failed to fetch challenge")
  }
}
