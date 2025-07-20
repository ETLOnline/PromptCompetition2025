"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Competition, Submission } from "@/types/auth"
import { Clock, FileText, Trophy, User } from "lucide-react"
import { signOut } from "firebase/auth";


/**
 * DashboardPage – themed with calming gradient background, white cards, soft shadows,
 * and aquamarine (#56ffbc) as the primary accent color.
 */
export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    fetchData()
  }, [user, router])

  const fetchData = async () => {
    try {
      const [competitionsRes, submissionsRes] = await Promise.all([
        fetch("/api/competitions"),
        fetch("/api/submissions/my"),
      ])

      if (competitionsRes.ok) {
        const competitionsData = await competitionsRes.json()

        // Add 5 more mock competitions for demo purposes
        const more = Array.from({ length: 5 }, (_, i) => ({
          ...competitionsData[0],
          id: competitionsData[0].id + "_" + (i + 1),
          title: competitionsData[0].title + " " + (i + 2),
        }))

        setCompetitions([...competitionsData, ...more])
      }

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json()
        setSubmissions(submissionsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50">
        {/* Aquamarine spinner */}
        <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-[#56ffbc]"></div>
      </div>
    )
  }

  const activeCompetitions = competitions.filter((c) => c.isActive && !c.isLocked)
  const hasSubmissions = submissions.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              {user.institution}
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await logout();
                router.push("/"); // or "/app" if that's your home
              }}
              className="hover:bg-gray-100"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Active Competitions */}
          <Card className="shadow-md">
            {/* Gradient card header */}
            <CardHeader className="bg-gradient-to-r from-[#d3fff1] to-[#b0ffe6] rounded-t-lg flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Active Competitions</CardTitle>
              <Trophy className="h-4 w-4 text-gray-700" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-900">{activeCompetitions.length}</div>
              <p className="text-xs text-gray-600">Available for submission</p>
            </CardContent>
          </Card>

          {/* My Submissions */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-[#d3fff1] to-[#b0ffe6] rounded-t-lg flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">My Submissions</CardTitle>
              <FileText className="h-4 w-4 text-gray-700" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-900">{submissions.length}</div>
              <p className="text-xs text-gray-600">Total submissions made</p>
            </CardContent>
          </Card>

          {/* Average Score */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-[#d3fff1] to-[#b0ffe6] rounded-t-lg flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Average Score</CardTitle>
              <Trophy className="h-4 w-4 text-gray-700" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-gray-900">
                {hasSubmissions ? (
                  (submissions.reduce((acc, sub) => acc + sub.averageScore, 0) / submissions.length).toFixed(1)
                ) : (
                  "N/A"
                )}
              </div>
              <p className="text-xs text-gray-600">Across all submissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Competitions */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Competitions</h2>

          {activeCompetitions.length === 0 ? (
            <Card className="shadow-md">
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active competitions at the moment.</p>
                <p className="text-sm text-gray-500 mt-2">Check back later for new challenges!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {activeCompetitions.map((competition) => {
                const userSubmission = submissions.find((s) => s.competitionId === competition.id)
                const deadline = new Date(competition.deadline)
                const isExpired = deadline < new Date()

                return (
                  <Card key={competition.id} className="shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl text-gray-900">{competition.title}</CardTitle>
                          <CardDescription className="mt-2 text-gray-700">
                            {competition.description}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={isExpired ? "destructive" : "default"} className={isExpired ? "bg-red-100 text-red-800" : "bg-[#56ffbc]/20 text-[#046f4e]"}>
                            {isExpired ? "Expired" : "Active"}
                          </Badge>
                          {userSubmission && (
                            <Badge variant="outline" className="border-[#56ffbc] text-[#046f4e]">
                              Submitted
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            Deadline: {deadline.toLocaleDateString()} at {deadline.toLocaleTimeString()}
                          </span>
                        </div>
                        <Button
                          onClick={() => router.push(`/competition/${competition.id}`)}
                          disabled={isExpired}
                          className={`transition-colors ${
                            isExpired
                              ? "cursor-not-allowed opacity-50"
                              : userSubmission
                              ? "bg-white border border-[#56ffbc] text-[#046f4e] hover:bg-[#e6fff6]"
                              : "bg-[#56ffbc] text-gray-900 hover:bg-[#45e0a6]"
                          }`}
                        >
                          {userSubmission ? "View Submission" : "Participate"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {/* Recent Submissions */}
        {hasSubmissions && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Submissions</h2>
            <div className="grid gap-4">
              {submissions.slice(0, 5).map((submission) => {
                const competition = competitions.find((c) => c.id === submission.competitionId)
                return (
                  <Card key={submission.id} className="shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{competition?.title || "Unknown Competition"}</h3>
                          <p className="text-sm text-gray-600">
                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#046f4e]">
                            {submission.averageScore.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">Score</div>
                          {submission.flaggedForReview && (
                            <Badge variant="outline" className="mt-1 border-amber-400 text-amber-600">
                              Under Review
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
