"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { fetchCompetitions, fetchWithAuth } from "@/lib/api"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useSubmissionStore } from "@/lib/store"
import { ViewCompetitionDetailsModal } from "@/components/view-competition-details-modal"
import { useAuth } from "@/components/auth-provider"

import { RegistrationModal } from "@/components/participantcompetitions/registration-modal"
import { CompetitionSkeleton } from "@/components/participantcompetitions/competition-skeleton"
import { CompetitionSection } from "@/components/participantcompetitions/competition-section"
import { SearchAndFilters } from "@/components/participantcompetitions/search-and-filters"
import { EmptyState } from "@/components/participantcompetitions/empty-state"
// import { PageHeader } from "@/components/participantcompetitions/page-header"

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

export default function CompetitionsPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loadingInitialFetch, setLoadingInitialFetch] = useState(true)
  const [participantMap, setParticipantMap] = useState<Record<string, boolean>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})
  const [completionMap, setCompletionMap] = useState<Record<string, boolean>>({})
  const [buttonStatesLoading, setButtonStatesLoading] = useState<Record<string, boolean>>({})

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
  const [itemsPerPage] = useState(6)
  const [currentPage, setCurrentPage] = useState(1)

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
  }, [])

  const loadCompetitions = async (profile: UserProfile) => {
    try {
      const data = await fetchCompetitions()
      setCompetitions(data)

      // Initialize all buttons as loading
      const initialButtonLoading: Record<string, boolean> = {}
      data.forEach((comp: Competition) => {
        initialButtonLoading[comp.id] = true
      })
      setButtonStatesLoading(initialButtonLoading)

      const participantStatus: Record<string, boolean> = {}
      const completionStatus: Record<string, boolean> = {}

      // Process competitions in parallel for faster load
      await Promise.all(
        data.map(async (competition: Competition) => {
          try {
            const participantDocRef = doc(
              db,
              "competitions",
              competition.id,
              "participants",
              profile.uid
            )
            const participantDoc = await getDoc(participantDocRef)
            const isParticipant = participantDoc.exists()
            participantStatus[competition.id] = isParticipant

            let isCompleted = false
            if (isParticipant) {
              const participantData = participantDoc.data()
              isCompleted = participantData?.challengesCompleted > 0
            }
            completionStatus[competition.id] = isCompleted
          } catch (error) {
            console.error(
              `Error checking participant status for competition ${competition.id}:`,
              error
            )
            participantStatus[competition.id] = false
            completionStatus[competition.id] = false
          } finally {
            // ✅ Only stop button loading AFTER badges (participant + completion) are set
            setButtonStatesLoading((prev) => ({
              ...prev,
              [competition.id]: false,
            }))
          }
        })
      )

      setParticipantMap(participantStatus)
      setCompletionMap(completionStatus)
    } catch (error) {
      console.error("Error loading competitions:", error)
      toast.error("Failed to load competitions.")
      setButtonStatesLoading({})
    } finally {
      setLoadingInitialFetch(false)
    }
}

  const checkAuth = async (): Promise<UserProfile | null> => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_USER_AUTH}`)
      setUser(profile)

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
    const now = new Date()
    const startDate = new Date(competition.startDeadline?.seconds * 1000 || competition.startDeadline)
    const endDate = new Date(competition.endDeadline?.seconds * 1000 || competition.endDeadline)

    if (now < startDate) {
      return {
        status: "UPCOMING",
        label: "Upcoming",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        dotColor: "bg-blue-400",
      }
    } else if (now >= startDate && now <= endDate) {
      return {
        status: "ACTIVE",
        label: "Active",
        color: "bg-green-50 text-green-700 border-green-200",
        dotColor: "bg-green-400",
      }
    } else {
      return {
        status: "ENDED",
        label: "Ended",
        color: "bg-gray-50 text-gray-600 border-gray-200",
        dotColor: "bg-gray-400",
      }
    }
  }

  const formatDateTime = (timestamp: any) => {
    const date = new Date(timestamp?.seconds * 1000 || timestamp)
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    }
  }

  const handleCompetitionClick = (competition: Competition) => {
    handleViewDetails(competition)
  }

  const handleButtonClick = (competition: Competition) => {
    const isRegistered = participantMap[competition.id]
    const status = getCompetitionStatus(competition)

    if (status.status === "ENDED" && isRegistered) {
      router.push(`/participant/${competition.id}/results`)
    } else if (isRegistered) {
      router.push(`/participant/${competition.id}`)
    } else {
      showRegistrationConfirmation(competition)
    }
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

  const filteredCompetitions = competitions.filter((comp: Competition) => {
    const matchesSearch = comp.title.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    const status = getCompetitionStatus(comp)
    if (filterStatus === "all") return status.status !== "INACTIVE"
    return status.status.toLowerCase() === filterStatus.toLowerCase()
  })

  const groupedCompetitions = groupCompetitionsByStatus(filteredCompetitions)

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

      <div className="max-w-7xl mx-auto px-6">
        <SearchAndFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12 bg-white rounded-xl shadow-sm mb-8">
        <div className="py-8">
          {loadingInitialFetch && competitions.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(itemsPerPage)].map((_, i) => (
                <CompetitionSkeleton key={i} />
              ))}
            </div>
          ) : filteredCompetitions.length === 0 ? (
            <EmptyState searchTerm={searchTerm} filterStatus={filterStatus} />
          ) : (
            <div className="space-y-12">
              <CompetitionSection
                title="Active Competitions"
                competitions={groupedCompetitions.active}
                dotColor="bg-green-400"
                badgeColor="bg-green-50 text-green-700 border-green-200"
                viewMode={viewMode}
                getCompetitionStatus={getCompetitionStatus}
                formatDateTime={formatDateTime}
                participantMap={participantMap}
                completionMap={completionMap}
                loadingMap={loadingMap}
                buttonStatesLoading={buttonStatesLoading}
                onCardClick={handleCompetitionClick}
                onButtonClick={handleButtonClick}
              />

              <CompetitionSection
                title="Upcoming Competitions"
                competitions={groupedCompetitions.upcoming}
                dotColor="bg-blue-400"
                badgeColor="bg-blue-50 text-blue-700 border-blue-200"
                viewMode={viewMode}
                getCompetitionStatus={getCompetitionStatus}
                formatDateTime={formatDateTime}
                participantMap={participantMap}
                completionMap={completionMap}
                loadingMap={loadingMap}
                buttonStatesLoading={buttonStatesLoading}
                onCardClick={handleCompetitionClick}
                onButtonClick={handleButtonClick}
              />

              <CompetitionSection
                title="Ended Competitions"
                competitions={groupedCompetitions.ended}
                dotColor="bg-gray-400"
                badgeColor="bg-gray-50 text-gray-600 border-gray-200"
                viewMode={viewMode}
                getCompetitionStatus={getCompetitionStatus}
                formatDateTime={formatDateTime}
                participantMap={participantMap}
                completionMap={completionMap}
                loadingMap={loadingMap}
                buttonStatesLoading={buttonStatesLoading}
                onCardClick={handleCompetitionClick}
                onButtonClick={handleButtonClick}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
