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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ParticipantBreadcrumb />
        
        {/* Header Section */}
        <div className="mt-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#0f172a] to-[#f59e0b] px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Competition Leaderboard
                  </h1>
                  <p className="text-blue-100 text-lg font-medium">
                    {competition.title}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                    <p className="text-white text-sm font-medium">Competition Ended</p>
                  </div>
                </div>
              </div>
              <div className="sm:hidden mt-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30 inline-block">
                  <p className="text-white text-sm font-medium">Competition Ended</p>
                </div>
              </div>
            </div>
            
            {/* Stats Bar (Optional) */}
            <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Final rankings and scores</span>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <CompetitionLeaderboard
            competitionId={competitionId as string}
            competitionLevel={competitionLevel}
          />
        </div>
      </div>
    </div>
  )
}