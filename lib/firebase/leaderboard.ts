import { db } from "@/lib/firebase"
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  startAfter, 
  limit, 
  DocumentSnapshot,
  where,
  Query,
  DocumentData
} from "firebase/firestore"

export type LeaderboardEntry = {
  id: string
  fullName: string
  email: string
  rank: number
  totalScore: number
}

export async function getLeaderboardEntries(
  lastDoc?: DocumentSnapshot,
  pageSize: number = 25
): Promise<{ entries: LeaderboardEntry[]; lastDoc: DocumentSnapshot | null }> {
  try {
    let q: Query<DocumentData> = query(
      collection(db, "leaderboard"), 
      orderBy("rank", "asc"), 
      limit(pageSize)
    )

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const snapshot = await getDocs(q)

    const entries: LeaderboardEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        fullName: data.fullName || "Unknown",
        email: data.email || "No email",
        rank: data.rank || 0,
        totalScore: data.totalScore || 0,
      }
    })

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null

    return { entries, lastDoc: lastVisible }
  } catch (error) {
    console.error("Error fetching leaderboard entries:", error)
    return { entries: [], lastDoc: null }
  }
}

// Optional: Add a function to get total count
export async function getLeaderboardCount(): Promise<number> {
  try {
    const snapshot = await getDocs(collection(db, "leaderboard"))
    return snapshot.size
  } catch (error) {
    console.error("Error getting leaderboard count:", error)
    return 0
  }
}

// Optional: Search function for server-side filtering (if needed for performance)
export async function searchLeaderboardEntries(
  searchTerm: string,
  lastDoc?: DocumentSnapshot,
  pageSize: number = 25
): Promise<{ entries: LeaderboardEntry[]; lastDoc: DocumentSnapshot | null }> {
  try {
    // Note: Firestore doesn't support full-text search well
    // This is a basic implementation - consider using Algolia or similar for better search
    let q: Query<DocumentData> = query(
      collection(db, "leaderboard"),
      orderBy("fullName"),
      limit(pageSize)
    )

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const snapshot = await getDocs(q)

    // Filter results on client side (not ideal for large datasets)
    const allEntries: LeaderboardEntry[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        fullName: data.fullName || "Unknown",
        email: data.email || "No email",
        rank: data.rank || 0,
        totalScore: data.totalScore || 0,
      }
    })

    const searchLower = searchTerm.toLowerCase()
    const filteredEntries = allEntries.filter(entry =>
      entry.fullName.toLowerCase().includes(searchLower) ||
      entry.email.toLowerCase().includes(searchLower)
    )

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null

    return { entries: filteredEntries, lastDoc: lastVisible }
  } catch (error) {
    console.error("Error searching leaderboard entries:", error)
    return { entries: [], lastDoc: null }
  }
}