import { Clock, CheckCircle, Users, Gavel } from "lucide-react"

interface LeaderboardBannerProps {
  topN: number
  judgeEvaluationsComplete: boolean
  competitionTitle: string
}

export function LeaderboardBanner({ topN, judgeEvaluationsComplete, competitionTitle }: LeaderboardBannerProps) {
  if (judgeEvaluationsComplete) {
    return (
      <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-emerald-600">
            <span>Final leaderboard including Judge evaluations for top</span>
            <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-1 rounded-lg text-xs font-medium uppercase tracking-wide">
              {topN}
            </span>
            <span>participants. Remaining participants ranked by LLM only.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-blue-800" />
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-blue-800">
          <span>Leaderboard based on LLM scores. Top</span>
          <span className="bg-blue-100 border border-blue-200 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium uppercase tracking-wide">
            {topN}
          </span>
          <span>participants are being evaluated by judges for final scores.</span>
          <div className="flex items-center gap-1 ml-2">
            <Gavel className="h-3 w-3" />
            <span className="text-xs uppercase tracking-wide">In Progress</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CompetitionHeader({ title, totalParticipants }: { title: string; totalParticipants: number }) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
      <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
        <Users className="h-4 w-4" />
        <span>{totalParticipants} Participants</span>
      </div>
    </div>
  )
}
