"use client"

import { useState, useEffect } from "react"
import { LlmScoreCard } from "./LlmScoreCard"
import type { Submission, PaginatedResponse, LlmSubmissionListProps } from "@/types/llmEvaluations"
import { Button } from "@/components/ui/button"
import { fetchWithAuth } from "@/lib/api"


export function LlmSubmissionList({ challengeId, competitionId }: LlmSubmissionListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [lastDocId, setLastDocId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set())

  // Fetch first page on mount
  useEffect(() => {
    fetchSubmissions()
  }, [challengeId, competitionId])


  const fetchSubmissions = async () => {
    if (!hasMore || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append("challengeId", challengeId)
      params.append("pageSize", "10")
      if (lastDocId) params.append("lastDocId", lastDocId)

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/llm-evaluations/${competitionId}/challenges/${challengeId}/submissions?${params.toString()}`
      )

      // -- Option A (reset on first page) --
      if (!lastDocId) {
        setSubmissions(res.items)
      } else {
        setSubmissions(prev => [...prev, ...res.items])
      }
      
      setLastDocId(res.lastDocId)
      setHasMore(res.hasMore)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCardExpansion = (id: string) => {
    setExpandedCardIds(prev => {
      const newSet = new Set(prev)
      newSet.has(id) ? newSet.delete(id) : newSet.add(id)
      return newSet
    })
  }


  return (
    <div className="space-y-3">
      {submissions.map(submission => (
        <div key={submission.id} className="border rounded-md p-3 bg-gray-50">
          <div className="font-medium text-gray-800">{submission.promptText}</div>
          {submission.llmScores && submission.llmScores.length > 0 && (
            <div className="mt-2 space-y-2">
              {submission.llmScores.map(score => (
                <>
                  <LlmScoreCard
                    evaluation={score}
                    variant={expandedCardIds.has(score.id) ? "default" : "compact"}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCardExpansion(score.id)}
                    className="mt-1"
                  >
                    {expandedCardIds.has(score.id) ? "Collapse" : "Expand"}
                  </Button>
                </>
              ))}
            </div>
          )}
        </div>
      ))}

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {hasMore && (
        <Button onClick={fetchSubmissions} disabled={isLoading} className="mt-2">
          {isLoading ? "Loading..." : "Load More"}
        </Button>
      )}
    </div>
  )
}
