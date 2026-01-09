// components/LlmEvaluation/ParticipantSearchResults.tsx
"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, User, FileText } from "lucide-react"
import { SubmissionCard } from "./SubmissionCard"
import type { Submission, UserProfile } from "@/types/llmEvaluations"

interface ParticipantSearchResultsProps {
  participantId: string
  submissions: Submission[]
  submissionsByChallenge: Record<string, Submission[]>
  challenges: Array<{ id: string; title: string; [key: string]: any }>
  userProfile?: UserProfile
  onClose: () => void
}

export function ParticipantSearchResults({
  participantId,
  submissions,
  submissionsByChallenge,
  challenges,
  userProfile,
  onClose,
}: ParticipantSearchResultsProps) {
  const challengeMap = new Map(challenges.map((c) => [c.id, c]))

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-white/80 backdrop-blur-sm">
          {/* Header */}
          <div className="border-b border-indigo-200 bg-gradient-to-r from-indigo-100 to-purple-100 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {userProfile && userProfile.fullName !== "Unknown User" ? userProfile.fullName : "Participant"}
                  </h3>
                  {userProfile && userProfile.email !== "Not available" && (
                    <p className="text-sm text-gray-600 mb-2">{userProfile.email}</p>
                  )}
                  <Badge variant="outline" className="font-mono text-xs bg-white border-indigo-300 text-indigo-700">
                    ID: {participantId}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 hover:bg-white/50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-white/70 rounded-lg p-4 border border-indigo-200">
                <div className="text-2xl font-bold text-indigo-700">
                  {submissions.length}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Total Submissions
                </div>
              </div>
              <div className="bg-white/70 rounded-lg p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">
                  {Object.keys(submissionsByChallenge).length}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Challenges Attempted
                </div>
              </div>
            </div>
          </div>

          {/* Submissions by Challenge */}
          <div className="p-6">
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h4>
                <p className="text-gray-500">
                  This participant has not submitted any solutions yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(submissionsByChallenge).map(([challengeId, challengeSubmissions]) => {
                  const challenge = challengeMap.get(challengeId)
                  return (
                    <div key={challengeId} className="space-y-3">
                      {/* Challenge Header */}
                      <div className="flex items-center gap-3 pb-2 border-b border-indigo-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {challengeId}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900">
                            {challenge?.title || `Challenge ${challengeId}`}
                          </h4>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300">
                          {challengeSubmissions.length} submission{challengeSubmissions.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      {/* Submissions for this challenge */}
                      <div className="space-y-3 pl-2">
                        {challengeSubmissions.map((submission) => (
                          <SubmissionCard
                            key={submission.id}
                            submission={submission}
                            userProfile={userProfile}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
