"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Competition, Submission } from "@/types/auth"
import { Clock, FileText, Trophy, User } from "lucide-react"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
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
        setCompetitions(competitionsData)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const activeCompetitions = competitions.filter((c) => c.isActive && !c.isLocked)
  const hasSubmissions = submissions.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                {user.institution}
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Competitions</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCompetitions.length}</div>
                <p className="text-xs text-muted-foreground">Available for submission</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Submissions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissions.length}</div>
                <p className="text-xs text-muted-foreground">Total submissions made</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {hasSubmissions
                    ? (submissions.reduce((acc, sub) => acc + sub.averageScore, 0) / submissions.length).toFixed(1)
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Across all submissions</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Competitions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Competitions</h2>
            {activeCompetitions.length === 0 ? (
              <Card>
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
                    <Card key={competition.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{competition.title}</CardTitle>
                            <CardDescription className="mt-2">{competition.description}</CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={isExpired ? "destructive" : "default"}>
                              {isExpired ? "Expired" : "Active"}
                            </Badge>
                            {userSubmission && <Badge variant="secondary">Submitted</Badge>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Deadline: {deadline.toLocaleDateString()} at {deadline.toLocaleTimeString()}
                          </div>
                          <Button onClick={() => router.push(`/competition/${competition.id}`)} disabled={isExpired}>
                            {userSubmission ? "View Submission" : "Participate"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          {hasSubmissions && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Submissions</h2>
              <div className="grid gap-4">
                {submissions.slice(0, 5).map((submission) => {
                  const competition = competitions.find((c) => c.id === submission.competitionId)
                  return (
                    <Card key={submission.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">{competition?.title || "Unknown Competition"}</h3>
                            <p className="text-sm text-gray-600">
                              Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{submission.averageScore.toFixed(1)}</div>
                            <div className="text-sm text-gray-600">Score</div>
                            {submission.flaggedForReview && (
                              <Badge variant="outline" className="mt-1">
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
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
