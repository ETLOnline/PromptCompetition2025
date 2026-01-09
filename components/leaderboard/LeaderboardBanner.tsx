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
    <div className="bg-white border-l-4 border-gray-700 rounded-lg p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Final Leaderboard</h3>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">
            Evaluations complete for top <span className="font-bold text-gray-700">{topN}</span> participants.
          </p>
        </div>
        <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
          <div className="text-center">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1" />
            <div className="font-medium">{participantsCount}</div>
            <div className="text-[10px] sm:text-xs text-gray-400">Participants</div>
          </div>
          <div className="text-center">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1" />
            <div className="font-medium">{maxScore}</div>
            <div className="text-[10px] sm:text-xs text-gray-400">Max Score</div>
          </div>
        </div>
      </div>
    </div>
  )
}