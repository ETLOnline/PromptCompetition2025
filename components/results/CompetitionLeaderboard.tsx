"use client"

import { useState, useEffect } from "react"
import { Trophy, Medal, Award, Eye, User } from "lucide-react"
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ViewParticipantSubmissionsModal } from "./ViewParticipantSubmissionsModal"

interface LeaderboardEntry {
  participantId: string
  rank: number
  fullName: string
  email: string
  finalScore: number
  institution?: string
  weightedFinalScore?: number
}

interface CompetitionLeaderboardProps {
  competitionId: string
  competitionLevel: string
}

export default function CompetitionLeaderboard({ competitionId, competitionLevel }: CompetitionLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [topN, setTopN] = useState(5)
  const [selectedParticipant, setSelectedParticipant] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [competitionId])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)

      // Fetch TopN from competition document
      const competitionRef = doc(db, "competitions", competitionId)
      const competitionSnap = await getDoc(competitionRef)
      if (competitionSnap.exists()) {
        const topNValue = competitionSnap.data()?.TopN || 5
        setTopN(topNValue)
        
        const leaderboardRef = collection(db, "competitions", competitionId, "finalLeaderboard")
        const q = query(leaderboardRef, orderBy("rank", "asc"), limit(topNValue))
        const snapshot = await getDocs(q)

        const leaderboardData: LeaderboardEntry[] = []
        
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data()
          
          // Fetch institution from users collection
          let institution = "N/A"
          try {
            const userRef = doc(db, "users", docSnap.id)
            const userSnap = await getDoc(userRef)
            if (userSnap.exists()) {
              institution = userSnap.data()?.institution || "N/A"
            }
          } catch (error) {
            console.error(`Error fetching institution for ${docSnap.id}:`, error)
          }

          leaderboardData.push({
            participantId: docSnap.id,
            rank: data.rank,
            fullName: data.fullName || "Unknown",
            email: data.email || "",
            finalScore: data.finalScore || 0,
            weightedFinalScore: data.weightedFinalScore,
            institution,
          })
        }

        setEntries(leaderboardData)
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
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
    return "bg-slate-100 text-slate-800 border-2 border-slate-300 font-semibold"
  }

  const getScoreDisplay = (entry: LeaderboardEntry) => {
    if (competitionLevel === "Level 2") {
      return (
        <div className="text-right">
          <span className="text-lg font-bold text-gray-900">{entry.finalScore.toFixed(2)}%</span>
        </div>
      )
    }
    return (
      <div className="text-right">
        <span className="text-lg font-bold text-gray-900">{entry.finalScore.toFixed(2)}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Competition Leaderboard</h2>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return null
  }

  return (
    <>
      <div id="competition-leaderboard" className="mt-16 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm">
            <Trophy className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Competition Leaderboard</h2>
            <p className="text-sm text-gray-600">Top {topN} participants in this competition</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Institution
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {competitionLevel === "Level 2" ? "Score (%)" : "Score"}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry.participantId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeStyle(entry.rank)}`}>
                          {entry.rank}
                        </div>
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{entry.fullName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{entry.institution}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {getScoreDisplay(entry)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedParticipant({ id: entry.participantId, name: entry.fullName })}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        View Submissions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {entries.map((entry) => (
              <div key={entry.participantId} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeStyle(entry.rank)}`}>
                      {entry.rank}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{entry.fullName}</p>
                    </div>
                  </div>
                  {getRankIcon(entry.rank)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{entry.institution}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>{getScoreDisplay(entry)}</div>
                  <button
                    onClick={() => setSelectedParticipant({ id: entry.participantId, name: entry.fullName })}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submissions Modal */}
      {selectedParticipant && (
        <ViewParticipantSubmissionsModal
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
