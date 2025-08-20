import { Card, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { SubmissionCard } from "./SubmissionCard"
import type { Submission } from "@/types/judge-submission"

interface SubmissionsListProps {
  submissions: Submission[]
  isLoadingAssignment: boolean
  isLoadingSubmissions: boolean
  hasMoreSubmissions: boolean
  progressStats: {
    totalAssigned: number
    graded: number
    remaining: number
    percentage: number
  }
  userUID: string | null
  onOpenScoring: (submission: Submission) => void
  onLoadMore: () => void
}

export function SubmissionsList({
  submissions,
  isLoadingAssignment,
  isLoadingSubmissions,
  hasMoreSubmissions,
  progressStats,
  userUID,
  onOpenScoring,
  onLoadMore,
}: SubmissionsListProps) {
  const SubmissionCardSkeleton = () => (
    <Card>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="flex gap-2 mt-4">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Submissions to Score</h2>
        </div>
      </div>

      {isLoadingAssignment ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <SubmissionCardSkeleton key={i} />
          ))}
        </div>
      ) : submissions.length === 0 && !isLoadingSubmissions ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Assigned</h3>
            <p className="text-gray-600">You haven't been assigned any submissions for this challenge yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission, index) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              userUID={userUID}
              onOpenScoring={onOpenScoring}
              index={index} 
            />
          ))}

          {/* Loading more submissions */}
          {isLoadingSubmissions && (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <SubmissionCardSkeleton key={`loading-${i}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
