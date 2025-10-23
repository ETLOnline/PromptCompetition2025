"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, X, Award, ChevronDown } from "lucide-react"
import { calculateWeightedTotal } from "@/lib/judge/utils"
import type { Submission, Challenge, ScoreData } from "@/types/judge-submission"
import { useState } from "react"

interface ScoreSheetProps {
  isOpen: boolean
  onClose: () => void
  submission: Submission | null
  challenge: Challenge | null
  scoreFormData: ScoreData
  isSavingScore: boolean
  onScoreChange: (field: keyof ScoreData, value: any) => void
  onSave: () => void
}

export function ScoreSheet({
  isOpen,
  onClose,
  submission,
  challenge,
  scoreFormData,
  isSavingScore,
  onScoreChange,
  onSave,
}: ScoreSheetProps) {
  const [expandedCriteria, setExpandedCriteria] = useState<Set<number>>(new Set())
  
  if (!submission || !challenge) return null

  const total = calculateWeightedTotal(scoreFormData.rubricScores, challenge.rubric)
  
  const toggleCriterion = (index: number) => {
    const newExpanded = new Set(expandedCriteria)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedCriteria(newExpanded)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-0 shadow-2xl max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-gray-900">Score Submission</DialogTitle>
              <p className="text-gray-600 text-sm">Evaluate the participant's submission against the rubric criteria</p>
            </div>
            {submission.status && (
              <Badge variant="outline" className="ml-2">{submission.status}</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission Preview */}
          <div>
            <Label htmlFor="submission-text" className="text-sm font-medium text-gray-700 mb-2 block">
              Submission Text
            </Label>
            <Textarea
              id="submission-text"
              value={submission.promptText || "No submission text available"}
              readOnly
              className="min-h-[120px] bg-slate-50 border-gray-200 text-sm leading-6 resize-none"
            />
          </div>

          {/* Scoring Criteria */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <Label className="text-sm font-semibold text-gray-900">Scoring Criteria</Label>
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {challenge.rubric.length} {challenge.rubric.length === 1 ? 'criterion' : 'criteria'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {challenge.rubric.map((criterion, index) => {
                const currentScore = scoreFormData.rubricScores[criterion.name] || 0
                const isExpanded = expandedCriteria.has(index)
                
                return (
                  <div key={index} className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                    <div className="grid grid-cols-[2fr_1fr] gap-8 items-center">
                      {/* Left Column: Criterion text with dropdown */}
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => toggleCriterion(index)}
                          className="w-full text-left flex items-start gap-2 group"
                        >
                          <div className="flex-1 min-w-0">
                            <Label className="text-sm font-bold text-gray-900 leading-6 block line-clamp-2 cursor-pointer group-hover:text-gray-700 transition-colors">
                              {criterion.name}
                            </Label>
                          </div>
                          <ChevronDown 
                            className={`w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        
                        {/* Expanded description */}
                        {isExpanded && criterion.description && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600 leading-relaxed">
                              <span className="font-semibold text-gray-900 block mb-1">
                                Title:
                              </span>
                              <span className="font-semibold text-gray-900 block mb-1">{criterion.name}</span>
                                <hr className="my-2 border-gray-200" />

                              <span className="font-semibold text-gray-900 block mb-1">
                                Description:
                              </span>
                              {criterion.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Scoring controls (vertically centered) */}
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={currentScore}
                          onChange={(e) =>
                            onScoreChange("rubricScores", {
                              ...scoreFormData.rubricScores,
                              [criterion.name]: Number(e.target.value),
                            })
                          }
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                        />

                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={currentScore}
                          onChange={(e) =>
                            onScoreChange("rubricScores", {
                              ...scoreFormData.rubricScores,
                              [criterion.name]: Math.max(0, Math.min(100, Number(e.target.value))) || 0,
                            })
                          }
                          className="w-20 text-center text-base font-medium border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Weighted Total */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900 text-lg block">Weighted Total Score</span>
                <p className="text-xs text-gray-600 mt-1">Calculated using normalized weights from the rubric</p>
              </div>
              <span className="text-4xl font-bold text-gray-900">{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <Label htmlFor="feedback" className="text-sm font-medium text-gray-700 mb-2 block">
              Feedback for Participant
            </Label>
            <Textarea
              id="feedback"
              placeholder="Write constructive feedback for the participant..."
              value={scoreFormData.comment || ""}
              onChange={(e) => onScoreChange("comment", e.target.value)}
              rows={4}
              className="text-sm leading-6 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
            />
          </div>

          {/* Actions */}
          <DialogFooter className="gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 bg-transparent"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={isSavingScore || challenge.rubric.length === 0}
              className="bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSavingScore ? "Saving..." : "Save Score"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}