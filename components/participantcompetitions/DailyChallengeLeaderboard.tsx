"use client"

import { Trophy, Medal, Award, Zap, X, Star, FileText, Target, Eye, Image as ImageIcon, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { useDailyChallengeLeaderboard } from "@/hooks/useDailyChallengeLeaderboard"
import type { DailyChallengeLeaderboardEntry } from "@/hooks/useDailyChallengeLeaderboard"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

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
  const [challengeDetails, setChallengeDetails] = useState<any>(null)
  const [loadingChallengeDetails, setLoadingChallengeDetails] = useState(false)

  // Fetch challenge details when modal opens
  useEffect(() => {
    if (expandedSubmissionId && !challengeDetails) {
      fetchChallengeDetails()
    }
  }, [expandedSubmissionId])

  const fetchChallengeDetails = async () => {
    try {
      setLoadingChallengeDetails(true)
      const challengeRef = doc(db, "dailychallenge", challengeId)
      const challengeSnap = await getDoc(challengeRef)
      
      if (challengeSnap.exists()) {
        setChallengeDetails(challengeSnap.data())
      }
    } catch (err) {
      console.error("Error fetching challenge details:", err)
    } finally {
      setLoadingChallengeDetails(false)
    }
  }

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

  const truncateText = (text: string, maxLength: number = 60) => {
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
      {/* Header (matched to Voting section styles) */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-[#0f172a] shadow-lg flex-shrink-0">
            <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Daily Challenge Leaderboard
          </h3>
          <Badge className="bg-[#0f172a] text-white border-0 font-medium text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1">
            Live
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 pl-0 sm:pl-11 md:pl-13">
          Ranked using a fair scoring method that balances both the number of votes and the average rating for each submission.
        </p>
      </div>

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
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-20 sm:w-24">
                    Rating
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-16 sm:w-20">
                    Votes
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-tight hidden lg:table-cell">
                    User submission
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
                    <td colSpan={6} className="px-6 py-8 sm:py-12 text-center">
                      <p className="text-xs sm:text-sm text-gray-500">No submissions meet the minimum vote threshold (2+ votes) yet</p>
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

                      {/* Rating Average */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => {
                              const rating = entry.ratingAvg ?? 0
                              const filled = rating >= s - 0.5
                              return (
                                <Star
                                  key={s}
                                  className={`h-3.5 w-3.5 ${filled ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                />
                              )
                            })}
                          </div>
                          <span className="text-xs font-semibold text-gray-800">
                            {entry.ratingAvg ? entry.ratingAvg.toFixed(1) : '0.0'}
                          </span>
                        </div>
                      </td>

                      {/* Total Votes */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 text-center">
                        <Badge className="bg-[#0f172a]/10 text-[#0f172a] hover:bg-[#0f172a]/15 border border-[#0f172a]/20 font-bold text-xs sm:text-sm px-2 sm:px-3 py-1">
                          {entry.voteCount}
                        </Badge>
                      </td>

                      {/* Submission Preview */}
                      <td className="px-3 sm:px-6 py-3 sm:py-5 hidden lg:table-cell">
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                          {truncateText(entry.submissionText, 50)}
                          {entry.submissionText.length > 50 && (
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
            <p className="text-xs sm:text-sm text-gray-500">No submissions meet the minimum vote threshold (2+ votes) yet</p>
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const rating = entry.ratingAvg ?? 0
                      const filled = rating >= s - 0.5
                      return (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${filled ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                        />
                      )
                    })}
                  </div>
                  <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                    {entry.ratingAvg ? entry.ratingAvg.toFixed(1) : '0.0'}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs sm:text-sm text-gray-600" title={entry.submissionText}>
                  {truncateText(entry.submissionText, 50)}
                  {entry.submissionText.length > 50 && (
                    <button
                      onClick={() => setExpandedSubmissionId(`${entry.userId}-${entry.rank}`)}
                      className="text-xs text-[#0f172a] hover:text-slate-800 font-semibold ml-1"
                    >
                      Show more
                    </button>
                  )}
                </p>
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
        <div className="mt-3 sm:mt-4 md:mt-6 p-2.5 sm:p-3 md:p-4 bg-[#0f172a]/5 rounded-lg border border-[#0f172a]/10">
          <p className="text-[10px] sm:text-xs text-[#0f172a] leading-relaxed">
            Leaderboard updates in real-time. Top performers are determined using a Bayesian average of ratings received on their submissions for the daily challenge.
          </p>
        </div>
      )}

      {/* Submission Details Modal with Challenge Context */}
      {expandedSubmissionId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4"
          onClick={() => setExpandedSubmissionId(null)}
        >
          <div 
            className="bg-white rounded-lg sm:rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-50 border-b border-gray-200 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Submission Details</h3>
              <button
                onClick={() => setExpandedSubmissionId(null)}
                className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-3 sm:p-4 md:p-6">
              {loadingChallengeDetails ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-3 sm:border-4 border-blue-200 border-t-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* Challenge Title */}
                  {challengeDetails?.title && (
                    <div className="bg-gray-50 rounded-md sm:rounded-lg p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 break-words leading-tight">
                        {challengeDetails.title}
                      </h3>
                    </div>
                  )}

                  {/* Problem Statement */}
                  {(challengeDetails?.problemStatement || challengeDetails?.problemAudioUrls?.length > 0) && (
                    <div className="bg-blue-50 rounded-md sm:rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <h4 className="text-sm sm:text-base font-semibold text-blue-900">Problem Statement</h4>
                      </div>
                    
                      {challengeDetails.problemStatement && (
                        <div className="bg-white rounded-md p-3 sm:p-4 max-h-40 sm:max-h-48 overflow-y-auto border mb-3 sm:mb-4">
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                            {challengeDetails.problemStatement}
                          </p>
                        </div>
                      )}
                    
                      {challengeDetails.problemAudioUrls && challengeDetails.problemAudioUrls.length > 0 && (
                        <div className="space-y-2 sm:space-y-3">
                          {challengeDetails.problemAudioUrls.map((url: string, index: number) => (
                            <div key={index} className="bg-white rounded-md p-2 sm:p-3 border">
                              <div className="text-xs sm:text-sm text-gray-700 mb-1.5 sm:mb-2 font-medium">Audio {index + 1}</div>
                              <audio controls src={url} className="w-full h-8" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Guidelines */}
                  {(challengeDetails?.guidelines || challengeDetails?.guidelinesAudioUrls?.length > 0) && (
                    <div className="bg-green-50 rounded-md sm:rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                        <h4 className="text-sm sm:text-base font-semibold text-green-900">Guidelines</h4>
                      </div>
                    
                      {challengeDetails.guidelines && (
                        <div className="bg-white rounded-md p-3 sm:p-4 max-h-40 sm:max-h-48 overflow-y-auto border mb-3 sm:mb-4">
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                            {challengeDetails.guidelines}
                          </p>
                        </div>
                      )}
                    
                      {challengeDetails.guidelinesAudioUrls && challengeDetails.guidelinesAudioUrls.length > 0 && (
                        <div className="space-y-2 sm:space-y-3">
                          {challengeDetails.guidelinesAudioUrls.map((url: string, index: number) => (
                            <div key={index} className="bg-white rounded-md p-2 sm:p-3 border">
                              <div className="text-xs sm:text-sm text-gray-700 mb-1.5 sm:mb-2 font-medium">Audio {index + 1}</div>
                              <audio controls src={url} className="w-full h-8" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visual Clues */}
                  {challengeDetails?.visualClueUrls && challengeDetails.visualClueUrls.length > 0 && (
                    <div className="bg-amber-50 rounded-md sm:rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
                        <h4 className="text-sm sm:text-base font-semibold text-amber-900">Visual Clues ({challengeDetails.visualClueUrls.length})</h4>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        {challengeDetails.visualClueUrls.map((url: string, index: number) => (
                          <div key={index} className="w-full flex justify-center">
                            <img
                              src={url}
                              alt={`Visual clue ${index + 1}`}
                              className="max-w-full h-auto rounded-md border border-amber-200 mx-auto"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Participant Submission */}
                  {(() => {
                    const currentEntry = leaderboard.find((e) => `${e.userId}-${e.rank}` === expandedSubmissionId)
                    return currentEntry && (
                      <div className="bg-purple-50 rounded-md sm:rounded-lg p-3 sm:p-4">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                          <Send className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                          <h4 className="text-sm sm:text-base font-semibold text-purple-900">{currentEntry.userFullName}'s Submission</h4>
                        </div>
                        <div className="bg-white rounded-md p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-y-auto border">
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                            {currentEntry.submissionText}
                          </p>
                        </div>
                        {currentEntry.submissionText && (
                          <div className="mt-2 text-[10px] sm:text-xs text-purple-700 bg-purple-100 px-2 sm:px-3 py-1 rounded-full inline-block">
                            Characters: {currentEntry.submissionText.length} | Words: {currentEntry.submissionText.split(/\s+/).filter(Boolean).length}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
