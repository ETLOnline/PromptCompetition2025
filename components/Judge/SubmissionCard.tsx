"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CheckCircle2, Star, Eye, EyeOff, Award, TrendingUp, ChevronUp, ChevronDown } from "lucide-react"
import { getAvatarColor } from "@/lib/judge/utils"
import type { Submission } from "@/types/judge-submission"

interface SubmissionCardProps {
  submission: Submission
  userUID: string | null
  onOpenScoring: (submission: Submission) => void
}

export function SubmissionCard({ submission, userUID, onOpenScoring }: SubmissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showModelInsights, setShowModelInsights] = useState(false)

  const isGraded = userUID && submission.judgeScore?.[userUID]
  const judgeScore = userUID && submission.judgeScore?.[userUID]

  const toggleExpansion = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  return (
    <Card className={`${isGraded ? "border-green-200 bg-green-50/30" : ""}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={`${getAvatarColor(submission.participantId)} text-white font-semibold`}>
                {submission.participantId.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">Participant {submission.participantId}</h3>
              <p className="text-sm text-gray-600">Submission ID: {submission.id.slice(0, 8)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isGraded && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Total Score: {judgeScore ? judgeScore.totalScore.toFixed(1) : "N/A"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Prompt Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-gray-900">Submission Text</Label>
              <Button variant="ghost" size="sm" onClick={toggleExpansion} className="text-xs">
                {isExpanded ? (
                  <>
                    <EyeOff className="w-3 h-3 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Expand
                  </>
                )}
              </Button>
            </div>
            <div className={`text-sm text-gray-700 ${isExpanded ? "" : "line-clamp-3"} bg-gray-50 p-3 rounded border`}>
              {submission.promptText || "No submission text available"}
            </div>
          </div>

          {/* Model Insights */}
          {submission.llmScores && Object.keys(submission.llmScores).length > 0 && (
            <div>
              <Collapsible open={showModelInsights} onOpenChange={setShowModelInsights}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between bg-transparent">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Model Insights ({Object.keys(submission.llmScores).length} models)
                    </span>
                    {showModelInsights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="space-y-3">
                    {Object.entries(submission.llmScores).map(([modelName, modelScore]) => (
                      <div key={modelName} className="p-3 border rounded bg-blue-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{modelName}</h4>
                          <Badge variant="outline">Score: {modelScore.finalScore.toFixed(1)}</Badge>
                        </div>
                        {modelScore.description && (
                          <p className="text-sm text-gray-600 mb-2">{modelScore.description}</p>
                        )}
                        {modelScore.scores && (
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(modelScore.scores).map(([criterion, score]) => (
                              <div key={criterion} className="text-xs">
                                <span className="font-medium">{criterion}:</span> {score}
                              </div>
                            ))}
                          </div>
                        )}
                      </div> 
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onOpenScoring(submission)}
              size="sm"
              className={isGraded ? "bg-green-600 hover:bg-green-700" : "bg-gray-900 hover:bg-gray-800"}
            >
              <Award className="w-4 h-4 mr-1" />
              {isGraded ? "Update Score" : "Score Submission"}
            </Button>
            {judgeScore && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Last scored: {new Date(judgeScore.updatedAt?.seconds * 1000 || Date.now()).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
