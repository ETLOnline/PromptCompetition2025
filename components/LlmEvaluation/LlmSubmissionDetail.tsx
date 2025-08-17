"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, FileText, Brain } from "lucide-react"
import type { LlmEvaluation, LlmSubmissionDetailProps } from "@/types/llmEvaluations"

export function LlmSubmissionDetail({ submission, challengeId, competitionId, onClose }: LlmSubmissionDetailProps) {
  const [expandedEvaluations, setExpandedEvaluations] = useState<Set<string>>(new Set())

  const toggleEvaluationExpansion = (evaluationId: string) => {
    setExpandedEvaluations((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(evaluationId)) {
        newSet.delete(evaluationId)
      } else {
        newSet.add(evaluationId)
      }
      return newSet
    })
  }

  const averageScore =
    submission.llmScores.length > 0
      ? submission.llmScores.reduce((sum, evaluation) => sum + evaluation.finalScore, 0) /
        submission.llmScores.length
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white shadow-sm rounded-xl p-6 hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Submission Details</h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>ID: {submission.id}</span>
              </div>
            </div>
          </div>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              Close
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs font-medium text-blue-800 mb-1">LLM Evaluations</div>
            <div className="text-lg font-bold text-blue-900">{submission.llmScores.length}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="text-xs font-medium text-emerald-800 mb-1">Average Score</div>
            <div className="text-lg font-bold text-emerald-900">{averageScore.toFixed(1)}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-xs font-medium text-amber-800 mb-1">Challenge</div>
            <div className="text-lg font-bold text-amber-900">{challengeId}</div>
          </div>
        </div>
      </Card>

      {/* Prompt Text */}
      <Card className="bg-white shadow-sm rounded-xl p-6 hover:shadow-md transition-all duration-200">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Prompt Text</h3>
          <div className="text-xs font-medium text-gray-500 mb-3">The original prompt submitted for evaluation</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="max-w-4xl">
            <pre className="text-sm text-gray-900 font-mono leading-relaxed whitespace-pre-wrap break-words">
              {submission.promptText}
            </pre>
          </div>
        </div>
      </Card>

      {/* LLM Evaluations */}
      <Card className="bg-white shadow-sm rounded-xl p-6 hover:shadow-md transition-all duration-200">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">LLM Evaluations</h3>
          <div className="text-xs font-medium text-gray-500 mb-3">
            Detailed evaluations from different language models
          </div>
        </div>

        {submission.llmScores.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-700 mb-1">No evaluations available</div>
            <div className="text-xs text-gray-500">This submission has not been evaluated yet.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {submission.llmScores.map((evaluation, index) => (
              <div key={evaluation.id}>
                <EvaluationCard
                  evaluation={evaluation}
                  isExpanded={expandedEvaluations.has(evaluation.id)}
                  onToggleExpansion={() => toggleEvaluationExpansion(evaluation.id)}
                />
                {index < submission.llmScores.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Metadata */}
      {submission.metadata && Object.keys(submission.metadata).length > 0 && (
        <Card className="bg-white shadow-sm rounded-xl p-6 hover:shadow-md transition-all duration-200">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Additional Metadata</h3>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <pre className="text-xs text-gray-700 font-mono">{JSON.stringify(submission.metadata, null, 2)}</pre>
          </div>
        </Card>
      )}
    </div>
  )
}

interface EvaluationCardProps {
  evaluation: LlmEvaluation
  isExpanded: boolean
  onToggleExpansion: () => void
}

function EvaluationCard({ evaluation, isExpanded, onToggleExpansion }: EvaluationCardProps) {
  const criterionEntries = Object.entries(evaluation.criterionScores)

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      {/* Evaluation Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-900">{evaluation.modelName}</span>
          </div>
          <Badge className="bg-blue-100 text-blue-800 text-xs font-medium">
            Final Score: {evaluation.finalScore.toFixed(1)}
          </Badge>
        </div>
        <Button
          onClick={onToggleExpansion}
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-900 hover:bg-blue-100"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </Button>
      </div>

      {/* Criterion Scores Grid */}
      {criterionEntries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
          {criterionEntries.map(([criterion, score]) => (
            <div key={criterion} className="bg-white rounded-lg p-2 border border-blue-200">
              <div className="text-xs font-medium text-blue-800 capitalize mb-1">
                {criterion.replace(/([A-Z])/g, " $1").trim()}
              </div>
              <div className="text-sm font-bold text-blue-900">{score.toFixed(1)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Evaluation Explanation */}
      {isExpanded && evaluation.description && (
        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <div className="text-xs font-medium text-blue-800 mb-2">Evaluation Explanation</div>
          <div className="text-sm text-blue-900 leading-relaxed">{evaluation.description}</div>
        </div>
      )}
    </div>
  )
}
