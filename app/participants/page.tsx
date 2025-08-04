"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Trophy,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  MapPin,
  DollarSign,
  ChevronDown,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useSubmissionStore } from "@/lib/store"

interface Competition {
  id: string
  title: string
  description: string
  startDeadline: any
  endDeadline: any
  createdAt?: string
  isActive?: boolean
  isLocked?: boolean
  location?: string
  prizeMoney?: string
}

// Modern Competition Card Skeleton
const CompetitionSkeleton = () => (
  <Card className="group relative overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-6 w-16 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full animate-pulse ml-4"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-pulse flex-1"></div>
            </div>
          ))}
        </div>
        <div className="h-11 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
      </div>
    </CardContent>
  </Card>
)

export default function CompetitionsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const { submissions, challengeCount } = useSubmissionStore()
  const isSubmitted = submissions === challengeCount

  // Filtering and Pagination States
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "ended" | "upcoming">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(9) // Number of items per page

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    fetchCompetitions()
  }, [user, router])

  const fetchCompetitions = async () => {
    try {
      setLoading(true)
      const competitionsQuery = query(collection(db, "competitions"), orderBy("startDeadline", "desc"))
      const competitionsSnapshot = await getDocs(competitionsQuery)

      const fetchedCompetitions = competitionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Competition[]
      setCompetitions(fetchedCompetitions)
    } catch (error) {
      console.error("Error fetching competitions:", error)
      setCompetitions([])
    } finally {
      setLoading(false)
    }
  }

  const getCompetitionStatus = (competition: Competition) => {
    if (competition.isActive == true) {
      const start = competition.startDeadline?.toDate?.() ?? new Date(competition.startDeadline)
      const end = competition.endDeadline?.toDate?.() ?? new Date(competition.endDeadline)
      const now = new Date()
      const extendedEnd = new Date(end.getTime() + 2 * 60 * 1000)

      if (now < start) {
        return {
          status: "UPCOMING",
          label: "Upcoming",
          color: "bg-blue-50 text-blue-700 border-blue-200",
          icon: Clock,
          dotColor: "bg-blue-400",
        }
      } else if (now >= start && now <= extendedEnd) {
        return {
          status: "ACTIVE",
          label: "Active",
          color: "bg-green-50 text-green-700 border-green-200",
          icon: CheckCircle2,
          dotColor: "bg-green-400",
        }
      } else {
        return {
          status: "ENDED",
          label: "Ended",
          color: "bg-gray-50 text-gray-600 border-gray-200",
          icon: CheckCircle2,
          dotColor: "bg-gray-400",
        }
      }
    } else {
      return {
        status: "INACTIVE",
        label: "Inactive",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: CheckCircle2,
        dotColor: "bg-red-400",
      }
    }
  }

  const formatDateTime = (dateString: any) => {
    const date = dateString?.toDate?.() ?? new Date(dateString)
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    }
  }

  const handleCompetitionClick = (competitionId: string) => {
    router.push(`/participants/competitions/${competitionId}`)
  }

  // Filtered competitions based on search term and status
  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch = comp.title.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false

    const status = getCompetitionStatus(comp)
    if (filterStatus === "all") return status.status !== "ENDED" && status.status !== "INACTIVE"
    return status.status.toLowerCase() === filterStatus
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredCompetitions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCompetitions = filteredCompetitions.slice(startIndex, endIndex)

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Available Competitions</h1>
                <p className="text-gray-600 text-sm">
                  {filteredCompetitions.length} competition{filteredCompetitions.length !== 1 ? "s" : ""} available
                </p>
              </div>
            </div>
            {/* Profile Info and Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 h-10 rounded-full pr-2 pl-1 border border-gray-200 hover:bg-gray-50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.photoURL || "/placeholder.svg?height=100&width=100&query=user-avatar"}
                        alt={user.displayName || "User"}
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-700 font-medium text-sm">
                        {user.displayName
                          ? user.displayName.charAt(0).toUpperCase()
                          : user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900 leading-none">{user.displayName || "User"}</p>
                      <p className="text-xs text-gray-600 leading-none mt-0.5">{user.email}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search competitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-40 border-gray-200">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CompetitionSkeleton key={i} />
            ))}
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-12 text-center">
              <div className="space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {searchTerm || filterStatus !== "all"
                      ? "No competitions match your criteria"
                      : "No competitions available yet"}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {searchTerm || filterStatus !== "all"
                      ? "Try adjusting your search terms or filters to find what you're looking for."
                      : "There are currently no competitions available. Check back later for new exciting competitions to join."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className={
                viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" : "space-y-4 mb-8"
              }
            >
              {currentCompetitions.map((competition) => {
                const status = getCompetitionStatus(competition)
                const startDateTime = formatDateTime(competition.startDeadline)
                const endDateTime = formatDateTime(competition.endDeadline)

                return (
                  <Card
                    key={competition.id}
                    className="group relative overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 h-fit cursor-pointer"
                    onClick={() => handleCompetitionClick(competition.id)}
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header with consistent height */}
                        <div className="flex items-start justify-between min-h-[40px]">
                          <div className="flex-1 min-w-0 pr-4">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors">
                              {competition.title}
                            </h3>
                          </div>
                          <Badge className={`${status.color} border font-medium whitespace-nowrap`}>
                            <div className={`w-2 h-2 ${status.dotColor} rounded-full mr-1.5`}></div>
                            {status.label}
                          </Badge>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{competition.description}</p>

                        {/* Details with consistent spacing */}
                        <div className="flex items-start gap-3 text-sm text-gray-600">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm">
                              {startDateTime.date === endDateTime.date
                                ? startDateTime.date
                                : `${startDateTime.date} - ${endDateTime.date}`}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {startDateTime.time} → {endDateTime.time}
                            </div>
                          </div>
                        </div>

                        {competition.location && (
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="font-medium capitalize">{competition.location}</span>
                          </div>
                        )}

                        {competition.prizeMoney && (
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <DollarSign className="w-4 h-4 text-yellow-600" />
                            </div>
                            <span className="font-medium">{competition.prizeMoney}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      {status.status === "ACTIVE" && (
                        <Button
                          className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white border-0 transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCompetitionClick(competition.id)
                          }}
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Join Competition
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}

                      {status.status === "UPCOMING" && (
                        <Button
                          className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white border-0 transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCompetitionClick(competition.id)
                          }}
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Join Competition
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCompetitions.length)} of{" "}
                  {filteredCompetitions.length} competitions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-gray-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0 border-gray-200"
                          >
                            {page}
                          </Button>
                        )
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        )
                      }
                      return null
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-gray-200"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
