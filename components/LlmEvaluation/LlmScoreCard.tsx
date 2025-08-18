// components/LlmEvaluation/LlmScoreCard.tsx
"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Brain, ChevronDown, ChevronUp, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LlmEvaluation } from "@/types/llmEvaluations"

interface LlmScoreCardProps {
  evaluation: LlmEvaluation
  className?: string
}

export function LlmScoreCard({ evaluation, className }: LlmScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isExplanationOpen, setIsExplanationOpen] = useState(false)
  const hasExplanation = evaluation.description?.trim()?.length > 0

  const getScoreColor = (score: number) => {
    if (score >= 8) return { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300" }
    if (score >= 6) return { text: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-300" }
    if (score >= 4) return { text: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-300" }
    return { text: "text-red-700", bg: "bg-red-50", border: "border-red-300" }
  }

  const getFinalScoreColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500 text-white"
    if (score >= 6) return "bg-blue-500 text-white"
    if (score >= 4) return "bg-amber-500 text-white"
    return "bg-red-500 text-white"
  }

  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-indigo-100">
            <Brain className="h-4 w-4 text-indigo-600" />
          </div>
          <span className="text-sm font-semibold">{evaluation.modelName}</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs px-3 py-1", getFinalScoreColor(evaluation.finalScore))}>
            {evaluation.finalScore.toFixed(1)}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Less" : "More"}
            {isExpanded ? <ChevronUp className="ml-1 w-3 h-3" /> : <ChevronDown className="ml-1 w-3 h-3" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Two-column criteria grid */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(evaluation.criterionScores).map(([criterion, score]) => {
              const { text, bg, border } = getScoreColor(score)
              return (
                <div
                  key={criterion}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg transition",
                    bg,
                    border,
                    "border hover:shadow-sm hover:scale-[1.02]"
                  )}
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-700">
                    {criterion.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className={cn("text-sm font-bold", text)}>{score.toFixed(1)}</span>
                </div>
              )
            })}
          </div>

          {hasExplanation && (
            <Collapsible open={isExplanationOpen} onOpenChange={setIsExplanationOpen}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExplanationOpen(!isExplanationOpen)}
                className="text-xs"
              >
                {isExplanationOpen ? "Hide explanation" : "Show explanation"}
              </Button>
              <CollapsibleContent>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all duration-200 mt-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-600 flex-shrink-0 mt-1 hover:bg-blue-700 transition-all duration-200">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-800" />
                        <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wide">EXPLANATION</h5>
                      </div>
                      <p className="text-sm font-medium text-blue-800 leading-relaxed">
                        {evaluation.description}
                      </p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  )
}
