"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Activity, Users, Trophy, BarChart3, Shield, UserCog } from "lucide-react"
import GetChallenges from "@/components/GetChallenges"
import StartEvaluationButton from "@/components/StartEvaluation"
import GenerateLeaderboardButton from "@/components/GenerateLeaderboard"
import DownloadLeaderboardButton from "@/components/DownloadLeaderboard"
import { collection, onSnapshot, doc, getDoc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AdminDashboard() {
  const { user, role, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const competitionId = searchParams.get("competitionId")

  const [competitionTitle, setCompetitionTitle] = useState<string | null>(null)
  const [totalSubmissions, setSubmissionCount] = useState<number>(0)
  const [stats, setStats] = useState({ totalParticipants: 0, pendingReviews: 0 })

  useEffect(() => {
    if (!user || !competitionId) {
      router.push("/admin/select-competition")
      return
    }

    ;(async () => {
      const compRef = doc(db, "competitions", competitionId)
      const compSnap = await getDoc(compRef)
      if (compSnap.exists()) {
        setCompetitionTitle((compSnap.data() as any).title || null)
      }
    })()

    const unsubParts = onSnapshot(
      collection(db, `competitions/${competitionId}/participants`),
      snap => setStats(prev => ({ ...prev, totalParticipants: snap.size }))
    )

    const unsubSubs = onSnapshot(
      collection(db, `competitions/${competitionId}/submissions`),
      snap => setSubmissionCount(snap.size)
    )

    const unsubPending = onSnapshot(
      query(
        collection(db, `competitions/${competitionId}/submissions`),
        where("status", "==", "selected_for_manual_review")
      ),
      snap => setStats(prev => ({ ...prev, pendingReviews: snap.size }))
    )

    return () => {
      unsubParts()
      unsubSubs()
      unsubPending()
    }
  }, [user, role, router, competitionId])

  if (!user || (role !== "admin" && role !== "superadmin")) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded uppercase tracking-wide">
                  {role === "superadmin" ? "SUPER ADMIN" : "ADMIN"}
                </span>
              </div>
              <p className="text-gray-600 text-lg">
                {competitionTitle ? `Managing: ${competitionTitle}` : "Loading competition..."}
              </p>
            </div>
            <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/select-competition")}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg bg-transparent gap-2"
            >
              <Trophy className="w-4 h-4" />
              Go to Competitions
            </Button>
              <Button
                variant="outline"
                onClick={logout}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg bg-transparent"
              >
                Logout
              </Button>

              
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white rounded-2xl shadow-sm p-6 h-full">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-gray-600 font-medium">Total Participants</h3>
                <div className="text-4xl font-bold text-gray-900">{stats.totalParticipants}</div>
                <p className="text-gray-500 text-sm">For this competition</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white rounded-2xl shadow-sm p-6 h-full">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-gray-600 font-medium">Total Submissions</h3>
                <div className="text-4xl font-bold text-gray-900">{totalSubmissions}</div>
                <p className="text-gray-500 text-sm">For this competition</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white rounded-2xl shadow-sm p-6 h-full">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-gray-600 font-medium">Pending Reviews</h3>
                <div className="text-4xl font-bold text-gray-900">{stats.pendingReviews}</div>
                <p className="text-gray-500 text-sm">Flagged for review</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Activity className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {(role === "admin" || role === "superadmin") && (
            <Card className="bg-white rounded-2xl shadow-sm p-6 h-full">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Admin Controls</h3>
                    <p className="text-gray-600">Manage roles and judges</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push("/admin/superadmin")}
                    className="w-full py-3 bg-gray-900 text-white rounded-lg"
                  >
                    <UserCog className="h-4 w-4 mr-2" /> Manage Roles
                  </Button>
                  <Button
                    onClick={() => router.push("/admin/participant-distribution")}
                    className="w-full py-3 bg-gray-900 text-white rounded-lg"
                  >
                    <Users className="h-4 w-4 mr-2" /> Manage Judges
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card className="bg-white rounded-2xl shadow-sm p-6 h-full">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Evaluation</h3>
                  <p className="text-gray-600">Manual or LLM scoring</p>
                </div>
              </div>
              <div className="space-y-3">
                <StartEvaluationButton competitionId={competitionId!} />
                <GenerateLeaderboardButton competitionId={competitionId!} />
              </div>
            </div>
          </Card>

          <Card className="bg-white rounded-2xl shadow-sm p-6 h-full">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Leaderboard Management</h3>
                  <p className="text-gray-600">View and export final rankings</p>
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push(`/admin/leaderboard?competitionId=${competitionId}`)}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg"
                >
                  <Trophy className="h-4 w-4 mr-2" /> View Leaderboard
                </Button>
                <DownloadLeaderboardButton competitionId={competitionId!} />
              </div>
            </div>
          </Card>
        </div>

        {/* Challenges Section */}
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <GetChallenges competitionId={competitionId!} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
