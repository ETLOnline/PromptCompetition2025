"use client"
import { toast } from "react-hot-toast"
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

import { fetchCompetitions, createCompetition, updateCompetition, deleteCompetition, 
  fetchWithAuth
  } from "@/lib/api"
  
import {
  Plus,
  Trophy,
  Calendar,
  MapPin,
  DollarSign,
  Search,
  Filter,
  Grid3X3,
  List,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
} from "lucide-react"

// Import our new components
import CompetitionGrid from "@/components/competition/CompetitionGrid"
import CreateCompetitionModal from "@/components/competition/CreateCompetitionModal"
import EditCompetitionModal from "@/components/competition/EditCompetitionModal"
import type { Competition, CreateCompetitionData, EditCompetitionData } from "@/types/competition"

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
  // const { user, role } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [showCompetitionEndedDialog, setShowCompetitionEndedDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "ended" | "upcoming">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(9)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  
  useEffect(() => {
    checkAuth();
    refetchCompetitions()
  }, [router])

  const checkAuth = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_SUPER_AUTH}`);
      setRole(profile.role)
    } 
    catch (error) 
    {
      router.push("/");
    } 
    finally 
    {
      setLoading(false);
    }
  };


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

  const getCompetitionStatus = (competition: Competition) => {
    const now = new Date()
    const startDate = new Date(competition.startDeadline)
    const endDate = new Date(competition.endDeadline)

    if (competition.isLocked) {
      return { label: "Locked", color: "bg-gray-100 text-gray-700 border-gray-200" }
    }
    if (!competition.isActive) {
      return { label: "Inactive", color: "bg-red-50 text-red-700 border-red-200" }
    }
    if (now < startDate) {
      return { label: "Upcoming", color: "bg-blue-50 text-blue-700 border-blue-200" }
    }
    if (now >= startDate && now <= endDate && competition.isActive && !competition.isLocked) {
      return { label: "Active", color: "bg-green-50 text-green-700 border-green-200" }
    }
    if (now > endDate) {
      return { label: "Ended", color: "bg-gray-50 text-gray-600 border-gray-200" }
    }
    return { label: "Active", color: "bg-green-50 text-green-700 border-green-200" }
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

    setSelectedCompetition(competition)
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

  // Handler functions for the modals
  const handleCreateSubmit = async (data: CreateCompetitionData) => {
    setCreateLoading(true)
    try {
      await createCompetition(data)
      toast.success("Competition created successfully!")
      refetchCompetitions()
    } catch (error) {
      console.error("Error creating competition:", error)
      throw error
    } finally {
      setCreateLoading(false)
    }
  }

  const handleEditSubmit = async (data: EditCompetitionData) => {
    if (!selectedCompetition) {
      throw new Error("User not authenticated or no competition selected.")
    }

    setEditLoading(true)
    try {
      await updateCompetition(selectedCompetition.id, data)
      toast.success("Competition updated successfully!")
      setSelectedCompetition(null)
      refetchCompetitions()
    } catch (error) {
      console.error("Error updating competition:", error)
      throw error
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteCompetition = async () => {
    if (!selectedCompetition) {
      throw new Error("User not authenticated or no competition selected.")
    }

    setDeleteLoading(true)
    try {
      await deleteCompetition(selectedCompetition.id)
      toast.success("Competition deleted.")
      setSelectedCompetition(null)
      refetchCompetitions()
    } catch (error) {
      console.error("Error deleting competition:", error)
      throw error
    } finally {
      setDeleteLoading(false)
    }
  }

  if ((role !== "admin" && role !== "superadmin")) {
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
            <CompetitionGrid
              competitions={currentCompetitions}
              onEdit={handleEditClick}
              onView={handleViewClick}
              onManage={handleManageClick}
              role={role}
              viewMode={viewMode}
            />

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

      {/* Create Competition Modal */}
      <CreateCompetitionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        loading={createLoading}
      />

      {/* Edit Competition Modal */}
      <EditCompetitionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        onDelete={handleDeleteCompetition}
        competition={selectedCompetition}
        loading={editLoading}
        deleteLoading={deleteLoading}
      />

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
    </div>
  )
}
