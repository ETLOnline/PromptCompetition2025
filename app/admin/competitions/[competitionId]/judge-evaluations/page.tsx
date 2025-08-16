"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { fetchWithAuth } from "@/lib/api"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, FileX } from "lucide-react"
import JudgeList from "@/components/JudgeEvaluations/JudgeList"
import JudgeDetailSection from "@/components/JudgeEvaluations/JudgeDetailSection"
import type { Evaluation, GroupedEvaluations } from "@/types/judgeEvaluations";

async function getJudgeEvaluations(competitionId: string) {
  const { evaluations } = await fetchWithAuth(
    `${process.env.NEXT_PUBLIC_API_URL}/judge/judge-evaluations/${competitionId}`,
  )
  return evaluations as Evaluation[]
}

function groupEvaluationsByJudge(evaluations: Evaluation[]): GroupedEvaluations {
  return evaluations.reduce(
    (acc, evaluation) => {
      const { judgeId, challengeId, scores, totalScore, comment, updatedAt } = evaluation

      const id = judgeId!;
      const challenge = challengeId!;

      if (!acc[id]) 
        acc[id] = {};

      if (!acc[id][challenge]) 
        acc[id][challenge] = [];

      acc[id][challenge].push({ scores, totalScore, comment, updatedAt });

      return acc
    },
    {} as {
      [judgeId: string]: {
        [challengeId: string]: {
          scores: Record<string, number>
          totalScore: number
          comment: string
          updatedAt: any
        }[]
      }
    },
  )
}

function createJudgeMapping(grouped: GroupedEvaluations) {
  return Object.keys(grouped).reduce(
    (acc, judgeId, idx) => {
      acc[judgeId] = `Judge ${idx + 1}`
      return acc
    },
    {} as Record<string, string>,
  )
}

// Loading skeleton components
function JudgeListSkeleton() {
  return (
    <Card className="h-full flex flex-col shadow-sm bg-white rounded-xl border border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-200 animate-pulse">
            <div className="w-4 h-4 bg-slate-300 rounded" />
          </div>
          <div className="flex-1">
            <div className="h-5 bg-slate-200 rounded-lg animate-pulse mb-2" />
            <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
          </div>
          <div className="w-6 h-5 bg-slate-200 rounded-full animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-3">
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg border-2 border-slate-200 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
                <div className="w-3 h-3 bg-slate-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function JudgeDetailSkeleton() {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="m-4 mb-3 border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 mb-3 animate-pulse">
            <div className="p-2 rounded-lg bg-slate-200">
              <div className="w-4 h-4 bg-slate-300 rounded" />
            </div>
            <div className="flex-1">
              <div className="h-6 bg-slate-200 rounded-lg mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-6 bg-slate-200 rounded-lg w-20 animate-pulse" />
            <div className="h-6 bg-slate-200 rounded-lg w-24 animate-pulse" />
          </div>
        </CardHeader>
      </Card>

      <div className="flex-1 px-4 pb-4">
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="bg-white rounded-xl shadow-sm animate-pulse border border-slate-200">
              <div className="p-4">
                <div className="h-5 bg-slate-200 rounded-lg mb-3" />
                <div className="space-y-2">
                  <div className="h-16 bg-slate-100 rounded-lg" />
                  <div className="h-12 bg-slate-100 rounded-lg" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
      <Card className="h-full border-2 border-dashed border-slate-300 bg-white/50 hover:bg-white/70 transition-all duration-200">
        <CardContent className="flex flex-col items-center justify-center h-full py-12 text-center">
          <div className="p-3 rounded-full bg-slate-100 mb-4 hover:bg-slate-200 transition-all duration-200">
            <FileX className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Evaluations Found</h3>
          <p className="text-sm text-gray-700 font-medium mb-3 max-w-md">
            There are no judge evaluations available for this competition yet.
          </p>
          <Badge className="bg-blue-50 text-blue-800 font-medium border border-blue-200 hover:bg-blue-100 transition-all duration-200 uppercase tracking-wide text-xs">
            Check back later
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
      <Card className="h-full border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-all duration-200">
        <CardContent className="flex flex-col items-center justify-center h-full py-12 text-center">
          <div className="p-3 rounded-full bg-red-100 mb-4 hover:bg-red-200 transition-all duration-200">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to Load Evaluations</h3>
          <p className="text-sm text-gray-700 font-medium mb-4 max-w-md">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-bold rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95 focus:ring-2 focus:ring-gray-600/20 focus:outline-none text-sm"
            aria-label="Retry loading evaluations"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function JudgeEvaluationsPage() {
  const { competitionId } = useParams<{ competitionId: string }>()
  const [groupedEvaluations, setGroupedEvaluations] = useState<GroupedEvaluations>({} as GroupedEvaluations)
  const [judgeMapping, setJudgeMapping] = useState<Record<string, string>>({} as Record<string, string>)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!competitionId) return

    try {
      setLoading(true)
      setError(null)

      const evals = await getJudgeEvaluations(competitionId)
      const grouped = groupEvaluationsByJudge(evals)
      const mapping = createJudgeMapping(grouped)

      setGroupedEvaluations(grouped)
      setJudgeMapping(mapping)
    } catch (err: any) {
      setError(err.message || "Failed to fetch judge evaluations")
      setGroupedEvaluations({} as GroupedEvaluations)
      setJudgeMapping({} as Record<string, string>)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [competitionId])

  const judgeIds = Object.keys(groupedEvaluations)

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Judge Evaluations</h1>
          <p className="text-sm text-gray-700 font-medium">Review and analyze judge evaluations for this competition</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
            <div className="lg:col-span-1">
              <JudgeListSkeleton />
            </div>
            <div className="lg:col-span-2">
              <JudgeDetailSkeleton />
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && <ErrorState error={error} onRetry={fetchData} />}

        {/* Empty State */}
        {!loading && !error && judgeIds.length === 0 && <EmptyState />}

        {/* Content */}
        {!loading && !error && judgeIds.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
            <div className="lg:col-span-1">
              <JudgeList judgeIds={judgeIds} judgeMapping={judgeMapping} defaultSelectedJudge={judgeIds[0]} />
            </div>
            <div className="lg:col-span-2">
              <JudgeDetailSection
                judgeIds={judgeIds}
                groupedEvaluations={groupedEvaluations}
                judgeMapping={judgeMapping}
                defaultSelectedJudge={judgeIds[0]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
