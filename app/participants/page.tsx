"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
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
import { collection, getDocs } from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { fetchCompetitions, fetchWithAuth } from "@/lib/api" // Import the new API function
import {
  Trophy,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  MapPin,
  ChevronDown,
  Search,
  Filter,
  Grid3X3,
  List,
  UserPlus,
  X,
  Eye,
} from "lucide-react"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore" // Removed collection, query, orderBy, onSnapshot
import { db } from "@/lib/firebase"
import { useSubmissionStore } from "@/lib/store"
import Image from "next/image"
import { ViewCompetitionDetailsModal } from "@/components/view-competition-details-modal" // Import the new modal
import { useAuth } from "@/components/auth-provider"

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

interface UserProfile {
  uid: string
  email: string
  role: string
  displayName?: string | null
  photoURL?: string | null
}

// Registration Modal Component
const RegistrationModal = ({
  isOpen,
  onClose,
  onConfirm,
  competitionTitle,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: (input: string) => void
  competitionTitle: string
  isLoading: boolean
}) => {
  const [registerInput, setRegisterInput] = useState("")
  const handleConfirm = () => {
    onConfirm(registerInput)
    setRegisterInput("")
  }
  const handleClose = () => {
    setRegisterInput("")
    onClose()
  }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Registration</h3>
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            You are about to register for <strong>{competitionTitle}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Type <strong>"REGISTER"</strong> to confirm your registration.
          </p>
          <Input
            placeholder="Type REGISTER to confirm"
            value={registerInput}
            onChange={(e) => setRegisterInput(e.target.value)}
            className="w-full"
            disabled={isLoading}
          />
          <div className="flex gap-2 pt-2">
            <Button onClick={handleConfirm} disabled={registerInput !== "REGISTER" || isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Registering...
                </>
              ) : (
                "Confirm Registration"
              )}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
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
  const { logout } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loadingInitialFetch, setLoadingInitialFetch] = useState(true)
  const [participantMap, setParticipantMap] = useState<Record<string, boolean>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})
  const [completionMap, setCompletionMap] = useState<Record<string, boolean>>({}) // Added completion status tracking

  // Registration Modal States
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const { submissions, challengeCount } = useSubmissionStore()
  const isSubmitted = submissions === challengeCount

  // View Details Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  // Filtering and Pagination States
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "ended" | "upcoming">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [itemsPerPage] = useState(6) // Number of items per page, changed to 6
  const [currentPage, setCurrentPage] = useState(1)

  // Ref to keep track of active timeouts for cleanup (kept for potential future use, though not used with fetchCompetitions directly)
  const timeoutRefs = useRef<NodeJS.Timeout[]>([])

  const [user, setUser] = useState<UserProfile | null>(null)
  const [completedCompetitions, setCompletedCompetitions] = useState<string[]>([])

  useEffect(() => {
    const init = async () => {
      setLoadingInitialFetch(true)
      await checkAuth()

      const profile = await checkAuth()
      if (!profile) return

      await loadCompetitions(profile)
    }

    init()

    return () => {
      timeoutRefs.current.forEach((id) => clearTimeout(id))
      timeoutRefs.current = []
    }
  }, [router])

  const loadCompetitions = async (user: UserProfile) => {
    try {
      const data = await fetchCompetitions()
      const sortedCompetitions = data.sort(
        (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      )
      setCompetitions(sortedCompetitions)

      const newParticipantMap: Record<string, boolean> = {}
      const newLoadingMap: Record<string, boolean> = {}

      sortedCompetitions.forEach((comp) => {
        newLoadingMap[comp.id] = true
      })
      setLoadingMap({ ...newLoadingMap })

      const fetchPromises = sortedCompetitions.map(async (comp) => {
        try {
          const participantDoc = await getDoc(doc(db, "competitions", comp.id, "participants", user.uid))
          newParticipantMap[comp.id] = participantDoc.exists()
        } catch (err) {
          console.error(`Error checking participant status for ${comp.id}:`, err)
          newParticipantMap[comp.id] = false
        } finally {
          newLoadingMap[comp.id] = false
        }
      })

      await Promise.all(fetchPromises)

      setParticipantMap(newParticipantMap)
      setLoadingMap(newLoadingMap)

      try {
        const completionStatus = await fetchCompetitionCompletionStatus(user.uid)
        setCompletionMap(completionStatus)
      } catch (error) {
        console.error("Error fetching completion status:", error)
      }
    } catch (error) {
      console.error("Error fetching competitions:", error)
      toast.error("Failed to load competitions.")
    } finally {
      setLoadingInitialFetch(false)
    }
  }

  const checkAuth = async (): Promise<UserProfile | null> => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_USER_AUTH}`)
      setUser(profile)

      // Role validation
      if (!profile || ["admin", "judge", "superadmin"].includes(profile.role)) {
        router.push("/")
        return null
      }

      return profile
    } catch (error) {
      router.push("/")
      return null
    } finally {
      setLoadingInitialFetch(false)
    }
  }

  const handleRegister = async (registerInput: string) => {
    if (!selectedCompetition || !user) return
    if (registerInput !== "REGISTER") {
      toast.error("Please type 'REGISTER' to confirm.")
      return
    }
    try {
      setLoadingMap((prev) => ({ ...prev, [selectedCompetition.id]: true }))
      const participantDocRef = doc(db, "competitions", selectedCompetition.id, "participants", user.uid)
      await setDoc(participantDocRef, {
        fullName: user.displayName || user.email?.split("@")[0] || "Unknown",
        email: user.email || "",
        registeredAt: serverTimestamp(),
        challengesCompleted: 0,
      })
      setParticipantMap((prev) => ({ ...prev, [selectedCompetition.id]: true }))
      setShowRegistrationModal(false)
      setSelectedCompetition(null)
      toast.success("Successfully registered for the competition!")
    } catch (error) {
      console.error("Error registering for competition:", error)
      toast.error("Failed to register. Please try again.")
    } finally {
      setLoadingMap((prev) => ({ ...prev, [selectedCompetition.id]: false }))
    }
  }

  const showRegistrationConfirmation = (competition: Competition) => {
    setSelectedCompetition(competition)
    setShowRegistrationModal(true)
  }

  const handleViewDetails = (competition: Competition) => {
    setSelectedCompetition(competition)
    setIsViewModalOpen(true)
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

  const fetchCompetitionCompletionStatus = async (participantId: string) => {
    const competitionsRef = collection(db, "competitions")
    const competitionsSnap = await getDocs(competitionsRef)

    const results: Record<string, boolean> = {}

    // Prepare all participant doc fetches in parallel
    const promises = competitionsSnap.docs.map(async (competitionDoc) => {
      const competitionId = competitionDoc.id
      const competitionData = competitionDoc.data()
      const challengeCount = competitionData.ChallengeCount || 0

      // Fetch participant's document for this competition
      const participantDocRef = doc(db, "competitions", competitionId, "participants", participantId)
      const participantSnap = await getDoc(participantDocRef)
      const participantData = participantSnap.data()

      const challengesCompleted = participantData?.challengesCompleted || 0

      results[competitionId] = challengeCount === challengesCompleted
    })

    // Wait for all fetches to finish
    await Promise.all(promises)

    return results
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

  const handleCompetitionClick = async (competition: Competition) => {
    // Always show details when clicking the card
    handleViewDetails(competition)
  }

  const groupCompetitionsByStatus = (competitions: Competition[]) => {
    const groups = {
      active: [] as Competition[],
      upcoming: [] as Competition[],
      ended: [] as Competition[],
    }

    competitions.forEach((comp) => {
      const status = getCompetitionStatus(comp)
      if (status.status === "ACTIVE") {
        groups.active.push(comp)
      } else if (status.status === "UPCOMING") {
        groups.upcoming.push(comp)
      } else if (status.status === "ENDED") {
        const isRegistered = participantMap[comp.id]
        const isCompleted = completedCompetitions.includes(comp.id)
        if (isRegistered || isCompleted) {
          groups.ended.push(comp)
        }
      }
    })

    return groups
  }

  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch = comp.title.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    const status = getCompetitionStatus(comp)
    if (filterStatus === "all") return status.status !== "INACTIVE"
    return status.status.toLowerCase() === filterStatus.toLowerCase()
  })

  const groupedCompetitions = groupCompetitionsByStatus(filteredCompetitions)

  // const totalPages = Math.ceil(filteredCompetitions.length / itemsPerPage)
  // const startIndex = (currentPage - 1) * itemsPerPage
  // const endIndex = startIndex + itemsPerPage
  // const currentCompetitions = filteredCompetitions.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false)
          setSelectedCompetition(null)
        }}
        onConfirm={handleRegister}
        competitionTitle={selectedCompetition?.title || ""}
        isLoading={selectedCompetition ? loadingMap[selectedCompetition.id] || false : false}
      />
      <ViewCompetitionDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedCompetition(null)
        }}
        competition={selectedCompetition}
      />
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/images/Logo-for-Picton-Blue.png"
                alt="Empowerment Through Learning Logo"
                width={300}
                height={130}
                className="h-12 w-auto"
                priority
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 leading-tight">Participant Dashboard</h1>
              </div>
            </div>
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
                      <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Available Competitions</h2>
            <p className="text-gray-600 text-sm">
              {filteredCompetitions.length} competition{filteredCompetitions.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>
        <div className="py-6">
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
      </div>
      {/* Main Content without the border */}
      <div className="max-w-7xl mx-auto px-6 pb-12 bg-white rounded-xl shadow-sm mb-8">
        <div className="py-8">
          {" "}
          {/* Added padding inside the bordered area */}
          {loadingInitialFetch && competitions.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(itemsPerPage)].map((_, i) => (
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
              <div className="space-y-12">
                {/* Active Competitions Section */}
                {groupedCompetitions.active.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <h3 className="text-xl font-bold text-gray-900">Active Competitions</h3>
                      <Badge className="bg-green-50 text-green-700 border-green-200 border font-medium">
                        {groupedCompetitions.active.length}
                      </Badge>
                    </div>
                    <div
                      className={
                        viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"
                      }
                    >
                      {groupedCompetitions.active.map((competition) => {
                        const status = getCompetitionStatus(competition)
                        const startDateTime = formatDateTime(competition.startDeadline)
                        const endDateTime = formatDateTime(competition.endDeadline)
                        const isRegistered = participantMap[competition.id]
                        const isButtonLoading = loadingMap[competition.id]
                        const isCompleted = completionMap[competition.id] || false
                        return (
                          <Card
                            key={competition.id}
                            className="bg-white shadow-lg rounded-xl h-full flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 overflow-hidden group cursor-pointer"
                            onClick={() => handleCompetitionClick(competition)}
                          >
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-slate-600/5" />
                              <CardContent className="p-8 relative flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge className={`${status.color} border font-medium px-3 py-1`}>
                                        <div className={`w-2 h-2 ${status.dotColor} rounded-full mr-1.5`}></div>
                                        {status.label}
                                      </Badge>
                                      {isRegistered && (
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border font-medium">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Registered
                                        </Badge>
                                      )}
                                      {isCompleted && (
                                        <Badge className="bg-purple-50 text-purple-700 border-purple-200 border font-medium">
                                          <Trophy className="w-3 h-3 mr-1" />
                                          Completed
                                        </Badge>
                                      )}
                                    </div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent leading-tight line-clamp-2 min-h-[3.5rem]">
                                      {competition.title}
                                    </h3>
                                  </div>
                                  <div className="ml-4">
                                    <Eye className="h-5 w-5 text-gray-400 hover:text-blue-600 transition-colors duration-200" />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <Calendar className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Date
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {startDateTime.date === endDateTime.date
                                          ? startDateTime.date
                                          : `${startDateTime.date} - ${endDateTime.date}`}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                      <Clock className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Time
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {startDateTime.time} → {endDateTime.time}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                      <MapPin className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Location
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {competition.location || "Online"}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                      <Trophy className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Prize
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {competition.prizeMoney || "TBD"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                  {(status.status === "ACTIVE" || status.status === "UPCOMING") && (
                                    <Button
                                      className="w-full gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 justify-center"
                                      disabled={isButtonLoading}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (isRegistered) {
                                          router.push(`/participants/competitions/${competition.id}`)
                                        } else {
                                          showRegistrationConfirmation(competition)
                                        }
                                      }}
                                    >
                                      {isButtonLoading ? (
                                        <>
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          <span className="font-semibold">Loading...</span>
                                        </>
                                      ) : isRegistered ? (
                                        <>
                                          <Trophy className="h-5 w-5" />
                                          <span className="font-semibold">
                                            {isCompleted ? "View Results" : "Continue"}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <UserPlus className="h-5 w-5" />
                                          <span className="font-semibold">Register</span>
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Upcoming Competitions Section */}
                {groupedCompetitions.upcoming.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <h3 className="text-xl font-bold text-gray-900">Upcoming Competitions</h3>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 border font-medium">
                        {groupedCompetitions.upcoming.length}
                      </Badge>
                    </div>
                    <div
                      className={
                        viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"
                      }
                    >
                      {groupedCompetitions.upcoming.map((competition) => {
                        const status = getCompetitionStatus(competition)
                        const startDateTime = formatDateTime(competition.startDeadline)
                        const endDateTime = formatDateTime(competition.endDeadline)
                        const isRegistered = participantMap[competition.id]
                        const isButtonLoading = loadingMap[competition.id]
                        const isCompleted = completionMap[competition.id] || false
                        return (
                          <Card
                            key={competition.id}
                            className="bg-white shadow-lg rounded-xl h-full flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 overflow-hidden group cursor-pointer"
                            onClick={() => handleCompetitionClick(competition)}
                          >
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-slate-600/5" />
                              <CardContent className="p-8 relative flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge className={`${status.color} border font-medium px-3 py-1`}>
                                        <div className={`w-2 h-2 ${status.dotColor} rounded-full mr-1.5`}></div>
                                        {status.label}
                                      </Badge>
                                      {isRegistered && (
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border font-medium">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Registered
                                        </Badge>
                                      )}
                                      {isCompleted && (
                                        <Badge className="bg-purple-50 text-purple-700 border-purple-200 border font-medium">
                                          <Trophy className="w-3 h-3 mr-1" />
                                          Completed
                                        </Badge>
                                      )}
                                    </div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent leading-tight line-clamp-2 min-h-[3.5rem]">
                                      {competition.title}
                                    </h3>
                                  </div>
                                  <div className="ml-4">
                                    <Eye className="h-5 w-5 text-gray-400 hover:text-blue-600 transition-colors duration-200" />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <Calendar className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Date
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {startDateTime.date === endDateTime.date
                                          ? startDateTime.date
                                          : `${startDateTime.date} - ${endDateTime.date}`}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                      <Clock className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Time
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {startDateTime.time} → {endDateTime.time}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                      <MapPin className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Location
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {competition.location || "Online"}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                      <Trophy className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Prize
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {competition.prizeMoney || "TBD"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                  {(status.status === "ACTIVE" || status.status === "UPCOMING") && (
                                    <Button
                                      className="w-full gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 justify-center"
                                      disabled={isButtonLoading}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (isRegistered) {
                                          router.push(`/participants/competitions/${competition.id}`)
                                        } else {
                                          showRegistrationConfirmation(competition)
                                        }
                                      }}
                                    >
                                      {isButtonLoading ? (
                                        <>
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          <span className="font-semibold">Loading...</span>
                                        </>
                                      ) : isRegistered ? (
                                        <>
                                          <Trophy className="h-5 w-5" />
                                          <span className="font-semibold">
                                            {isCompleted ? "View Results" : "Continue"}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <UserPlus className="h-5 w-5" />
                                          <span className="font-semibold">Register</span>
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Ended Competitions Section */}
                {groupedCompetitions.ended.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <h3 className="text-xl font-bold text-gray-900">Ended Competitions</h3>
                      <Badge className="bg-gray-50 text-gray-600 border-gray-200 border font-medium">
                        {groupedCompetitions.ended.length}
                      </Badge>
                    </div>
                    <div
                      className={
                        viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"
                      }
                    >
                      {groupedCompetitions.ended.map((competition) => {
                        const status = getCompetitionStatus(competition)
                        const startDateTime = formatDateTime(competition.startDeadline)
                        const endDateTime = formatDateTime(competition.endDeadline)
                        const isRegistered = participantMap[competition.id]
                        const isButtonLoading = loadingMap[competition.id]
                        const isCompleted = completionMap[competition.id] || false
                        return (
                          <Card
                            key={competition.id}
                            className="bg-white shadow-lg rounded-xl h-full flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 overflow-hidden group cursor-pointer"
                            onClick={() => handleCompetitionClick(competition)}
                          >
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-slate-600/5" />
                              <CardContent className="p-8 relative flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge className={`${status.color} border font-medium px-3 py-1`}>
                                        <div className={`w-2 h-2 ${status.dotColor} rounded-full mr-1.5`}></div>
                                        {status.label}
                                      </Badge>
                                      {isRegistered && (
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border font-medium">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Registered
                                        </Badge>
                                      )}
                                      {isCompleted && (
                                        <Badge className="bg-purple-50 text-purple-700 border-purple-200 border font-medium">
                                          <Trophy className="w-3 h-3 mr-1" />
                                          Completed
                                        </Badge>
                                      )}
                                    </div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent leading-tight line-clamp-2 min-h-[3.5rem]">
                                      {competition.title}
                                    </h3>
                                  </div>
                                  <div className="ml-4">
                                    <Eye className="h-5 w-5 text-gray-400 hover:text-blue-600 transition-colors duration-200" />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <Calendar className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Date
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {startDateTime.date === endDateTime.date
                                          ? startDateTime.date
                                          : `${startDateTime.date} - ${endDateTime.date}`}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                      <Clock className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Time
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {startDateTime.time} → {endDateTime.time}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                      <MapPin className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Location
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {competition.location || "Online"}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                      <Trophy className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        Prize
                                      </p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {competition.prizeMoney || "TBD"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                  {isRegistered && (
                                    <Button
                                      className="w-full gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 justify-center"
                                      disabled={isButtonLoading}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/participants/competitions/${competition.id}`)
                                      }}
                                    >
                                      <Trophy className="h-5 w-5" />
                                      <span className="font-semibold">View Results</span>
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
