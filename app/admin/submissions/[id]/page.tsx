"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { Submission, Competition } from "@/types/auth"
import { ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"


export default function AdminSubmissionDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [manualScore, setManualScore] = useState("")
  const [manualNotes, setManualNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/auth/login")
      return
    }

    fetchData()
  }, [user, params.id, router])

  const fetchData = async () => {
    try {
      const submissionRes = await fetch(`/api/admin/submissions/${params.id}`)

      if (submissionRes.ok) {
        const submissionData = await submissionRes.json()
        setSubmission(submissionData)
        setManualScore(submissionData.manualReviewScore?.toString() || "")
        setManualNotes(submissionData.manualReviewNotes || "")

        // Fetch competition details
        const competitionRes = await fetch(`/api/admin/competitions/${submissionData.competitionId}`)
        if (competitionRes.ok) {
          const competitionData = await competitionRes.json()
          setCompetition(competitionData)
        }
      }
    } catch (error) {
      console.error("Error fetching submission data:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveManualReview = async () => {
    if (!submission) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/submissions/${params.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manualReviewScore: Number.parseFloat(manualScore),
          manualReviewNotes: manualNotes,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Manual review saved successfully!",
        })
        fetchData() // Refresh data
      } else {
        throw new Error("Failed to save review")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save manual review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
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

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">Submission not found.</p>
            <Button className="mt-4" onClick={() => router.push("/admin")}>
              Back to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
                <h1 className="text-3xl font-bold text-gray-900">Submission Review</h1>
                <p className="text-gray-600">Submission #{submission.id.slice(-6)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {submission.flaggedForReview && <Badge variant="outline">Flagged for Review</Badge>}
              <Badge variant={submission.manualReviewScore !== undefined ? "default" : "secondary"}>
                {submission.manualReviewScore !== undefined ? "Reviewed" : "Pending Review"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Submission Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Competition Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {competition && (
                    <>
                      <div>
                        <h3 className="font-semibold mb-2">Competition</h3>
                        <p className="text-gray-600">{competition.title}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Problem Statement</h3>
                        <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm">{competition.problemStatement}</pre>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Evaluation Criteria</h3>
                        <div className="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm">{competition.evaluationCriteria}</pre>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Participant's Submission</CardTitle>
                  <CardDescription>Submitted: {new Date(submission.submittedAt).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Prompt</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{submission.prompt}</pre>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">LLM Generated Output</h3>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{submission.llmOutput}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Automated Evaluation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{submission.averageScore.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Average Score</div>
                    </div>
                    <div className="space-y-2">
                      {submission.evaluationScores.map((score) => (
                        <div key={score.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{score.llmModel}</div>
                            <div className="text-sm text-gray-600">{score.feedback}</div>
                          </div>
                          <div className="text-lg font-bold">{score.score.toFixed(1)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Manual Review Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Manual Review</CardTitle>
                  <CardDescription>Provide expert evaluation and final scoring for this submission</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="manualScore">Manual Review Score (0-100)</Label>
                    <Input
                      id="manualScore"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={manualScore}
                      onChange={(e) => setManualScore(e.target.value)}
                      placeholder="Enter score (0-100)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manualNotes">Review Notes & Feedback</Label>
                    <Textarea
                      id="manualNotes"
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      placeholder="Provide detailed feedback on the submission..."
                      rows={8}
                    />
                  </div>

                  <Button onClick={saveManualReview} disabled={saving || !manualScore} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Manual Review"}
                  </Button>
                </CardContent>
              </Card>

              {submission.manualReviewScore !== undefined && (
                <Card>
                  <CardHeader>
                    <CardTitle>Review History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Manual Review Score:</span>
                        <span className="text-xl font-bold text-green-600">
                          {submission.manualReviewScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Automated Score:</span>
                        <span className="text-lg font-bold text-primary">{submission.averageScore.toFixed(1)}</span>
                      </div>
                      {submission.manualReviewNotes && (
                        <div>
                          <h4 className="font-semibold mb-2">Previous Review Notes:</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm">{submission.manualReviewNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => router.push(`/admin/competitions/${submission.competitionId}`)}
                  >
                    View Competition Details
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => {
                      // Navigate to next flagged submission
                      router.push("/admin/reviews")
                    }}
                  >
                    Go to Review Queue
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
