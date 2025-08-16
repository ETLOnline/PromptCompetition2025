"use client"

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, MessageCircle, Target, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

interface ChallengeAccordionItemProps {
  challengeId: string
  evaluations: {
    scores: Record<string, number>
    totalScore: number
    comment: string
    updatedAt: any
  }[]
}

export default function ChallengeAccordionItem({ challengeId, evaluations }: ChallengeAccordionItemProps) {
  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    if (score >= 60) return <AlertTriangle className="w-4 h-4 text-amber-600" />
    return <XCircle className="w-4 h-4 text-red-600" />
  }

  const getScoreColors = (score: number) => {
    if (score >= 80)
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-200",
      }
    if (score >= 60)
      return {
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-200",
      }
    return {
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-200",
    }
  }

  return (
    <AccordionItem value={challengeId} className="border-0">
      <AccordionTrigger className="hover:no-underline py-4 px-4 hover:bg-slate-50 rounded-t-lg transition-all duration-200 focus:ring-2 focus:ring-gray-900/10 focus:outline-none">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Challenge {challengeId}</h3>
              <div className="flex items-center gap-2">
                <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {evaluations.length} EVALUATION{evaluations.length !== 1 ? "S" : ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4 mt-3">
          {evaluations.map((evaluation, idx) => {
            const scoreColors = getScoreColors(evaluation.totalScore)

            return (
              <Card
                key={idx}
                className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg hover:border-slate-300"
              >
                <CardContent className="p-4">
                  {/* Header with Total Score */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Evaluation #{idx + 1}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {getScoreIcon(evaluation.totalScore)}
                          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                            PERFORMANCE SCORE
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={`text-lg font-bold px-4 py-2 border ${scoreColors.bg} ${scoreColors.text} ${scoreColors.border} hover:shadow-md transition-all duration-200`}
                    >
                      {evaluation.totalScore}
                    </Badge>
                  </div>

                  {/* Scores Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {Object.entries(evaluation.scores).map(([criterion, score]) => {
                      const criterionColors = getScoreColors(score)

                      return (
                        <div
                          key={criterion}
                          className={`flex items-center justify-between p-3 rounded-lg ${criterionColors.bg} border ${criterionColors.border} hover:shadow-sm hover:scale-[1.02] transition-all duration-200`}
                        >
                          <div className="flex items-center gap-2">
                            {getScoreIcon(score)}
                            <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                              {criterion.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                          </div>
                          <span className={`font-bold text-sm ${criterionColors.text}`}>{score}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Comment Section */}
                  {evaluation.comment && (
                    <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all duration-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-600 flex-shrink-0 mt-1 hover:bg-blue-700 transition-all duration-200">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-blue-800" />
                            <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wide">JUDGE FEEDBACK</h5>
                          </div>
                          <p className="text-sm font-medium text-blue-800 leading-relaxed">{evaluation.comment}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
