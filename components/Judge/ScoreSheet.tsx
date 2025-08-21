"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, X, Award } from "lucide-react"
import { calculateWeightedTotal } from "@/lib/judge/utils"
import type { Submission, Challenge, ScoreData } from "@/types/judge-submission"

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
  if (!submission || !challenge) return null

  const total = calculateWeightedTotal(scoreFormData.rubricScores, challenge.rubric)

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[520px] p-5 overflow-y-auto max-h-screen">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <Award className="w-4 h-4" />
            Score Submission
            {submission.status && (
              <Badge variant="outline" className="ml-2">{submission.status}</Badge>
            )}
          </SheetTitle>
        </SheetHeader> 

        <div className="mt-6 space-y-6 text-sm leading-5">
          {/* Submission Preview */}
          <div>
            <Label className="text-xs font-medium text-foreground">Submission Text</Label>
            <Textarea
              value={submission.promptText || "No submission text available"}
              readOnly
              className="mt-2 min-h-[110px] bg-slate-50 text-sm leading-5"
            />
          </div>

          {/* Scoring Criteria */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-medium">Scoring Criteria</Label>
              <Badge variant="secondary" className="text-[10px]">{challenge.rubric.length} items</Badge>
            </div>

            {challenge.rubric.map((criterion, index) => {
              const currentScore = scoreFormData.rubricScores[criterion.name] || 0
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-4">
                    {/* Label on the left */}
                    <Label className="text-sm font-medium w-40">{criterion.name}</Label>

                    {/* Slider in the middle */}
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
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />

                    {/* Number input on the right */}
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
                      className="w-20 text-right"
                      placeholder="0–100"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Weighted Total */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Weighted Total Score:</span>
              <span className="text-2xl font-bold text-gray-900">{total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Calculated using normalized weights from the rubric</p>
          </div>

          {/* Feedback */}
          <div>
            <Textarea
              placeholder="Write constructive feedback for the participant..."
              value={scoreFormData.comment || ""}
              onChange={(e) => onScoreChange("comment", e.target.value)}
              rows={3}
              className="mt-2 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="h-8 text-sm">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={isSavingScore || challenge.rubric.length === 0}
              className="h-8 text-sm bg-gray-900 hover:bg-gray-800"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSavingScore ? "Saving..." : "Save Score"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
