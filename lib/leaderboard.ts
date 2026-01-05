// Backend functions for competition leaderboard
import { db } from './firebase'
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore"

import type { DisplayEntry, Competition, LeaderboardEntry } from "@/types/leaderboard"


/**
 * Enhanced error handling wrapper for Firebase operations
 */
async function withErrorHandling<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof Error) {
      // Enhance error messages for common Firebase issues
      if (error.message.includes("permission-denied")) {
        throw new Error(`Permission denied: Check your Firebase security rules for ${operationName}`)
      }
      if (error.message.includes("not-found")) {
        throw new Error(`Data not found: The requested ${operationName} data does not exist`)
      }
      if (error.message.includes("unavailable")) {
        throw new Error(`Service unavailable: Firebase is temporarily unavailable for ${operationName}`)
      }
    }

    throw error
  }
}

/**
 * Fetch the most recent competition where AllJudgeEvaluated === true
 */
export async function getLatestCompetition(): Promise<Competition> {
    return withErrorHandling(async () => {
        const competitionsRef = collection(db, "competitions")
        const q = query(competitionsRef, where("AllJudgeEvaluated", "==", true), 
                    orderBy("createdAt", "desc"), limit(1))

        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
        throw new Error(
            "No completed competitions found. Please ensure at least one competition has AllJudgeEvaluated set to true.",
        )
        }

        const doc = querySnapshot.docs[0]
        const data = doc.data()

        return {
            competitionId: doc.id,
            title: data.title || "Untitled Competition",
            TopN: data.TopN,
            AllJudgeEvaluated: data.AllJudgeEvaluated,
        }
    }, "getLatestCompetition")
}

/**
 * Fetch leaderboard data for a specific competition
 */
export async function getLeaderboard(competitionId: string): Promise<LeaderboardEntry[]> {
  try {
    const leaderboardRef = collection(db, "competitions", competitionId, "leaderboard")
    const querySnapshot = await getDocs(leaderboardRef)

    const leaderboardData: LeaderboardEntry[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      leaderboardData.push({
        participantId: doc.id,
        fullName: data.fullName,
        llmScore: data.totalScore || 0,
      })
    })

    // Sort by LLM score descending for initial ranking
    return leaderboardData.sort((a, b) => b.llmScore - a.llmScore)
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    throw error
  }
}

/**
 * Fetch judge evaluations for the top N participants
 */
export async function getJudgeScores(competitionId: string, topN: number): Promise<Map<string, number>> {
  try {
    const judgeScores = new Map<string, number>()

    // Get leaderboard to identify top N participants
    const leaderboard = await getLeaderboard(competitionId)
    const topParticipants = leaderboard.slice(0, topN)

    // Fetch judge scores for each top participant
    for (const participant of topParticipants) {
      try {
        const judgeEvalRef = doc(db, "competitions", competitionId, "judgeEvaluations", participant.participantId)
        const judgeEvalDoc = await getDoc(judgeEvalRef)

        if (judgeEvalDoc.exists()) {
          const data = judgeEvalDoc.data()
          judgeScores.set(participant.participantId, data.totalScore || 0)
        }
      } catch (error) {
        console.warn(`No judge score found for participant ${participant.participantId}`)
        // Continue with other participants even if one fails
      }
    }

    return judgeScores
  } catch (error) {
    console.error("Error fetching judge scores:", error)
    throw error
  }
}

/**
 * Calculate final scores and prepare display data
 */
export function calculateFinalScores(
  leaderboardData: LeaderboardEntry[],
  judgeScores: Map<string, number>,
  topN: number,
): DisplayEntry[] {
  // Calculate final scores
  const entriesWithFinalScores = leaderboardData.map((entry) => {
    const judgeScore = judgeScores.get(entry.participantId) || null
    const finalScore = entry.llmScore + (judgeScore || 0)

    return {
      ...entry,
      judgeScore,
      finalScore,
    }
  })

  // Sort by final score descending
  entriesWithFinalScores.sort((a, b) => b.finalScore - a.finalScore)

  // Add ranks and format for display
  return entriesWithFinalScores.map((entry, index) => ({
    rank: index + 1,
    name: entry.fullName,
    llmScore: entry.llmScore,
    judgeScore: entry.judgeScore,
    finalScore: entry.finalScore,
  }))
}

/**
 * Check if all judge evaluations are complete for top N participants
 */
export async function areJudgeEvaluationsComplete(competitionId: string, topN: number): Promise<boolean> {
  try {
    const judgeScores = await getJudgeScores(competitionId, topN)
    return judgeScores.size === topN
  } catch (error) {
    console.error("Error checking judge evaluation status:", error)
    return false
  }
}
