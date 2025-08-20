import { Trophy, Medal, Award } from "lucide-react"
import type { DisplayEntry } from "@/types/leaderboard"

interface LeaderboardTableProps {
  data: DisplayEntry[]
  topN: number
  competitionTitle: string
}

export function LeaderboardTable({ data, topN, competitionTitle }: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-emerald-600" />
      case 2:
        return <Medal className="h-4 w-4 text-gray-600" />
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />
      default:
        return null
    }
  }

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) {
      return "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm"
    }
    if (rank === 2) {
      return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm"
    }
    if (rank === 3) {
      return "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm"
    }
    if (rank <= topN) {
      return "bg-blue-50 text-blue-700 border border-blue-200"
    }
    return "bg-gray-50 text-gray-600 border border-gray-200"
  }

  const getRowBackgroundStyle = (rank: number) => {
    if (rank === 1) {
      return "bg-gradient-to-r from-emerald-50/50 to-white border-l-4 border-l-emerald-400"
    }
    if (rank === 2) {
      return "bg-gradient-to-r from-gray-50/50 to-white border-l-4 border-l-gray-400"
    }
    if (rank === 3) {
      return "bg-gradient-to-r from-amber-50/50 to-white border-l-4 border-l-amber-400"
    }
    if (rank <= topN) {
      return "bg-gradient-to-r from-blue-50/30 to-white"
    }
    return "bg-white"
  }

  return (
    <div className="overflow-hidden">
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{competitionTitle}</h2>
          <div className="inline-flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1">
            <span className="text-sm font-medium text-gray-700">Leaderboard</span>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Participant
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      LLM Score
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Judge Score
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Final Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((entry, index) => (
                    <tr
                      key={`${entry.rank}-${entry.name}`}
                      className={`
                        ${getRowBackgroundStyle(entry.rank)}
                        hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white 
                        transition-all duration-200 group
                      `}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex-shrink-0">
                            {getRankIcon(entry.rank)}
                          </div>
                          <span
                            className={`
                              inline-flex items-center justify-center min-w-[2rem] h-7 px-3 rounded-lg text-sm font-bold
                              ${getRankBadgeStyle(entry.rank)}
                            `}
                          >
                            {entry.rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate">
                              {entry.name}
                            </div>
                          </div>
                          {entry.rank <= topN && (
                            <span className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide flex-shrink-0">
                              Top {topN}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg text-sm font-mono font-medium border border-gray-200">
                          {entry.llmScore.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {entry.judgeScore !== null ? (
                          <span className="inline-flex items-center bg-gradient-to-r from-gray-700 to-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-mono font-medium shadow-sm">
                            {entry.judgeScore.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-lg font-light">—</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`
                            inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-mono font-medium
                            ${
                              entry.rank <= 3
                                ? "bg-gradient-to-r from-gray-700 to-gray-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-800 border border-gray-200"
                            }
                          `}
                        >
                          {entry.finalScore.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {data.map((entry, index) => (
            <div
              key={`mobile-${entry.rank}-${entry.name}`}
              className={`
                ${getRowBackgroundStyle(entry.rank)}
                rounded-xl p-4 shadow-sm border border-gray-200 
                hover:shadow-md transition-all duration-200
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>
                  <span
                    className={`
                      inline-flex items-center justify-center min-w-[2rem] h-7 px-3 rounded-lg text-sm font-bold
                      ${getRankBadgeStyle(entry.rank)}
                    `}
                  >
                    {entry.rank}
                  </span>
                </div>
                {entry.rank <= topN && (
                  <span className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                    Top {topN}
                  </span>
                )}
              </div>
              
              <div className="mb-4">
                <div className="text-base font-bold text-gray-900 mb-1">
                  {entry.name}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    LLM
                  </div>
                  <span className="inline-flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono font-medium border border-gray-200">
                    {entry.llmScore.toFixed(2)}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Judge
                  </div>
                  {entry.judgeScore !== null ? (
                    <span className="inline-flex items-center bg-gradient-to-r from-gray-700 to-gray-600 text-white px-2 py-1 rounded text-xs font-mono font-medium shadow-sm">
                      {entry.judgeScore.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Final
                  </div>
                  <span
                    className={`
                      inline-flex items-center px-2 py-1 rounded text-xs font-mono font-medium
                      ${
                        entry.rank <= 3
                          ? "bg-gradient-to-r from-gray-700 to-gray-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-800 border border-gray-200"
                      }
                    `}
                  >
                    {entry.finalScore.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 bg-gray-50 rounded-xl p-4">
          <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 text-center">
            Legend
          </div>
          <div className="flex flex-wrap gap-4 justify-center text-xs">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-gray-700">1st Place</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-700">2nd Place</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-gray-700">3rd Place</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                Top {topN}
              </span>
              <span className="font-medium text-gray-700">Judge Evaluated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}