"use client"
import React, { useState, useEffect } from "react"
import { fetchOverallLeaderboard } from "@/lib/api"
import { Trophy, Medal, Award, TrendingUp, Users, Target, Star, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface OverallLeaderboardEntry {
  userId: string
  rank: number
  fullName: string
  email: string
  totalRatingSum: number
  totalVoteCount: number
  submissionCount: number
  bayesScore: number
  userType?: string
}

interface LeaderboardMetadata {
  lastGeneratedAt: any
  totalUsers: number
  totalSubmissions: number
  totalVotes: number
  totalRatingSum: number
  bayesianConstants?: {
    m: number
    C: number
  }
}

interface OverallLeaderboardProps {
  topN?: number
  onGenerateLeaderboard?: () => void
  isGeneratingLeaderboard?: boolean
}

export const OverallLeaderboard = ({ topN = 10, onGenerateLeaderboard, isGeneratingLeaderboard }: OverallLeaderboardProps) => {
  const [leaderboard, setLeaderboard] = useState<OverallLeaderboardEntry[]>([])
  const [metadata, setMetadata] = useState<LeaderboardMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [topN])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchOverallLeaderboard(topN)
      setLeaderboard(data.leaderboard || [])
      setMetadata(data.metadata || null)
    } catch (err) {
      console.error("Error fetching overall leaderboard:", err)
      setError(err instanceof Error ? err.message : "Failed to load leaderboard")
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 drop-shadow-md" />
      case 2:
        return <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 drop-shadow-sm" />
      case 3:
        return <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 drop-shadow-sm" />
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
    if (rank <= 10) {
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
    if (!timestamp) return "N/A"

    // Handle Firestore Timestamp objects
    let date: Date
    if (timestamp && typeof timestamp.toDate === 'function') {
      // Firestore Timestamp object with toDate method
      date = timestamp.toDate()
    } else if (timestamp && (timestamp._seconds || timestamp.seconds)) {
      // Firestore timestamp-like objects with _seconds or seconds property
      const seconds = timestamp._seconds || timestamp.seconds
      date = new Date(seconds * 1000)
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      // Regular date string or number
      date = new Date(timestamp)
    } else {
      return "Invalid Date"
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date"
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-[#0f172a] shadow-lg flex-shrink-0">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Overall Leaderboard
          </h3>
          <Badge className="bg-[#0f172a] text-white border-0 font-medium text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1">
            Global Rankings
          </Badge>
          {onGenerateLeaderboard && (
            <Button
              onClick={onGenerateLeaderboard}
              disabled={isGeneratingLeaderboard}
              className="bg-[#0f172a] hover:bg-[#0d1220] text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 ml-auto"
            >
              {isGeneratingLeaderboard ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Leaderboard
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-600 pl-0 sm:pl-11 md:pl-13">
          Aggregated rankings across all daily challenges using Bayesian averaging to ensure fair scoring.
        </p>
        {metadata?.lastGeneratedAt && (
          <p className="text-xs text-gray-500 pl-0 sm:pl-11 md:pl-13 mt-1">
            Last updated: {formatDate(metadata.lastGeneratedAt)}
          </p>
        )}
      </div>
      {/* Stats Cards */}
      {metadata && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-gray-600">Total Users</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{metadata.totalUsers}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-green-600" />
              <p className="text-xs text-gray-600">Submissions</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{metadata.totalSubmissions}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-yellow-600" />
              <p className="text-xs text-gray-600">Total Votes</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{metadata.totalVotes}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <p className="text-xs text-gray-600">Avg Rating</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {metadata.totalVotes > 0 ? (metadata.totalRatingSum / metadata.totalVotes).toFixed(2) : "0.00"}
            </p>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-32">
                    User ID
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-24">
                    Bayes Score
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-20">
                    Votes
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-20">
                    Avg Rating
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-24">
                    Challenges
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  // Loading skeleton rows
                  [...Array(5)].map((_, i) => (
                    <tr key={`skeleton-${i}`} className="bg-white">
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Skeleton className="h-4 w-16 mx-auto" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-sm text-gray-500">No leaderboard data available yet</p>
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry) => (
                    <tr
                      key={`${entry.userId}-${entry.rank}`}
                      className={`${getRowBackgroundStyle(entry.rank)} hover:bg-slate-50 transition-all duration-200 group`}
                    >
                      {/* Rank */}
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center justify-center gap-2">
                          {entry.rank <= 3 && getRankIcon(entry.rank)}
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${getRankBadgeStyle(entry.rank)}`}>
                            {entry.rank}
                          </div>
                        </div>
                      </td>

                      {/* Participant Name */}
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex flex-col">
                          <p className="text-sm font-semibold text-gray-900">{entry.fullName}</p>
                          <p className="text-xs text-gray-500">{entry.email}</p>
                        </div>
                      </td>

                      {/* User ID */}
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        <span className="text-sm font-mono text-gray-700">{entry.userId}</span>
                      </td>

                      {/* Bayesian Score */}
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-gray-900">
                            {entry.bayesScore.toFixed(3)}
                          </span>
                        </div>
                      </td>

                      {/* Votes */}
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        <span className="text-sm text-gray-700">{entry.totalVoteCount}</span>
                      </td>

                      {/* Average Rating */}
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-semibold text-gray-800">
                            {entry.totalVoteCount > 0 
                              ? (entry.totalRatingSum / entry.totalVoteCount).toFixed(2) 
                              : "0.00"}
                          </span>
                        </div>
                      </td>

                      {/* Submission Count */}
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        <span className="text-sm font-semibold text-gray-900">{entry.submissionCount}</span>
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
            <p className="text-xs sm:text-sm text-gray-500">No leaderboard data available yet</p>
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
                      {entry.rank <= 3 && getRankIcon(entry.rank)}
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${getRankBadgeStyle(entry.rank)}`}>
                        {entry.rank}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                      {entry.fullName}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {entry.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-semibold text-gray-800">
                    {entry.totalVoteCount > 0 
                      ? (entry.totalRatingSum / entry.totalVoteCount).toFixed(2) 
                      : "0.00"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-600">Bayes Score</p>
                  <p className="text-sm font-bold text-gray-900">{entry.bayesScore.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Votes</p>
                  <p className="text-sm font-bold text-gray-900">{entry.totalVoteCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Challenges</p>
                  <p className="text-sm font-bold text-gray-900">{entry.submissionCount}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      {!loading && leaderboard.length > 0 && metadata && (
        <div className="mt-3 sm:mt-4 md:mt-6 space-y-3">
          <div className="p-2.5 sm:p-3 md:p-4 bg-[#0f172a]/5 rounded-lg border border-[#0f172a]/10">
            <p className="text-[10px] sm:text-xs text-[#0f172a] leading-relaxed">
              <strong>Bayesian Scoring:</strong> Rankings use a Bayesian average that balances user ratings with global averages. 
              This prevents users with few votes from ranking artificially high and ensures fair competition across all participants.
            </p>
            {metadata.bayesianConstants && (
              <p className="text-[10px] sm:text-xs text-[#0f172a]/70 mt-2">
                Constants: m (prior) = {metadata.bayesianConstants.m.toFixed(3)}, 
                C (confidence) = {metadata.bayesianConstants.C.toFixed(1)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
