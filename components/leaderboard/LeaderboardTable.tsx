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

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 text-center mb-6">{competitionTitle} - Leaderboard</h2>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wide">
                  LLM Score
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Judge Score
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Final Score
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry, index) => (
                <tr
                  key={`${entry.rank}-${entry.name}`}
                  className={`
                    ${entry.rank <= 3 ? "bg-gradient-to-r from-slate-50 to-white" : "bg-white"}
                    ${index !== data.length - 1 ? "border-b border-gray-100" : ""}
                    hover:bg-gray-50 transition-all duration-200
                  `}
                >
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getRankIcon(entry.rank)}
                      <span
                        className={`
                        inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-lg text-xs font-medium
                        ${
                          entry.rank <= 3
                            ? "bg-gradient-to-r from-gray-700 to-gray-600 text-white"
                            : entry.rank <= topN
                              ? "bg-gray-100 text-gray-700 border border-gray-200"
                              : "bg-gray-50 text-gray-600 border border-gray-200"
                        }
                      `}
                      >
                        {entry.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{entry.name}</span>
                      {entry.rank <= topN && (
                        <span className="bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium uppercase tracking-wide">
                          Top {topN}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs font-medium font-mono">
                      {entry.llmScore.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {entry.judgeScore !== null ? (
                      <span className="bg-gradient-to-r from-gray-700 to-gray-600 text-white px-2 py-1 rounded-lg text-xs font-medium font-mono">
                        {entry.judgeScore.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`
                      px-2 py-1 rounded-lg text-xs font-medium font-mono
                      ${
                        entry.rank <= 3
                          ? "bg-gradient-to-r from-gray-700 to-gray-600 text-white"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
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

        <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">1st Place</span>
          </div>
          <div className="flex items-center gap-2">
            <Medal className="h-4 w-4 text-gray-600" />
            <span className="font-medium">2nd Place</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-600" />
            <span className="font-medium">3rd Place</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium uppercase tracking-wide">
              Top {topN}
            </span>
            <span className="font-medium">Judge Evaluated</span>
          </div>
        </div>
      </div>
    </div>
  )
}
