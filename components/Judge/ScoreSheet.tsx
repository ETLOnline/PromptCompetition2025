"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Save, FileText } from "lucide-react"
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Score Submission
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission Info */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Participant ID:</span>
              <span className="text-sm">{submission.participantId}</span>
            </div>
            <Badge variant="outline">{submission.status}</Badge>
          </div>

          {/* Rubric Score Inputs */}
          <div className="space-y-4">
            {challenge.rubric.map((criterion) => (
                <div
                key={criterion.name}
                className="flex items-center justify-between gap-4"
                >
                <Label className="text-sm font-medium text-gray-900">
                    {criterion.name}
                </Label>

                <Input
                    type="number"
                    min={0}
                    max={100}
                    className="max-w-[80px]"
                    value={scoreFormData.rubricScores[criterion.name] || 0}
                    onChange={(e) =>
                    onScoreChange("rubricScores", {
                        ...scoreFormData.rubricScores,
                        [criterion.name]: Number(e.target.value),
                    })
                    }
                />
                </div>
            ))}
            </div>


          {/* Overall Feedback */}
          <div>
            <Label>Feedback</Label>
            <Textarea
              placeholder="General feedback..."
              value={scoreFormData.comment || ""}
              onChange={(e) => onScoreChange("comment", e.target.value)}
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={onSave} disabled={isSavingScore}>
              <Save className="h-4 w-4 mr-2" />
              {isSavingScore ? "Saving..." : "Save Score"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
