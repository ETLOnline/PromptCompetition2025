"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Trophy, Clock, LogOut, User } from "lucide-react"
import { getSubmissionCountByParticipant } from "@/lib/firebase/getSubmissionCountByParticipant"
import { countDocuments } from "@/lib/firebase/countDocuments"
import ChallengeList from "@/components/ChallengeList"
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<number | null>(null)
  const [count, setCount] = useState<number | null>(null)
  const [startDeadlineReached, setStartDeadlineReached] = useState<boolean>(false)
  const [endDeadlinePassed, setEndDeadlinePassed] = useState<boolean>(false)
  const [checkingDeadline, setCheckingDeadline] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const fetchDeadlines = async () => {
      try {
        const competitionsRef = collection(db, "competitions")
        const latestQuery = query(competitionsRef, orderBy("createdAt", "desc"), limit(1))
        const snapshot = await getDocs(latestQuery)

        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          const data = doc.data()
          const start = data.startDeadline?.toDate?.() ?? new Date(data.startDeadline)
          const end = data.endDeadline?.toDate?.() ?? new Date(data.endDeadline)
          const now = new Date()
          const extendedEnd = new Date(end.getTime() + 2 * 60 * 1000) // end + 2 minutes

          setStartDeadlineReached(now >= start)
          setEndDeadlinePassed(now > extendedEnd)
        }
      } catch (error) {
        console.error("Error fetching deadlines:", error)
      } finally {
        setCheckingDeadline(false)
      }
    }

    fetchDeadlines()

    if (user?.uid) {
      getSubmissionCountByParticipant(user.uid).then(setSubmissions)
    }

    countDocuments(process.env.NEXT_PUBLIC_CHALLENGE_DATABASE!).then(setCount)
  }, [user, router])

  if (!user || checkingDeadline) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-150 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    )
  }

  const getCompetitionStatus = () => {
    if (!startDeadlineReached) {
      return {
        status: "UPCOMING",
        message: "Competition starts soon",
        bgColor: "bg-blue-50",
        textColor: "text-blue-800",
        borderColor: "border-blue-200",
      }
    } else if (startDeadlineReached && !endDeadlinePassed) {
      return {
        status: "ACTIVE",
        message: "Competition is live",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-800",
        borderColor: "border-emerald-200",
      }
    } else {
      return {
        status: "ENDED",
        message: "Competition has ended",
        bgColor: "bg-gray-50",
        textColor: "text-gray-800",
        borderColor: "border-gray-200",
      }
    }
  }

  const competitionStatus = getCompetitionStatus()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-150">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-base font-medium text-gray-700">Welcome back, {user.displayName || "Participant"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1 rounded-full border text-xs font-medium uppercase tracking-wide ${competitionStatus.bgColor} ${competitionStatus.textColor} ${competitionStatus.borderColor}`}
              >
                {competitionStatus.status}
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  await logout()
                  router.push("/")
                }}
                className="hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4 text-gray-600" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Status Banner */}
        <div className="mb-8">
          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Competition Status</h3>
                  <p className="text-sm font-medium text-gray-700">{competitionStatus.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white">Active Competitions</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-4">
              <div className="text-3xl font-bold text-gray-900 mb-1">{count !== null ? count : "—"}</div>
              <p className="text-sm font-medium text-gray-700">Available for submission</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white">My Submissions</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-4">
              <div className="text-3xl font-bold text-gray-900 mb-1">{submissions !== null ? submissions : "—"}</div>
              <p className="text-sm font-medium text-gray-700">Total submissions made</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white">Total Score</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-4">
              <div className="text-3xl font-bold text-gray-900 mb-1">Pending</div>
              <p className="text-sm font-medium text-gray-700">Across all submissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Challenges Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-rose-400 to-red-500 rounded-lg flex items-center justify-center">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Challenges</h2>
              <p className="text-base font-medium text-gray-700">Available competition challenges</p>
            </div>
          </div>

          <Card className="bg-white shadow-sm rounded-xl">
            <CardContent className="p-8">
              {startDeadlineReached && !endDeadlinePassed ? (
                <ChallengeList />
              ) : !startDeadlineReached ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-sky-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Competition Not Started</h3>
                  <p className="text-base font-medium text-gray-700 max-w-md mx-auto">
                    Challenges will be available once the competition starts. Please check back later.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-slate-400 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Competition Ended</h3>
                  <p className="text-base font-medium text-gray-700 max-w-md mx-auto">
                    The competition has ended and challenges are no longer available for submission.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
