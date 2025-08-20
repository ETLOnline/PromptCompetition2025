import { Suspense } from "react"
import {
    getLatestCompetition,
    getLeaderboard,
    getJudgeScores,
    calculateFinalScores,
    areJudgeEvaluationsComplete,
} from "@/lib/leaderboard"
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable"
import { LeaderboardBanner, CompetitionHeader } from "@/components/leaderboard/LeaderboardBanner"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"


async function LeaderboardContent() {
  try {    
    // Fetch the latest completed competition
    const latestCompetition = await getLatestCompetition()
    
    // Fetch leaderboard data
    const leaderboard = await getLeaderboard(latestCompetition.competitionId)

    // Fetch judge scores for top N participants
    const judgeScores = await getJudgeScores(latestCompetition.competitionId, latestCompetition.TopN)

    // Check if judge evaluations are complete
    const judgeEvaluationsComplete = await areJudgeEvaluationsComplete(
      latestCompetition.competitionId,
      latestCompetition.TopN,
    )

    // Calculate final scores and prepare display data
    const displayData = calculateFinalScores(leaderboard, judgeScores, latestCompetition.TopN)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <CompetitionHeader title={latestCompetition.title} totalParticipants={displayData.length} />

          <LeaderboardBanner
            topN={latestCompetition.TopN}
            judgeEvaluationsComplete={judgeEvaluationsComplete}
            competitionTitle={latestCompetition.title}
          />

          <LeaderboardTable
            data={displayData}
            topN={latestCompetition.TopN}
            competitionTitle={latestCompetition.title}
          />

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{displayData.length}</div>
                <div className="text-sm font-medium text-gray-700 uppercase tracking-wide">Total Participants</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{latestCompetition.TopN}</div>
                <div className="text-sm font-medium text-gray-700 uppercase tracking-wide">Judge Evaluated</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{displayData[0]?.finalScore.toFixed(2) || "N/A"}</div>
                <div className="text-sm font-medium text-gray-700 uppercase tracking-wide">Highest Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <div className="text-lg font-bold text-red-600 mb-2">Error Loading Leaderboard</div>
                <div className="text-sm font-medium text-red-600">
                  {error instanceof Error ? error.message : "Unknown error occurred"}
                </div>
                <div className="text-xs text-red-600 mt-2">
                  Please check your Firebase configuration and ensure the competition data exists.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-96 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>

        <Skeleton className="h-16 w-full mb-6 rounded-xl" />

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<LeaderboardSkeleton />}>
      <LeaderboardContent />
    </Suspense>
  )
}

export const metadata = {
  title: "Competition Leaderboard",
  description: "View the latest competition results and rankings",
}
