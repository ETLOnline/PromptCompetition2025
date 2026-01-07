"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import CompetitionLeaderboard from "@/components/results/CompetitionLeaderboard"
import ParticipantBreadcrumb from "@/components/participant-breadcrumb"

interface Competition {
  id: string
  title: string
  status: string
  endDeadline: any
  level?: string
}

export default function LeaderboardPage() {
  const { competitionId } = useParams()
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()

  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [competitionLevel, setCompetitionLevel] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      router.push("/sign-in")
      return
    }

    const fetchCompetitionDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!competitionId || typeof competitionId !== "string") {
          throw new Error("Invalid competition ID")
        }

        // Fetch competition details
        const competitionRef = doc(db, "competitions", competitionId)
        const competitionSnap = await getDoc(competitionRef)

        if (!competitionSnap.exists()) {
          throw new Error("Competition not found")
        }

        const competitionData = competitionSnap.data()
        const level = competitionData?.level || "custom"
        setCompetitionLevel(level)

        setCompetition({
          id: competitionId,
          title: competitionData.title || "Competition",
          status: competitionData.status || "ended",
          endDeadline: competitionData.endDeadline,
          level
        })

      } catch (err: any) {
        console.error("Error fetching competition details:", err)
        setError(err.message || "Failed to load competition details")
      } finally {
        setLoading(false)
      }
    }

    fetchCompetitionDetails()
  }, [competitionId, isLoaded, isSignedIn, router])

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
          <p className="text-gray-600">Loading leaderboard...</p>
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
          <h2 className="text-xl font-bold text-red-800">Error Loading Leaderboard</h2>
          <p className="text-red-700">{error}</p>
          <div className="pt-6">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <ParticipantBreadcrumb />
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mx-4 sm:mx-6 lg:mx-8 mt-6 mb-8">
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 rounded-t-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Competition Leaderboard</h1>
                  {competition && (
                    <p className="text-lg text-gray-600 mb-1">{competition.title}</p>
                  )}
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-200">
                      {competitionLevel === "Level 1" ? "Level 1 - LLM Evaluation" : 
                       competitionLevel === "Level 2" ? "Level 2 - Human Judge Evaluation" : 
                       "Custom Evaluation"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CompetitionLeaderboard
          competitionId={competitionId as string}
          competitionLevel={competitionLevel}
        />
      </div>
    </div>
  )
}