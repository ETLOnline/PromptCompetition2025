"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Loader2, User, Calendar, Trophy, FileText, Eye, Award, Target } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Submission {
  id: string
  challengeId: string
  challengeTitle: string
  challengeDescription?: string
  challengeProblemStatement?: string
  challengeGuidelines?: string
  challengeDifficulty?: string
  challengePoints?: number
  participantId: string
  participantName: string
  participantEmail: string
  submittedPrompt: string
  llmScore?: number
  judgeScore?: number
  finalScore?: number
  submittedAt: any
  evaluationStatus?: string
  competitionTitle?: string
  competitionId?: string
}

interface SubmissionViewerModalProps {
  isOpen: boolean
  onClose: () => void
  participantId: string
  participantName: string
  competitionId: string
}

export function SubmissionViewerModal({
  isOpen,
  onClose,
  participantId,
  participantName,
  competitionId
}: SubmissionViewerModalProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && participantId) {
      fetchSubmissions()
    }
  }, [isOpen, participantId, competitionId])

  const fetchSubmissions = async () => {
    setIsLoading(true)
    try {
      // No authentication required - complete transparency
      const response = await fetch(
        `/api/submissions/by-participant?participantId=${participantId}&competitionId=${competitionId}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("API Error:", response.status, errorData)
        throw new Error(errorData.error || `Failed to fetch submissions (${response.status})`)
      }

      const data = await response.json()
      console.log("Fetched submissions:", data.submissions?.length || 0)
      setSubmissions(data.submissions || [])
    } catch (error: any) {
      console.error("Error fetching submissions:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load submissions",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    
    let date: Date
    if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000)
    } else if (timestamp?.toDate) {
      date = timestamp.toDate()
    } else {
      date = new Date(timestamp)
    }
    
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <span className="font-bold">{participantName}&apos;s Submissions</span>
          </DialogTitle>
          <DialogDescription>
            Complete transparency - View all submission details including challenge context and prompts
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No submissions found</p>
            <p className="text-sm mt-2">This participant hasn't submitted any challenges yet.</p>
          </div>
        ) : (
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {submissions.map((submission, index) => (
                <div
                  key={submission.id}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
                >
                  {/* Header with gradient background */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono bg-blue-100 border-blue-300 text-blue-700 font-semibold">
                            Submission #{index + 1}
                          </Badge>
                          <Badge variant="secondary" className="font-semibold text-base">
                            {submission.challengeTitle || "Challenge"}
                          </Badge>
                          {submission.challengeDifficulty && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {submission.challengeDifficulty}
                            </Badge>
                          )}
                          {submission.challengePoints && (
                            <Badge variant="outline" className="text-xs">
                              {submission.challengePoints} pts
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium text-gray-900">{submission.participantName}</span>
                          <span className="text-xs hidden sm:inline">({submission.participantEmail})</span>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="flex flex-col gap-1.5 items-end">
                        {submission.llmScore !== undefined && submission.llmScore !== null && submission.llmScore > 0 && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-300 font-mono">
                            LLM: {submission.llmScore.toFixed(2)}
                          </Badge>
                        )}
                        {submission.judgeScore !== undefined && submission.judgeScore !== null && submission.judgeScore > 0 && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-300 font-mono">
                            Judge: {submission.judgeScore.toFixed(2)}
                          </Badge>
                        )}
                        {submission.finalScore !== undefined && submission.finalScore !== null && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 font-mono font-bold">
                            <Trophy className="w-3 h-3 mr-1" />
                            {submission.finalScore.toFixed(2)}
                          </Badge>
                        )}
                        {submission.evaluationStatus && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {submission.evaluationStatus.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(submission.submittedAt)}</span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-4 space-y-4">
                    {/* Competition Title */}
                    {submission.competitionTitle && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <Label className="text-sm font-bold text-blue-900 flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          Competition: {submission.competitionTitle}
                        </Label>
                      </div>
                    )}

                    {/* Challenge Description */}
                    {submission.challengeDescription && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-900 mb-2 block">Challenge Description</Label>
                        <div className="bg-gray-50 rounded-md p-3 border max-h-32 overflow-y-auto">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{submission.challengeDescription}</p>
                        </div>
                      </div>
                    )}

                    {/* Problem Statement */}
                    {submission.challengeProblemStatement && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <Label className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4" />
                          Problem Statement
                        </Label>
                        <div className="bg-white rounded-md p-3 border max-h-48 overflow-y-auto">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{submission.challengeProblemStatement}</p>
                        </div>
                      </div>
                    )}

                    {/* Guidelines */}
                    {submission.challengeGuidelines && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <Label className="text-sm font-semibold text-green-900 flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4" />
                          Guidelines
                        </Label>
                        <div className="bg-white rounded-md p-3 border max-h-48 overflow-y-auto">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{submission.challengeGuidelines}</p>
                        </div>
                      </div>
                    )}

                    {/* Submitted Prompt - Highlighted */}
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border-2 border-yellow-300 shadow-sm">
                      <Label className="text-sm font-bold text-yellow-900 flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4" />
                        Participant&apos;s Submitted Prompt
                      </Label>
                      <div className="bg-white rounded-md p-4 border border-yellow-200 max-h-60 overflow-y-auto">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed font-mono">{submission.submittedPrompt || "No prompt submitted"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
