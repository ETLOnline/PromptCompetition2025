"use client"

import React, { useEffect, useState } from "react"
import { fetchOverallLeaderboard } from "@/lib/api"
import { Star, Users, Trophy, Medal, Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

interface Entry {
  userId: string
  rank: number
  fullName: string
  email?: string
  totalRatingSum: number
  totalVoteCount: number
  submissionCount: number
  institution?: string
}

interface Props {
  topN?: number
}

export const OverallLeaderboardParticipant = ({ topN = 10 }: Props) => {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedInstitutions, setExpandedInstitutions] = useState<Set<string>>(new Set())

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchOverallLeaderboard(topN)
        if (!mounted) return
        let leaderboardEntries = data.leaderboard || []
        
        // Fetch institutions for each user
        const userIds = leaderboardEntries.map((e: Entry) => e.userId)
        const institutionPromises = userIds.map(async (userId: string) => {
          try {
            const userRef = doc(db, "users", userId)
            const userSnap = await getDoc(userRef)
            return userSnap.exists() ? userSnap.data()?.institution || "N/A" : "N/A"
          } catch (error) {
            console.error(`Failed to fetch institution for user ${userId}:`, error)
            return "N/A"
          }
        })
        
        const institutions = await Promise.all(institutionPromises)
        leaderboardEntries = leaderboardEntries.map((e: Entry, i: number) => ({ ...e, institution: institutions[i] }))
        
        setEntries(leaderboardEntries)
      } catch (err) {
        console.error("Failed to load overall leaderboard:", err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [topN])

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

  function formatAvgHelper(entry: Entry) {
    if (!entry.totalVoteCount || entry.totalVoteCount <= 0) return 0
    return entry.totalRatingSum / entry.totalVoteCount
  }

  const toggleInstitutionExpansion = (userId: string) => {
    setExpandedInstitutions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const renderInstitution = (institution: string | undefined, userId: string) => {
    const text = institution || "N/A"
    const isExpanded = expandedInstitutions.has(userId)
    
    // For expanded state, show full text
    if (isExpanded) {
      return (
        <div className="text-xs sm:text-sm text-gray-700 leading-tight">
          {text}{" "}
          <button
            onClick={() => toggleInstitutionExpansion(userId)}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
          >
            show less
          </button>
        </div>
      )
    }
    
    // For collapsed state, show truncated text with show more
    // Estimate characters that fit in ~1.5 lines (roughly 30-40 characters for typical institution names)
    const maxCollapsedLength = 35
    
    if (text.length <= maxCollapsedLength) {
      // Short text, no need for show more
      return (
        <span className="text-xs sm:text-sm text-gray-700 leading-tight">{text}</span>
      )
    }
    
    // Long text, show truncated with show more
    const truncatedText = text.substring(0, maxCollapsedLength)
    const lastSpaceIndex = truncatedText.lastIndexOf(' ')
    const displayText = lastSpaceIndex > maxCollapsedLength * 0.7 ? truncatedText.substring(0, lastSpaceIndex) : truncatedText
    
    return (
      <div className="text-xs sm:text-sm text-gray-700 leading-tight">
        {displayText}...{" "}
        <button
          onClick={() => toggleInstitutionExpansion(userId)}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium"
        >
          show more
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3">
        <p className="text-sm text-red-700">Failed to load leaderboard: {error}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-[#0f172a] shadow-lg flex-shrink-0">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Overall Leaderboard</h3>
          <Badge className="bg-[#0f172a] text-white border-0 font-medium text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1">Global</Badge>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 pl-0 sm:pl-11 md:pl-13">
          Top participants across daily challenges — ranked by average rating.
        </p>
      </div>

      <div className="hidden md:block">
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200">
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-12 sm:w-16">
                    Rank
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-tight w-36">
                    Participant
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-tight w-44">
                    Institution
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-44">
                    Avg Rating
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-20 sm:w-24">
                    Votes
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-28">
                    Challenges
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="bg-white">
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full mx-auto" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        <Skeleton className="h-6 w-32 mx-auto" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        <Skeleton className="h-6 w-12 mx-auto" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        <Skeleton className="h-6 w-12 mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-sm text-gray-500">No leaderboard data available</td>
                  </tr>
                ) : (
                  entries.map((e) => (
                    <tr 
                      key={`${e.userId}-${e.rank}`} 
                      className={`${getRowBackgroundStyle(e.rank)} hover:bg-slate-50 transition-all duration-200 group`}
                    >
                      {/* Rank */}
                      <td className="px-2 sm:px-4 py-3 sm:py-5">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <div className="flex-shrink-0 hidden sm:block">
                            {getRankIcon(e.rank)}
                          </div>
                          <span className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold ${getRankBadgeStyle(e.rank)}`}>
                            {e.rank}
                          </span>
                        </div>
                      </td>

                      {/* Participant */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                          {e.fullName}
                        </p>
                      </td>

                      {/* Institution */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 align-top">
                        {renderInstitution(e.institution, e.userId)}
                      </td>

                      {/* Avg Rating with Stars */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => {
                              const rating = formatAvgHelper(e)
                              const filled = rating >= s - 0.5
                              return (
                                <Star
                                  key={s}
                                  className={`h-3.5 w-3.5 ${filled ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                />
                              )
                            })}
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-gray-800">
                            {formatAvgHelper(e).toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Total Votes */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 text-center">
                        <Badge className="bg-[#0f172a]/10 text-[#0f172a] hover:bg-[#0f172a]/15 border border-[#0f172a]/20 font-bold text-xs sm:text-sm px-2 sm:px-3 py-1">
                          {e.totalVoteCount || 0}
                        </Badge>
                      </td>

                      {/* Submission Count */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 text-center">
                        <Badge className="bg-[#0f172a]/10 text-[#0f172a] hover:bg-[#0f172a]/15 border border-[#0f172a]/20 font-bold text-xs sm:text-sm px-2 sm:px-3 py-1">
                          {e.submissionCount || 0}
                        </Badge>
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
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-gray-600">Avg</p>
                  <Skeleton className="h-4 w-12 mx-auto" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600">Votes</p>
                  <Skeleton className="h-4 w-8 mx-auto" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600">Challenges</p>
                  <Skeleton className="h-4 w-10 mx-auto" />
                </div>
              </div>
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-gray-500">No leaderboard data available</p>
          </div>
        ) : (
          entries.map((e) => (
            <div 
              key={`${e.userId}-${e.rank}`} 
              className={`rounded-lg border border-gray-200 p-3 ${getRowBackgroundStyle(e.rank)}`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center gap-1.5">
                      {getRankIcon(e.rank)}
                      <span className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold ${getRankBadgeStyle(e.rank)}`}>
                        {e.rank}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {e.fullName}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{e.institution || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-600 mb-1">Avg Rating</p>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const rating = formatAvgHelper(e)
                        const filled = rating >= s - 0.5
                        return (
                          <Star
                            key={s}
                            className={`h-2.5 w-2.5 ${filled ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                          />
                        )
                      })}
                    </div>
                    <p className="text-xs font-bold text-gray-900">{formatAvgHelper(e).toFixed(2)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 mb-1">Votes</p>
                  <p className="text-sm font-bold text-gray-900">{e.totalVoteCount || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 mb-1">Challenges</p>
                  <p className="text-sm font-bold text-gray-900">{e.submissionCount || 0}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      {!loading && entries.length > 0 && (
        <div className="mt-3 sm:mt-4 md:mt-6 p-2.5 sm:p-3 md:p-4 bg-[#0f172a]/5 rounded-lg border border-[#0f172a]/10">
          <p className="text-[10px] sm:text-xs text-[#0f172a] leading-relaxed">
            Overall leaderboard ranks participants based on bayesian average across all daily challenge submissions.
          </p>
        </div>
      )}
    </div>
  )
}

export default OverallLeaderboardParticipant