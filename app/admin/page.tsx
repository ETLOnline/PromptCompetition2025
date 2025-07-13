"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Competition, Submission } from "@/types/auth"
import { Plus, Users, Trophy, FileText, Settings, Eye, Download, Lock, Unlock, Play } from "lucide-react"

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    if (user.role !== "admin") {
      router.push("/dashboard")
      return
    }

    fetchData()
  }, [user, router])

  const fetchData = async () => {
    try {
      const [competitionsRes, submissionsRes, statsRes] = await Promise.all([
        fetch("/api/admin/competitions"),
        fetch("/api/admin/submissions"),
        fetch("/api/admin/stats"),
      ])

      if (competitionsRes.ok) {
        const competitionsData = await competitionsRes.json()
        setCompetitions(competitionsData)
      }

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json()
        setSubmissions(submissionsData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCompetitionLock = async (competitionId: string, isLocked: boolean) => {
    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}/lock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: !isLocked }),
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error toggling competition lock:", error)
    }
  }

  const triggerEvaluation = async (competitionId: string) => {
    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}/evaluate`, {
        method: "POST",
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error triggering evaluation:", error)
    }
  }

  const exportParticipantData = async () => {
    try {
      const response = await fetch("/api/admin/export/participants")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "participants.csv"
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error exporting participant data:", error)
    }
  }

  const exportSubmissionData = async (competitionId?: string) => {
    try {
      const url = competitionId
        ? `/api/admin/export/submissions?competitionId=${competitionId}`
        : "/api/admin/export/submissions"
      const response = await fetch(url)
      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = downloadUrl
        a.download = competitionId ? `submissions-${competitionId}.csv` : "all-submissions.csv"
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
      }
    } catch (error) {
      console.error("Error exporting submission data:", error)
    }
  }

  if (!user || user.role !== "admin") return null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage competitions and monitor submissions</p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push("/admin/competitions/new")}>
                <Plus className="h-4 w-4 mr-2" />
                New Competition
              </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalParticipants}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                <p className="text-xs text-muted-foreground">Across all competitions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingReviews}</div>
                <p className="text-xs text-muted-foreground">Flagged for manual review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Competitions</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{competitions.filter((c) => c.isActive).length}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
                <CardDescription>Export participant and submission data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={exportParticipantData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All Participants
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => exportSubmissionData()}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All Submissions
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push("/admin/reviews")}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Manual Review Panel
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push("/admin/participants")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Participants
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Competitions Management */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Competitions</h2>
              <Button onClick={() => router.push("/admin/competitions/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>

            <div className="grid gap-6">
              {competitions.map((competition) => {
                const competitionSubmissions = submissions.filter((s) => s.competitionId === competition.id)
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
                          <div className="flex gap-2">
                            <Badge variant={competition.isActive ? "default" : "secondary"}>
                              {competition.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant={competition.isLocked ? "destructive" : "outline"}>
                              {competition.isLocked ? "Locked" : "Open"}
                            </Badge>
                            {isExpired && <Badge variant="destructive">Expired</Badge>}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Submissions:</span>
                            <span className="font-medium ml-2">{competitionSubmissions.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Deadline:</span>
                            <span className="font-medium ml-2">{deadline.toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Avg Score:</span>
                            <span className="font-medium ml-2">
                              {competitionSubmissions.length > 0
                                ? (
                                    competitionSubmissions.reduce((acc, sub) => acc + sub.averageScore, 0) /
                                    competitionSubmissions.length
                                  ).toFixed(1)
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/competitions/${competition.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/competitions/${competition.id}/edit`)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={competition.isLocked ? "default" : "destructive"}
                          onClick={() => toggleCompetitionLock(competition.id, competition.isLocked)}
                        >
                          {competition.isLocked ? (
                            <Unlock className="h-4 w-4 mr-2" />
                          ) : (
                            <Lock className="h-4 w-4 mr-2" />
                          )}
                          {competition.isLocked ? "Unlock" : "Lock"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => triggerEvaluation(competition.id)}
                          disabled={competitionSubmissions.length === 0}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Evaluate All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportSubmissionData(competition.id)}
                          disabled={competitionSubmissions.length === 0}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Latest participant submissions across all competitions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.slice(0, 10).map((submission) => {
                  const competition = competitions.find((c) => c.id === submission.competitionId)
                  return (
                    <div
                      key={submission.id}
                      className="flex justify-between items-center py-3 border-b last:border-b-0"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{competition?.title || "Unknown Competition"}</h4>
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">{submission.averageScore.toFixed(1)}</div>
                          <div className="text-xs text-gray-600">Score</div>
                        </div>
                        {submission.flaggedForReview && <Badge variant="outline">Under Review</Badge>}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/submissions/${submission.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
