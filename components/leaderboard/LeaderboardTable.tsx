"use client"

import { useState } from "react"
import { Trophy, Medal, Award, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SubmissionViewerModal } from "./SubmissionViewerModal"
import type { DisplayEntry } from "@/types/leaderboard"

interface LeaderboardTableProps {
  data: DisplayEntry[]
  topN: number
  competitionTitle: string
  isLevel1?: boolean
  competitionId: string
}

export function LeaderboardTable({ data, topN, competitionTitle, isLevel1 = false, competitionId }: LeaderboardTableProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<{
    id: string
    name: string
  } | null>(null)

  const handleViewSubmissions = (participantId: string, participantName: string) => {
    setSelectedParticipant({ id: participantId, name: participantName })
  }

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
    <>
      <div className="overflow-hidden w-full">
        <div className="p-1 sm:p-3">
          
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
                      {!isLevel1 && (
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Judge Score
                        </th>
                      )}
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Final Score
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        View
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
                          <button
                            onClick={() => handleViewSubmissions(entry.id, entry.name)}
                            className="flex-1 min-w-0 text-left hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                          >
                            <div className="text-sm font-bold text-gray-900 truncate hover:underline cursor-pointer">
                              {entry.name}
                            </div>
                          </button>
                          {entry.rank <= topN && (
                            <span className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide flex-shrink-0">
                              Top {topN}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-mono font-medium shadow-sm">
                          {entry.llmScore.toFixed(2)}
                        </span>
                      </td>
                      {!isLevel1 && (
                        <td className="px-6 py-5 text-center">
                          {entry.judgeScore !== null ? (
                            <span className="inline-flex items-center bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-mono font-medium shadow-sm">
                              {entry.judgeScore.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-lg font-light">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`
                            inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-mono font-medium
                            ${
                              entry.rank <= 3
                                ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm"
                                : "bg-gray-100 text-gray-800 border border-gray-200"
                            }
                          `}
                        >
                          {entry.finalScore.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSubmissions(entry.id, entry.name)}
                          className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3 sm:space-y-4">
          {data.map((entry, index) => (
            <div
              key={`mobile-${entry.rank}-${entry.name}`}
              className={`
                ${getRowBackgroundStyle(entry.rank)}
                rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 
                hover:shadow-md transition-all duration-200 w-full
              `}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>
                  <span
                    className={`
                      inline-flex items-center justify-center min-w-[1.75rem] sm:min-w-[2rem] h-6 sm:h-7 px-2 sm:px-3 rounded-md sm:rounded-lg text-xs sm:text-sm font-bold
                      ${getRankBadgeStyle(entry.rank)}
                    `}
                  >
                    {entry.rank}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {entry.rank <= topN && (
                    <span className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                      Top {topN}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewSubmissions(entry.id, entry.name)}
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <button
                onClick={() => handleViewSubmissions(entry.id, entry.name)}
                className="w-full text-left mb-3 sm:mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1"
              >
                <div className="text-sm sm:text-base font-bold text-gray-900 mb-1 break-words hover:text-blue-600 hover:underline transition-colors">
                  {entry.name}
                </div>
              </button>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div>
                  <div className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    LLM
                  </div>
                  <span className="inline-flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-1.5 sm:px-2 py-1 rounded text-[10px] sm:text-xs font-mono font-medium shadow-sm">
                    {entry.llmScore.toFixed(2)}
                  </span>
                </div>
                {!isLevel1 && (
                  <div>
                    <div className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Judge
                    </div>
                    {entry.judgeScore !== null ? (
                      <span className="inline-flex items-center bg-gradient-to-r from-purple-600 to-purple-700 text-white px-1.5 sm:px-2 py-1 rounded text-[10px] sm:text-xs font-mono font-medium shadow-sm">
                        {entry.judgeScore.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs sm:text-sm">—</span>
                    )}
                  </div>
                )}
                <div>
                  <div className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Final
                  </div>
                  <span
                    className={`
                      inline-flex items-center px-1.5 sm:px-2 py-1 rounded text-[10px] sm:text-xs font-mono font-medium
                      ${
                        entry.rank <= 3
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm"
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
            {!isLevel1 && topN > 0 && (
              <div className="flex items-center gap-2">
                <span className="bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                  Top {topN}
                </span>
                <span className="font-medium text-gray-700">Judge Evaluated</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
      
    {/* Submission Viewer Modal */}
    {selectedParticipant && (
      <SubmissionViewerModal
        isOpen={!!selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
        participantId={selectedParticipant.id}
        participantName={selectedParticipant.name}
        competitionId={competitionId}
      />
    )}
    </>
  )
}