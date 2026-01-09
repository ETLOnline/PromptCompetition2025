// app\admin\competitions\[competitionId]\llm-evaluations\page.tsx
"use client"

import React from "react"
import { Suspense, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChallengeAccordion } from "@/components/LlmEvaluation/ChallengeAccordion"
import { ParticipantSearchResults } from "@/components/LlmEvaluation/ParticipantSearchResults"
import { fetchWithAuth, fetchAllParticipantSubmissions, fetchUsersByIds } from "@/lib/api"
import type { CompetitionLlmEvaluations, Submission, UserProfile } from "@/types/llmEvaluations"
import { Search, Loader2, User } from "lucide-react"
import { useAuth } from "@clerk/nextjs"

// --- API FUNCTIONS ---
export async function fetchCompetitionLlmEvaluations(
  competitionId: string
): Promise<CompetitionLlmEvaluations> {
  try {
    // fetchWithAuth already returns JSON
    const data = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/llm-evaluations/${competitionId}`
    )
    return data
  } catch (error) {
    console.error("Error fetching competition LLM evaluations:", error)
    throw error
  }
}

// --- PAGE COMPONENT ---
export default function LlmEvaluationsPage() {
  const params = useParams()
  const competitionId = params?.competitionId as string
  const [competitionData, setCompetitionData] = useState<CompetitionLlmEvaluations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()
  const { getToken } = useAuth()
  
  // Participant search state
  const [searchInput, setSearchInput] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<{
    participantId: string
    submissions: Submission[]
    submissionsByChallenge: Record<string, Submission[]>
    userProfile?: UserProfile
  } | null>(null)
    
  useEffect(() => {
    const init = async () => {
      const authed = await checkAuth()
      if (authed) {
        await loadData(competitionId)
      }
    }
    init()
  }, [competitionId])

  const loadData = async (competitionId: string) => {
    try {
      setLoading(true)
      const data = await fetchCompetitionLlmEvaluations(competitionId)
      setCompetitionData(data)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const checkAuth = async () => {
    try {
      await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`
      )
      return true
    } catch (error) {
      router.push("/")
      return false
    }
  }

  const handleParticipantSearch = async () => {
    const participantId = searchInput.trim()
    if (!participantId) return

    setIsSearching(true)
    try {
      const response = await fetchAllParticipantSubmissions(competitionId, participantId, getToken)
      
      // Fetch user profile
      let userProfile: UserProfile | undefined
      try {
        const userProfiles = await fetchUsersByIds([participantId], getToken)
        userProfile = userProfiles[participantId]
      } catch (err) {
        console.warn("Failed to fetch user profile:", err)
      }

      setSearchResults({
        participantId,
        submissions: response.items || [],
        submissionsByChallenge: response.submissionsByChallenge || {},
        userProfile,
      })
    } catch (err) {
      console.error("Search failed:", err)
      setSearchResults({
        participantId,
        submissions: [],
        submissionsByChallenge: {},
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleClearSearch = () => {
    setSearchInput("")
    setSearchResults(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleParticipantSearch()
    }
  }



  if (loading) return <LlmEvaluationsLoading />
  if (error) return <LlmEvaluationsError error={error} competitionId={competitionId} />
  if (!competitionData) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with gradient accent */}
        <div className="mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  LLM Evaluations
                </h1>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                Comprehensive analysis and performance metrics for language model challenges
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Section */}
        <div className="mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-emerald-50 p-1">
              <div className="bg-white rounded-xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Total Challenges Stat */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-blue-100 to-blue-150 border border-blue-200/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-blue-700 mb-1">
                            {competitionData.challenges.length}
                          </div>
                          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                            Total Challenges
                          </div>
                        </div>
                      </div>
                      <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transform origin-left animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Total Submissions Stat */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-150 border border-emerald-200/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-emerald-700 mb-1">
                            {competitionData.totalSubmissions}
                          </div>
                          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                            Total Submissions
                          </div>
                        </div>
                      </div>
                      <div className="h-1 bg-emerald-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transform origin-left animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Participant Search Section */}
        <div className="mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-1">
              <div className="bg-white rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Search Participant Submissions</h2>
                    <p className="text-sm text-gray-600">Find all submissions from a specific participant</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Enter Participant ID (e.g., E3PW5lywLScUnqcWkgd3e2MOB0g2)"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10 bg-white border-gray-300 focus:border-[#0f172a] focus:ring-[#0f172a] h-11"
                      disabled={isSearching}
                    />
                  </div>
                  <Button
                    onClick={handleParticipantSearch}
                    disabled={isSearching || !searchInput.trim()}
                    className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-8 h-11"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search Results */}
        {searchResults && (
          <ParticipantSearchResults
            participantId={searchResults.participantId}
            submissions={searchResults.submissions}
            submissionsByChallenge={searchResults.submissionsByChallenge}
            challenges={competitionData.challenges}
            userProfile={searchResults.userProfile}
            onClose={handleClearSearch}
          />
        )}

        {/* Enhanced Challenge Accordion */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-6 h-6 bg-[#0f172a] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Challenge Details</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
          </div>
          
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white p-1">
              <div className="bg-white rounded-xl">
                <ChallengeAccordion challenges={competitionData.challenges} competitionId={competitionId} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// --- ENHANCED LOADING & ERROR COMPONENTS ---
function LlmEvaluationsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading Header */}
        <div className="mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
              <div className="flex items-center space-x-3 mb-2">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-8 w-64" />
              </div>
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
          </div>
        </div>

        {/* Loading Stats */}
        <div className="mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-emerald-50 p-1">
              <div className="bg-white rounded-xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="text-right space-y-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-1 w-full rounded-full" />
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="text-right space-y-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-1 w-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Loading Challenge Section */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <Skeleton className="w-6 h-6 rounded-lg" />
            <Skeleton className="h-6 w-48" />
            <div className="flex-1">
              <Skeleton className="h-px w-full" />
            </div>
          </div>
          
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <div className="p-8 space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function LlmEvaluationsError({ error, competitionId }: { error: any; competitionId: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4">
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden max-w-lg w-full">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-1">
          <div className="bg-white rounded-xl p-8">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Error Content */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-red-700 mb-2">
                    Failed to Load LLM Evaluations
                  </h3>
                  <p className="text-sm font-medium text-red-600 mb-4 leading-relaxed">
                    {error instanceof Error ? error.message : "An unexpected error occurred while loading the evaluation data."}
                  </p>
                  <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
                      Competition ID
                    </div>
                    <div className="text-sm font-mono text-red-700 break-all">
                      {competitionId}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}