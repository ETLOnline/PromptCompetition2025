import { db } from "@/lib/firebase"
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  startAfter, 
  limit, 
  DocumentSnapshot,
  Query,
  DocumentData
} from "firebase/firestore"

export type Level2LeaderboardEntry = {
  id: string
  fullName: string
  email: string
  rank: number
  finalScore: number
  batchId?: string
  participantId: string
  challengeScores?: Record<string, {
    averageScore: number
    judgeCount: number
  }>
}

export async function getLevel2LeaderboardEntries(
  competitionId: string,
  lastDoc?: DocumentSnapshot,
  pageSize: number = 25
): Promise<{ entries: Level2LeaderboardEntry[]; lastDoc: DocumentSnapshot | null }> {
  try {
    let q: Query<DocumentData> = query(
      collection(db, "competitions", competitionId, "finalLeaderboard"),
      orderBy("rank", "asc"),
      limit(pageSize)
    )

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const snapshot = await getDocs(q)
    const entries: Level2LeaderboardEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        fullName: data.fullName || "Unknown",
        email: data.email || "No email",
        rank: data.rank || 0,
        finalScore: data.finalScore || 0,
        batchId: data.batchId,
        participantId: data.participantId,
        challengeScores: data.challengeScores
      }
    })

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null
    return { entries, lastDoc: lastVisible }
  } catch (error) {
    console.error("Error fetching Level 2 leaderboard entries:", error)
    return { entries: [], lastDoc: null }
  }
}

export async function getLevel2LeaderboardCount(competitionId: string): Promise<number> {
  try {
    const snapshot = await getDocs(collection(db, "competitions", competitionId, "finalLeaderboard"))
    return snapshot.size
  } catch (error) {
    console.error("Error getting Level 2 leaderboard count:", error)
    return 0
  }
}
