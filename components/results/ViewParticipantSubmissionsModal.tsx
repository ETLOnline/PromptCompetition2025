"use client"

import { useState, useEffect } from "react"
import { X, FileText, ChevronDown, ChevronUp, Eye, Headphones, ImageIcon } from "lucide-react"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Submission {
  id: string
  challengeId: string
  promptText: string
  finalScore: number | null
  submissionTime: string
  judgeScores?: Record<string, any>
  llmScores?: Record<string, any>
}

interface Challenge {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  problemAudioUrls?: string[]
  guidelinesAudioUrls?: string[]
  visualClueUrls?: string[]
  systemPrompt?: string
}

interface ViewParticipantSubmissionsModalProps {
  isOpen: boolean
  onClose: () => void
  participantId: string
  participantName: string
  competitionId: string
}

export function ViewParticipantSubmissionsModal({
  isOpen,
  onClose,
  participantId,
  participantName,
  competitionId,
}: ViewParticipantSubmissionsModalProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [challenges, setChallenges] = useState<Record<string, Challenge>>({})
  const [expandedChallenges, setExpandedChallenges] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchSubmissions()
    }
  }, [isOpen, participantId, competitionId])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)

      // Fetch all submissions for this participant
      const submissionsRef = collection(db, "competitions", competitionId, "submissions")
      const q = query(submissionsRef, where("participantId", "==", participantId))
      const snapshot = await getDocs(q)

      const submissionData: Submission[] = []
      const challengeIds = new Set<string>()

      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        submissionData.push({
          id: docSnap.id,
          challengeId: data.challengeId,
          promptText: data.promptText || "No submission text",
          finalScore: data.finalScore ?? null,
          submissionTime: data.submissionTime,
          judgeScores: data.judgeScores,
          llmScores: data.llmScores,
        })
        challengeIds.add(data.challengeId)
      })

      // Sort by challenge ID
      submissionData.sort((a, b) => a.challengeId.localeCompare(b.challengeId))
      setSubmissions(submissionData)

      // Fetch challenge details
      const challengeData: Record<string, Challenge> = {}
      for (const challengeId of challengeIds) {
        try {
          const challengeRef = doc(db, "competitions", competitionId, "challenges", challengeId)
          const challengeSnap = await getDoc(challengeRef)
          if (challengeSnap.exists()) {
            const data = challengeSnap.data()
            challengeData[challengeId] = {
              id: challengeId,
              title: data.title || `Challenge ${challengeId}`,
              problemStatement: data.problemStatement || "",
              guidelines: data.guidelines || "",
              problemAudioUrls: data.problemAudioUrls || [],
              guidelinesAudioUrls: data.guidelinesAudioUrls || [],
              visualClueUrls: data.visualClueUrls || [],
              systemPrompt: data.systemPrompt || "",
            }
          }
        } catch (error) {
          console.error(`Error fetching challenge ${challengeId}:`, error)
        }
      }
      setChallenges(challengeData)
    } catch (error) {
      console.error("Error fetching submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleChallengeExpansion = (challengeId: string) => {
    setExpandedChallenges((prev) => ({
      ...prev,
      [challengeId]: !prev[challengeId],
    }))
  }

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleDateString() + " at " + date.toLocaleTimeString()
    } catch {
      return "Unknown"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {participantName}'s Submissions
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                View all submissions for this competition
              </p>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No submissions found for this participant</p>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => {
              const challenge = challenges[submission.challengeId]
              const isExpanded = expandedChallenges[submission.challengeId]

              return (
                <div
                  key={submission.id}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
                >
                  {/* Submission Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Challenge {submission.challengeId}
                          {challenge && ` - ${challenge.title}`}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Submitted on {formatDate(submission.submissionTime)}
                        </p>
                      </div>
                      {submission.finalScore !== null && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {submission.finalScore.toFixed(2)}
                          </div>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission Content */}
                  <div className="p-6 space-y-4">
                    {/* Participant's Submission */}
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Submission Text
                      </h4>
                      <div className="bg-white rounded-md p-4 max-h-64 overflow-y-auto border border-purple-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                          {submission.promptText}
                        </p>
                      </div>
                      <div className="mt-2 text-xs text-purple-700">
                        Characters: {submission.promptText.length} | Words:{" "}
                        {submission.promptText.split(/\s+/).filter(Boolean).length}
                      </div>
                    </div>

                    {/* View Challenge Button */}
                    {challenge && (
                      <button
                        onClick={() => toggleChallengeExpansion(submission.challengeId)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Eye className="h-4 w-4" />
                          {isExpanded ? "Hide" : "View"} Challenge Details
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-600" />
                        )}
                      </button>
                    )}

                    {/* Challenge Details (Expandable) */}
                    {isExpanded && challenge && (
                      <div className="space-y-4 border-t border-gray-200 pt-4">
                        {/* Problem Statement */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h5 className="text-sm font-semibold text-blue-900 mb-2">
                            Problem Statement
                          </h5>
                          {challenge.problemStatement && (
                            <div className="bg-white rounded-md p-3 mb-3 border border-blue-100">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {challenge.problemStatement}
                              </p>
                            </div>
                          )}
                          {challenge.problemAudioUrls && challenge.problemAudioUrls.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-blue-800 mb-2">
                                <Headphones className="h-3 w-3" />
                                <span>Audio Files ({challenge.problemAudioUrls.length})</span>
                              </div>
                              {challenge.problemAudioUrls.map((url, index) => (
                                <div key={index} className="bg-white rounded-md p-2 border border-blue-100">
                                  <audio controls src={url} className="w-full h-8" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Guidelines */}
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <h5 className="text-sm font-semibold text-green-900 mb-2">
                            Guidelines
                          </h5>
                          {challenge.guidelines && (
                            <div className="bg-white rounded-md p-3 mb-3 border border-green-100">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {challenge.guidelines}
                              </p>
                            </div>
                          )}
                          {challenge.guidelinesAudioUrls && challenge.guidelinesAudioUrls.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-green-800 mb-2">
                                <Headphones className="h-3 w-3" />
                                <span>Audio Files ({challenge.guidelinesAudioUrls.length})</span>
                              </div>
                              {challenge.guidelinesAudioUrls.map((url, index) => (
                                <div key={index} className="bg-white rounded-md p-2 border border-green-100">
                                  <audio controls src={url} className="w-full h-8" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Visual Clues */}
                        {challenge.visualClueUrls && challenge.visualClueUrls.length > 0 && (
                          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                            <h5 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              Visual Clues ({challenge.visualClueUrls.length})
                            </h5>
                            <div className="grid grid-cols-2 gap-3">
                              {challenge.visualClueUrls.map((url, index) => (
                                <div
                                  key={index}
                                  className="rounded-md border border-amber-200 overflow-hidden bg-white flex items-center justify-center"
                                >
                                  <img
                                    src={url}
                                    alt={`Visual clue ${index + 1}`}
                                    className="max-w-full max-h-48 object-contain"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rubric - REMOVED */}
                        {/* 
                        {challenge.rubric && challenge.rubric.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h5 className="text-sm font-semibold text-gray-900 mb-3">
                              Evaluation Rubric
                            </h5>
                            <div className="space-y-2">
                              {challenge.rubric.map((item, index) => (
                                <div
                                  key={index}
                                  className="bg-white rounded-md p-3 border border-gray-200"
                                >
                                  <div className="flex items-start justify-between mb-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </p>
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                      Weight: {item.weight}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600">{item.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        */}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
