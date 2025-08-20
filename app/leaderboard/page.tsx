"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  where,
  QueryDocumentSnapshot,
} from "firebase/firestore"
import type { Competition, FinalLeaderboardEntry, DisplayEntry } from "@/types/leaderboard"
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable"
import { LeaderboardBanner, CompetitionHeader } from "@/components/leaderboard/LeaderboardBanner"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

const PAGE_SIZE = 10

export default function LeaderboardPage() {
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [leaderboard, setLeaderboard] = useState<DisplayEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<FinalLeaderboardEntry> | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchLatestCompetition()
  }, [])

  useEffect(() => {
    if (competition) {
      setLeaderboard([])
      setLastDoc(null)
      setPage(1)
      fetchLeaderboard()
    }
  }, [competition])

  useEffect(() => {
    if (competition && page > 1) {
      fetchLeaderboard()
    }
  }, [page])

  // Fetch latest competition with final leaderboard
  const fetchLatestCompetition = async () => {
    setLoading(true)
    try {
      const compQuery = query(
        collection(db, "competitions"),
        where("hasFinalLeaderboard", "==", true),
        orderBy("endDeadline", "desc"),
        limit(1)
      )
      const compSnap = await getDocs(compQuery)
      if (!compSnap.empty) {
        const doc = compSnap.docs[0]
        const data = doc.data()
        setCompetition({
          competitionId: doc.id,
          title: data.title,
          TopN: data.TopN || 0,
          maxScore: data.maxScore || 0,
        })
        setError(null)
      } else {
        setError("No competition with final leaderboard found.")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to fetch competition.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch leaderboard entries with pagination
  const fetchLeaderboard = async () => {
    if (!competition) return
    setLoading(true)
    try {
      const leaderboardRef = collection(db, `competitions/${competition.competitionId}/finalLeaderboard`)
      let q = query(leaderboardRef, orderBy("rank", "asc"), limit(PAGE_SIZE))
      if (lastDoc) {
        q = query(leaderboardRef, orderBy("rank", "asc"), startAfter(lastDoc), limit(PAGE_SIZE))
      }

      const snap = await getDocs(q)
      if (!snap.empty) {
        const entries: DisplayEntry[] = snap.docs.map((doc) => {
          const data = doc.data() as FinalLeaderboardEntry
          return {
            rank: data.rank,
            name: data.fullName,
            llmScore: data.llmScore,
            judgeScore: data.judgeScore ?? null,
            finalScore: data.finalScore,
          }
        })

        setLeaderboard(entries)
        setLastDoc(snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot<FinalLeaderboardEntry>)
        setHasMore(snap.size === PAGE_SIZE)
      } else {
        setHasMore(false)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to fetch leaderboard.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />

      {loading && leaderboard.length === 0 ? (
        <LeaderboardSkeleton />
      ) : error || !competition ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Error Loading Leaderboard
                  </h3>
                  <p className="text-sm font-medium text-gray-700">
                    {error || "An unknown error occurred while loading the leaderboard."}
                  </p>
                  <button
                    onClick={fetchLatestCompetition}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="space-y-6">
              {/* Competition Header */}
              <div className="text-center space-y-2">
                <CompetitionHeader
                  title={competition.title}
                  totalParticipants={leaderboard.length}
                />
              </div>

              {/* Leaderboard Banner */}
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                <LeaderboardBanner
                  topN={competition.TopN}
                  judgeEvaluationsComplete={true}
                  competitionTitle={competition.title}
                  maxScore={competition.maxScore}
                />
              </div>

              {/* Leaderboard Table */}
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <LeaderboardTable
                  data={leaderboard}
                  topN={competition.TopN}
                  competitionTitle={competition.title}
                />
              </div>

              {/* Enhanced Pagination */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1 || loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  <span className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white text-sm font-medium rounded-lg shadow-sm">
                    Page {page}
                  </span>
                  {loading && (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  )}
                </div>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!hasMore || loading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="text-center space-y-3">
            <Skeleton className="h-8 w-96 mx-auto rounded-lg" />
            <Skeleton className="h-4 w-32 mx-auto rounded-lg" />
          </div>

          {/* Banner Skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-4 pb-3 border-b border-gray-100">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              
              {/* Table Rows */}
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 py-3">
                  <Skeleton className="h-4 w-6 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="h-4 w-12 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Skeleton */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="h-9 w-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}