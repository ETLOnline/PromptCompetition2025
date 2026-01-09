"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Virtuoso } from "react-virtuoso"
import { useAuth } from "@clerk/nextjs"
import { SubmissionCard } from "./SubmissionCard"
import type { Submission, LlmSubmissionListProps, UserProfile } from "@/types/llmEvaluations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchWithAuth, fetchUsersByIds, fetchParticipantSubmissions } from "@/lib/api"
import { AlertCircle, FileText, Loader2, Search, X } from "lucide-react"

export function LlmSubmissionList({ challengeId, competitionId }: LlmSubmissionListProps) {
  const { getToken } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [userLookup, setUserLookup] = useState<Record<string, UserProfile>>({})
  const [lastDocId, setLastDocId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Search state
  const [searchInput, setSearchInput] = useState("")
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Fetch first page on mount
  useEffect(() => {
    fetchSubmissions(true)
  }, [challengeId, competitionId])

  const fetchSubmissions = async (isFirstPage: boolean = false) => {
    if ((!hasMore && !isFirstPage) || isLoading || isSearchActive) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append("challengeId", challengeId)
      params.append("pageSize", "20")
      
      // Reset pagination on first page
      const docId = isFirstPage ? null : lastDocId
      if (docId) params.append("lastDocId", docId)

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/llm-evaluations/${competitionId}/challenges/${challengeId}/submissions?${params.toString()}`,
        {},
        getToken
      )

      // Extract unique participant IDs from new submissions
      const newSubmissions: Submission[] = res.items || []
      const newParticipantIds = new Set<string>()
      
      newSubmissions.forEach((sub) => {
        // const participantId = sub.participantId || sub.userId || sub.id.split('_')[0]
        const participantId = sub.participantId || sub.userId || sub.id.split('_').slice(0, -1).join('_')
        
        if (participantId && !userLookup[participantId]) {
          newParticipantIds.add(participantId)

        }
      })

      // Batch fetch user profiles for new participant IDs
      if (newParticipantIds.size > 0) {
        try {
          const userProfiles = await fetchUsersByIds(Array.from(newParticipantIds), getToken)
          setUserLookup((prev) => ({ ...prev, ...userProfiles }))
        } catch (userErr) {
          console.warn("Failed to fetch user profiles (endpoint may not be implemented yet):", userErr)
          // Continue without user data rather than failing entirely
          // This allows the app to work even if the backend endpoint isn't ready
        }
      }

      // Update submissions list
      if (isFirstPage) {
        setSubmissions(newSubmissions)
      } else {
        setSubmissions((prev) => [...prev, ...newSubmissions])
      }

      setLastDocId(res.lastDocId)
      setHasMore(res.hasMore)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
      setIsInitialLoad(false)
    }
  }

  const handleSearch = async () => {
    const participantId = searchInput.trim()
    if (!participantId) {
      setError("Please enter a participant ID")
      return
    }

    setIsSearching(true)
    setIsSearchActive(true)
    setError(null)

    try {
      const res = await fetchParticipantSubmissions(competitionId, challengeId, participantId, getToken)
      
      const searchResults: Submission[] = res.items || []
      const newParticipantIds = new Set<string>()
      
      searchResults.forEach((sub) => {
        const pId = sub.participantId || sub.userId || sub.id.split('_')[0]
        if (pId && !userLookup[pId]) {
          newParticipantIds.add(pId)
        }
      })

      // Fetch user profiles for search results
      if (newParticipantIds.size > 0) {
        try {
          const userProfiles = await fetchUsersByIds(Array.from(newParticipantIds), getToken)
          setUserLookup((prev) => ({ ...prev, ...userProfiles }))
        } catch (userErr) {
          console.warn("Failed to fetch user profiles:", userErr)
        }
      }

      setSubmissions(searchResults)
      
      if (searchResults.length === 0) {
        setError(`No submissions found for participant ID: ${participantId}`)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Search failed")
    } finally {
      setIsSearching(false)
    }
  }

  const handleClearSearch = () => {
    setSearchInput("")
    setIsSearchActive(false)
    setError(null)
    setLastDocId(null)
    setHasMore(true)
    fetchSubmissions(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      fetchSubmissions(false)
    }
  }, [hasMore, isLoading])

  // Memoize item renderer for performance
  const renderSubmissionCard = useCallback(
    (index: number) => {
      const submission = submissions[index]
      if (!submission) return null

      const participantId = submission.participantId || submission.userId || submission.id.split('_')[0]
      const userProfile = userLookup[participantId]

      return (
        <div className="mb-4">
          <SubmissionCard 
            submission={submission} 
            userProfile={userProfile}
          />
        </div>
      )
    },
    [submissions, userLookup]
  )

  const Footer = useMemo(() => {
    if (error) {
      return () => (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800 mb-1">Error loading submissions</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )
    }

    // Don't show "Load More" button when in search mode
    if (isSearchActive) {
      return () => null
    }

    if (hasMore && !isLoading) {
      return () => (
        <div className="flex justify-center py-6">
          <Button
            onClick={loadMore}
            variant="outline"
            size="lg"
            className="min-w-[140px] h-10 font-medium bg-transparent"
          >
            Load More
          </Button>
        </div>
      )
    }

    if (isLoading && !isInitialLoad) {
      return () => (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )
    }

    if (!hasMore && submissions.length > 0) {
      return () => (
        <div className="text-center py-6 text-sm text-gray-500">
          No more submissions
        </div>
      )
    }

    return () => null
  }, [error, hasMore, isLoading, isInitialLoad, submissions.length, loadMore, isSearchActive])

  if (isInitialLoad && isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-64"></div>
                </div>
              </div>
              <div className="space-y-3 mt-6">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-8 bg-gray-200 rounded w-24 mt-4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!isLoading && submissions.length === 0 && !error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          No submissions have been found for this challenge. Check back later or try refreshing the page.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Enter Participant ID (e.g., E3PW5lywLScUnqcWkgd3e2MOB0g2)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 bg-white border-gray-300 focus:border-[#0f172a] focus:ring-[#0f172a]"
              disabled={isSearching}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchInput.trim()}
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-6"
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
            {isSearchActive && (
              <Button
                onClick={handleClearSearch}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
        
        {isSearchActive && !error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
            <div className="w-2 h-2 bg-[#0f172a] rounded-full animate-pulse"></div>
            <span className="font-medium">
              Showing results for: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{searchInput.trim()}</span>
            </span>
          </div>
        )}
      </div>

      {/* Submissions List */}
      <Virtuoso
        style={{ height: "auto", minHeight: "400px" }}
        useWindowScroll
        data={submissions}
        endReached={loadMore}
        overscan={200}
        itemContent={(index) => renderSubmissionCard(index)}
        components={{
          Footer,
        }}
      />
    </div>
  )
}
