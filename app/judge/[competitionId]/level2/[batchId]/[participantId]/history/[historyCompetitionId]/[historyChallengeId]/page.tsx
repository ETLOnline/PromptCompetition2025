"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader, FileText, AlertCircle, Calendar, Trophy, Volume2, Eye } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { useNotifications } from "@/hooks/useNotifications"
import { Notifications } from "@/components/Notifications"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

interface Challenge {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  rubric: Array<{
    name: string
    description: string
    weight: number
  }>
  problemAudioUrls?: string[]
  guidelinesAudioUrls?: string[]
  visualClueUrls?: string[]
}

interface Submission {
  id: string
  promptText: string
  participantId: string
  challengeId: string
  submittedAt: any
  judgeScores?: any
  llmScores?: any
}

// Helper function to format date from various formats
const formatDate = (dateValue: any): string => {
  if (!dateValue) return "N/A"
  
  try {
    // Handle ISO string format
    if (typeof dateValue === 'string') {
      return new Date(dateValue).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // Handle Firestore Timestamp
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // Handle timestamp with seconds
    if (dateValue._seconds || dateValue.seconds) {
      const timestamp = (dateValue._seconds || dateValue.seconds) * 1000
      return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    return "N/A"
  } catch (error) {
    console.error('Error formatting date:', error)
    return "N/A"
  }
}

export default function ViewPreviousSubmission() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const batchId = params?.batchId as string
  const participantId = params?.participantId as string
  const historyCompetitionId = params?.historyCompetitionId as string
  const historyChallengeId = params?.historyChallengeId as string

  const [userUID, setUserUID] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [hasSubmission, setHasSubmission] = useState(true)
  const [participantName, setParticipantName] = useState<string>("")
  const [competitionTitle, setCompetitionTitle] = useState<string>("")
  const [judgeDetails, setJudgeDetails] = useState<Record<string, {fullName: string, email: string}>>({})
  const [isLoading, setIsLoading] = useState(true)

  const { notifications, addNotification, removeNotification } = useNotifications()

  // Function to fetch judge details
  const fetchJudgeDetails = async (judgeIds: string[]) => {
    try {
      const judgeDetailsMap: Record<string, {fullName: string, email: string}> = {}
      
      for (const judgeId of judgeIds) {
        const judgeRef = doc(db, "users", judgeId)
        const judgeSnap = await getDoc(judgeRef)
        
        if (judgeSnap.exists()) {
          const judgeData = judgeSnap.data()
          judgeDetailsMap[judgeId] = {
            fullName: judgeData?.fullName || "Unknown Judge",
            email: judgeData?.email || ""
          }
        } else {
          judgeDetailsMap[judgeId] = {
            fullName: "Unknown Judge",
            email: ""
          }
        }
      }
      
      setJudgeDetails(judgeDetailsMap)
    } catch (error) {
      console.error("Error fetching judge details:", error)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_JUDGE_AUTH}`)
      setUserUID(profile.uid)
      setIsAuthenticated(true)
    } catch (error) {
      router.push("/")
    }
  }

  useEffect(() => {
    if (isAuthenticated && userUID) {
      loadData()
    }
  }, [isAuthenticated, userUID, historyCompetitionId, historyChallengeId, participantId])

  const loadData = async () => {
    try {
      setIsLoading(true)

      // Fetch competition title from the history competition
      const competitionRef = doc(db, "competitions", historyCompetitionId)
      const competitionSnap = await getDoc(competitionRef)
      if (competitionSnap.exists()) {
        setCompetitionTitle(competitionSnap.data()?.title || "Competition")
      }

      // Fetch participant name
      const participantRef = doc(db, "competitions", historyCompetitionId, "participants", participantId)
      const participantSnap = await getDoc(participantRef)
      if (participantSnap.exists()) {
        setParticipantName(participantSnap.data()?.fullName || "Unknown Participant")
      } else {
        // Try to fetch from current competition if not found in history competition
        const currentParticipantRef = doc(db, "competitions", competitionId, "participants", participantId)
        const currentParticipantSnap = await getDoc(currentParticipantRef)
        if (currentParticipantSnap.exists()) {
          setParticipantName(currentParticipantSnap.data()?.fullName || "Unknown Participant")
        }
      }

      // Fetch challenge details from the history competition
      const challengeRef = doc(db, "competitions", historyCompetitionId, "challenges", historyChallengeId)
      const challengeSnap = await getDoc(challengeRef)
      
      if (!challengeSnap.exists()) {
        addNotification("error", "Challenge not found")
        router.push(`/judge/${competitionId}/level2/${batchId}/${participantId}/history`)
        return
      }

      const challengeData = challengeSnap.data()
      setChallenge({
        id: historyChallengeId,
        title: challengeData?.title || `Challenge ${historyChallengeId}`,
        problemStatement: challengeData?.problemStatement || "",
        guidelines: challengeData?.guidelines || "",
        rubric: challengeData?.rubric || [],
        problemAudioUrls: challengeData?.problemAudioUrls || [],
        guidelinesAudioUrls: challengeData?.guidelinesAudioUrls || [],
        visualClueUrls: challengeData?.visualClueUrls || []
      })

      // Fetch submission from the history competition
      const submissionId = `${participantId}_${historyChallengeId}`
      const submissionRef = doc(db, "competitions", historyCompetitionId, "submissions", submissionId)
      const submissionSnap = await getDoc(submissionRef)

      if (submissionSnap.exists()) {
        const subData = submissionSnap.data()
        const submissionData = {
          id: submissionId,
          promptText: subData?.promptText || "",
          participantId: participantId,
          challengeId: historyChallengeId,
          submittedAt: subData?.submittedAt,
          judgeScores: subData?.judgeScores || null,
          llmScores: subData?.llmScores || null
        }
        
        setSubmission(submissionData)
        setHasSubmission(true)

        // Fetch judge details if there are judge scores
        if (submissionData.judgeScores && Object.keys(submissionData.judgeScores).length > 0) {
          const judgeIds = Object.keys(submissionData.judgeScores)
          await fetchJudgeDetails(judgeIds)
        }
      } else {
        setHasSubmission(false)
        setSubmission(null)
      }

    } catch (error) {
      console.error("Error loading data:", error)
      addNotification("error", "Failed to load submission data")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateWeightedTotal = (rubricScores: Record<string, number>, rubric: any[]) => {
    let totalScore = 0
    rubric.forEach((criterion) => {
      const score = rubricScores[criterion.name] || 0
      totalScore += (score * criterion.weight) / 100
    })
    return Math.round(totalScore * 100) / 100
  }

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="animate-spin w-8 h-8 text-gray-900" />
          <p className="text-gray-900 font-medium mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Challenge Not Found</h3>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Notifications notifications={notifications} removeNotification={removeNotification} />

      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-blue-600" />
                  <CardTitle className="text-2xl">{competitionTitle}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Challenge: {challenge.title} • Participant: {participantName}
                </p>
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  Previous Submission (View Only)
                </Badge>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push(`/judge/${competitionId}/level2/${batchId}/${participantId}/history`)}
              >
                Back to History
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Challenge Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Challenge Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Problem Statement */}
            {challenge.problemStatement && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Problem Statement</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{challenge.problemStatement}</p>
              </div>
            )}

            {/* Problem Audio */}
            {challenge.problemAudioUrls && challenge.problemAudioUrls.length > 0 && (
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Problem Audio
                </h3>
                {challenge.problemAudioUrls.map((url, idx) => (
                  <audio key={idx} controls className="w-full mb-2">
                    <source src={url} type="audio/mpeg" />
                  </audio>
                ))}
              </div>
            )}

            {/* Guidelines */}
            {challenge.guidelines && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Guidelines</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{challenge.guidelines}</p>
              </div>
            )}

            {/* Guidelines Audio */}
            {challenge.guidelinesAudioUrls && challenge.guidelinesAudioUrls.length > 0 && (
              <div className="bg-emerald-50 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Guidelines Audio
                </h3>
                {challenge.guidelinesAudioUrls.map((url, idx) => (
                  <audio key={idx} controls className="w-full mb-2">
                    <source src={url} type="audio/mpeg" />
                  </audio>
                ))}
              </div>
            )}

            {/* Visual Clues */}
            {challenge.visualClueUrls && challenge.visualClueUrls.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Visual Clues
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {challenge.visualClueUrls.map((url, idx) => (
                    <img key={idx} src={url} alt={`Visual clue ${idx + 1}`} className="rounded-lg border border-amber-200" />
                  ))}
                </div>
              </div>
            )}

            {/* Rubric */}
            {challenge.rubric && challenge.rubric.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-3">Evaluation Rubric</h3>
                <div className="space-y-3">
                  {challenge.rubric.map((criterion, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-gray-900">{criterion.name}</h4>
                        <Badge variant="secondary">{criterion.weight}%</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{criterion.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission */}
        <Card>
          <CardHeader>
            <CardTitle>Participant Submission</CardTitle>
          </CardHeader>
          <CardContent>
            {hasSubmission && submission ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Submitted: {formatDate(submission.submittedAt)}</span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{submission.promptText}</p>
                </div>

                {/* Judge Scores (if available) */}
                {submission.judgeScores && Object.keys(submission.judgeScores).length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3">Judge Evaluations</h3>
                    <div className="space-y-4">
                      {Object.entries(submission.judgeScores).map(([judgeId, scoreData]: [string, any]) => {
                        const judge = judgeDetails[judgeId] || { fullName: "Unknown Judge", email: "" }
                        return (
                          <div key={judgeId} className="bg-white rounded-lg p-4 border border-blue-200">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <p className="font-medium text-gray-900">{judge.fullName}</p>
                                {judge.email && (
                                  <p className="text-sm text-gray-600">{judge.email}</p>
                                )}
                              </div>
                              <Badge className="bg-blue-600 text-white">
                                Score: {scoreData.totalScore}
                              </Badge>
                            </div>
                            {scoreData.comment && (
                              <div className="mt-2 text-sm text-gray-700">
                                <p className="font-medium mb-1">Feedback:</p>
                                <p className="text-gray-600">{scoreData.comment}</p>
                              </div>
                            )}
                            {scoreData.rubricScores && (
                              <div className="mt-3 space-y-2">
                                <p className="text-sm font-medium text-gray-700">Rubric Scores:</p>
                                {Object.entries(scoreData.rubricScores).map(([criterion, score]: [string, any]) => (
                                  <div key={criterion} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{criterion}</span>
                                    <span className="font-medium">{score}/100</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* LLM Scores (if available) */}
                {submission.llmScores && Object.keys(submission.llmScores).length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-3">AI Model Evaluations</h3>
                    <div className="space-y-4">
                      {Object.entries(submission.llmScores).map(([modelName, scoreData]: [string, any]) => (
                        <div key={modelName} className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex justify-between items-center mb-3">
                            <p className="font-medium text-gray-900">Model: {modelName}</p>
                            <Badge className="bg-green-600 text-white">
                              Score: {scoreData.finalScore}
                            </Badge>
                          </div>
                          {scoreData.description && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Evaluation:</p>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                                {scoreData.description}
                              </p>
                            </div>
                          )}
                          {scoreData.scores && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">Rubric Scores:</p>
                              {Object.entries(scoreData.scores).map(([criterion, score]: [string, any]) => (
                                <div key={criterion} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{criterion}</span>
                                  <span className="font-medium">{score}/100</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 rounded-lg p-6 text-center border border-red-200">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">No Submission Found</h3>
                <p className="text-red-700">
                  This participant did not submit a response for this challenge.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
