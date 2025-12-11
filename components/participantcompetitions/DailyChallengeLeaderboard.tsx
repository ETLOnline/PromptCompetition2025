"use client"

import { Trophy, Medal, Award, Zap, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { useDailyChallengeLeaderboard } from "@/hooks/useDailyChallengeLeaderboard"
import type { DailyChallengeLeaderboardEntry } from "@/hooks/useDailyChallengeLeaderboard"

interface DailyChallengeLeaderboardProps {
  challengeId: string
  challengeTitle: string
  topN?: number
}

export const DailyChallengeLeaderboard = ({
  challengeId,
  challengeTitle,
  topN = 10,
}: DailyChallengeLeaderboardProps) => {
  const { leaderboard, loading, error } = useDailyChallengeLeaderboard({
    challengeId,
    topN,
  })
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null)

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500 drop-shadow-md" />
      case 2:
        return <Medal className="h-5 w-5 text-slate-400 drop-shadow-sm" />
      case 3:
        return <Award className="h-5 w-5 text-amber-500 drop-shadow-sm" />
      default:
        return null
    }
  }

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) {
      return "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white shadow-lg border-2 border-yellow-300"
    }
    if (rank === 2) {
      return "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 text-white shadow-md border-2 border-slate-200"
    }
    if (rank === 3) {
      return "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white shadow-md border-2 border-amber-300"
    }
    if (rank <= topN) {
      return "bg-slate-100 text-slate-800 border-2 border-slate-300 font-semibold"
    }
    return "bg-gray-50 text-gray-600 border border-gray-200"
  }

  const getRowBackgroundStyle = (rank: number) => {
    if (rank === 1) {
      return "bg-gradient-to-r from-yellow-50/80 via-yellow-50/50 to-transparent border-l-4 border-l-yellow-500 shadow-sm"
    }
    if (rank === 2) {
      return "bg-gradient-to-r from-slate-50/80 via-slate-50/50 to-transparent border-l-4 border-l-slate-400 shadow-sm"
    }
    if (rank === 3) {
      return "bg-gradient-to-r from-amber-50/80 via-amber-50/50 to-transparent border-l-4 border-l-amber-500 shadow-sm"
    }
    if (rank <= topN) {
      return "bg-white hover:bg-slate-50/50"
    }
    return "bg-white"
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    const date = new Date(timestamp?.seconds ? timestamp.seconds * 1000 : timestamp)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  if (error) {
    return (
      <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Failed to load leaderboard: {error}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
          <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#0f172a] shadow-lg flex-shrink-0">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            <span className="sm:hidden">Top Perfomers of the Day</span>
            <span className="hidden sm:inline">Top Performers Of The Daily Challenge</span>
          </h3>
          <Badge className="hidden sm:inline-flex bg-[#0f172a] text-white border-0 font-medium text-xs">
            Live
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 pl-0 sm:pl-13">
          Vote-based rankings
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200">
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-12 sm:w-16">
                    Rank
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-tight">
                    Participant
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-16 sm:w-24">
                    Votes
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-tight hidden lg:table-cell">
                    Preview
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-20 sm:w-32">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  // Loading skeleton rows
                  [...Array(5)].map((_, i) => (
                    <tr key={`skeleton-${i}`} className="bg-white">
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full mx-auto" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Skeleton className="h-4 w-24 sm:w-32" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Skeleton className="h-6 w-10 sm:w-12 mx-auto" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Skeleton className="h-4 w-16 sm:w-24 mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 sm:py-12 text-center">
                      <p className="text-xs sm:text-sm text-gray-500">No submissions yet</p>
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry) => (
                    <tr
                      key={`${entry.userId}-${entry.rank}`}
                      className={`${getRowBackgroundStyle(entry.rank)} hover:bg-slate-50 transition-all duration-200 group`}
                    >
                      {/* Rank */}
                      <td className="px-2 sm:px-4 py-3 sm:py-5">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <div className="flex-shrink-0 hidden sm:block">
                            {getRankIcon(entry.rank)}
                          </div>
                          <span className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold ${getRankBadgeStyle(entry.rank)}`}>
                            {entry.rank}
                          </span>
                        </div>
                      </td>

                      {/* Participant Name */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                          {entry.userFullName}
                        </p>
                      </td>

                      {/* Total Votes */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 text-center">
                        <Badge className="bg-[#0f172a]/10 text-[#0f172a] hover:bg-[#0f172a]/15 border border-[#0f172a]/20 font-bold text-xs sm:text-sm px-2 sm:px-3 py-1">
                          {entry.totalVotes}
                        </Badge>
                      </td>

                      {/* Submission Preview */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 hidden lg:table-cell">
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                          {truncateText(entry.submissionText, 80)}
                          {entry.submissionText.length > 80 && (
                            <button
                              onClick={() => setExpandedSubmissionId(`${entry.userId}-${entry.rank}`)}
                              className="text-xs text-[#0f172a] hover:text-slate-800 font-semibold ml-1 inline"
                            >
                              more
                            </button>
                          )}
                        </p>
                      </td>

                      {/* Submitted Date */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 text-center">
                        <p className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(entry.timestamp)}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          // Loading skeleton cards
          [...Array(5)].map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-24 sm:w-32 mb-2" />
                  <Skeleton className="h-3 w-16 sm:w-24" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-xs sm:text-sm text-gray-500">No submissions yet</p>
          </div>
        ) : (
          leaderboard.map((entry) => (
            <div
              key={`${entry.userId}-${entry.rank}`}
              className={`rounded-lg border border-gray-200 p-3 ${getRowBackgroundStyle(entry.rank)}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center gap-1.5">
                      {getRankIcon(entry.rank)}
                      <span className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold ${getRankBadgeStyle(entry.rank)}`}>
                        {entry.rank}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                      {entry.userFullName}
                    </p>
                  </div>
                </div>
                <Badge className="bg-[#0f172a]/10 text-[#0f172a] hover:bg-[#0f172a]/15 border border-[#0f172a]/20 font-bold text-xs px-2 py-1 flex-shrink-0">
                  {entry.totalVotes}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2" title={entry.submissionText}>
                    {truncateText(entry.submissionText, 100)}
                  </p>
                  {entry.submissionText.length > 100 && (
                    <button
                      onClick={() => setExpandedSubmissionId(`${entry.userId}-${entry.rank}`)}
                      className="text-xs text-[#0f172a] hover:text-slate-800 font-semibold mt-0.5"
                    >
                      Show more
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(entry.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      {!loading && leaderboard.length > 0 && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-[#0f172a]/5 rounded-lg border border-[#0f172a]/10">
          <p className="text-xs text-[#0f172a]">
            Leaderboard updates in real-time. Top performers are determined by the total votes received on their submissions for the daily challenge.
          </p>
        </div>
      )}

      {/* Submission Details Modal */}
      {expandedSubmissionId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setExpandedSubmissionId(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Full Submission</h3>
              <button
                onClick={() => setExpandedSubmissionId(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {leaderboard.find((e) => `${e.userId}-${e.rank}` === expandedSubmissionId) && (
                <div>
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      {getRankIcon(leaderboard.find((e) => `${e.userId}-${e.rank}` === expandedSubmissionId)?.rank || 0)}
                      <p className="text-sm sm:text-base font-bold text-gray-900">
                        {leaderboard.find((e) => `${e.userId}-${e.rank}` === expandedSubmissionId)?.userFullName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-500 flex-wrap">
                      <span>📅 {formatDate(leaderboard.find((e) => `${e.userId}-${e.rank}` === expandedSubmissionId)?.timestamp)}</span>
                      <Badge className="bg-[#0f172a]/10 text-[#0f172a] hover:bg-[#0f172a]/15 border border-[#0f172a]/20 font-bold text-xs">
                        {leaderboard.find((e) => `${e.userId}-${e.rank}` === expandedSubmissionId)?.totalVotes} votes
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-lg border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {leaderboard.find((e) => `${e.userId}-${e.rank}` === expandedSubmissionId)?.submissionText}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
