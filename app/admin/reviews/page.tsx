"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Submission, Competition } from "@/types/auth"
import { ArrowLeft, Eye, Trophy } from "lucide-react"

export default function AdminReviewsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/auth/login")
      return
    }

    fetchData()
  }, [user, router])

  const fetchData = async () => {
    try {
      const [submissionsRes, competitionsRes] = await Promise.all([
        fetch("/api/admin/submissions"),
        fetch("/api/admin/competitions"),
      ])

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json()
        setSubmissions(submissionsData)
      }

      if (competitionsRes.ok) {
        const competitionsData = await competitionsRes.json()
        setCompetitions(competitionsData)
      }
    } catch (error) {
      console.error("Error fetching review data:", error)
    } finally {
      setLoading(false)
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

  const flaggedSubmissions = submissions.filter((s) => s.flaggedForReview)
  const pendingReviews = flaggedSubmissions.filter((s) => s.manualReviewScore === undefined)
  const completedReviews = flaggedSubmissions.filter((s) => s.manualReviewScore !== undefined)
  const topSubmissions = submissions
    .filter((s) => s.averageScore > 0)
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 20)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="ghost" onClick={() => router.push("/admin")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manual Review Panel</h1>
              <p className="text-gray-600">Review and score flagged submissions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">Pending Reviews ({pendingReviews.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed Reviews ({completedReviews.length})</TabsTrigger>
              <TabsTrigger value="top-performers">Top Performers ({topSubmissions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Manual Reviews</CardTitle>
                  <CardDescription>High-scoring submissions that require expert evaluation</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingReviews.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No submissions pending review at the moment.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingReviews.map((submission) => {
                        const competition = competitions.find((c) => c.id === submission.competitionId)
                        return (
                          <div
                            key={submission.id}
                            className="flex justify-between items-center p-4 border rounded-lg bg-yellow-50"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{competition?.title || "Unknown Competition"}</div>
                              <div className="text-sm text-gray-600">
                                Submission #{submission.id.slice(-6)} • Submitted:{" "}
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-blue-600 font-medium">
                                Auto Score: {submission.averageScore.toFixed(1)}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="destructive">Pending Review</Badge>
                              <Button onClick={() => router.push(`/admin/submissions/${submission.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Review Now
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="completed" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Manual Reviews</CardTitle>
                  <CardDescription>Submissions that have been manually reviewed and scored</CardDescription>
                </CardHeader>
                <CardContent>
                  {completedReviews.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No completed reviews yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {completedReviews.map((submission) => {
                        const competition = competitions.find((c) => c.id === submission.competitionId)
                        return (
                          <div
                            key={submission.id}
                            className="flex justify-between items-center p-4 border rounded-lg bg-green-50"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{competition?.title || "Unknown Competition"}</div>
                              <div className="text-sm text-gray-600">
                                Submission #{submission.id.slice(-6)} • Submitted:{" "}
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </div>
                              <div className="flex gap-4 text-sm">
                                <span className="text-blue-600">Auto Score: {submission.averageScore.toFixed(1)}</span>
                                <span className="text-green-600 font-medium">
                                  Manual Score: {submission.manualReviewScore?.toFixed(1)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="default">Reviewed</Badge>
                              <Button
                                variant="outline"
                                onClick={() => router.push(`/admin/submissions/${submission.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Review
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="top-performers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Top 20 Performers (All Competitions)
                  </CardTitle>
                  <CardDescription>Highest scoring submissions across all competitions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topSubmissions.map((submission, index) => {
                      const competition = competitions.find((c) => c.id === submission.competitionId)
                      const finalScore = submission.manualReviewScore || submission.averageScore
                      return (
                        <div key={submission.id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{competition?.title || "Unknown Competition"}</div>
                              <div className="text-sm text-gray-600">
                                Submission #{submission.id.slice(-6)} •
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xl font-bold text-primary">{finalScore.toFixed(1)}</div>
                              <div className="text-xs text-gray-600">
                                {submission.manualReviewScore ? "Manual" : "Auto"} Score
                              </div>
                            </div>
                            {submission.flaggedForReview && (
                              <Badge variant={submission.manualReviewScore ? "default" : "destructive"}>
                                {submission.manualReviewScore ? "Reviewed" : "Pending"}
                              </Badge>
                            )}
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
                      )
                    })}
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
