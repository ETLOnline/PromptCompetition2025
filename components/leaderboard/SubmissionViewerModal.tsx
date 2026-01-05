"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, User, Calendar, Trophy, FileText, Eye, Award } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Submission {
  id: string
  challengeId: string
  challengeTitle: string
  participantId: string
  participantName: string
  participantEmail: string
  submittedPrompt: string
  llmScore?: number
  judgeScore?: number
  finalScore?: number
  submittedAt: any
  evaluationStatus?: string
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
            <span className="font-bold">{participantName}'s Submissions</span>
          </DialogTitle>
          <DialogDescription>
            View all submissions for this participant in this competition
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
                  className="border rounded-lg p-4 space-y-3 hover:border-blue-300 transition-colors bg-gradient-to-br from-white to-gray-50/50"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono bg-blue-50 border-blue-200 text-blue-700">
                          Submission #{index + 1}
                        </Badge>
                        <Badge variant="secondary" className="font-semibold">
                          {submission.challengeTitle || "Challenge"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium text-gray-900">{submission.participantName}</span>
                        <span className="text-xs hidden sm:inline">({submission.participantEmail})</span>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex flex-col gap-1.5 items-end">
                      {submission.llmScore !== undefined && submission.llmScore !== null && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-300 font-mono">
                          LLM: {submission.llmScore.toFixed(2)}
                        </Badge>
                      )}
                      {submission.judgeScore !== undefined && submission.judgeScore !== null && (
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
                    </div>
                  </div>

                  {/* Submission Content */}
                  <div className="bg-muted/50 rounded-md p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      SUBMITTED PROMPT
                    </p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{submission.submittedPrompt}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {formatDate(submission.submittedAt)}
                      </span>
                    </div>
                    {submission.evaluationStatus && (
                      <Badge variant="outline" className="text-xs">
                        {submission.evaluationStatus}
                      </Badge>
                    )}
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
