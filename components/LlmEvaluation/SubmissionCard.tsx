// components/LlmEvaluation/SubmissionCard.tsx
"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"
import { ExpandableText } from "./ExpandableText"
import { LlmScoreCard } from "./LlmScoreCard"
import type { Submission, UserProfile } from "@/types/llmEvaluations"

interface SubmissionCardProps {
  submission: Submission
  userProfile?: UserProfile
  className?: string
}

export function SubmissionCard({ submission, userProfile, className = "" }: SubmissionCardProps) {
  const participantId = submission.participantId || submission.userId || submission.id.split('_')[0]

  return (
    <Card
      className={`border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      <div className="p-6 space-y-4">
        {/* Header: User Information */}
        <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {userProfile?.fullName || "Participant"}
            </h3>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {userProfile?.email || ""}
            </p>
            <Badge 
              variant="outline" 
              className="mt-2 text-[10px] font-mono bg-gray-50 text-gray-600 border-gray-200 px-2 py-0.5"
            >
              ID: {participantId}
            </Badge>
          </div>
        </div>

        {/* Body: Expandable Prompt Text */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Submission
          </h4>
          <ExpandableText 
            text={submission.promptText} 
            maxLength={250}
            className="bg-gray-50 rounded-lg p-4 border border-gray-100"
          />
        </div>

        {/* Footer: LLM Score Cards */}
        {submission.llmScores && submission.llmScores.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Evaluations ({submission.llmScores.length})
            </h4>
            <div className="space-y-2">
              {submission.llmScores.map((score) => (
                <div key={score.id} className="border border-gray-100 rounded-md bg-gray-50/50">
                  <LlmScoreCard evaluation={score} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
