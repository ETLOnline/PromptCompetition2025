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
      <Card className="bg-white shadow-sm rounded-xl p-8 hover:shadow-md transition-all duration-200">
        <div className="text-center">
          <div className="text-sm font-medium text-gray-700 mb-2">No challenges found</div>
          <div className="text-xs font-medium text-gray-700">
            No LLM evaluations are available for this competition yet.
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-white shadow-sm rounded-xl p-6 hover:shadow-md transition-all duration-200">
      <Accordion
        type="multiple"
        value={expandedChallenges}
        onValueChange={setExpandedChallenges}
        className="space-y-2"
      >
        {challenges.map((challenge) => (
          <AccordionItem
            key={challenge.id}
            value={challenge.id}
            className="border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center justify-between w-full mr-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900">{challenge.title || `Challenge ${challenge.id}`}</h3>
                  <Badge
                    variant="secondary"
                    className="bg-blue-50 border-blue-200 text-blue-800 text-xs font-medium uppercase"
                  >
                    {challenge.submissionCount} SUBMISSIONS
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                {/* Fetch submissions on demand */}
                {expandedChallenges.includes(challenge.id) && (
                  <LlmSubmissionList
                    challengeId={challenge.id}
                    competitionId={competitionId}
                  />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  )
}
