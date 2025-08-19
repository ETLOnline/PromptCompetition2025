// components\LlmEvaluation\ChallengeAccordion.tsx
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { LlmSubmissionList } from "./LlmSubmissionList"
import type { ChallengeAccordionProps } from "@/types/llmEvaluations"

export function ChallengeAccordion({ challenges, competitionId }: ChallengeAccordionProps) {
  const [expandedChallenges, setExpandedChallenges] = useState<string[]>([])

  if (!challenges || challenges.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-lg rounded-2xl p-12 hover:shadow-xl transition-all duration-300">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="text-lg font-semibold text-slate-800 mb-3">No challenges found</div>
          <div className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            No LLM evaluations are available for this competition yet. Check back later for new challenges.
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-lg rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
      <Accordion type="multiple" value={expandedChallenges} onValueChange={setExpandedChallenges} className="space-y-4">
        {challenges.map((challenge) => (
          <AccordionItem
            key={challenge.id}
            value={challenge.id}
            className="border-2 border-slate-200 rounded-xl bg-gradient-to-r from-white to-slate-50 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <AccordionTrigger className="px-6 py-5 hover:no-underline group">
              <div className="flex items-center justify-between w-full mr-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-900 transition-colors duration-200">
                    {challenge.title || `Challenge ${challenge.id}`}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full shadow-sm"
                  >
                    {challenge.submissionCount} SUBMISSIONS
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="bg-white rounded-xl border-2 border-slate-100 p-6 shadow-inner">
                {/* Fetch submissions on demand */}
                {expandedChallenges.includes(challenge.id) && (
                  <LlmSubmissionList challengeId={challenge.id} competitionId={competitionId} />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  )
}
