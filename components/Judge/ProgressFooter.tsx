"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronDown, MoreHorizontal } from "lucide-react"

interface ProgressStats {
  totalAssigned: number
  totalScored: number
  currentPage: number
  totalPages: number
}

interface ProgressFooterProps {
  progressStats: ProgressStats
  hasMoreSubmissions: boolean
  isLoadingSubmissions: boolean
  onLoadMore: () => void
}

export function ProgressFooter({
  progressStats,
  hasMoreSubmissions,
  isLoadingSubmissions,
  onLoadMore,
}: ProgressFooterProps) {
  const progressPercentage =
    progressStats.totalAssigned > 0 ? (progressStats.totalScored / progressStats.totalAssigned) * 100 : 0

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-slate-600">
            Progress: {progressStats.totalScored} of {progressStats.totalAssigned} submissions scored
          </div>
          <div className="text-sm text-slate-600">
            Page {progressStats.currentPage} of {progressStats.totalPages}
          </div>
        </div>

        <Progress value={progressPercentage} className="mb-3" />

        {hasMoreSubmissions && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={onLoadMore}
              disabled={isLoadingSubmissions}
              className="flex items-center gap-2 bg-transparent"
            >
              {isLoadingSubmissions ? (
                <>
                  <MoreHorizontal className="h-4 w-4 animate-pulse" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Load More Submissions
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
