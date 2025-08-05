"use client"

import type React from "react"
import { toast } from "react-hot-toast"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchCompetitions, createCompetition, updateCompetition, deleteCompetition } from "@/lib/api"
import {
  Plus,
  Trophy,
  Calendar,
  MapPin,
  Users,
  Search,
  Filter,
  Grid3X3,
  List,
  Clock,
  DollarSign,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Save,
  X,
  Info,
  Trash2,
} from "lucide-react"

interface Competition {
  id: string
  title: string
  description: string
  prizeMoney: string
  startDeadline: string
  endDeadline: string
  location: string
  isActive: boolean
  isLocked: boolean
  createdAt?: string
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
              <div className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-pulse flex-1"></div>
            </div>
          ))}
        </div>
        <div className="h-11 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
      </div>
    </CardContent>
  </Card>
)

// Skeleton for search and filter bar
const SearchFilterSkeleton = () => (
  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
    <div className="flex flex-1 gap-4 w-full sm:w-auto">
      <div className="relative flex-1 max-w-md">
        <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md animate-pulse"></div>
      </div>
      <div className="h-10 w-40 bg-gradient-to-r from-gray-200 to-gray-100 rounded-md animate-pulse"></div>
    </div>
    <div className="h-10 w-20 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
  </div>
)

export default function ModernCompetitionSelector() {
  const { user, role } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [showCompetitionEndedDialog, setShowCompetitionEndedDialog] = useState(false)
  const [showCompetitionStartedDialog, setShowCompetitionStartedDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "ended" | "upcoming">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(9)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prizeMoney: "",
    startTime: "",
    endTime: "",
    location: "online",
  })
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    startDeadline: "",
    endDeadline: "",
    location: "",
    prizeMoney: "",
    isActive: false,
    isLocked: false,
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const refetchCompetitions = async () => {
    try {
      const data = await fetchCompetitions()
      const sorted = data.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })
      setCompetitions(sorted)
    } catch (error) {
      console.error("Error reloading competitions:", error)
      toast.error("Failed to load competitions.")
    } finally {
      setIsInitialLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    refetchCompetitions()
  }, [user, router])

  const getCompetitionStatus = (competition: Competition) => {
    const now = new Date()
    const startDate = new Date(competition.startDeadline)
    const endDate = new Date(competition.endDeadline)

    if (competition.isLocked) {
      return {
        label: "Locked",
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: XCircle,
        dotColor: "bg-gray-400",
      }
    }

    if (!competition.isActive) {
      return {
        label: "Inactive",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
        dotColor: "bg-red-400",
      }
    }

    if (now < startDate) {
      return {
        label: "Upcoming",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Clock,
        dotColor: "bg-blue-400",
      }
    }

    if (now >= startDate && now <= endDate && competition.isActive && !competition.isLocked) {
      return {
        label: "Active",
        color: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle2,
        dotColor: "bg-green-400",
      }
    }

    if (now > endDate) {
      return {
        label: "Ended",
        color: "bg-gray-50 text-gray-600 border-gray-200",
        icon: CheckCircle2,
        dotColor: "bg-gray-400",
      }
    }

    return {
      label: "Active",
      color: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle2,
      dotColor: "bg-green-400",
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
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

  const formatCompetitionDateTime = (startDateString: string, endDateString: string) => {
    const startDateTime = formatDateTime(startDateString)
    const endDateTime = formatDateTime(endDateString)

    if (startDateTime.date === endDateTime.date) {
      return {
        dateDisplay: `Start Date: ${startDateTime.date}`,
        timeDisplay: `Time: ${startDateTime.time} → ${endDateTime.time}`,
      }
    } else {
      return {
        dateDisplay: `Start Date: ${startDateTime.date}    End Date: ${endDateTime.date}`,
        timeDisplay: `Time: ${startDateTime.time} → ${endDateTime.time}`,
      }
    }
  }

  const formatForDatetimeLocal = (isoString: string) => {
    if (!isoString) return ""
    const date = new Date(isoString)
    // Convert to Pakistan timezone for editing
    const pakistanDate = new Date(date.getTime() + 5 * 60 * 60 * 1000)
    const offset = pakistanDate.getTimezoneOffset()
    const localDate = new Date(pakistanDate.getTime() - offset * 60 * 1000)
    return localDate.toISOString().slice(0, 16)
  }

  const toPakistanISOString = (value: string) => {
    const date = new Date(value)
    // Convert to Pakistan timezone before saving
    const pakistanTime = new Date(date.getTime() + 5 * 60 * 60 * 1000)
    return pakistanTime.toISOString()
  }

  const handleManageClick = (competitionId: string) => {
    router.push(`/admin/competitions/${competitionId}/dashboard`)
  }

  const handleViewClick = (competition: Competition) => {
    setSelectedCompetition(competition)
    setIsViewModalOpen(true)
  }

  const handleEditClick = (competition: Competition) => {
    const startDate = new Date(competition.startDeadline)
    const endDate = new Date(competition.endDeadline)
    const now = new Date()

    if (now > endDate) {
      setShowCompetitionEndedDialog(true)
      return
    }

    if (now >= startDate) {
      setShowCompetitionStartedDialog(true)
      return
    }

    setSelectedCompetition(competition)
    setEditFormData({
      title: competition.title || "",
      description: competition.description || "",
      startDeadline: formatForDatetimeLocal(competition.startDeadline || ""),
      endDeadline: formatForDatetimeLocal(competition.endDeadline || ""),
      location: competition.location || "",
      prizeMoney: competition.prizeMoney || "",
      isActive: competition.isActive ?? false,
      isLocked: competition.isLocked ?? false,
    })
    setIsEditModalOpen(true)
  }

  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch = comp.title.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false

    if (filterStatus === "all") return true

    const status = getCompetitionStatus(comp)
    return status.label.toLowerCase() === filterStatus
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

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormError(null)
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleEditCheckboxChange = (name: string, checked: boolean) => {
    setEditFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const { title, description, prizeMoney, startTime, endTime, location } = formData

    if (!title || !description || !prizeMoney || !startTime || !endTime || !location) {
      setFormError("All fields are required.")
      return
    }

    const startDateTime = new Date(startTime)
    const endDateTime = new Date(endTime)

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setFormError("Invalid start or end date/time.")
      return
    }

    if (endDateTime <= startDateTime) {
      setFormError("End time must be after start time.")
      return
    }

    try {
      if (!user) {
        setFormError("User not authenticated.")
        return
      }

      const token = await user.getIdToken()
      await createCompetition(
        {
          title,
          description,
          prizeMoney,
          startDeadline: toPakistanISOString(startTime),
          endDeadline: toPakistanISOString(endTime),
          location,
        },
        token,
      )

      setIsCreateModalOpen(false)
      toast.success("Competition created successfully!")
      refetchCompetitions()
      setFormData({
        title: "",
        description: "",
        prizeMoney: "",
        startTime: "",
        endTime: "",
        location: "online",
      })
    } catch (error) {
      console.error("Error creating competition:", error)
      setFormError("Failed to create competition. Please try again.")
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setFormError("User not authenticated.")
      return
    }
    const token = await user.getIdToken()

    if (!selectedCompetition) return

    const startDate = new Date(selectedCompetition.startDeadline)
    const endDate = new Date(selectedCompetition.endDeadline)
    const now = new Date()

    if (now > endDate) {
      setShowCompetitionEndedDialog(true)
      return
    }

    if (now >= startDate) {
      setShowCompetitionStartedDialog(true)
      return
    }

    setEditLoading(true)
    try {
      await updateCompetition(
        selectedCompetition.id,
        {
          ...editFormData,
          startDeadline: toPakistanISOString(editFormData.startDeadline),
          endDeadline: toPakistanISOString(editFormData.endDeadline),
        },
        token,
      )

      setIsEditModalOpen(false)
      toast.success("Competition updated successfully!")
      setSelectedCompetition(null)
      refetchCompetitions()
    } catch (error) {
      console.error("Error updating competition:", error)
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteCompetition = async () => {
    if (!user) {
      setFormError("User not authenticated.")
      return
    }
    const token = await user.getIdToken()

    if (!selectedCompetition) return

    setDeleteLoading(true)
    try {
      await deleteCompetition(selectedCompetition.id, token)
      setIsEditModalOpen(false)
      setShowDeleteDialog(false)
      toast.success("Competition deleted.")
      setSelectedCompetition(null)
      setIsEditModalOpen(false)
    } catch (error) {
      console.error("Error deleting competition:", error)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!user || (role !== "admin" && role !== "superadmin")) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Competition Management</h1>
                    <p className="text-gray-600 text-sm">
                      {isInitialLoading ? (
                        <span className="inline-block w-32 h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-pulse"></span>
                      ) : (
                        `${filteredCompetitions.length} competition${filteredCompetitions.length !== 1 ? "s" : ""} available`
                      )}
                    </p>
                  </div>
                </div>
                {role === "superadmin" && (
                  <Badge className="bg-blue-600 text-white border-0 px-3 py-1">Super Admin</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {role === "superadmin" && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Competition
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {isInitialLoading ? (
          <SearchFilterSkeleton />
        ) : (
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
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {isInitialLoading ? (
          // Show skeleton cards while loading
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" : "space-y-4 mb-8"
            }
          >
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
                      : role === "superadmin"
                        ? "Create your first competition to get started with managing events."
                        : "Contact a super admin to create competitions for you to manage."}
                  </p>
                </div>
                {role === "superadmin" && !searchTerm && filterStatus === "all" && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Competition
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Competition Grid */}
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
                    className="group relative overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 h-fit"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header with consistent height */}
                        <div className="flex items-start justify-between min-h-[40px]">
                          <div className="flex-1 min-w-0 pr-4">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                              {competition.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewClick(competition)}
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {role === "superadmin" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(competition)}
                                className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-gray-900"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            <Badge className={`${status.color} border font-medium whitespace-nowrap`}>
                              <div className={`w-2 h-2 ${status.dotColor} rounded-full mr-1.5`}></div>
                              {status.label}
                            </Badge>
                          </div>
                        </div>

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

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="font-medium capitalize">{competition.location}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <DollarSign className="w-4 h-4 text-yellow-600" />
                          </div>
                          <span className="font-medium">{competition.prizeMoney}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => handleManageClick(competition.id)}
                        className="w-full mt-4 bg-gray-900 hover:from-gray-900 hover:to-gray-600 text-white border-0 transition-all duration-300"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage Competition
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
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

      {/* View Competition Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="bg-white border-0 shadow-2xl max-w-2xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">Competition Details</DialogTitle>
                <p className="text-gray-600 text-sm">View complete information about this competition</p>
              </div>
            </div>
          </DialogHeader>
          {selectedCompetition && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-xl font-bold text-gray-900 mb-3 break-words leading-tight">
                  {selectedCompetition.title}
                </h3>
                <div className="bg-white rounded-md p-4 max-h-32 overflow-y-auto border">
                  <p className="text-gray-700 leading-relaxed text-sm break-all overflow-wrap-anywhere">
                    {selectedCompetition.description}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <Label className="text-base font-semibold text-blue-900">Schedule</Label>
                  </div>
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-gray-900">
                      {(() => {
                        const formatted = formatCompetitionDateTime(
                          selectedCompetition.startDeadline,
                          selectedCompetition.endDeadline,
                        )
                        return formatted.dateDisplay.replace("Start Date: ", "").replace("    End Date: ", " - ")
                      })()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {(() => {
                        const formatted = formatCompetitionDateTime(
                          selectedCompetition.startDeadline,
                          selectedCompetition.endDeadline,
                        )
                        return formatted.timeDisplay
                      })()}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <Label className="text-base font-semibold text-green-900">Location</Label>
                    </div>
                    <div className="text-sm text-gray-900 capitalize font-medium break-words">
                      {selectedCompetition.location}
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                      <Label className="text-base font-semibold text-yellow-900">Prize Money</Label>
                    </div>
                    <div className="text-sm text-gray-900 font-medium break-words">
                      {selectedCompetition.prizeMoney}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Label className="text-base font-semibold text-gray-900 mb-3 block">Status</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${selectedCompetition.isActive ? "bg-green-400" : "bg-red-400"}`}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">
                        {selectedCompetition.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${selectedCompetition.isLocked ? "bg-gray-400" : "bg-green-400"}`}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">
                        {selectedCompetition.isLocked ? "Locked" : "Unlocked"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Competition Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-white border-0 shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">Edit Competition</DialogTitle>
                <p className="text-gray-600 text-sm">Update competition details and settings</p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Info className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit-title" className="text-sm font-medium text-gray-700 mb-2 block">
                    Competition Title *
                  </Label>
                  <Input
                    id="edit-title"
                    name="title"
                    value={editFormData.title}
                    onChange={handleEditFormChange}
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700 mb-2 block">
                    Description *
                  </Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditFormChange}
                    rows={4}
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-location" className="text-sm font-medium text-gray-700 mb-2 block">
                      Location *
                    </Label>
                    <Input
                      id="edit-location"
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditFormChange}
                      required
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-prizeMoney" className="text-sm font-medium text-gray-700 mb-2 block">
                      Prize Money *
                    </Label>
                    <Input
                      id="edit-prizeMoney"
                      name="prizeMoney"
                      value={editFormData.prizeMoney}
                      onChange={handleEditFormChange}
                      required
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Info className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Schedule</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startDeadline" className="text-sm font-medium text-gray-700 mb-2 block">
                    Start Date & Time *
                  </Label>
                  <Input
                    id="edit-startDeadline"
                    name="startDeadline"
                    type="datetime-local"
                    value={editFormData.startDeadline}
                    onChange={handleEditFormChange}
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endDeadline" className="text-sm font-medium text-gray-700 mb-2 block">
                    End Date & Time *
                  </Label>
                  <Input
                    id="edit-endDeadline"
                    name="endDeadline"
                    type="datetime-local"
                    value={editFormData.endDeadline}
                    onChange={handleEditFormChange}
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Info className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Competition Settings</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 rounded-lg border bg-card">
                  <Checkbox
                    id="edit-isActive"
                    checked={editFormData.isActive}
                    onCheckedChange={(checked) => handleEditCheckboxChange("isActive", checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="edit-isActive" className="text-sm font-medium cursor-pointer">
                      Active Competition
                    </Label>
                    <p className="text-xs text-gray-600">Enable this competition for public participation</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border bg-card">
                  <Checkbox
                    id="edit-isLocked"
                    checked={editFormData.isLocked}
                    onCheckedChange={(checked) => handleEditCheckboxChange("isLocked", checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="edit-isLocked" className="text-sm font-medium cursor-pointer">
                      Lock Competition
                    </Label>
                    <p className="text-xs text-gray-600">Prevent further modifications to this competition</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3 pt-6 border-t">
              <div className="flex justify-between w-full">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Competition
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editLoading}
                    className="bg-gray-900 hover:bg-gray-800 text-white border-0"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editLoading ? "Saving Changes..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Competition Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-white border-0 shadow-2xl max-w-2xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">Create New Competition</DialogTitle>
                <p className="text-gray-600 text-sm">Set up a new competition for participants to join</p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2 block">
                  Competition Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="e.g., AI Prompt Engineering Challenge 2024"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 min-h-[100px]"
                  placeholder="Describe what this competition is about, its goals, and what participants can expect..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prizeMoney" className="text-sm font-medium text-gray-700 mb-2 block">
                    Prize Money
                  </Label>
                  <Input
                    id="prizeMoney"
                    value={formData.prizeMoney}
                    onChange={(e) => handleFormChange("prizeMoney", e.target.value)}
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="e.g., $5,000"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-sm font-medium text-gray-700 mb-2 block">
                    Location
                  </Label>
                  <Select value={formData.location} onValueChange={(value) => handleFormChange("location", value)}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">🌐 Online</SelectItem>
                      <SelectItem value="offsite">🏢 Offsite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime" className="text-sm font-medium text-gray-700 mb-2 block">
                    Start Date & Time
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => handleFormChange("startTime", e.target.value)}
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime" className="text-sm font-medium text-gray-700 mb-2 block">
                    End Date & Time
                  </Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => handleFormChange("endTime", e.target.value)}
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
            {formError && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">{formError}</p>
              </div>
            )}
            <DialogFooter className="gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                className="border-gray-200 text-gray-700 hover:bg-gray-50 bg-transparent"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Competition
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Competition Ended Dialog */}
      <Dialog open={showCompetitionEndedDialog} onOpenChange={setShowCompetitionEndedDialog}>
        <DialogContent className="sm:max-w-[425px] p-6">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mb-4">
              <Info className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">Competition Ended</DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-2">
              This competition has already ended and can no longer be edited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center pt-4">
            <Button onClick={() => setShowCompetitionEndedDialog(false)} className="w-full sm:w-auto">
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Competition Started Dialog */}
      <Dialog open={showCompetitionStartedDialog} onOpenChange={setShowCompetitionStartedDialog}>
        <DialogContent className="sm:max-w-[425px] p-6">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600 mb-4">
              <Info className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">Competition Started</DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-2">
              This competition has already started and can no longer be edited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center pt-4">
            <Button onClick={() => setShowCompetitionStartedDialog(false)} className="w-full sm:w-auto">
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] p-6">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">Delete Competition</DialogTitle>
            <DialogDescription className="text-base text-gray-600 mt-2">
              Are you sure you want to delete this competition? This action cannot be undone and all associated data
              will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCompetition}
              disabled={deleteLoading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
