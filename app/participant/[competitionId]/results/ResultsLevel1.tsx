"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Trophy, Clock, AlertCircle, FileX, ChevronDown, ChevronUp, ArrowLeft, Eye } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import CompetitionLeaderboard from "@/components/results/CompetitionLeaderboard"
import ParticipantBreadcrumb from "@/components/participant-breadcrumb"

interface LLMScore {
  description: string
  finalScore: number | null
  scores: Record<string, number>
}

interface Submission {
  id?: string
  challengeId: string
  finalScore: number | null
  llmScores?: Record<string, LLMScore> | null
  submissionTime?: any
  status?: "pending" | "evaluated" | "scored" | "failed"
  rank?: number
  promptText?: string
}

interface Competition {
  id: string
  title: string
  status: string
  endDeadline: any
}

interface UserStats {
  finalScore: number | null
  llmScore: number | null
  rank: number | null
}

interface ResultsLevel1Props {
  submissions: Submission[]
  competition: Competition
  userOverallStats: UserStats | null
  competitionId: string
}

export default function ResultsLevel1({ submissions, competition, userOverallStats, competitionId }: ResultsLevel1Props) {
  const router = useRouter()
  const [expandedFeedback, setExpandedFeedback] = useState<Record<string, boolean>>({})
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({})
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null)
  const [maxScore, setMaxScore] = useState<number | null>(null)

  useEffect(() => {
    const fetchMaxScore = async () => {
      try {
        const competitionRef = doc(db, "competitions", competitionId)
        const competitionSnap = await getDoc(competitionRef)
        if (competitionSnap.exists()) {
          const data = competitionSnap.data()
          setMaxScore(data?.maxScore || (data?.ChallengeCount || 0) * 100)
        }
      } catch (error) {
        console.error("Error fetching max score:", error)
      }
    }
    fetchMaxScore()
  }, [competitionId])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown"
    try {
      let date: Date
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Firestore Timestamp
        date = timestamp.toDate()
      } else if (timestamp._seconds) {
        // Firestore Timestamp object with _seconds
        date = new Date(timestamp._seconds * 1000)
      } else if (typeof timestamp === 'string') {
        // ISO string
        date = new Date(timestamp)
      } else {
        date = new Date(timestamp)
      }
      
      if (isNaN(date.getTime())) {
        return "Invalid date"
      }
      
      return date.toLocaleDateString() + " at " + date.toLocaleTimeString()
    } catch (error) {
      console.error("Error formatting date:", error, timestamp)
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

  const getModelDisplayName = (modelKey: string) => {
    const modelNames: Record<string, string> = {
      "anthropic/claude-sonnet-4": "Claude Sonnet 4",
      "google/gemini-2.5-flash": "Gemini 2.5 Flash",
      "openai/gpt-5-chat": "GPT-5 Chat",
    }
    return modelNames[modelKey] || modelKey
  }

  const getModelColor = (modelKey: string) => {
    const colors: Record<string, string> = {
      "anthropic/claude-sonnet-4": "from-purple-50 to-purple-100 border-purple-200",
      "google/gemini-2.5-flash": "from-blue-50 to-blue-100 border-blue-200",
      "openai/gpt-5-chat": "from-green-50 to-green-100 border-green-200",
    }
    return colors[modelKey] || "from-gray-50 to-gray-100 border-gray-200"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <ParticipantBreadcrumb />
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mx-4 sm:mx-6 lg:mx-8 mt-6 mb-8">
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 rounded-t-2xl">
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
                  {competition && (
                    <p className="text-lg text-gray-600 mb-1">{competition.title}</p>
                  )}
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-200">
                      Level 1 - LLM Evaluation
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const element = document.getElementById('competition-leaderboard');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-transparent hover:bg-gray-50 rounded-xl transition-all duration-200 border border-gray-300 text-sm font-medium flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <Trophy className="h-4 w-4" />
                Go to Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  {submissions.filter((s) => getSubmissionStatus(s) === "pending").length}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">In Progress</h3>
              <p className="text-sm text-gray-500">Awaiting evaluation</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {userOverallStats?.rank || "N/A"}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Your Rank</h3>
              <p className="text-sm text-gray-500">Overall position</p>
            </div>
          </div>
        </div>

        {/* Overall Score Section */}
        {userOverallStats && userOverallStats.finalScore !== null && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl p-8 shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Overall Performance</h2>
                  <p className="text-sm text-gray-600">Your aggregate score across all challenges</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Total Score</span>
                    <Trophy className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {userOverallStats.finalScore?.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {maxScore ? `Out of ${maxScore} points` : "Sum of all challenge scores"}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Your Rank</span>
                    <Trophy className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    #{userOverallStats.rank}
                  </div>
                  <p className="text-xs text-gray-500">Position in leaderboard</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submissions List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Your Submissions</h2>
            <span className="text-sm text-gray-500">{submissions.length} total</span>
          </div>

          <div className="grid gap-6">
            {submissions.map((submission, idx) => {
              const status = getSubmissionStatus(submission)
              const submissionKey = `${submission.id || idx}`
              const isExpanded = expandedSubmissions[submissionKey]

              return (
                <div
                  key={submissionKey}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Submission Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Challenge {submission.challengeId}
                          </h3>
                          <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-2 ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                            {getStatusMessage(status)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          Submitted on {formatDate(submission.submissionTime)}
                        </p>
                      </div>
                      {status === "evaluated" && submission.finalScore !== null && (
                        <div className="text-right">
                          <div className="text-3xl font-bold text-blue-600">
                            {submission.finalScore.toFixed(2)}
                          </div>
                          <p className="text-xs text-gray-500">Final Score</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission Content */}
                  <div className="p-6">
                    {/* Prompt Text */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Your Submission
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {submission.promptText || "No prompt text available"}
                        </p>
                      </div>
                    </div>

                    {/* LLM Evaluations */}
                    {status === "evaluated" && submission.llmScores && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          AI Model Evaluations ({Object.keys(submission.llmScores).length} models)
                        </h4>
                        
                        <div className="grid gap-4">
                          {Object.entries(submission.llmScores).map(([modelKey, modelScore]) => {
                            const feedbackKey = `${submissionKey}_${modelKey}`
                            const isFeedbackExpanded = expandedFeedback[feedbackKey]

                            return (
                              <div
                                key={modelKey}
                                className={`bg-gradient-to-r ${getModelColor(modelKey)} rounded-xl border p-5`}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-900 mb-1">
                                      {getModelDisplayName(modelKey)}
                                    </h5>
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className="text-gray-700">
                                        Score: <span className="font-bold">{modelScore.finalScore}</span>
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setExpandedFeedback((prev) => ({
                                        ...prev,
                                        [feedbackKey]: !prev[feedbackKey],
                                      }))
                                    }
                                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                                  >
                                    {isFeedbackExpanded ? (
                                      <ChevronUp className="h-5 w-5 text-gray-600" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5 text-gray-600" />
                                    )}
                                  </button>
                                </div>

                                {/* Rubric Scores */}
                                {modelScore.scores && Object.keys(modelScore.scores).length > 0 && (
                                  <div className="mb-3 flex flex-wrap gap-2">
                                    {Object.entries(modelScore.scores).map(([criterion, score]) => (
                                      <div
                                        key={criterion}
                                        className="bg-white/70 px-3 py-1.5 rounded-lg text-xs"
                                      >
                                        <span className="text-gray-600">{criterion}:</span>{" "}
                                        <span className="font-semibold text-gray-900">{score}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Feedback Description */}
                                {isFeedbackExpanded && modelScore.description && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-700 mb-2">Detailed Feedback:</p>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {modelScore.description}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {status === "pending" && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                        <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                        <p className="text-sm text-yellow-800">
                          Your submission is being evaluated by our AI models. This usually takes a few minutes.
                        </p>
                      </div>
                    )}

                    {status === "failed" && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-800">
                          The evaluation encountered an error. Please contact support for assistance.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Competition Leaderboard */}
        <CompetitionLeaderboard competitionId={competitionId} competitionLevel="Level 1" />
      </div>
    </div>
  )
}
