import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, onSnapshot, Query, doc, getDoc } from "firebase/firestore"

export interface DailyChallengeLeaderboardEntry {
  rank: number
  userId: string
  userFullName: string
  totalVotes: number
  submissionText: string
  timestamp: any
}

interface UseDailyChallengeLeaderboardProps {
  challengeId: string
  topN?: number
}

/**
 * Custom hook to fetch and listen to Daily Challenge leaderboard in real-time
 * Efficiently queries Firestore with proper indexing
 * 
 * - Orders by totalVotes (descending)
 * - Limits to top N submissions (default 10)
 * - Uses real-time listener for live updates
 * - Fetches user names from users collection
 */
export const useDailyChallengeLeaderboard = ({
  challengeId,
  topN = 10,
}: UseDailyChallengeLeaderboardProps) => {
  const [leaderboard, setLeaderboard] = useState<DailyChallengeLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!challengeId) {
      setError("Challenge ID is required")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const submissionsRef = collection(db, "dailychallenge", challengeId, "submissions")
      
      // Efficient query: Order by totalVotes (descending) and limit to top N
      // Note: Requires Firestore composite index on (totalVotes descending, __name__)
      const q = query(
        submissionsRef,
        orderBy("totalVotes", "desc"),
        limit(topN)
      ) as Query

      // Real-time listener for live leaderboard updates
      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          try {
            const entries: DailyChallengeLeaderboardEntry[] = []
            let rank = 1

            // Fetch user names for all submissions in parallel
            const userFetchPromises = snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data()
              const userId = data.userId || docSnap.id

              // Fetch user's full name from users collection
              let userFullName = "Anonymous User"
              try {
                const userDoc = await getDoc(doc(db, "users", userId))
                if (userDoc.exists()) {
                  userFullName = userDoc.data()?.fullName || "Anonymous User"
                }
              } catch (err) {
                console.error(`Error fetching user ${userId}:`, err)
              }

              return {
                rank: 0, // Will be set after sorting
                userId: userId,
                userFullName: userFullName,
                totalVotes: data.totalVotes || 0,
                submissionText: data.submissionText || "",
                timestamp: data.timestamp,
              }
            })

            // Wait for all user name fetches to complete
            const resolvedEntries = await Promise.all(userFetchPromises)

            // Add ranks
            resolvedEntries.forEach((entry, index) => {
              entry.rank = index + 1
            })

            setLeaderboard(resolvedEntries)
            setError(null)
            setLoading(false)
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to process leaderboard data"
            console.error("Error processing leaderboard:", err)
            setError(errorMessage)
            setLoading(false)
          }
        },
        (err) => {
          const errorMessage = err instanceof Error ? err.message : "Failed to fetch leaderboard"
          console.error("Firestore listener error:", err)
          setError(errorMessage)
          setLoading(false)
        }
      )

      // Cleanup listener on unmount
      return () => unsubscribe()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      console.error("Hook error:", err)
      setError(errorMessage)
      setLoading(false)
    }
  }, [challengeId, topN])

  return { leaderboard, loading, error }
}
