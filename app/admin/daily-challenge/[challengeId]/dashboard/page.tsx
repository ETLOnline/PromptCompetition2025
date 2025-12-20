"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { fetchWithAuth } from "@/lib/api"
import { ArrowLeft,Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminDailyChallengeCard } from "@/components/admin/AdminDailyChallengeCard"
import { JudgeFeedbackSection } from "@/components/participantcompetitions/JudgeFeedbackSection"
import { AdminSubmissionsView } from "@/components/admin/AdminSubmissionsView"

interface DailyChallenge {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  startTime: any
  endTime: any
  status: string
  type: string
  totalSubmissions: number
  createdAt?: any
  createdBy?: string
  problemAudioUrls?: string[]
  guidelinesAudioUrls?: string[]
  visualClueUrls?: string[]
}

export default function AdminDailyChallengeDashboard() {
  const router = useRouter()
  const params = useParams()
  const challengeId = params?.challengeId as string
  
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [router])

  const checkAuth = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`)
      if (profile.role !== "superadmin") {
        router.push("/admin/select-competition")
        return
      }
      fetchChallenge()
    } catch (error) {
      console.error("Authentication check failed:", error)
      router.push("/")
    }
  }

  const fetchChallenge = async () => {
    try {
      setLoading(true)
      setError(null)

      const challengeRef = doc(db, "dailychallenge", challengeId)
      const challengeSnap = await getDoc(challengeRef)

      if (!challengeSnap.exists()) {
        setError("Challenge not found")
        setLoading(false)
        return
      }

      const data = challengeSnap.data()
      
      setChallenge({
        id: challengeSnap.id,
        title: data.title || "Untitled Challenge",
        problemStatement: data.problemStatement || "",
        guidelines: data.guidelines || "",
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status || "unknown",
        type: data.type || "direct",
        totalSubmissions: data.totalSubmissions || 0,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        problemAudioUrls: data.problemAudioUrls || [],
        guidelinesAudioUrls: data.guidelinesAudioUrls || [],
        visualClueUrls: data.visualClueUrls || [],
      })

      setLoading(false)
    } catch (err) {
      console.error("Error fetching challenge:", err)
      setError("Failed to load challenge")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0f172a]" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700 font-semibold text-lg">{error || "Challenge not found"}</p>
            <Button
              onClick={() => router.push("/admin/daily-challenge")}
              className="mt-4 bg-[#0f172a] hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Challenges
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header & Breadcrumbs */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Challenge Dashboard
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Monitor and analyze challenge performance
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Challenge Overview Card */}
        <div>
          <AdminDailyChallengeCard challenge={challenge} />
        </div>

        {/* Submissions Section */}
        <div>
          <AdminSubmissionsView
            challengeId={challengeId}
            challengeTitle={challenge.title}
          />
        </div>
        {/* Judge Feedback Section */}
        <div>
          <JudgeFeedbackSection
            challengeId={challengeId}
            challengeTitle={challenge.title}
            userRole="superadmin"
          />
        </div>
      </div>
    </div>
  )
}
