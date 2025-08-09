"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, User, Calendar, FileText, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { getFirestore, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import type { Submission } from "../../types/judge-submission"

interface SubmissionAccordionItemProps {
  submission: Submission
  competitionId: string
  judgeId: string
  isExpanded: boolean
  onToggle: () => void
  onUpdate: (updatedSubmission: Submission) => void
}

export function SubmissionAccordionItem({
  submission,
  competitionId,
  judgeId,
  isExpanded,
  onToggle,
  onUpdate,
}: SubmissionAccordionItemProps) {
    const [score, setScore] = useState(submission.judgeScore?.score?.toString() ?? "")
    const [comment, setComment] = useState(submission.judgeScore?.comment ?? "")
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const canEvaluate = submission.status === "selected_for_manual_review"
    const isEvaluated = submission.status === "evaluated"
    const isMyEvaluation = submission.judgeScore?.judgeId === judgeId

    async function handleSubmitEvaluation() {
        const numericScore = Number(score)
        if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        setError("Score must be a number between 0 and 100.")
        return
        }

        if (!comment || comment.trim().length < 10) {
        setError("Comment must be at least 10 characters long.")
        return
        }

        setSaving(true)
        setError(null)
        setSuccess(false)

        try {
        const db = getFirestore()
        const subRef = doc(db, "competitions", competitionId, "submissions", submission.id)

        await updateDoc(subRef, {
            judgeScore: {
            judgeId,
            score: numericScore,
            comment: comment.trim(),
            evaluatedAt: serverTimestamp(),
            },
            status: "evaluated",
        })

        const updatedSubmission: Submission = {
            ...submission,
            status: "evaluated",
            judgeScore: {
            judgeId,
            score: numericScore,
            comment: comment.trim(),
            evaluatedAt: new Date() as any, // Will be replaced by server timestamp
            },
        }

        onUpdate(updatedSubmission)
        setSuccess(true)
        } catch (e: any) {
        setError(e?.message ?? "Failed to save evaluation")
        } finally {
        setSaving(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
        case "pending":
            return "bg-gray-100 text-gray-800"
        case "selected_for_manual_review":
            return "bg-yellow-100 text-yellow-800"
        case "evaluated":
            return "bg-green-100 text-green-800"
        default:
            return "bg-gray-100 text-gray-800"
        }
    }

    return (
        <Card className="w-full">
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Participant {submission.participantId}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(submission.status)}>{submission.status.replace(/_/g, " ")}</Badge>
                    {isEvaluated && submission.judgeScore && (
                    <Badge variant="outline">Score: {submission.judgeScore.score}</Badge>
                    )}
                </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-7">
                <Calendar className="h-3 w-3" />
                <span>Submitted {submission.submittedAt?.toDate?.()?.toLocaleDateString() ?? "Unknown date"}</span>
                </div>
            </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
                {/* Submission Content */}
                <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Submission Content
                </h4>

                {submission.content?.text && (
                    <div>
                    <Label className="text-sm font-medium">Response</Label>
                    <div className="mt-1 rounded-md border bg-muted/30 p-3">
                        <p className="whitespace-pre-wrap text-sm">{submission.content.text}</p>
                    </div>
                    </div>
                )}

                {submission.content?.files && submission.content.files.length > 0 && (
                    <div>
                    <Label className="text-sm font-medium">Attached Files</Label>
                    <div className="mt-1 space-y-2">
                        {submission.content.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between rounded-md border p-2">
                            <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                {file.type}
                            </Badge>
                            <span className="text-sm">{file.name}</span>
                            </div>
                            <Button asChild size="sm" variant="ghost">
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                                View
                            </a>
                            </Button>
                        </div>
                        ))}
                    </div>
                    </div>
                )}
                </div>

                {/* Evaluation Section */}
                {canEvaluate && (
                <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Evaluation</h4>

                    {success && (
                    <div className="mb-4 flex items-center rounded-md bg-green-50 p-3 text-green-700">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        <span>Evaluation submitted successfully!</span>
                    </div>
                    )}

                    {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700">
                        <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        <span>{error}</span>
                        </div>
                    </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor={`score-${submission.id}`} className="text-sm font-medium">
                        Score (0–100) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                        id={`score-${submission.id}`}
                        type="number"
                        min={0}
                        max={100}
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder="Enter score..."
                        className="mt-1"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor={`comment-${submission.id}`} className="text-sm font-medium">
                        Comment <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                        id={`comment-${submission.id}`}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Provide detailed feedback..."
                        rows={4}
                        className="mt-1"
                        />
                    </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                        setScore("")
                        setComment("")
                        setError(null)
                        }}
                        disabled={saving}
                    >
                        Clear
                    </Button>
                    <Button onClick={handleSubmitEvaluation} disabled={saving || !score || !comment}>
                        {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                        ) : (
                        "Submit Evaluation"
                        )}
                    </Button>
                    </div>
                </div>
                )}

                {isEvaluated && isMyEvaluation && (
                <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Your Evaluation</h4>
                    <div className="space-y-2">
                    <div>
                        <span className="font-medium">Score:</span>{" "}
                        <span className="font-mono">{submission.judgeScore?.score}</span>
                    </div>
                    <div>
                        <span className="font-medium">Comment:</span>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground mt-1">
                        {submission.judgeScore?.comment}
                        </p>
                    </div>
                    </div>
                </div>
                )}

                {isEvaluated && !isMyEvaluation && (
                <div className="border-t pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="h-5 w-5" />
                    <span>This submission has been evaluated by another judge.</span>
                    </div>
                </div>
                )}
            </CardContent>
            </CollapsibleContent>
        </Collapsible>
        </Card>
    )
}
