"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { User, Calendar, MessageSquare, FileText, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Level2Evaluation } from "@/types/level2JudgeEvaluations"

interface EvaluationDetailsPanelProps {
  evaluations: Level2Evaluation[]
  selectedBatch: string
  selectedJudge: string
  selectedParticipant: string
  judges: Record<string, string>
  participants: Record<string, string>
}

export default function EvaluationDetailsPanel({
  evaluations,
  selectedBatch,
  selectedJudge,
  selectedParticipant,
  judges,
  participants,
}: EvaluationDetailsPanelProps) {
  const [filteredEvaluations, setFilteredEvaluations] = useState<Level2Evaluation[]>([])

  useEffect(() => {
    let filtered = evaluations

    if (selectedBatch && selectedBatch !== "all") {
      filtered = filtered.filter(e => e.batchId === selectedBatch)
    }

    if (selectedJudge && selectedJudge !== "all") {
      filtered = filtered.filter(e => e.judgeId === selectedJudge)
    }

    if (selectedParticipant && selectedParticipant !== "all") {
      filtered = filtered.filter(e => e.participantId === selectedParticipant)
    }

    setFilteredEvaluations(filtered)
  }, [evaluations, selectedBatch, selectedJudge, selectedParticipant])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (filteredEvaluations.length === 0) {
    return (
      <Card className="h-full bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300">
        <CardContent className="flex flex-col items-center justify-center h-full py-12">
          <div className="p-3 rounded-full bg-slate-100 mb-4">
            <FileText className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Evaluations Found</h3>
          <p className="text-sm text-gray-600 text-center max-w-md">
            No evaluations match the selected filters. Try adjusting your selection.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col shadow-sm bg-white rounded-xl border border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Evaluation Details</h2>
              <p className="text-xs text-gray-600">View detailed evaluation information</p>
            </div>
          </div>
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold text-xs px-2 py-1">
            {filteredEvaluations.length} {filteredEvaluations.length === 1 ? 'Evaluation' : 'Evaluations'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-4">
            {filteredEvaluations.map((evaluation, index) => {
              const challengeIds = Object.keys(evaluation.evaluations)

              return (
                <Card key={`${evaluation.judgeId}-${evaluation.participantId}-${index}`} className="border border-slate-200 shadow-sm">
                  <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-slate-100">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <User className="w-4 h-4 text-blue-700" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Judge</p>
                            <p className="font-bold text-sm text-gray-900">{evaluation.judgeName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-green-100">
                            <User className="w-4 h-4 text-green-700" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Participant</p>
                            <p className="font-bold text-sm text-gray-900">{evaluation.participantName}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">{formatDate(evaluation.lastUpdated)}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {evaluation.evaluatedChallenges.length} / {challengeIds.length} Challenges
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4">
                    <Accordion type="single" collapsible className="w-full">
                      {challengeIds.map((challengeId) => {
                        const evalData = evaluation.evaluations[challengeId]
                        const isEvaluated = evaluation.evaluatedChallenges.includes(challengeId)

                        return (
                          <AccordionItem key={challengeId} value={challengeId} className="border-b last:border-b-0">
                            <AccordionTrigger className="hover:no-underline py-3">
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center gap-3">
                                  {isEvaluated ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-gray-300" />
                                  )}
                                  <span className="font-semibold text-sm">Challenge {challengeId}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!evalData?.hasSubmission && (
                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                                      No Submission
                                    </Badge>
                                  )}
                                  <Badge className={cn(
                                    "text-xs font-bold",
                                    isEvaluated ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                                  )}>
                                    {isEvaluated ? `${evalData?.score || 0} pts` : "Not Evaluated"}
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {isEvaluated && evalData ? (
                                <div className="space-y-4 pt-2 pb-4">
                                  {/* Rubric Scores */}
                                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                    <h4 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Rubric Scores</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                      {Object.entries(evalData.rubricScores).map(([criterion, score]) => (
                                        <div key={criterion} className="bg-white rounded-lg p-3 border border-slate-200">
                                          <p className="text-xs text-gray-500 mb-1">{criterion}</p>
                                          <p className="text-lg font-bold text-gray-900">{score}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Comment */}
                                  {evalData.comment && (
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                      <div className="flex items-start gap-2 mb-2">
                                        <MessageSquare className="w-4 h-4 text-blue-700 mt-0.5" />
                                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Judge's Comment</h4>
                                      </div>
                                      <p className="text-sm text-gray-700 leading-relaxed">{evalData.comment}</p>
                                    </div>
                                  )}

                                  {/* Metadata */}
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>Evaluated: {formatDate(evalData.evaluatedAt)}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 py-2">This challenge has not been evaluated yet.</p>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        )
                      })}
                    </Accordion>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
