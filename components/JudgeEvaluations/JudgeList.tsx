"use client"

import { useState } from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Check, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAvatarColor } from "@/lib/judge/utils"
import type { JudgeListProps } from "@/types/judgeEvaluations";


export default function JudgeList({ judgeIds, judgeMapping, defaultSelectedJudge }: JudgeListProps) {
  const [selectedJudge, setSelectedJudge] = useState(defaultSelectedJudge)
  const [loadingJudge, setLoadingJudge] = useState<string | null>(null)

  // Emit selected judge to parent via custom event
  const handleJudgeSelect = (judgeId: string) => {
    if (judgeId === selectedJudge) return

    setLoadingJudge(judgeId)
    setSelectedJudge(judgeId)
    window.dispatchEvent(new CustomEvent("judgeSelected", { detail: { judgeId } }))

    // Clear loading after brief delay
    setTimeout(() => setLoadingJudge(null), 300)
  }

  const getJudgeInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2)
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-1">
      <Card className="h-full flex flex-col shadow-sm bg-white rounded-xl border border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Judges</h2>
              <p className="text-sm font-medium text-gray-700">Select a judge to view their evaluations</p>
            </div>
            <Badge className="bg-blue-50 text-blue-800 border-blue-200 font-bold text-xs px-2 py-1 uppercase tracking-wide hover:bg-blue-100 transition-all duration-200">
              {judgeIds.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full px-3">
            <div className="space-y-2 py-3">
              {judgeIds.map((judgeId) => {
                const judgeName = judgeMapping[judgeId]
                const avatarColor = getAvatarColor(judgeName)
                const initials = getJudgeInitials(judgeName)
                const isSelected = selectedJudge === judgeId
                const isLoading = loadingJudge === judgeId

                return (
                  <button
                    key={judgeId}
                    onClick={() => handleJudgeSelect(judgeId)}
                    disabled={isLoading}
                    className={cn(
                      "group w-full p-3 rounded-lg transition-all duration-200 border-2 hover:shadow-md",
                      "hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-blue-600/20 focus:outline-none",
                      isSelected
                        ? "bg-emerald-50 border-emerald-200 shadow-md"
                        : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                      isLoading && "disabled:opacity-60",
                    )}
                    aria-pressed={isSelected}
                    aria-busy={isLoading}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className={cn(
                          "relative flex items-center justify-center w-10 h-10 rounded-lg font-bold text-white text-xs transition-all duration-200 shadow-sm",
                          avatarColor,
                          isSelected ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-white" : "",
                          "group-hover:scale-110",
                        )}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" aria-label="Loading judge data" />
                        ) : (
                          <>
                            {initials}
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Judge Info */}
                      <div className="flex-1 text-left">
                        <h3
                          className={cn(
                            "text-sm font-bold transition-colors mb-1",
                            isSelected ? "text-gray-900" : "text-gray-900 group-hover:text-gray-700",
                          )}
                        >
                          {judgeName}
                        </h3>
                        <div className="flex items-center gap-2">
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          <p
                            className={cn(
                              "text-xs font-medium transition-colors uppercase tracking-wide",
                              isSelected ? "text-emerald-600" : "text-gray-700 group-hover:text-gray-600",
                            )}
                          >
                            {isSelected ? "CURRENTLY SELECTED" : "CLICK TO SELECT"}
                          </p>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
                          isSelected
                            ? "bg-emerald-600 border-emerald-600"
                            : "border-slate-300 group-hover:border-slate-400",
                        )}
                      >
                        {isSelected && <Check className="w-2 h-2 text-white" />}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
