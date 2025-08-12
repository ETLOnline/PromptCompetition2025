import { collection, doc, writeBatch, getDocs, deleteField, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase" // Adjust import path as needed
import type { Challenge, User } from "@/types/judging"

export interface ManualAssignment {
  challengeId: string
  judgeId: string
  count: number
}

/**
 * Reset all judge distributions for a competition
 * Removes all judge assignments and cleans up user index entries
 */
export async function resetDistributionForCompetition(
    competitionId: string,
    judges: User[],
    challenges: Challenge[],
    ): Promise<void> {
    try {
        // 1. Remove competition entry from /userIndex/{judgeId} documents
        const userIndexBatch = writeBatch(db)
        
        for (const judge of judges) {
            const userIndexDocRef = doc(db, "userIndex", judge.id)
            userIndexBatch.update(userIndexDocRef, {
                [`competitionIds.${competitionId}`]: deleteField(),
            })
        }
        await userIndexBatch.commit()

        // 2. Remove all judge documents from challenge subcollections
        // We need to fetch and delete the documents outside of the batch first
        const deletePromises: Promise<void>[] = []
        
        for (const challenge of challenges) {
        const judgesCollectionRef = collection( db, "competitions", competitionId, 
            "challenges", challenge.id, "judges" )

        const judgeDocsSnap = await getDocs(judgesCollectionRef)
        
        // Create individual delete operations (not in batch to avoid conflicts)
        judgeDocsSnap.forEach((judgeDoc) => {
            deletePromises.push(deleteDoc(judgeDoc.ref))
        })
        }

        // Execute all judge document deletions
        if (deletePromises.length > 0) {
        await Promise.all(deletePromises)
        console.log(`Deleted ${deletePromises.length} judge assignments`)
        }

    } catch (error) {
        throw new Error(`Failed to reset judge distribution: ${error}`)
    }
}


/**
 * Get current judge assignments for a competition
 */
export async function getJudgeAssignments(
  competitionId: string,
  challenges: Challenge[],
): Promise<Record<string, Record<string, number>>> {
  const assignments: Record<string, Record<string, number>> = {}

  try {
    for (const challenge of challenges) {
      assignments[challenge.id] = {}

      const judgesCollectionRef = collection(db, "competitions", competitionId, "challenges", challenge.id, "judges")

      const judgeDocsSnap = await getDocs(judgesCollectionRef)
      judgeDocsSnap.forEach((doc) => {
        const data = doc.data()
        assignments[challenge.id][data.judgeId] = data.assignedCount || 0
      })
    }

    return assignments
  } catch (error) {
    console.error("Error getting judge assignments:", error)
    throw new Error("Failed to get judge assignments")
  }
}

/**
 * Check if a competition has existing judge distributions
 */
export async function hasExistingDistribution(competitionId: string, challenges: Challenge[]): Promise<boolean> {
  try {
    for (const challenge of challenges) {
      const judgesCollectionRef = collection(db, "competitions", competitionId, "challenges", challenge.id, "judges")

      const judgeDocsSnap = await getDocs(judgesCollectionRef)
      if (!judgeDocsSnap.empty) {
        return true
      }
    }
    return false
  } catch (error) {
    console.error("Error checking existing distribution:", error)
    return false
  }
}
