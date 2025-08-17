"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Brain, ChevronDown, ChevronUp, Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LlmEvaluation } from "@/types/llmEvaluations"


interface LlmScoreCardProps {
  evaluation: LlmEvaluation
  variant?: "default" | "compact" | "detailed"
  showTimestamp?: boolean
  className?: string
}

export function LlmScoreCard({ evaluation, variant = "default", className }: LlmScoreCardProps) {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false)

  const criterionEntries = Object.entries(evaluation.criterionScores)
  const hasExplanation = evaluation.description && evaluation.description.trim().length > 0

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-600 bg-emerald-50 border-emerald-200"
    if (score >= 6) return "text-blue-800 bg-blue-50 border-blue-200"
    if (score >= 4) return "text-amber-600 bg-amber-50 border-amber-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  const getFinalScoreColor = (score: number) => {
    if (score >= 8) return "bg-emerald-50 text-emerald-600 border-emerald-200"
    if (score >= 6) return "bg-blue-50 text-blue-800 border-blue-200"
    if (score >= 4) return "bg-amber-50 text-amber-600 border-amber-200"
    return "bg-red-50 text-red-600 border-red-200"
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all duration-200",
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{evaluation.modelName}</span>
          </div>
          <Badge className={cn("text-xs font-medium uppercase border", getFinalScoreColor(evaluation.finalScore))}>
            {evaluation.finalScore.toFixed(1)}
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("bg-white shadow-sm rounded-xl p-4 hover:shadow-md transition-all duration-200", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-800" />
            <h3 className="text-lg font-bold text-gray-900">{evaluation.modelName}</h3>
          </div>
        </div>
        <Badge className={cn("text-sm font-bold uppercase border-2", getFinalScoreColor(evaluation.finalScore))}>
          FINAL SCORE: {evaluation.finalScore.toFixed(1)}
        </Badge>
      </div>

      {/* Criterion Scores Grid */}
      {criterionEntries.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-3">Criterion Scores</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {criterionEntries.map(([criterion, score]) => (
              <div
                key={criterion}
                className={cn(
                  "rounded-lg p-3 border transition-all duration-200 hover:shadow-sm",
                  getScoreColor(score),
                )}
              >
                <div className="text-xs font-medium uppercase mb-1">{criterion.replace(/([A-Z])/g, " $1").trim()}</div>
                <div className="text-lg font-bold">{score.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation Section */}
      {hasExplanation && (
        <Collapsible open={isExplanationOpen} onOpenChange={setIsExplanationOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-3 h-auto bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {isExplanationOpen ? "HIDE" : "SHOW"} EVALUATION EXPLANATION
                </span>
              </div>
              {isExplanationOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-900 leading-relaxed font-medium">{evaluation.descriptiongit }</div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  )
}

// Utility component for displaying multiple score cards
interface LlmScoreCardListProps {
  evaluations: LlmEvaluation[]
  variant?: "default" | "compact" | "detailed"
  showTimestamp?: boolean
  className?: string
}

export function LlmScoreCardList({
  evaluations,
  variant = "default",
  showTimestamp = false,
  className,
}: LlmScoreCardListProps) {
  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="text-center py-8">
        <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <div className="text-sm font-medium text-gray-700 mb-1">No evaluations available</div>
        <div className="text-xs font-medium text-gray-700">This submission has not been evaluated yet.</div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {evaluations.map((evaluation) => (
        <LlmScoreCard key={evaluation.id} evaluation={evaluation} variant={variant} showTimestamp={showTimestamp} />
      ))}
    </div>
  )
}
