"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Competition, Submission } from "@/types/auth"
import { ArrowLeft, Download, Eye, Lock, Unlock, Play, Trophy } from "lucide-react"

export default function AdminCompetitionDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/auth/login")
      return
    }

    fetchData()
  }, [user, params.id, router])

  const fetchData = async () => {
    try {
      const [competitionRes, submissionsRes] = await Promise.all([
        fetch(`/api/admin/competitions/${params.id}`),
        fetch(`/api/admin/submissions?competitionId=${params.id}`),
      ])

      if (competitionRes.ok) {
        const competitionData = await competitionRes.json()
        setCompetition(competitionData)
      }

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json()
        setSubmissions(submissionsData)
      }
    } catch (error) {
      console.error("Error fetching competition data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLock = async () => {
    if (!competition) return

    try {
      const response = await fetch(`/api/admin/competitions/${params.id}/lock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: !competition.isLocked }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error toggling lock:", error)
    }
  }

  const triggerEvaluation = async () => {
    try {
      const response = await fetch(`/api/admin/competitions/${params.id}/evaluate`, {
        method: "POST",
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error triggering evaluation:", error)
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

  if (!competition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">Competition not found.</p>
            <Button className="mt-4" onClick={() => router.push("/admin")}>
              Back to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const deadline = new Date(competition.deadline)
  const isExpired = deadline < new Date()
  const topSubmissions = submissions
    .filter((s) => s.averageScore > 0)
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 10)

  const flaggedSubmissions = submissions.filter((s) => s.flaggedForReview)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => router.push("/admin")} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{competition.title}</h1>
                <div className="flex items-center gap-4 mt-2">
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleLock}>
                {competition.isLocked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                {competition.isLocked ? "Unlock" : "Lock"}
              </Button>
              <Button onClick={triggerEvaluation} disabled={submissions.length === 0}>
                <Play className="h-4 w-4 mr-2" />
                Evaluate All
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="submissions">All Submissions</TabsTrigger>
              <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
              <TabsTrigger value="flagged">Flagged for Review</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Competition Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-gray-600">{competition.description}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Deadline</h3>
                      <p className="text-gray-600">{deadline.toLocaleString()}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Problem Statement</h3>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm">{competition.problemStatement}</pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{submissions.length}</div>
                        <div className="text-sm text-gray-600">Total Submissions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{flaggedSubmissions.length}</div>
                        <div className="text-sm text-gray-600">Flagged for Review</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {submissions.length > 0
                            ? (
                                submissions.reduce((acc, sub) => acc + sub.averageScore, 0) / submissions.length
                              ).toFixed(1)
                            : "0"}
                        </div>
                        <div className="text-sm text-gray-600">Average Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {submissions.length > 0
                            ? Math.max(...submissions.map((s) => s.averageScore)).toFixed(1)
                            : "0"}
                        </div>
                        <div className="text-sm text-gray-600">Highest Score</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Criteria & Rubric</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Evaluation Criteria</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{competition.evaluationCriteria}</pre>
                    </div>
                  </div>
                  {competition.rubric && (
                    <div>
                      <h3 className="font-semibold mb-2">Detailed Rubric</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">{competition.rubric}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>All Submissions ({submissions.length})</CardTitle>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Export submissions for this competition
                        fetch(`/api/admin/export/submissions?competitionId=${params.id}`)
                          .then((response) => response.blob())
                          .then((blob) => {
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement("a")
                            a.href = url
                            a.download = `submissions-${competition.title}.csv`
                            a.click()
                            window.URL.revokeObjectURL(url)
                          })
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">Submission #{submission.id.slice(-6)}</div>
                          <div className="text-sm text-gray-600">
                            Submitted: {new Date(submission.submittedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{submission.averageScore.toFixed(1)}</div>
                            <div className="text-xs text-gray-600">Score</div>
                          </div>
                          {submission.flaggedForReview && <Badge variant="outline">Flagged</Badge>}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/submissions/${submission.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="top-performers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Top 10 Performers
                  </CardTitle>
                  <CardDescription>Highest scoring submissions in this competition</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topSubmissions.map((submission, index) => (
                      <div key={submission.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">Submission #{submission.id.slice(-6)}</div>
                            <div className="text-sm text-gray-600">
                              Submitted: {new Date(submission.submittedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">{submission.averageScore.toFixed(1)}</div>
                            <div className="text-xs text-gray-600">Score</div>
                          </div>
                          {submission.flaggedForReview && <Badge variant="outline">Under Review</Badge>}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/submissions/${submission.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flagged" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Flagged for Manual Review ({flaggedSubmissions.length})</CardTitle>
                  <CardDescription>High-scoring submissions requiring expert evaluation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {flaggedSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="flex justify-between items-center p-4 border rounded-lg bg-yellow-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">Submission #{submission.id.slice(-6)}</div>
                          <div className="text-sm text-gray-600">
                            Submitted: {new Date(submission.submittedAt).toLocaleString()}
                          </div>
                          {submission.manualReviewScore !== undefined && (
                            <div className="text-sm text-green-600 font-medium">
                              Manual Review Complete: {submission.manualReviewScore.toFixed(1)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{submission.averageScore.toFixed(1)}</div>
                            <div className="text-xs text-gray-600">Auto Score</div>
                          </div>
                          <Badge variant={submission.manualReviewScore !== undefined ? "default" : "destructive"}>
                            {submission.manualReviewScore !== undefined ? "Reviewed" : "Pending"}
                          </Badge>
                          <Button size="sm" onClick={() => router.push(`/admin/submissions/${submission.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
