// app/participants/competitions/[id]/results/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { fetchCompetitionResults } from "@/lib/api" // <-- using your API helper
import { AlertCircle, Trophy, Clock, FileX, User, ArrowLeft, RefreshCw } from "lucide-react"

interface Submission {
  id?: string
  challengeId: string
  finalScore: number | null
  llmScores: Record<
    string,
    {
      description: string
      finalScore: number | null
      scores: Record<string, number>
    }
  > | null
  submittedAt?: any
  status?: "pending" | "evaluated" | "failed"
}

interface Competition {
  id: string
  title: string
  status: string
  endDeadline: any
}

export default function ResultsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Auth state management
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!id || typeof id !== "string") {
          throw new Error("Invalid competition ID")
        }

        // 🔹 Call backend API instead of Firestore directly
        const { competition, submissions } = await fetchCompetitionResults(id)

        setCompetition(competition)
        setSubmissions(submissions)
      } catch (err: any) {
        console.error("Error fetching results:", err)
        setError(err.message || "Failed to load results")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, user, authLoading, router])

  const handleRetry = () => {
    if (!user) return

    setLoading(true)
    setError(null)

    const event = new CustomEvent("retry-fetch")
    window.dispatchEvent(event)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString() + " at " + date.toLocaleTimeString()
    } catch {
      return "Invalid date"
    }
  }

  const getSubmissionStatus = (submission: Submission) => {
    if (!submission.finalScore && submission.finalScore !== 0) {
      if (submission.status === "failed") return "failed"
      if (submission.status === "pending") return "pending"
      return "not-evaluated"
    }
    return "evaluated"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "evaluated":
        return <Trophy className="h-5 w-5 text-green-600" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <FileX className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "evaluated":
        return "Evaluation completed"
      case "pending":
        return "Evaluation in progress..."
      case "failed":
        return "Evaluation failed - please contact support"
      default:
        return "Not yet evaluated"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "evaluated":
        return "bg-green-50 border-green-200 text-green-800"
      case "pending":
        return "bg-yellow-50 border-yellow-200 text-yellow-800"
      case "failed":
        return "bg-red-50 border-red-200 text-red-800"
      default:
        return "bg-gray-50 border-gray-200 text-gray-800"
    }
  }

  // Loading states
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-bold text-red-800">Error Loading Results</h2>
          <p className="text-red-700">{error}</p>
          <div className="space-y-2">
            <button
              onClick={handleRetry}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No submissions state
  if (!submissions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-blue-50 border border-blue-200 rounded-xl p-6 text-center space-y-4">
          <User className="h-12 w-12 text-blue-600 mx-auto" />
          <h2 className="text-xl font-bold text-blue-800">No Submissions Found</h2>
          <p className="text-blue-700">You haven't submitted any solutions for this competition yet.</p>
          {competition && (
            <p className="text-sm text-blue-600">
              Competition: <span className="font-semibold">{competition.title}</span>
            </p>
          )}
          <button
            onClick={() => router.back()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Competition
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <button
                onClick={() => router.back()}
                className="mt-1 p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all duration-200 border border-gray-200"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Competition Results</h1>
                {competition && <p className="text-lg text-gray-600 max-w-2xl">{competition.title}</p>}
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Your submissions
                  </span>
                  {competition?.endDeadline && (
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Ended {formatDate(competition.endDeadline)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <FileX className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{submissions.length}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Total Submissions</h3>
              <p className="text-sm text-gray-500">All your attempts</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-50 rounded-xl">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {submissions.filter((s) => getSubmissionStatus(s) === "evaluated").length}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Evaluated</h3>
              <p className="text-sm text-gray-500">Completed assessments</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {submissions.filter((s) => ["pending", "not-evaluated"].includes(getSubmissionStatus(s))).length}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">In Progress</h3>
              <p className="text-sm text-gray-500">Awaiting evaluation</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Your Submissions</h2>
            <span className="text-sm text-gray-500">{submissions.length} total</span>
          </div>

          <div className="grid gap-6">
            {submissions.map((submission, idx) => {
              const status = getSubmissionStatus(submission)

              return (
                <div
                  key={submission.id || idx}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {submission.challengeId || "Unknown Challenge"}
                          </h3>
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}
                          >
                            {getStatusIcon(status)}
                            {getStatusMessage(status)}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          {submission.submittedAt && (
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {formatDate(submission.submittedAt)}
                            </span>
                          )}
                          {submission.id && (
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              ID: {submission.id.slice(-8)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Final Score</h4>
                        {submission.finalScore !== null && submission.finalScore !== undefined ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-gray-900">{submission.finalScore.toFixed(2)}</span>
                            <span className="text-sm text-gray-500">/ 100</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-lg text-gray-400 italic">
                              {status === "pending" ? "Evaluating..." : status === "failed" ? "Failed" : "Pending"}
                            </span>
                            {status === "pending" && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
                          </div>
                        )}
                      </div>

                      {submission.finalScore !== null && submission.finalScore !== undefined && (
                        <div className="text-right">
                          <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                              submission.finalScore >= 80
                                ? "bg-green-50 text-green-700"
                                : submission.finalScore >= 60
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                            }`}
                          >
                            {submission.finalScore >= 80 ? (
                              <>
                                <Trophy className="h-4 w-4" />
                                Excellent
                              </>
                            ) : submission.finalScore >= 60 ? (
                              <>
                                <Clock className="h-4 w-4" />
                                Good
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4" />
                                Needs Improvement
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
