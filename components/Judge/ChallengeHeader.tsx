"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Scale, FileText, CheckCircle2, ChevronUp, ChevronDown } from "lucide-react"
import { useState } from "react"
import type { Challenge } from "@/types/judge-submission"

interface ChallengeHeaderProps {
  challenge: Challenge | null
  isLoading: boolean
  progressStats: {
    totalAssigned: number
    graded: number
    remaining: number
    percentage: number
  }
}

export function ChallengeHeader({ challenge, isLoading, progressStats }: ChallengeHeaderProps) {
  const [isRubricExpanded, setIsRubricExpanded] = useState(false)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (!challenge) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-2xl text-gray-900">{challenge.title}</CardTitle>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p>{challenge.problemStatement}</p>
            </div>
            {challenge.guidelines && (
              <div className="text-sm text-gray-600">
                <strong>Guidelines:</strong> {challenge.guidelines}
              </div>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <Badge variant="outline" className="gap-1">
              <FileText className="w-3 h-3" />
              {progressStats.totalAssigned} submissions
            </Badge>
            <Badge
              variant={progressStats.graded === progressStats.totalAssigned ? "default" : "secondary"}
              className="gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              {progressStats.graded} graded
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Rubric Section */}
      {challenge.rubric.length > 0 && (
        <CardContent className="pt-0">
          <Collapsible open={isRubricExpanded} onOpenChange={setIsRubricExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-transparent">
                <span className="flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Scoring Rubric ({challenge.rubric.length} criteria)
                </span>
                {isRubricExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="grid gap-4">
                {challenge.rubric.map((criterion, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <h4 className="font-semibold text-gray-900">{criterion.name}</h4>
                        <p className="text-sm text-gray-600">{criterion.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}
    </Card>
  )
}
