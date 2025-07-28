"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { getLeaderboardEntries, type LeaderboardEntry } from "@/lib/firebase/leaderboard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Trophy, Medal, Award, Loader2, Filter, X, BarChart3, Users } from "lucide-react"
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
        setAllEntries((prev) => {
          const existingIds = new Set(prev.map((entry) => entry.id))
          const uniqueNewEntries = newEntries.filter((entry) => !existingIds.has(entry.id))
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
      filtered = filtered.filter(
        (entry) =>
          entry.fullName.toLowerCase().includes(searchLower) || entry.email.toLowerCase().includes(searchLower),
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
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />
    if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />
    return null
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">1st</Badge>
    if (rank === 2) return <Badge className="bg-gray-100 text-gray-800 border-gray-200">2nd</Badge>
    if (rank === 3) return <Badge className="bg-amber-100 text-amber-800 border-amber-200">3rd</Badge>
    if (rank <= 10) return <Badge variant="secondary">#{rank}</Badge>
    return <Badge variant="outline">#{rank}</Badge>
  }

  const clearFilters = () => {
    setSearch("")
    setSortBy("rank")
    setSortOrder("asc")
  }

  const hasActiveFilters = search !== "" || sortBy !== "rank" || sortOrder !== "asc"

  // Calculate stats
  const stats = useMemo(() => {
    const totalParticipants = allEntries.length
    const highestScore = allEntries.length > 0 ? Math.max(...allEntries.map((e) => e.totalScore)) : 0
    const averageScore =
      allEntries.length > 0 ? allEntries.reduce((sum, e) => sum + e.totalScore, 0) / allEntries.length : 0

    return { totalParticipants, highestScore, averageScore }
  }, [allEntries])

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Participants</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalParticipants.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Highest Score</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.highestScore.toFixed(1)}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Average Score</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.averageScore.toFixed(1)}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Sort by Rank</SelectItem>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="score">Sort by Score</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="w-full lg:w-auto gap-2 bg-transparent">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {processedEntries.length} of {allEntries.length} participants
          {debouncedSearch && ` (filtered by "${debouncedSearch}")`}
        </p>
        {processedEntries.length !== allEntries.length && (
          <Badge variant="secondary" className="gap-1">
            <Filter className="h-3 w-3" />
            Filtered
          </Badge>
        )}
      </div>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard ({processedEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {processedEntries.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No participants found</h3>
              <p className="text-gray-600">
                {debouncedSearch ? "Try adjusting your search criteria" : "No participants available"}
              </p>
              {debouncedSearch && (
                <Button variant="outline" onClick={() => setSearch("")} className="mt-4">
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left p-4 font-medium text-gray-700">Rank</th>
                    <th className="text-left p-4 font-medium text-gray-700">Participant</th>
                    <th className="text-left p-4 font-medium text-gray-700">Email</th>
                    <th className="text-right p-4 font-medium text-gray-700">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {processedEntries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={`border-b hover:bg-gray-50 transition-colors ${
                        entry.rank <= 3 ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                          {getRankBadge(entry.rank)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{entry.fullName}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-600 text-sm">{entry.email}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-semibold text-gray-900 text-lg">{entry.totalScore.toFixed(1)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load More Button */}
      {hasMore && !debouncedSearch && (
        <div className="flex justify-center">
          <Button onClick={loadMore} disabled={loading} variant="outline" className="gap-2 bg-transparent">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load More
                <span className="text-xs text-gray-500">({allEntries.length} loaded)</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
