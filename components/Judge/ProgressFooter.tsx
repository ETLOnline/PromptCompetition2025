"use client"

import { Button } from "@/components/ui/button"
import { ChevronRight, Loader } from "lucide-react"

interface ProgressStats {
  totalAssigned: number
  graded: number
  remaining: number
  percentage: number
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
  if (progressStats.totalAssigned <= 0) return null

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="font-medium text-gray-900">Progress:</span>
            <span className="ml-2">
              {progressStats.graded} / {progressStats.totalAssigned} graded
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressStats.percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {progressStats.percentage}%
            </span>
          </div>
        </div>

        {hasMoreSubmissions && (
          <Button
            onClick={onLoadMore}
            disabled={isLoadingSubmissions}
            variant="outline"
            className="bg-transparent"
          >
            {isLoadingSubmissions ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load More
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
