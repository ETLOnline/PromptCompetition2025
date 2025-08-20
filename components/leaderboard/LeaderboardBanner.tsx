import { Clock, CheckCircle, Users, Gavel } from "lucide-react"

interface LeaderboardBannerProps {
  topN: number
  judgeEvaluationsComplete: boolean
  competitionTitle: string
  maxScore: number
}

export function LeaderboardBanner({
  topN,
  judgeEvaluationsComplete,
  competitionTitle,
  maxScore,
}: LeaderboardBannerProps) {
  const totalMaxScore = maxScore * 2

  if (judgeEvaluationsComplete) {
    return (
      <div className="p-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-emerald-700">
                  <span>Final leaderboard including Judge evaluations for top</span>
                  <span className="inline-flex items-center bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                    {topN}
                  </span>
                  <span>participants. Remaining participants ranked by LLM only.</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-emerald-100">
              <div className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3">
                Maximum Possible Scores
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">LLM Max</div>
                  <div className="text-lg font-bold text-gray-900">{maxScore}</div>
                  <div className="text-xs text-gray-400">points</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Judge Max</div>
                  <div className="text-lg font-bold text-gray-900">{maxScore}</div>
                  <div className="text-xs text-gray-400">points</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Maximum</div>
                  <div className="text-xl font-bold text-emerald-600">{totalMaxScore}</div>
                  <div className="text-xs text-gray-400">points</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-800" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-blue-800">
                <span>Leaderboard based on LLM scores. Top</span>
                <span className="inline-flex items-center bg-blue-100 border border-blue-300 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                  {topN}
                </span>
                <span>participants are being evaluated by judges for final scores.</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Gavel className="h-3 w-3 text-amber-600" />
                </div>
                <span className="inline-flex items-center bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                  In Progress
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3">
              Maximum Possible Scores
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">LLM Max</div>
                <div className="text-lg font-bold text-gray-900">{maxScore}</div>
                <div className="text-xs text-gray-400">points</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Judge Max</div>
                <div className="text-lg font-bold text-gray-900">{maxScore}</div>
                <div className="text-xs text-gray-400">points</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Maximum</div>
                <div className="text-xl font-bold text-blue-600">{totalMaxScore}</div>
                <div className="text-xs text-gray-400">points</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CompetitionHeader({
  title,
  totalParticipants,
  maxScore,
}: {
  title: string
  totalParticipants: number
  maxScore?: number
}) {
  const totalMaxScore = maxScore ? maxScore * 2 : 0

  return (
    <div className="text-center space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
            <Users className="h-3 w-3 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">{totalParticipants} Participants</span>
        </div>
      </div>
      
      {maxScore && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 max-w-md mx-auto">
          <div className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3 text-center">
            Maximum Possible Scores
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">LLM Max</div>
              <div className="text-lg font-bold text-gray-900">{maxScore}</div>
              <div className="text-xs text-gray-400">points</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Judge Max</div>
              <div className="text-lg font-bold text-gray-900">{maxScore}</div>
              <div className="text-xs text-gray-400">points</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Max</div>
              <div className="text-xl font-bold text-blue-600">{totalMaxScore}</div>
              <div className="text-xs text-gray-400">points</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}