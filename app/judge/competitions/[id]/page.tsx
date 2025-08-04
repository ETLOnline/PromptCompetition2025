"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase" // Adjust import path as needed
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Trophy,
  FileText,
  Save,
  ArrowLeft,
  Star,
  Clock,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  Lock,
  Loader,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface Submission {
  id: string
  participant_ID: string
  challenge_ID: string
  promptText: string
  submittedAt: any
  status: string
}

interface Challenge {
  id: string
  title: string
  problemStatement: string
}

interface JudgeScore {
  judgeId: string
  score: number
  comment?: string
  updatedAt: any
}

interface SubmissionWithChallenge extends Submission {
  challenge: Challenge
  judgeScore?: JudgeScore
}

interface NotificationState {
  message: string
  type: "success" | "error" | "warning"
  submissionId?: string
}

interface ParticipantData {
  id: string
  locked?: boolean
}

export default function JudgeReviewPage() {
  const params = useParams()
  const router = useRouter()
  const participantId = params.id as string

  const [submissions, setSubmissions] = useState<SubmissionWithChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({})
  const [expandedProblemStatements, setExpandedProblemStatements] = useState<Record<string, boolean>>({})
  const [notification, setNotification] = useState<NotificationState | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const [lockConfirmText, setLockConfirmText] = useState("")
  const [pendingSubmissionId, setPendingSubmissionId] = useState<string | null>(null)
  const [participantData, setParticipantData] = useState<ParticipantData | null>(null)

  const { user } = useAuth()
  const judgeId = user.uid

  useEffect(() => {
    fetchSubmissions()
    fetchParticipantData()
  }, [participantId])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)

      // Fetch submissions for this participant
      const submissionsQuery = query(
        collection(db, process.env.NEXT_PUBLIC_SUBMISSION_DATABASE || "submissions"),
        where("participant_ID", "==", participantId),
      )

      const submissionsSnapshot = await getDocs(submissionsQuery)
      const submissionsData = submissionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Submission[]

      // Fetch challenge data and judge scores for each submission
      const submissionsWithChallenges = await Promise.all(
        submissionsData.map(async (submission) => {
          // Fetch challenge data
          const challengeDoc = await getDoc(doc(db, "challenges", submission.challenge_ID))
          const challenge = challengeDoc.exists()
            ? ({ id: challengeDoc.id, ...challengeDoc.data() } as Challenge)
            : { id: submission.challenge_ID, title: "Unknown Challenge", problemStatement: "Challenge not found" }

          // Fetch existing judge score
          const judgeScoreDoc = await getDoc(doc(db, "submissions", submission.id, "evaluation", "Judge_Score"))
          const judgeScore = judgeScoreDoc.exists() ? (judgeScoreDoc.data() as JudgeScore) : undefined

          return {
            ...submission,
            challenge,
            judgeScore,
          }
        }),
      )

      setSubmissions(submissionsWithChallenges)

      // Pre-fill scores and comments from existing judge scores
      const initialScores: Record<string, number> = {}
      const initialComments: Record<string, string> = {}

      submissionsWithChallenges.forEach((submission) => {
        if (submission.judgeScore) {
          initialScores[submission.id] = submission.judgeScore.score
          initialComments[submission.id] = submission.judgeScore.comment || ""
        }
      })

      setScores(initialScores)
      setComments(initialComments)
    } catch (error) {
      console.error("Error fetching submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (submissionId: string, score: number) => {
    setScores((prev) => ({ ...prev, [submissionId]: score }))
  }

  const handleCommentChange = (submissionId: string, comment: string) => {
    setComments((prev) => ({ ...prev, [submissionId]: comment }))
  }

  const toggleSubmissionExpanded = (submissionId: string) => {
    setExpandedSubmissions((prev) => ({ ...prev, [submissionId]: !prev[submissionId] }))
  }

  const toggleProblemStatementExpanded = (submissionId: string) => {
    setExpandedProblemStatements((prev) => ({ ...prev, [submissionId]: !prev[submissionId] }))
  }

  const showNotification = (message: string, type: "success" | "error" | "warning", submissionId?: string) => {
    setNotification({ message, type, submissionId })
    setTimeout(() => setNotification(null), 5000) // Auto dismiss after 5 seconds
  }

  const dismissNotification = () => {
    setNotification(null)
  }

  const fetchParticipantData = async () => {
    try {
      const participantDoc = await getDoc(doc(db, "participants", participantId))
      if (participantDoc.exists()) {
        setParticipantData({ id: participantDoc.id, ...participantDoc.data() } as ParticipantData)
      }
    } catch (error) {
      console.error("Error fetching participant data:", error)
    }
  }

  const saveScore = async (submissionId: string) => {
    // Check if participant is locked
    if (participantData?.locked) {
      showNotification("This participant's judgement is locked and cannot be modified.", "error")
      return
    }

    // Check if this is an update (existing score)
    const existingSubmission = submissions.find((s) => s.id === submissionId)
    if (existingSubmission?.judgeScore) {
      setPendingSubmissionId(submissionId)
      setIsConfirmModalOpen(true)
      return
    }

    // Proceed with saving
    await performSaveScore(submissionId)
  }

  const performSaveScore = async (submissionId: string) => {
    try {
      setSaving(submissionId)

      const score = scores[submissionId]
      const comment = comments[submissionId]

      if (!score || score < 1 || score > 10) {
        showNotification("Please enter a valid score between 1 and 10", "error", submissionId)
        return
      }

      const judgeScoreData = {
        judgeId,
        score,
        comment: comment || "",
        updatedAt: serverTimestamp(),
      }
      // setDoc(documentReference, dataObject)

      await setDoc(doc(db, "submissions", submissionId, "evaluation", "Judge_Score"), judgeScoreData)

      // Update local state
      setSubmissions((prev) =>
        prev.map((submission) =>
          submission.id === submissionId ? { ...submission, judgeScore: judgeScoreData as JudgeScore } : submission,
        ),
      )

      showNotification("Score saved successfully!", "success", submissionId)
    } catch (error) {
      console.error("Error saving score:", error)
      showNotification("Error saving score. Please try again.", "error", submissionId)
    } finally {
      setSaving(null)
    }
  }

  const handleConfirmUpdate = async () => {
    setIsConfirmModalOpen(false)
    if (pendingSubmissionId) {
      await performSaveScore(pendingSubmissionId)
      setPendingSubmissionId(null)
    }
  }

  const handleCancelUpdate = () => {
    setIsConfirmModalOpen(false)
    setPendingSubmissionId(null)
  }

  const handleLockParticipant = () => {
    // Check if all submissions have scores
    const unscored = submissions.filter((s) => !s.judgeScore)
    if (unscored.length > 0) {
      showNotification(
        `Please score all submissions before locking. ${unscored.length} submission(s) remaining.`,
        "warning",
      )
      return
    }
    setIsLockModalOpen(true)
  }

  const performLockParticipant = async () => {
    if (lockConfirmText !== "SURE") {
      showNotification('Please type "SURE" to confirm locking.', "error")
      return
    }

    try {
      // Lock the participant
      await setDoc(
        doc(db, "participants", participantId),
        {
          locked: true,
          lockedBy: judgeId,
          lockedAt: serverTimestamp(),
        },
        { merge: true },
      )

      // Update all submissions to judgement_complete
      const updatePromises = submissions.map((submission) =>
        setDoc(
          doc(db, "submissions", submission.id),
          {
            status: "judgement_complete",
          },
          { merge: true },
        ),
      )

      await Promise.all(updatePromises)

      // Update local state
      setParticipantData((prev) => (prev ? { ...prev, locked: true } : null))
      setSubmissions((prev) => prev.map((submission) => ({ ...submission, status: "judgement_complete" })))

      setIsLockModalOpen(false)
      setLockConfirmText("")
      showNotification("Participant judgement locked successfully. No further changes can be made.", "success")
    } catch (error) {
      console.error("Error locking participant:", error)
      showNotification("Error locking participant. Please try again.", "error")
    }
  }

  const handleCancelLock = () => {
    setIsLockModalOpen(false)
    setLockConfirmText("")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-150 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Loading submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-150">
      {/* Notification Component */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div
            className={`
              p-4 rounded-xl border shadow-sm transition-all duration-300 transform translate-x-0
              ${
                notification.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : notification.type === "error"
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {notification.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                {notification.type === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
                {notification.type === "warning" && <AlertCircle className="w-5 h-5 text-amber-600" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{notification.message}</p>
              </div>
              <Button
                onClick={dismissNotification}
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Score Updates */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[350px] text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-amber-50">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Update Score?</h2>
            <p className="text-gray-700 mb-6">
              This submission already has a score. Are you sure you want to update it?
            </p>
            <div className="flex justify-center gap-4">
              <Button
                className="bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:shadow-md transition-all duration-200 font-medium px-6"
                onClick={handleConfirmUpdate}
              >
                Yes, Update
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 px-6 bg-transparent"
                onClick={handleCancelUpdate}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lock Participant Modal */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[400px] text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-red-50">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Lock Participant Judgement</h2>
            <p className="text-gray-700 mb-4">
              This will permanently lock all judgements for this participant.
              <span className="text-red-600 font-semibold">
                {" "}
                You will not be able to make any changes after this action.
              </span>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-600 font-bold">"SURE"</span> to confirm:
              </label>
              <input
                type="text"
                value={lockConfirmText}
                onChange={(e) => setLockConfirmText(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all duration-200 text-center font-mono"
                placeholder="Type SURE"
              />
            </div>
            <div className="flex justify-center gap-4">
              <Button
                className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-md transition-all duration-200 font-medium px-6 disabled:opacity-50"
                onClick={performLockParticipant}
                disabled={lockConfirmText !== "SURE"}
              >
                <Lock className="w-4 h-4 mr-2" />
                Lock Permanently
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 px-6 bg-transparent"
                onClick={handleCancelLock}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-150 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Judge Review Panel
                {participantData?.locked && (
                  <span className="ml-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-medium uppercase">
                    <Lock className="w-4 h-4" />
                    LOCKED
                  </span>
                )}
              </h1>
              <p className="text-gray-700 font-medium text-base mt-1">
                Participant ID: <span className="text-gray-900 font-mono">{participantId}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {submissions.length === 0 ? (
          <Card className="bg-white shadow-sm rounded-xl">
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Submissions Found</h3>
              <p className="text-gray-700">This participant hasn't submitted any challenges yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
                      <p className="text-gray-700 font-medium text-sm">Total Submissions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {submissions.filter((s) => s.judgeScore).length}
                      </p>
                      <p className="text-gray-700 font-medium text-sm">Scored</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {submissions.filter((s) => !s.judgeScore).length}
                      </p>
                      <p className="text-gray-700 font-medium text-sm">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    {!participantData?.locked ? (
                      <Button
                        onClick={handleLockParticipant}
                        disabled={submissions.filter((s) => !s.judgeScore).length > 0}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium w-full"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Lock Judgement
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-red-600">
                        <Lock className="w-5 h-5" />
                        <span className="font-semibold">Locked</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-700 mt-2">
                      {!participantData?.locked ? "Complete all scores first" : "Judgement is final"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submissions List */}
            <div className="space-y-4">
              {submissions.map((submission, index) => (
                <Card
                  key={submission.id}
                  className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200"
                >
                  <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-150 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-900">
                            {submission.challenge.title}
                          </CardTitle>
                          <CardDescription className="text-gray-700 font-medium mt-1">
                            Submission #{index + 1} • {submission.status}
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {submission.judgeScore && (
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                            <Star className="w-4 h-4 text-blue-800" />
                            <span className="text-blue-800 font-semibold text-xs uppercase">
                              {submission.judgeScore.score}/10
                            </span>
                          </div>
                        )}

                        <Button
                          onClick={() => toggleSubmissionExpanded(submission.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-700 hover:bg-gray-50 transition-all duration-200"
                        >
                          {expandedSubmissions[submission.id] ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedSubmissions[submission.id] && (
                    <CardContent className="space-y-6 pt-6">
                      {/* Participant's Solution */}
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-3">Participant's Solution</h4>
                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                          <p className="text-gray-700 whitespace-pre-wrap font-medium text-base">
                            {submission.promptText}
                          </p>
                        </div>
                      </div>

                      {/* Scoring Section */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Score Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Score (1-10)</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={scores[submission.id] || ""}
                              onChange={(e) => handleScoreChange(submission.id, Number.parseInt(e.target.value))}
                              className={`
                                w-full px-4 py-3 rounded-lg bg-gray-50 border text-gray-900 placeholder-gray-500
                                focus:outline-none focus:ring-2 transition-all duration-200
                                ${
                                  notification?.submissionId === submission.id && notification.type === "error"
                                    ? "border-red-300 focus:border-red-400 focus:ring-red-900/10"
                                    : "border-gray-300 focus:border-gray-400 focus:ring-gray-900/10"
                                }
                              `}
                              placeholder="Enter score (1-10)"
                            />
                            {scores[submission.id] && (scores[submission.id] < 1 || scores[submission.id] > 10) && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                              </div>
                            )}
                          </div>
                          {scores[submission.id] && (scores[submission.id] < 1 || scores[submission.id] > 10) && (
                            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Score must be between 1 and 10
                            </p>
                          )}
                        </div>

                        {/* Comment Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
                          <textarea
                            value={comments[submission.id] || ""}
                            onChange={(e) => handleCommentChange(submission.id, e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10 transition-all duration-200 resize-none"
                            placeholder="Add feedback for the participant..."
                          />
                        </div>
                      </div>

                      {/* Problem Statement Dropdown */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-bold text-gray-900">Problem Statement</h4>
                          <Button
                            onClick={() => toggleProblemStatementExpanded(submission.id)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-700 hover:bg-gray-50 transition-all duration-200"
                          >
                            {expandedProblemStatements[submission.id] ? (
                              <>
                                <ChevronDown className="w-4 h-4 mr-2" />
                                Hide Problem
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-4 h-4 mr-2" />
                                Show Problem
                              </>
                            )}
                          </Button>
                        </div>

                        {expandedProblemStatements[submission.id] && (
                          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                            <p className="text-gray-700 whitespace-pre-wrap font-medium text-base">
                              {submission.challenge.problemStatement}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t border-gray-200">
                        <Button
                          onClick={() => saveScore(submission.id)}
                          disabled={
                            saving === submission.id ||
                            !scores[submission.id] ||
                            scores[submission.id] < 1 ||
                            scores[submission.id] > 10 ||
                            participantData?.locked
                          }
                          className="bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium px-6 py-2"
                        >
                          {saving === submission.id ? (
                            <>
                              <Loader className="animate-spin h-4 w-4 mr-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              {submission.judgeScore ? "Update Score" : "Save Score"}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, query, doc, getDoc, where, orderBy, documentId  } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AdminNavbar } from "@/components/AdminNavbar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import {
    Trophy,
    Users,
    Eye,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock,
    Target,
    Filter,
    ArrowUpDown,
    UserCheck,
    Search,
} from "lucide-react"

interface ParticipantAssignment {
    id: string
    participantId: string
    totalChallenges: number
    reviewedChallenges: number
    status: "pending" | "in-progress" | "completed"
    lastReviewedAt?: Date
}

type SortOption = "progress" | "status" | "name" | "assigned"
type FilterOption = "all" | "pending" | "in-progress" | "completed"

export default function JudgeDashboard() {
    const [assignments, setAssignments] = useState<ParticipantAssignment[]>([])
    const [filteredAssignments, setFilteredAssignments] = useState<ParticipantAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<SortOption>("progress")
    const [filterBy, setFilterBy] = useState<FilterOption>("all")
    const [searchTerm, setSearchTerm] = useState("")
    const router = useRouter()
    const { user } = useAuth();

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
            setLoading(true);
            setError(null);

            const judgeId = user.uid; 
            if (!judgeId) {
                setError("No judge is logged in.");
                setLoading(false);
                return;
            }

            // Step 1: Get the list of participant IDs assigned to this judge
            const judgeDocRef = doc(db, "judges", judgeId);
            const judgeSnap = await getDoc(judgeDocRef);

            if (!judgeSnap.exists()) {
                setError("Judge data not found.");
                setLoading(false);
                return;
            }

            const judgeData = judgeSnap.data();
            const assignedParticipants: string[] = judgeData.participants || [];

            if (assignedParticipants.length === 0) {
                setAssignments([]); // No assignments
                setLoading(false);
                return;
            }

            // Step 2: Fetch only those participant docs from leaderboard
            const participantsRef = collection(db, process.env.NEXT_PUBLIC_LEADERBOARD_DATABASE || "leaderboard");

            // Firestore only allows up to 10 items in `documentId() in [...]` queries
            const chunks = [];
            for (let i = 0; i < assignedParticipants.length; i += 10) {
                chunks.push(assignedParticipants.slice(i, i + 10));
            }

            let results: any[] = [];
            for (const chunk of chunks) {
                const q = query(participantsRef, where(documentId(), "in", chunk));
                const snap = await getDocs(q);
                snap.forEach((doc) => results.push({ id: doc.id, ...doc.data() }));
            }

            // Step 3: Format data (simplified - adapt to your UI expectations)
            const assignments: ParticipantAssignment[] = results.map((doc: any) => ({
                id: `assignment-${doc.id}`,
                participantId: doc.id,
                totalChallenges: doc.totalChallenges ?? 0,
                reviewedChallenges: doc.reviewedChallenges ?? 0,
                status:
                doc.reviewedChallenges >= doc.totalChallenges
                    ? "completed"
                    : doc.reviewedChallenges > 0
                    ? "in-progress"
                    : "pending",
                lastReviewedAt: doc.lastReviewedAt ? new Date(doc.lastReviewedAt) : undefined,
            }));

            setAssignments(assignments);
            } catch (err) {
            console.error("Error fetching assignments:", err);
            setError("Failed to load participant assignments. Please try again.");
            } finally {
            setLoading(false);
            }
        };

        fetchAssignments();
        }, []);


    useEffect(() => {
        let filtered = [...assignments]

        // Apply search filter
        if (searchTerm) {
        filtered = filtered.filter((assignment) =>
            assignment.participantId.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        }

        // Apply status filter
        if (filterBy !== "all") {
        filtered = filtered.filter((assignment) => assignment.status === filterBy)
        }

        // Apply sort
        filtered.sort((a, b) => {
        switch (sortBy) {
            case "progress":
            return b.reviewedChallenges / b.totalChallenges - a.reviewedChallenges / a.totalChallenges
            case "status":
            const statusOrder = { pending: 0, "in-progress": 1, completed: 2 }
            return statusOrder[a.status] - statusOrder[b.status]
            default:
            return 0
        }
        })

        setFilteredAssignments(filtered)
    }, [assignments, sortBy, filterBy, searchTerm])

    const handleReviewSubmissions = (participantId: string) => {
        router.push(`/judge/${participantId}`)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
        case "pending":
            return (
            <div className="px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-xs font-medium border border-gray-200 flex items-center gap-1 uppercase">
                <Clock className="w-3 h-3" />
                PENDING
            </div>
            )
        case "in-progress":
            return (
            <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium border border-amber-200 flex items-center gap-1 uppercase">
                <Target className="w-3 h-3" />
                IN PROGRESS
            </div>
            )
        case "completed":
            return (
            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-200 flex items-center gap-1 uppercase">
                <CheckCircle2 className="w-3 h-3" />
                COMPLETED
            </div>
            )
        default:
            return null
        }
    }

    const getProgressPercentage = (reviewed: number, total: number) => {
        return Math.round((reviewed / total) * 100)
    }

    const stats = {
        total: assignments.length,
        pending: assignments.filter((a) => a.status === "pending").length,
        inProgress: assignments.filter((a) => a.status === "in-progress").length,
        completed: assignments.filter((a) => a.status === "completed").length,
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-150 text-white">
            <AdminNavbar />
            <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="text-center">
                <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-white-250 to-white-400">
                    <Trophy className="w-8 h-8 text-black" />
                </div>
                <h1 className="text-3xl font-bold text-black">Judge Evaluation Panel</h1>
                </div>
                <p className="text-base font-medium text-black max-w-2xl mx-auto">
                Review and evaluate assigned participants' challenge submissions with comprehensive tracking and progress
                monitoring
                </p>
                <div className="mt-6 flex items-center justify-center gap-4 text-lg text-black">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="font-large">{assignments.length} Assigned Participants</span>
                </div>
                </div>
            </div>
            </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Loading State */}
            {loading && (
            <div className="flex items-center justify-center py-16">
                <Card className="bg-white shadow-sm rounded-xl border-0">
                <CardContent className="p-8 text-center">
                    <Loader2 className="w-8 h-8 text-gray-900 animate-spin mx-auto mb-4" />
                    <p className="text-gray-700 font-medium">Loading assignments...</p>
                </CardContent>
                </Card>
            </div>
            )}

            {/* Error State */}
            {error && (
            <div className="flex items-center justify-center py-16">
                <Card className="max-w-md w-full bg-white shadow-sm rounded-xl border border-red-200">
                <CardContent className="p-8">
                    <div className="text-center">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 w-fit mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h3>
                    <p className="text-gray-700 font-medium mb-4">{error}</p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-gray-800 hover:to-gray-700 text-white font-medium transition-all duration-200"
                    >
                        Try Again
                    </Button>
                    </div>
                </CardContent>
                </Card>
            </div>
            )}

            {/* Stats Cards */}
            {!loading && !error && assignments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-white text-black rounded-t-xl">
                    <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase">Total Assigned</span>
                    </div>
                </CardHeader>
                <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{stats.total}</div>
                    <div className="text-sm font-medium text-gray-700">Participants</div>
                </CardContent>
                </Card>

                <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-white text-black rounded-t-xl">
                    <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase">Pending</span>
                    </div>
                </CardHeader>
                <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{stats.pending}</div>
                    <div className="text-sm font-medium text-gray-700">Reviews</div>
                </CardContent>
                </Card>

                <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-white text-black rounded-t-xl">
                    <div className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase">In Progress</span>
                    </div>
                </CardHeader>
                <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-amber-600 mb-2">{stats.inProgress}</div>
                    <div className="text-sm font-medium text-gray-700">Reviews</div>
                </CardContent>
                </Card>

                <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-white text-black rounded-t-xl">
                    <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase">Completed</span>
                    </div>
                </CardHeader>
                <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-emerald-600 mb-2">{stats.completed}</div>
                    <div className="text-sm font-medium text-gray-700">Reviews</div>
                </CardContent>
                </Card>
            </div>
            )}

            {/* Controls */}
            {!loading && !error && assignments.length > 0 && (
            <Card className="bg-white shadow-sm rounded-xl mb-8">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 text-black rounded-t-xl">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase">Filter & Search</span>
                </div>
                </CardHeader>
                <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by participant ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200"
                    />
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-700" />
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-700" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200"
                    >
                        <option value="progress">Sort by Progress</option>
                        <option value="status">Sort by Status</option>
                        <option value="name">Sort by Name</option>
                        <option value="assigned">Sort by Assigned Date</option>
                    </select>
                    </div>
                </div>
                </CardContent>
            </Card>
            )}

            {/* Assignments List */}
            {!loading && !error && filteredAssignments.length > 0 && (
            <div className="space-y-4">
                {filteredAssignments.map((assignment) => {
                const progressPercentage = getProgressPercentage(
                    assignment.reviewedChallenges,
                    assignment.totalChallenges,
                )

                return (
                    <Card
                    key={assignment.id}
                    className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 group"
                    >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                        {/* Left side - Participant Info and Status */}
                        <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700">
                            <UserCheck className="w-6 h-6 text-white" />
                            </div>

                            <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                                ID: {assignment.participantId.slice(0, 8)}
                                </h3>
                                {getStatusBadge(assignment.status)}
                            </div>
                            <p className="text-sm font-medium text-gray-700">Assigned for evaluation and review</p>
                            </div>
                        </div>

                        {/* Middle - Progress */}
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                            <div className="text-sm font-medium text-gray-700 mb-1">Progress</div>
                            <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                {assignment.reviewedChallenges}/{assignment.totalChallenges}
                                </span>
                            </div>
                            </div>
                            <div className="text-center">
                            <div className="text-sm font-medium text-gray-700 mb-1">Completion</div>
                            <div className="text-xl font-bold text-gray-900">{progressPercentage}%</div>
                            </div>
                        </div>

                        {/* Right side - Action Button */}
                        <div className="flex-shrink-0 ml-6">
                            <Button
                            onClick={() => handleReviewSubmissions(assignment.participantId)}
                            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-800 hover:to-gray-700 text-white font-medium transition-all duration-200 hover:shadow-lg px-6"
                            >
                            <Eye className="w-4 h-4 mr-2" />
                            Review Submissions
                            </Button>
                        </div>
                        </div>
                    </CardContent>
                    </Card>
                )
                })}
            </div>
            )}

            {/* Empty State */}
            {!loading && !error && assignments.length === 0 && (
            <div className="text-center py-16">
                <Card className="bg-white shadow-sm rounded-xl max-w-md mx-auto">
                <CardContent className="p-8">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-from-gray-600 to-gray-700 w-fit mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Participants Assigned</h3>
                    <p className="text-gray-700 font-medium">
                    You don't have any participants assigned for evaluation yet. Check back later or contact an
                    administrator.
                    </p>
                </CardContent>
                </Card>
            </div>
            )}

            {/* No Results from Filter */}
            {!loading && !error && assignments.length > 0 && filteredAssignments.length === 0 && (
            <div className="text-center py-16">
                <Card className="bg-white shadow-sm rounded-xl max-w-md mx-auto">
                <CardContent className="p-8">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 w-fit mx-auto mb-4">
                    <Filter className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Results Found</h3>
                    <p className="text-gray-700 font-medium mb-4">
                    No participants match your current filter criteria. Try adjusting your filters.
                    </p>
                    <Button
                    onClick={() => {
                        setFilterBy("all")
                        setSortBy("progress")
                        setSearchTerm("")
                    }}
                    className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-gray-800 hover:to-gray-700 text-black font-medium transition-all duration-200"
                    >
                    Clear Filters
                    </Button>
                </CardContent>
                </Card>
            </div>
            )}
        </div>
        </div>
    )
}
