"use client"

import { useState, useEffect } from "react"
import { Accordion } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { User, FileText, Clock, FileX, Loader2 } from "lucide-react"
import ChallengeAccordionItem from "./ChallengeAccordionItem"
import { getAvatarColor } from "@/lib/judge/utils"
import type { Evaluation, JudgeDetailSectionProps, ChallengeAccordionItemProps } from "@/types/judgeEvaluations";

export default function JudgeDetailSection({
  judgeIds,
  groupedEvaluations,
  judgeMapping,
  defaultSelectedJudge,
}: JudgeDetailSectionProps) {
  const [selectedJudge, setSelectedJudge] = useState(defaultSelectedJudge)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleJudgeSelect = (e: Event) => {
      const customEvent = e as CustomEvent
      setLoading(true)
      setSelectedJudge(customEvent.detail.judgeId)
      // Simulate brief loading for judge switch
      setTimeout(() => setLoading(false), 300)
    }
    window.addEventListener("judgeSelected", handleJudgeSelect)
    return () => window.removeEventListener("judgeSelected", handleJudgeSelect)
  }, [])

  const evaluationsForJudge = groupedEvaluations[selectedJudge] || {}
  const challengeCount = Object.keys(evaluationsForJudge).length
  const totalEvaluations = Object.values(evaluationsForJudge).reduce((sum, evaluations) => sum + evaluations.length, 0)

  const judgeName = judgeMapping[selectedJudge]
  const avatarColorClass = getAvatarColor(judgeName)

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Section */}
      <Card className="mx-4 mt-4 mb-3 shadow-sm bg-white rounded-lg hover:shadow-md transition-all duration-200 border border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${avatarColorClass} shadow-sm hover:shadow-md transition-all duration-200`}>
              {loading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" aria-label="Loading judge data" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-0.5">
                {loading ? <div className="h-6 bg-slate-200 rounded-lg animate-pulse w-32" /> : judgeName}
              </h2>
              <p className="text-sm font-medium text-gray-700">Judge Performance Overview</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200 border border-slate-200 hover:border-slate-300">
              <div className="p-1.5 rounded bg-gradient-to-r from-gray-700 to-gray-600 shadow-sm hover:shadow-md transition-all duration-200">
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                {loading ? (
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-20" />
                ) : (
                  <>
                    <div className="text-base font-bold text-gray-900">{challengeCount}</div>
                    <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                      CHALLENGE{challengeCount !== 1 ? "S" : ""}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-200 border border-slate-200 hover:border-slate-300">
              <div className="p-1.5 rounded bg-gradient-to-r from-gray-700 to-gray-600 shadow-sm hover:shadow-md transition-all duration-200">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                {loading ? (
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-24" />
                ) : (
                  <>
                    <div className="text-base font-bold text-gray-900">{totalEvaluations}</div>
                    <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                      EVALUATION{totalEvaluations !== 1 ? "S" : ""}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content Section */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="bg-white shadow-sm rounded-lg border border-slate-200 animate-pulse">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-5 bg-slate-200 rounded-lg mb-1.5" />
                      <div className="h-4 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-24 bg-slate-100 rounded-lg" />
                </div>
              </Card>
            ))}
          </div>
        ) : challengeCount === 0 ? (
          <Card className="h-full border-2 border-dashed border-slate-300 bg-white shadow-sm rounded-lg hover:shadow-md transition-all duration-200">
            <CardContent className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="p-4 rounded-full bg-slate-100 mb-4 hover:bg-slate-200 transition-all duration-200">
                <FileX className="w-12 h-12 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1.5">No Evaluations Found</h3>
              <p className="text-sm font-medium text-gray-700 mb-3 max-w-md">
                This judge hasn't evaluated any challenges yet.
              </p>
              <Badge className="bg-blue-50 text-blue-800 border-blue-200 font-medium uppercase tracking-wide hover:bg-blue-100 transition-all duration-200">
                CHECK BACK LATER
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {Object.entries(evaluationsForJudge).map(([challengeId, evaluations]) => (
              <Card
                key={challengeId}
                className="bg-white shadow-sm rounded-lg hover:shadow-md transition-all duration-200 overflow-hidden border border-slate-200 hover:border-slate-300"
              >
                <Accordion type="multiple">
                  <ChallengeAccordionItem challengeId={challengeId} evaluations={evaluations} />
                </Accordion>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
