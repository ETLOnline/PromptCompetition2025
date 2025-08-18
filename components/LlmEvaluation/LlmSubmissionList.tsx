"use client"

import { useState, useEffect } from "react"
import { LlmScoreCard } from "./LlmScoreCard"
import type { Submission, LlmSubmissionListProps } from "@/types/llmEvaluations"
import { Button } from "@/components/ui/button"
import { fetchWithAuth } from "@/lib/api"
import { AlertCircle, FileText, Loader2 } from "lucide-react"

export function LlmSubmissionList({ challengeId, competitionId }: LlmSubmissionListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [lastDocId, setLastDocId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set())
  const [isInitialLoad, setIsInitialLoad] = useState(true)

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
        `${process.env.NEXT_PUBLIC_API_URL}/llm-evaluations/${competitionId}/challenges/${challengeId}/submissions?${params.toString()}`,
      )

      // Reset on first page, append on subsequent pages
      if (!lastDocId) {
        setSubmissions(res.items)
      } else {
        setSubmissions((prev) => [...prev, ...res.items])
      }

      setLastDocId(res.lastDocId)
      setHasMore(res.hasMore)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
      setIsInitialLoad(false)
    }
  }

  const toggleCardExpansion = (id: string) => {
    setExpandedCardIds((prev) => {
      const newSet = new Set(prev)
      newSet.has(id) ? newSet.delete(id) : newSet.add(id)
      return newSet
    })
  }

  if (isInitialLoad && isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-8 bg-gray-200 rounded w-24 mt-4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!isLoading && submissions.length === 0 && !error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          No submissions have been found for this challenge. Check back later or try refreshing the page.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="p-6">
            <div className="font-medium text-gray-900 text-sm leading-relaxed mb-2">{submission.promptText}</div>

            {submission.llmScores && submission.llmScores.length > 0 && (
              <div className="space-y-2">
                {submission.llmScores.map((score) => (
                  <div key={score.id} className="border border-gray-100 rounded-md bg-gray-50/50">
                    <LlmScoreCard
                      evaluation={score}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800 mb-1">Error loading submissions</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-6 pb-2">
          <Button
            onClick={fetchSubmissions}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="min-w-[140px] h-10 font-medium bg-transparent"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
