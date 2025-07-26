"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { getLeaderboardEntries, LeaderboardEntry } from "@/lib/firebase/leaderboard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Trophy, Medal, Award, Loader2, Filter, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SortBy = "rank" | "name" | "score"
type SortOrder = "asc" | "desc"

export default function ViewLeaderboardTable() {
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([])
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("rank")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)


  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Initial load
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setInitialLoading(true)
    try {
      const { entries: newEntries, lastDoc: newLastDoc } = await getLeaderboardEntries(undefined, 50)
      setAllEntries(newEntries)
      setLastDoc(newLastDoc)
      setHasMore(newEntries.length === 50)
    } catch (error) {
      console.error("Error loading leaderboard:", error)
    } finally {
      setInitialLoading(false)
    }
  }

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    try {
      const { entries: newEntries, lastDoc: newLastDoc } = await getLeaderboardEntries(lastDoc, 25)
      
      if (newEntries.length === 0) {
        setHasMore(false)
      } else {
        // Prevent duplicates by checking if entry already exists
        setAllEntries(prev => {
          const existingIds = new Set(prev.map(entry => entry.id))
          const uniqueNewEntries = newEntries.filter(entry => !existingIds.has(entry.id))
          return [...prev, ...uniqueNewEntries]
        })
        setLastDoc(newLastDoc)
        setHasMore(newEntries.length === 25)
      }
    } catch (error) {
      console.error("Error loading more entries:", error)
    } finally {
      setLoading(false)
    }
  }, [lastDoc, loading, hasMore])

  // Filtered and sorted entries
  const processedEntries = useMemo(() => {
    let filtered = allEntries

    // Search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.fullName.toLowerCase().includes(searchLower) ||
        entry.email.toLowerCase().includes(searchLower)
      )
    }



    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (sortBy) {
        case "name":
          aVal = a.fullName.toLowerCase()
          bVal = b.fullName.toLowerCase()
          break
        case "score":
          aVal = a.totalScore
          bVal = b.totalScore
          break
        case "rank":
        default:
          aVal = a.rank
          bVal = b.rank
          break
      }

      if (sortOrder === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })

    return filtered
  }, [allEntries, debouncedSearch, sortBy, sortOrder])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />
    return <span className="text-sm font-semibold text-gray-600">#{rank}</span>
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600"
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500"
    if (rank === 3) return "bg-gradient-to-r from-amber-400 to-amber-600"
    if (rank <= 10) return "bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/80"
    return "bg-gradient-to-r from-gray-500 to-gray-600"
  }

  const clearFilters = () => {
    setSearch("")
    setSortBy("rank")
    setSortOrder("asc")
  }

  const hasActiveFilters = search !== "" || sortBy !== "rank" || sortOrder !== "asc"

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#56ffbc] mx-auto mb-4" />
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border border-[#56ffbc]/20">
          <CardContent className="p-6">
            <div className="text-center">
              <Trophy className="h-8 w-8 text-[#56ffbc] mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{allEntries.length}</p>
              <p className="text-gray-400 text-sm">Total Participants</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border border-[#56ffbc]/20">
          <CardContent className="p-6">
            <div className="text-center">
              <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {allEntries.length > 0 ? allEntries.reduce((max, entry) => Math.max(max, entry.totalScore), 0).toFixed(1) : "0"}
              </p>
              <p className="text-gray-400 text-sm">Highest Score</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border border-[#56ffbc]/20">
          <CardContent className="p-6">
            <div className="text-center">
              <Medal className="h-8 w-8 text-[#56ffbc] mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {allEntries.length > 0 ? (allEntries.reduce((sum, entry) => sum + entry.totalScore, 0) / allEntries.length).toFixed(1) : "0"}
              </p>
              <p className="text-gray-400 text-sm">Average Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border border-[#56ffbc]/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#07073a] border-[#56ffbc]/30 text-white placeholder:text-gray-400 focus:border-[#56ffbc]"
              />
            </div>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-full lg:w-[180px] bg-[#07073a] border-[#56ffbc]/30 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#07073a] border-[#56ffbc]/30 text-white">
                <SelectItem value="rank" className="text-white hover:bg-[#56ffbc]/20 focus:bg-[#56ffbc]/20 focus:text-white">Sort by Rank</SelectItem>
                <SelectItem value="name" className="text-white hover:bg-[#56ffbc]/20 focus:bg-[#56ffbc]/20 focus:text-white">Sort by Name</SelectItem>
                <SelectItem value="score" className="text-white hover:bg-[#56ffbc]/20 focus:bg-[#56ffbc]/20 focus:text-white">Sort by Score</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
              <SelectTrigger className="w-full lg:w-[180px] bg-[#07073a] border-[#56ffbc]/30 text-white">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent className="bg-[#07073a] border-[#56ffbc]/30 text-white">
                <SelectItem value="asc" className="text-white hover:bg-[#56ffbc]/20 focus:bg-[#56ffbc]/20 focus:text-white">Ascending</SelectItem>
                <SelectItem value="desc" className="text-white hover:bg-[#56ffbc]/20 focus:bg-[#56ffbc]/20 focus:text-white">Descending</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full lg:w-auto border-[#56ffbc]/30 text-[#56ffbc] hover:bg-[#56ffbc]/10"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          Showing {processedEntries.length} of {allEntries.length} participants
          {debouncedSearch && ` (filtered by "${debouncedSearch}")`}
        </p>
        {processedEntries.length !== allEntries.length && (
          <Badge variant="secondary" className="bg-[#56ffbc]/20 text-[#56ffbc]">
            <Filter className="h-3 w-3 mr-1" />
            Filtered
          </Badge>
        )}
      </div>

      {/* Leaderboard Table */}
      <Card className="bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border border-[#56ffbc]/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#56ffbc]/20">
                  <th className="text-left p-4 font-semibold text-[#56ffbc]">Rank</th>
                  <th className="text-left p-4 font-semibold text-[#56ffbc]">Participant</th>
                  <th className="text-left p-4 font-semibold text-[#56ffbc]">Email</th>
                  <th className="text-right p-4 font-semibold text-[#56ffbc]">Score</th>
                </tr>
              </thead>
              <tbody>
                {processedEntries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-[#56ffbc]/10 hover:bg-[#56ffbc]/5 transition-colors ${
                      entry.rank <= 3 ? 'bg-gradient-to-r from-[#56ffbc]/5 to-transparent' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(entry.rank)}
                        <Badge 
                          className={`${getRankBadgeColor(entry.rank)} text-white font-semibold px-3 py-1`}
                        >
                          #{entry.rank}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">{entry.fullName}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-300 text-sm">{entry.email}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-bold text-[#56ffbc] text-lg">
                        {entry.totalScore.toFixed(1)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {processedEntries.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No participants found</p>
              {debouncedSearch && (
                <p className="text-gray-500 text-sm mt-2">
                  Try adjusting your search criteria
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load More Button */}
      {hasMore && !debouncedSearch && (
        <div className="flex justify-center">
          <Button
            onClick={loadMore}
            disabled={loading}
            className="bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/90 text-[#07073a] font-semibold hover:from-[#56ffbc]/90 hover:to-[#56ffbc]/80 shadow-lg shadow-[#56ffbc]/25 px-8 py-3"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load More Participants
                <span className="ml-2 text-xs opacity-75">({allEntries.length} loaded)</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}