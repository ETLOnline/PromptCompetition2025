import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"

export type LeaderboardEntry = {
  id: string
  fullName: string
  email: string
  rank: number
  totalScore: number
}

export async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const q = query(collection(db, "leaderboard"), orderBy("rank"))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(doc => {
    const data = doc.data() as Omit<LeaderboardEntry, "id">
    return {
      id: doc.id,
      ...data,
    }
  })
}
