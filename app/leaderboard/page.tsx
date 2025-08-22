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
import { LeaderboardBanner } from "@/components/leaderboard/LeaderboardBanner"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ChevronLeft, ChevronRight, Trophy, Users, Target } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PAGE_SIZE = 10

export default function LeaderboardPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<DisplayEntry[]>([])
  const [participantsCount, setParticipantsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<FinalLeaderboardEntry> | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchCompetitions()
  }, [])

  useEffect(() => {
    if (selectedCompetitionId) {
      resetLeaderboard()
      fetchLeaderboard(selectedCompetitionId)
      fetchParticipantsCount(selectedCompetitionId)
    }
  }, [selectedCompetitionId])

  useEffect(() => {
    if (selectedCompetitionId && page > 1) {
      fetchLeaderboard(selectedCompetitionId, page, lastDoc || undefined)
    }
  }, [page])

  const resetLeaderboard = () => {
    setLeaderboard([])
    setLastDoc(null)
    setPage(1)
    setHasMore(true)
  }

  // Fetch competitions for dropdown
  const fetchCompetitions = async () => {
    setLoading(true)
    try {
      const compQuery = query(
        collection(db, "competitions"),
        where("hasFinalLeaderboard", "==", true),
        orderBy("finalLeaderboardGeneratedAt", "desc")
      )
      const compSnap = await getDocs(compQuery)

      if (!compSnap.empty) {
        const comps: Competition[] = compSnap.docs.map((doc) => {
          const data = doc.data()
          return {
            competitionId: doc.id,
            title: data.title,
            TopN: data.TopN || 0,
            maxScore: data.maxScore || 0,
          }
        })
        setCompetitions(comps)
        setSelectedCompetitionId(comps[0].competitionId)
        setError(null)
      } else {
        setError("No competitions with final leaderboard found.")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to fetch competitions.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch leaderboard entries with pagination
  const fetchLeaderboard = async (
    competitionId: string,
    page = 1,
    lastDoc?: QueryDocumentSnapshot<FinalLeaderboardEntry>
  ) => {
    setLoading(true)
    try {
      const leaderboardRef = collection(db, `competitions/${competitionId}/finalLeaderboard`)
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

        setLeaderboard((prev) => [...prev, ...entries])
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

  // Fetch participants count
  const fetchParticipantsCount = async (competitionId: string) => {
    try {
      const leaderboardRef = collection(db, `competitions/${competitionId}/finalLeaderboard`)
      const snap = await getDocs(leaderboardRef)
      setParticipantsCount(snap.size)
    } catch (err) {
      console.error("Error fetching participants count:", err)
    }
  }

  const selectedCompetition = competitions.find((c) => c.competitionId === selectedCompetitionId) || null

  return (
    <>
      <Navbar />

      {loading && leaderboard.length === 0 ? (
        <LeaderboardSkeleton />
      ) : error || !selectedCompetition ? (
        <ErrorState error={error} onRetry={fetchCompetitions} />
      ) : (
        <LeaderboardContent
          competitions={competitions}
          selectedCompetition={selectedCompetition}
          setSelectedCompetitionId={setSelectedCompetitionId}
          leaderboard={leaderboard}
          participantsCount={participantsCount}
          page={page}
          setPage={setPage}
          hasMore={hasMore}
          loading={loading}
        />
      )}

      <Footer />
    </>
  )
}

function ErrorState({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white/80 backdrop-blur-sm border border-red-100 rounded-3xl p-8 shadow-xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertCircle className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Oops! Something went wrong
              </h3>
              <p className="text-gray-600 font-medium max-w-md">
                {error || "An unknown error occurred while loading the leaderboard. Don't worry, we're on it!"}
              </p>
            </div>
            <button
              onClick={onRetry}
              className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-200"
            >
              <span className="relative z-10">Try Again</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LeaderboardContent({
  competitions,
  selectedCompetition,
  setSelectedCompetitionId,
  leaderboard,
  participantsCount,
  page,
  setPage,
  hasMore,
  loading,
}: {
  competitions: Competition[]
  selectedCompetition: Competition
  setSelectedCompetitionId: (id: string) => void
  leaderboard: DisplayEntry[]
  participantsCount: number
  page: number
  setPage: (v: number) => void
  hasMore: boolean
  loading: boolean
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-3xl shadow-xl mb-4">
              <Trophy className="h-8 w-8 text-emerald-600" />
            </div>

            {/* Stats Cards */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-gray-900">{participantsCount}</p>
                    <p className="text-sm text-gray-600 font-medium">Participants</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl">
                    <Target className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-gray-900">{selectedCompetition.maxScore}</p>
                    <p className="text-sm text-gray-600 font-medium">Total Score</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            
            {/* Competition Selector */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="max-w-md mx-auto">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Competition
                </label>
                <Select
                  value={selectedCompetition.competitionId}
                  onValueChange={(val) => setSelectedCompetitionId(val)}
                >
                  <SelectTrigger className="w-full rounded-2xl border-gray-200 shadow-sm focus:ring-4 focus:ring-indigo-100">
                    <SelectValue placeholder="Choose a competition" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-lg">
                    {competitions.map((comp) => (
                      <SelectItem
                        key={comp.competitionId}
                        value={comp.competitionId}
                        className="cursor-pointer"
                      >
                        {comp.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8">
              <div className="mb-8">
                <LeaderboardBanner
                  topN={selectedCompetition.TopN}
                  judgeEvaluationsComplete={true}
                  competitionTitle={selectedCompetition.title}
                  maxScore={selectedCompetition.maxScore}
                />
              </div>

              {participantsCount === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-xl text-gray-500 font-medium">No participants yet</p>
                  <p className="text-gray-400 mt-2">Be the first to join this competition!</p>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
                    <LeaderboardTable
                      data={leaderboard}
                      topN={selectedCompetition.TopN}
                      competitionTitle={selectedCompetition.title}
                    />
                  </div>
                  <Pagination page={page} setPage={setPage} hasMore={hasMore} loading={loading} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Pagination({
  page,
  setPage,
  hasMore,
  loading,
}: {
  page: number
  setPage: (p: number) => void
  hasMore: boolean
  loading: boolean
}) {
  return (
    <div className="flex items-center justify-center gap-4 pt-8">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 1 || loading}
        className="group inline-flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:shadow-none transition-all duration-200"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
      </button>

      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="px-6 py-3 bg-gray-700 text-white font-bold rounded-2xl shadow-lg">
            <span className="relative z-10">Page {page}</span>
          </div>
          {loading && (
            <div className="absolute -right-12 top-1/2 -translate-y-1/2">
              <div className="w-6 h-6 border-3 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setPage(page + 1)}
        disabled={!hasMore || loading}
        className="group inline-flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:shadow-none transition-all duration-200"
        aria-label="Next page"
      >
        <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-gray-200 rounded-3xl mx-auto animate-pulse"></div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-96 mx-auto rounded-2xl" />
              <Skeleton className="h-6 w-48 mx-auto rounded-xl" />
            </div>
            
            {/* Stats Cards Skeleton */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-16 rounded-lg" />
                      <Skeleton className="h-4 w-20 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Card Skeleton */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 p-6 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="max-w-md mx-auto space-y-3">
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}