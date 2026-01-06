// app/participants/competitions/[id]/results/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { fetchCompetitionResults } from "@/lib/api"
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import ResultsLevel1 from "./ResultsLevel1"
import ResultsLevel2 from "./ResultsLevel2"
import ResultsCustom from "./ResultsCustom"

interface Submission {
  id?: string
  challengeId: string
  finalScore: number | null
  llmScores?: Record<
    string,
    {
      description: string
      finalScore: number | null
      scores: Record<string, number>
    }
  > | null
  judgeScores?: Record<string, any> | null
  judgeScore?: Record<string, any> | null
  submittedAt?: any
  status?: "pending" | "evaluated" | "scored" | "failed"
  rank?: number
  promptText?: string
}

interface Competition {
  id: string
  title: string
  status: string
  endDeadline: any
  level?: string
}

interface UserOverallStats {
  finalScore: number | null
  llmScore: number | null
  judgeScore: number | null
  rank: number | null
  weightedFinalScore?: number | null
  challengeScores?: Record<string, { averageScore: number; judgeCount: number }>
}

export default function ResultsPage() {
  const { competitionId } = useParams() 
  const router = useRouter()
  const { getToken, isLoaded, isSignedIn, userId } = useAuth()
  
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [competitionLevel, setCompetitionLevel] = useState<string | null>(null)
  const [userOverallStats, setUserOverallStats] = useState<UserOverallStats | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn || !userId) {
      router.push("/sign-in")
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!competitionId || typeof competitionId !== "string") { 
          throw new Error("Invalid competition ID")
        }

        // Fetch competition details to get level
        const competitionRef = doc(db, "competitions", competitionId)
        const competitionSnap = await getDoc(competitionRef)
        
        if (!competitionSnap.exists()) {
          throw new Error("Competition not found")
        }

        const competitionData = competitionSnap.data()
        const level = competitionData?.level || "custom"
        setCompetitionLevel(level)

        // Fetch backend API for submissions
        const { competition, submissions } = await fetchCompetitionResults(competitionId, getToken)

        setCompetition({ ...competition, level })
        setSubmissions(submissions)
        console.log("Fetched submissions:", submissions)
        console.log("Competition level:", level)

        // Fetch user overall stats from finalLeaderboard
        if (userId) {
          try {
            const leaderboardRef = doc(db, "competitions", competitionId, "finalleaderboard", userId)
            const leaderboardSnap = await getDoc(leaderboardRef)
            if (leaderboardSnap.exists()) {
              const data = leaderboardSnap.data()
              setUserOverallStats({
                finalScore: data.finalScore ?? null,
                llmScore: data.llmScore ?? null,
                judgeScore: data.judgeScore ?? null,
                rank: data.rank ?? null,
                weightedFinalScore: data.weightedFinalScore ?? null,
                challengeScores: data.challengeScores ?? null,
              })
            }
          } catch (leaderboardError) {
            console.error("Error fetching leaderboard stats:", leaderboardError)
          }
        }
      } catch (err: any) {
        console.error("Error fetching results:", err)
        setError(err.message || "Failed to load results")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [competitionId, isLoaded, isSignedIn, userId, router, getToken])
  
  const handleRetry = async () => {
    if (!isSignedIn || !userId) return

    try {
      setLoading(true)
      setError(null)

      if (!competitionId || typeof competitionId !== "string") {
        throw new Error("Invalid competition ID")
      }

      // Fetch competition details to get level
      const competitionRef = doc(db, "competitions", competitionId)
      const competitionSnap = await getDoc(competitionRef)
      
      if (!competitionSnap.exists()) {
        throw new Error("Competition not found")
      }

      const competitionData = competitionSnap.data()
      const level = competitionData?.level || "custom"
      setCompetitionLevel(level)

      const { competition, submissions } = await fetchCompetitionResults(competitionId, getToken)
      setCompetition({ ...competition, level })
      setSubmissions(submissions)

      // Fetch user overall stats from finalLeaderboard
      if (userId) {
        try {
          const leaderboardRef = doc(db, "competitions", competitionId, "finalLeaderboard", userId)
          const leaderboardSnap = await getDoc(leaderboardRef)
          if (leaderboardSnap.exists()) {
            const data = leaderboardSnap.data()
            setUserOverallStats({
              finalScore: data.finalScore ?? null,
              llmScore: data.llmScore ?? null,
              judgeScore: data.judgeScore ?? null,
              rank: data.rank ?? null,
              weightedFinalScore: data.weightedFinalScore ?? null,
              challengeScores: data.challengeScores ?? null,
            })
          }
        } catch (leaderboardError) {
          console.error("Error fetching leaderboard stats:", leaderboardError)
        }
      }
    } catch (err: any) {
      console.error("Error fetching results:", err)
      setError(err.message || "Failed to load results")
    } finally {
      setLoading(false)
    }
  }

  // Loading states
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-bold text-red-800">Error Loading Results</h2>
          <p className="text-red-700">{error}</p>
          <div className="space-y-2">
            <button
              onClick={handleRetry}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No submissions state
  if (!submissions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-start gap-6">
              <button
                onClick={() => router.back()}
                className="mt-1 p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all duration-200 border border-gray-200"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Competition Results</h1>
                {competition && (
                  <p className="text-lg text-gray-600">{competition.title}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-12 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-2">
                  <AlertCircle className="h-10 w-10 text-blue-600" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-900">No Submissions Yet</h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    You haven't submitted any solutions for this competition yet.
                  </p>
                </div>
                <div className="pt-6">
                  <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render appropriate component based on competition level
  if (!competition || !competitionLevel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading competition details...</p>
        </div>
      </div>
    )
  }

  if (competitionLevel === "Level 1") {
    return (
      <ResultsLevel1
        submissions={submissions as any}
        competition={competition}
        userOverallStats={userOverallStats as any}
        competitionId={competitionId as string}
      />
    )
  }

  if (competitionLevel === "Level 2") {
    return (
      <ResultsLevel2
        submissions={submissions as any}
        competition={competition}
        userOverallStats={userOverallStats as any}
        competitionId={competitionId as string}
      />
    )
  }

  // Default to custom (combined LLM and Judge evaluation)
  return (
    <ResultsCustom
      submissions={submissions as any}
      competition={competition}
      userOverallStats={userOverallStats as any}
      competitionId={competitionId as string}
    />
  )
}
