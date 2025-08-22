import { Users, Trophy } from "lucide-react"

interface LeaderboardBannerProps {
  topN: number
  judgeEvaluationsComplete: boolean
  maxScore: number
  participantsCount: number
}

export function LeaderboardBanner({
  topN,
  judgeEvaluationsComplete,
  maxScore,
  participantsCount,
}: LeaderboardBannerProps) {

  if (!judgeEvaluationsComplete) {
    return null
  }

  return (
    <div className="bg-white border-l-4 border-gray-700 rounded-lg p-2 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Final Leaderboard</h3>
          <p className="text-gray-600">
            Judge evaluations complete for top <span className="font-bold text-gray-700">{topN}</span> participants.
            Others ranked by AI evaluation.
          </p>
        </div>
        <div className="flex gap-4 text-sm text-gray-500">
          <div className="text-center">
            <Users className="h-4 w-4 mx-auto mb-1" />
            <div>{participantsCount}</div>
          </div>
          <div className="text-center">
            <Trophy className="h-4 w-4 mx-auto mb-1" />
            <div>{maxScore}</div>
          </div>
        </div>
      </div>
    </div>
  )
}