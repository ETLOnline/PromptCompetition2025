import "@/lib/firebase" // ensure Firebase is initialized (side-effect import)
import { getFirestore, doc, getDoc } from "firebase/firestore"

// Updated type: competitionId maps to an object where each challengeId maps to number of assigned submissions
export type AssignedMap = Record<string, Record<string, number>>

interface UserIndexDoc {
  judgeId?: string
  competitionIds?: AssignedMap
}

/**
 * Retrieves the assigned competitions and challenges for a judge.
 * Reads: userIndex/{judgeId}
 * Returns the competitionIds field or an empty object.
 */
export async function getAssignedCompetitions(judgeId: string): Promise<AssignedMap> {
  if (!judgeId) return {}
  try {
    const db = getFirestore()
    const ref = doc(db, "userIndex", judgeId)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      return {}
    }

    const data = snap.data() as UserIndexDoc
    return (data?.competitionIds ?? {}) as AssignedMap
  } catch (err) {
    console.error("getAssignedCompetitions error:", err)
    throw err
  }
}
