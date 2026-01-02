"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchLevel2JudgeEvaluations } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, FileX, Users, FolderKanban, FileCheck } from "lucide-react"
import BatchList from "@/components/Level2JudgeEvaluations/BatchList"
import EvaluationDetailsPanel from "@/components/Level2JudgeEvaluations/EvaluationDetailsPanel"
import FilterBar from "@/components/Level2JudgeEvaluations/FilterBar"
import type { Level2EvaluationResponse, FilterState, GroupedLevel2Evaluations } from "@/types/level2JudgeEvaluations"

// Loading skeleton components
function BatchListSkeleton() {
  return (
    <Card className="h-full flex flex-col shadow-sm bg-white rounded-xl border border-slate-200">
      <div className="p-4 border-b border-slate-200">
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
      </div>
      <CardContent className="flex-1 p-3">
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border-2 border-slate-200 animate-pulse">
              <div className="h-4 bg-slate-200 rounded mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3 mb-3" />
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-12 bg-slate-100 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DetailsPanelSkeleton() {
  return (
    <Card className="h-full flex flex-col shadow-sm bg-white rounded-xl border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="p-2 rounded-lg bg-slate-200">
            <div className="w-4 h-4 bg-slate-300 rounded" />
          </div>
          <div className="flex-1">
            <div className="h-6 bg-slate-200 rounded-lg mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-4">
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
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
      <Card className="h-full border-2 border-dashed border-slate-300 bg-white/50">
        <CardContent className="flex flex-col items-center justify-center h-full py-12 text-center">
          <div className="p-3 rounded-full bg-slate-100 mb-4">
            <FileX className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Evaluations Found</h3>
          <p className="text-sm text-gray-700 font-medium mb-3 max-w-md">
            There are no Level 2 judge evaluations available for this competition yet.
          </p>
          <Badge className="bg-blue-50 text-blue-800 font-medium border border-blue-200 uppercase tracking-wide text-xs">
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
      <Card className="h-full border-2 border-red-200 bg-red-50">
        <CardContent className="flex flex-col items-center justify-center h-full py-12 text-center">
          <div className="p-3 rounded-full bg-red-100 mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to Load Evaluations</h3>
          <p className="text-sm text-gray-700 font-medium mb-4 max-w-md">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-bold rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Level2JudgeEvaluationsPage() {
  const { competitionId } = useParams<{ competitionId: string }>()
  const router = useRouter()
  
  const [data, setData] = useState<Level2EvaluationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: "",
    selectedBatch: "all",
    selectedJudge: "all",
    selectedParticipant: "all",
  })

  useEffect(() => {
    const init = async () => {
      const authed = await checkAuth()
      if (authed) {
        await fetchData()
      }
    }
    init()
  }, [competitionId])

  const checkAuth = async () => {
    try {
      await fetchLevel2JudgeEvaluations(competitionId)
      return true
    } catch (error) {
      router.push("/")
      return false
    }
  }

  const fetchData = async () => {
    if (!competitionId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetchLevel2JudgeEvaluations(competitionId)
      setData(response)

      // Set default selected batch to first batch if available
      if (response.batches.length > 0) {
        setFilterState(prev => ({
          ...prev,
          selectedBatch: response.batches[0].batchId
        }))
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch Level 2 judge evaluations")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filters: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...filters }))
  }

  const handleBatchSelect = (batchId: string) => {
    setFilterState(prev => ({ ...prev, selectedBatch: batchId }))
  }

  // Statistics
  const stats = {
    totalBatches: data?.batches.length || 0,
    totalJudges: Object.keys(data?.judges || {}).length,
    totalParticipants: Object.keys(data?.participants || {}).length,
    totalEvaluations: data?.evaluations.length || 0,
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl shadow-sm">
                <FolderKanban className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Level 2 Judge Evaluations</h1>
                <p className="text-sm text-gray-700 font-medium">Review batch-wise judge evaluations</p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          {!loading && !error && data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <FolderKanban className="w-5 h-5 text-purple-700" />
                  <p className="text-xs font-bold text-purple-900 uppercase tracking-wide">Batches</p>
                </div>
                <p className="text-2xl font-bold text-purple-900">{stats.totalBatches}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-700" />
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">Judges</p>
                </div>
                <p className="text-2xl font-bold text-blue-900">{stats.totalJudges}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-700" />
                  <p className="text-xs font-bold text-green-900 uppercase tracking-wide">Participants</p>
                </div>
                <p className="text-2xl font-bold text-green-900">{stats.totalParticipants}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-5 h-5 text-amber-700" />
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Evaluations</p>
                </div>
                <p className="text-2xl font-bold text-amber-900">{stats.totalEvaluations}</p>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        {!loading && !error && data && (
          <FilterBar
            filterState={filterState}
            onFilterChange={handleFilterChange}
            batches={data.batches}
            judges={data.judges}
            participants={data.participants}
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-400px)]">
            <div className="lg:col-span-1">
              <BatchListSkeleton />
            </div>
            <div className="lg:col-span-2">
              <DetailsPanelSkeleton />
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && <ErrorState error={error} onRetry={fetchData} />}

        {/* Empty State */}
        {!loading && !error && data && data.evaluations.length === 0 && <EmptyState />}

        {/* Content */}
        {!loading && !error && data && data.evaluations.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-400px)]">
            <div className="lg:col-span-1">
              <BatchList
                batches={data.batches}
                selectedBatch={filterState.selectedBatch}
                onBatchSelect={handleBatchSelect}
                filterState={filterState}
              />
            </div>
            <div className="lg:col-span-2">
              <EvaluationDetailsPanel
                evaluations={data.evaluations}
                selectedBatch={filterState.selectedBatch}
                selectedJudge={filterState.selectedJudge}
                selectedParticipant={filterState.selectedParticipant}
                judges={data.judges}
                participants={data.participants}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
