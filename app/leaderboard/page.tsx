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
import { AlertCircle, ChevronLeft, ChevronRight, Trophy, Users, Target, RefreshCw, Inbox } from "lucide-react"
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
    setError(null)
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
            maxScore: data.level === "Level 2" ? 100 : (data.maxScore || 0), // Level 2 always has max score of 100
            level: data.level || "custom",
          }
        })
        setCompetitions(comps)
        setSelectedCompetitionId(comps[0].competitionId)
      } else {
        // No competitions found - this is not an error, just empty state
        setCompetitions([])
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
    // Only set loading for initial load or pagination, not competition switching
    if (page === 1 && !lastDoc) {
      setLoading(true)
    }
    try {
      // Determine collection path based on competition level
      const isLevel2 = selectedCompetition?.level === "Level 2"
      const collectionPath = "finalLeaderboard"
      
      // For Level 2, limit to TopN participants; otherwise use PAGE_SIZE for pagination
      const limitCount = isLevel2 && selectedCompetition?.TopN ? selectedCompetition.TopN : PAGE_SIZE
      
      const leaderboardRef = collection(db, `competitions/${competitionId}/${collectionPath}`)
      let q = query(leaderboardRef, orderBy("rank", "asc"), limit(limitCount))
      if (lastDoc) {
        q = query(leaderboardRef, orderBy("rank", "asc"), startAfter(lastDoc), limit(limitCount))
      }

      const snap = await getDocs(q)
      if (!snap.empty) {
        const entries: DisplayEntry[] = snap.docs.map((doc) => {
          const data = doc.data() as any // Level 2 has different structure
          
          if (isLevel2) {
            // Level 2 structure
            return {
              rank: data.rank,
              name: data.fullName,
              llmScore: 0, // Level 2 doesn't have LLM scores
              judgeScore: data.finalScore, // Level 2 final score comes from judges
              finalScore: data.finalScore,
            }
          } else {
            // Level 1 structure
            return {
              rank: data.rank,
              name: data.fullName,
              llmScore: data.llmScore,
              judgeScore: data.judgeScore ?? null,
              finalScore: data.finalScore,
            }
          }
        })

        setLeaderboard((prev) => [...prev, ...entries])
        setLastDoc(snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot<FinalLeaderboardEntry>)
        // For Level 2 with TopN, disable pagination after reaching TopN participants
        if (isLevel2 && selectedCompetition?.TopN) {
          setHasMore(false)
        } else {
          setHasMore(snap.size === PAGE_SIZE)
        }
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
      const isLevel2 = selectedCompetition?.level === "Level 2"
      const collectionPath =  "finalLeaderboard"
      
      const leaderboardRef = collection(db, `competitions/${competitionId}/${collectionPath}`)
      const snap = await getDocs(leaderboardRef)
      setParticipantsCount(snap.size)
    } catch (err) {
      console.error("Error fetching participants count:", err)
    }
  }

  const selectedCompetition = competitions.find((c) => c.competitionId === selectedCompetitionId) || null

  // Determine which state to show
  const showEmptyState = !loading && competitions.length === 0 && !error
  const showErrorState = !loading && error !== null

  return (
    <>
      <Navbar />

      {loading && leaderboard.length === 0 ? (
        <LeaderboardSkeleton />
      ) : showErrorState ? (
        <ErrorState error={error} onRetry={fetchCompetitions} />
      ) : showEmptyState ? (
        <EmptyState />
      ) : selectedCompetition ? (
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
      ) : null}

      <Footer />
    </>
  )
}

// Enhanced Error State - For actual errors
function ErrorState({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white/90 backdrop-blur-md border border-red-100 rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-4 sm:space-y-8">
            {/* Animated Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl sm:rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-red-400 via-red-500 to-red-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-white drop-shadow-lg" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full animate-ping"></div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full"></div>
            </div>

            {/* Error Message */}
            <div className="space-y-3 sm:space-y-4 max-w-lg">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                Oops! Something Went Wrong
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <p className="text-red-700 font-medium text-xs sm:text-sm leading-relaxed">
                  {error || "An unexpected error occurred while loading the leaderboard. Our team has been notified and is working on it!"}
                </p>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm">
                This might be a temporary issue. Please try refreshing the page.
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={onRetry}
              className="group relative inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <RefreshCw className="relative z-10 h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-180 transition-transform duration-500" />
              <span className="relative z-10">Try Again</span>
            </button>

            {/* Additional Help */}
            <div className="pt-4 border-t border-gray-200 w-full">
              <p className="text-xs text-gray-400">
                Still having issues? Contact support at{" "}
                <a href="mailto:info@etlonline.org" className="text-indigo-600 hover:text-indigo-700 font-medium underline">
                  info@etlonline.org
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Empty State - For when no competitions exist (not an error)
function EmptyState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16 max-w-4xl">
        <div className="bg-white/90 backdrop-blur-md border border-gray-100 rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-4 sm:space-y-8">
            {/* Animated Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl sm:rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-300">
                <Trophy className="h-8 w-8 sm:h-12 sm:w-12 text-indigo-600 drop-shadow-sm" strokeWidth={2} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <Inbox className="h-3 w-3 text-white" />
              </div>
            </div>

            {/* Empty Message */}
            <div className="space-y-3 sm:space-y-4 max-w-lg">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                No Competitions Available
              </h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
                There are currently no competitions with final leaderboards available.
              </p>
              <p className="text-gray-500 text-xs sm:text-sm">
                Check back soon for upcoming competitions and exciting challenges!
              </p>
            </div>

            {/* Decorative Elements */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-indigo-700">New competitions coming soon</span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="pt-8 border-t border-gray-200 w-full">
              <p className="text-xs text-gray-400">
                Currently no competitions have been created with final leaderboards. Check back later!
              </p>
            </div>
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
        <div className="space-y-4 sm:space-y-8">

          {/* Main Content Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            
            {/* Competition Selector */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="max-w-md mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Select Competition
                </label>
                <Select
                  value={selectedCompetition.competitionId}
                  onValueChange={(val) => setSelectedCompetitionId(val)}
                >
                  <SelectTrigger className="w-full rounded-xl sm:rounded-2xl border-gray-200 shadow-sm focus:ring-4 focus:ring-indigo-100 text-xs sm:text-sm">
                    <SelectValue placeholder="Choose a competition" className="truncate block" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-lg max-w-[calc(100vw-2rem)] sm:max-w-full">
                    {competitions.map((comp) => (
                      <SelectItem
                        key={comp.competitionId}
                        value={comp.competitionId}
                        className="cursor-pointer text-xs sm:text-sm"
                      >
                        <span className="block truncate sm:whitespace-normal max-w-[calc(100vw-4rem)] sm:max-w-none">
                          {comp.title}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-2 sm:p-4 lg:p-6">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-4 lg:p-6 mb-4 sm:mb-6">
                <LeaderboardBanner
                  topN={selectedCompetition.TopN}
                  judgeEvaluationsComplete={true}
                  maxScore={selectedCompetition.maxScore}
                  participantsCount={participantsCount}
                />
              </div>

              {participantsCount === 0 ? (
                <div className="text-center py-8 sm:py-16">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                  </div>
                  <p className="text-base sm:text-xl text-gray-500 font-medium">No participants yet</p>
                  <p className="text-sm sm:text-base text-gray-400 mt-2">Be the first to join this competition!</p>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-4 lg:p-6 mb-4 sm:mb-6 overflow-x-auto">
                    <LeaderboardTable
                      data={leaderboard}
                      topN={selectedCompetition.TopN}
                      competitionTitle={selectedCompetition.title}
                      isLevel1={selectedCompetition.level === "Level 1"}
                      isLevel2={selectedCompetition.level === "Level 2"}
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
    <div className="flex items-center justify-center gap-2 sm:gap-4 pt-4 sm:pt-8">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 1 || loading}
        className="group inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl sm:rounded-2xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:shadow-none transition-all duration-200"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:-translate-x-0.5" />
      </button>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative">
          <div className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-700 text-white text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl shadow-lg">
            <span className="relative z-10">Page {page}</span>
          </div>
          {loading && (
            <div className="absolute -right-8 sm:-right-12 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setPage(page + 1)}
        disabled={!hasMore || loading}
        className="group inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl sm:rounded-2xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:shadow-none transition-all duration-200"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
        <div className="space-y-4 sm:space-y-8">
          {/* Header Skeleton */}
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-2xl sm:rounded-3xl mx-auto animate-pulse"></div>
            <div className="space-y-2 sm:space-y-3">
              <Skeleton className="h-8 sm:h-10 w-64 sm:w-96 mx-auto rounded-xl sm:rounded-2xl" />
              <Skeleton className="h-5 sm:h-6 w-32 sm:w-48 mx-auto rounded-lg sm:rounded-xl" />
            </div>
            
            {/* Stats Cards Skeleton */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-4 sm:mt-8">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl" />
                    <div className="space-y-1 sm:space-y-2">
                      <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 rounded-md sm:rounded-lg" />
                      <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 rounded-md sm:rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Card Skeleton */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="max-w-md mx-auto space-y-2 sm:space-y-3">
                <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 rounded-md sm:rounded-lg" />
                <Skeleton className="h-10 sm:h-12 w-full rounded-lg sm:rounded-xl" />
              </div>
            </div>
            
            <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
              <Skeleton className="h-16 sm:h-24 w-full rounded-xl sm:rounded-2xl" />
              <Skeleton className="h-48 sm:h-64 w-full rounded-xl sm:rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}