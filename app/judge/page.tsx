"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AdminNavbar } from "@/components/AdminNavbar"
import { Button } from "@/components/ui/button"
import {
  Trophy,
  Users,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  Filter,
  ArrowUpDown,
  UserCheck,
  Search,
} from "lucide-react"

interface ParticipantAssignment {
  id: string
  participantId: string
  totalChallenges: number
  reviewedChallenges: number
  status: "pending" | "in-progress" | "completed"
  lastReviewedAt?: Date
}

type SortOption = "progress" | "status" | "name" | "assigned"
type FilterOption = "all" | "pending" | "in-progress" | "completed"

export default function JudgeDashboard() {
  const [assignments, setAssignments] = useState<ParticipantAssignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<ParticipantAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("progress")
  const [filterBy, setFilterBy] = useState<FilterOption>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  // Mock judge ID - in real app, get from auth context
  const judgeId = "current-judge-id"

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true)
        setError(null)
        // In a real app, you'd fetch from a judge_assignments collection
        // For now, we'll create mock data based on the participants
        const participantsRef = collection(db, process.env.NEXT_PUBLIC_LEADERBOARD_DATABASE || "leaderboard")
        const q = query(participantsRef, orderBy("rank", "asc"))
        const querySnapshot = await getDocs(q)
        const mockAssignments: ParticipantAssignment[] = []

        querySnapshot.forEach((doc, index) => {
          const data = doc.data()
          const reviewedCount = Math.floor(Math.random() * 6) // 0-5 reviewed
          const totalCount = 5 // Assuming 5 total challenges

          let status: "pending" | "in-progress" | "completed" = "pending"
          if (reviewedCount === totalCount) status = "completed"
          else if (reviewedCount > 0) status = "in-progress"

          mockAssignments.push({
            id: `assignment-${doc.id}`,
            participantId: doc.id,
            totalChallenges: totalCount,
            reviewedChallenges: reviewedCount,
            status,
            lastReviewedAt:
              reviewedCount > 0 ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000) : undefined,
          })
        })

        setAssignments(mockAssignments)
      } catch (err) {
        console.error("Error fetching assignments:", err)
        setError("Failed to load participant assignments. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [])

  useEffect(() => {
    let filtered = [...assignments]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((assignment) =>
        assignment.participantId.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (filterBy !== "all") {
      filtered = filtered.filter((assignment) => assignment.status === filterBy)
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "progress":
          return b.reviewedChallenges / b.totalChallenges - a.reviewedChallenges / a.totalChallenges
        case "status":
          const statusOrder = { pending: 0, "in-progress": 1, completed: 2 }
          return statusOrder[a.status] - statusOrder[b.status]
        default:
          return 0
      }
    })

    setFilteredAssignments(filtered)
  }, [assignments, sortBy, filterBy, searchTerm])

  const handleReviewSubmissions = (participantId: string) => {
    router.push(`/judge/${participantId}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <div className="px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-xs font-medium border border-gray-200 flex items-center gap-1 uppercase">
            <Clock className="w-3 h-3" />
            PENDING
          </div>
        )
      case "in-progress":
        return (
          <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium border border-amber-200 flex items-center gap-1 uppercase">
            <Target className="w-3 h-3" />
            IN PROGRESS
          </div>
        )
      case "completed":
        return (
          <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-200 flex items-center gap-1 uppercase">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </div>
        )
      default:
        return null
    }
  }

  const getProgressPercentage = (reviewed: number, total: number) => {
    return Math.round((reviewed / total) * 100)
  }

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    inProgress: assignments.filter((a) => a.status === "in-progress").length,
    completed: assignments.filter((a) => a.status === "completed").length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-100 via-blue-100 to-indigo-100 text-white">
        <AdminNavbar />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-black">Judge Evaluation Panel</h1>
            </div>
            <p className="text-base font-medium text-black max-w-2xl mx-auto">
              Review and evaluate assigned participants' challenge submissions with comprehensive tracking and progress
              monitoring
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 text-lg text-black">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-large">{assignments.length} Assigned Participants</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Card className="bg-white shadow-sm rounded-xl border-0">
              <CardContent className="p-8 text-center">
                <Loader2 className="w-8 h-8 text-gray-900 animate-spin mx-auto mb-4" />
                <p className="text-gray-700 font-medium">Loading assignments...</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-16">
            <Card className="max-w-md w-full bg-white shadow-sm rounded-xl border border-red-200">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 w-fit mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h3>
                  <p className="text-gray-700 font-medium mb-4">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-800 hover:to-gray-700 text-white font-medium transition-all duration-200"
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && !error && assignments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-t-xl">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase">Total Assigned</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.total}</div>
                <div className="text-sm font-medium text-gray-700">Participants</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-t-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase">Pending</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{stats.pending}</div>
                <div className="text-sm font-medium text-gray-700">Reviews</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-t-xl">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase">In Progress</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-amber-600 mb-2">{stats.inProgress}</div>
                <div className="text-sm font-medium text-gray-700">Reviews</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-t-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase">Completed</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">{stats.completed}</div>
                <div className="text-sm font-medium text-gray-700">Reviews</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Controls */}
        {!loading && !error && assignments.length > 0 && (
          <Card className="bg-white shadow-sm rounded-xl mb-8">
            <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-t-xl">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <span className="font-bold text-sm uppercase">Filter & Search</span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by participant ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200"
                  />
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-700" />
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-700" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200"
                  >
                    <option value="progress">Sort by Progress</option>
                    <option value="status">Sort by Status</option>
                    <option value="name">Sort by Name</option>
                    <option value="assigned">Sort by Assigned Date</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignments List */}
        {!loading && !error && filteredAssignments.length > 0 && (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const progressPercentage = getProgressPercentage(
                assignment.reviewedChallenges,
                assignment.totalChallenges,
              )

              return (
                <Card
                  key={assignment.id}
                  className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      {/* Left side - Participant Info and Status */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600">
                          <UserCheck className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                              ID: {assignment.participantId.slice(0, 8)}
                            </h3>
                            {getStatusBadge(assignment.status)}
                          </div>
                          <p className="text-sm font-medium text-gray-700">Assigned for evaluation and review</p>
                        </div>
                      </div>

                      {/* Middle - Progress */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-700 mb-1">Progress</div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-gray-700 to-gray-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              {assignment.reviewedChallenges}/{assignment.totalChallenges}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-700 mb-1">Completion</div>
                          <div className="text-xl font-bold text-gray-900">{progressPercentage}%</div>
                        </div>
                      </div>

                      {/* Right side - Action Button */}
                      <div className="flex-shrink-0 ml-6">
                        <Button
                          onClick={() => handleReviewSubmissions(assignment.participantId)}
                          className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-800 hover:to-gray-700 text-white font-medium transition-all duration-200 hover:shadow-lg px-6"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review Submissions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && assignments.length === 0 && (
          <div className="text-center py-16">
            <Card className="bg-white shadow-sm rounded-xl max-w-md mx-auto">
              <CardContent className="p-8">
                <div className="p-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 w-fit mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Participants Assigned</h3>
                <p className="text-gray-700 font-medium">
                  You don't have any participants assigned for evaluation yet. Check back later or contact an
                  administrator.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Results from Filter */}
        {!loading && !error && assignments.length > 0 && filteredAssignments.length === 0 && (
          <div className="text-center py-16">
            <Card className="bg-white shadow-sm rounded-xl max-w-md mx-auto">
              <CardContent className="p-8">
                <div className="p-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 w-fit mx-auto mb-4">
                  <Filter className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-700 font-medium mb-4">
                  No participants match your current filter criteria. Try adjusting your filters.
                </p>
                <Button
                  onClick={() => {
                    setFilterBy("all")
                    setSortBy("progress")
                    setSearchTerm("")
                  }}
                  className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-800 hover:to-gray-700 text-white font-medium transition-all duration-200"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
