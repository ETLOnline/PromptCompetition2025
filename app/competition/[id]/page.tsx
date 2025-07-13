"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { Competition, Submission } from "@/types/auth"
import { ArrowLeft, Clock, FileText, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CompetitionPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [prompt, setPrompt] = useState("")
  const [llmOutput, setLlmOutput] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    fetchCompetitionData()
  }, [user, params.id, router])

  const fetchCompetitionData = async () => {
    try {
      const [competitionRes, submissionRes] = await Promise.all([
        fetch(`/api/competitions/${params.id}`),
        fetch(`/api/submissions/competition/${params.id}`),
      ])

      if (competitionRes.ok) {
        const competitionData = await competitionRes.json()
        setCompetition(competitionData)
      }

      if (submissionRes.ok) {
        const submissionData = await submissionRes.json()
        setSubmission(submissionData)
        if (submissionData) {
          setPrompt(submissionData.prompt)
          setLlmOutput(submissionData.llmOutput)
        }
      }
    } catch (error) {
      console.error("Error fetching competition data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!prompt.trim() || !llmOutput.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both the prompt and LLM output fields.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: params.id,
          prompt,
          llmOutput,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your submission has been saved successfully!",
        })
        fetchCompetitionData() // Refresh data
      } else {
        throw new Error("Submission failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
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

  if (!competition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">Competition not found.</p>
            <Button className="mt-4" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const deadline = new Date(competition.deadline)
  const isExpired = deadline < new Date()
  const isLocked = competition.isLocked || isExpired

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{competition.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={isLocked ? "destructive" : "default"}>{isLocked ? "Locked" : "Active"}</Badge>
                {submission && <Badge variant="secondary">Submitted</Badge>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Competition Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Competition Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600">{competition.description}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Problem Statement</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{competition.problemStatement}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Deadline
                    </h3>
                    <p className="text-gray-600">
                      {deadline.toLocaleDateString()} at {deadline.toLocaleTimeString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{competition.evaluationCriteria}</pre>
                  </div>
                </CardContent>
              </Card>

              {competition.rubric && (
                <Card>
                  <CardHeader>
                    <CardTitle>Rubric</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{competition.rubric}</pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Submission Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Submission</CardTitle>
                  <CardDescription>
                    {submission
                      ? "You can update your submission until the deadline."
                      : "Submit your prompt and the corresponding LLM output."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLocked && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This competition is locked. No new submissions or updates are allowed.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="prompt">Your Prompt</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Enter your carefully crafted prompt here..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={6}
                      disabled={isLocked}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="llmOutput">LLM Generated Output</Label>
                    <Textarea
                      id="llmOutput"
                      placeholder="Paste the output generated by the LLM using your prompt..."
                      value={llmOutput}
                      onChange={(e) => setLlmOutput(e.target.value)}
                      rows={8}
                      disabled={isLocked}
                    />
                  </div>

                  <Button onClick={handleSubmit} disabled={submitting || isLocked} className="w-full">
                    {submitting ? "Submitting..." : submission ? "Update Submission" : "Submit Entry"}
                  </Button>
                </CardContent>
              </Card>

              {/* Submission Status */}
              {submission && (
                <Card>
                  <CardHeader>
                    <CardTitle>Submission Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Submitted:</span>
                      <span className="font-medium">{new Date(submission.submittedAt).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Score:</span>
                      <span className="text-2xl font-bold text-primary">{submission.averageScore.toFixed(1)}</span>
                    </div>

                    {submission.flaggedForReview && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Your submission has been flagged for manual review by our expert panel.
                        </AlertDescription>
                      </Alert>
                    )}

                    {submission.manualReviewScore !== undefined && (
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Manual Review Score:</span>
                          <span className="text-xl font-bold text-green-600">
                            {submission.manualReviewScore.toFixed(1)}
                          </span>
                        </div>
                        {submission.manualReviewNotes && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm">{submission.manualReviewNotes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
