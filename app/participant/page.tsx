"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { fetchCompetitions, fetchWithAuth } from "@/lib/api"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useSubmissionStore } from "@/lib/store"
import { ViewCompetitionDetailsModal } from "@/components/view-competition-details-modal"
import { useAuth } from "@/components/auth-provider"
import ParticipantBreadcrumb from "@/components/participant-breadcrumb"

import { RegistrationModal } from "@/components/participantcompetitions/registration-modal"
// import { CompetitionSkeleton } from "@/components/participantcompetitions/competition-skeleton"
import { CompetitionSection } from "@/components/participantcompetitions/competition-section"
import { SearchAndFilters } from "@/components/participantcompetitions/search-and-filters"
import { EmptyState } from "@/components/participantcompetitions/empty-state"
import { AppecInfoBox } from "@/components/participantcompetitions/AppecInfoBox"
import { AppecHeroBanner } from "@/components/participantcompetitions/AppecHeroBanner"
// import { FeaturedCompetition } from "@/components/participantcompetitions/FeaturedCompetition"
import { DailyChallengesSection } from "@/components/participantcompetitions/DailyChallengesSection"
import { CompetitionProgressTimeline } from "@/components/participantcompetitions/CompetitionProgressTimeline"
import { PageSkeletonLoader } from "@/components/participantcompetitions/page-skeleton-loader"
import { Spinner } from "@/components/ui/spinner"
import { fetchDailyChallenges } from "@/lib/api"
// import { PageHeader } from "@/components/participantcompetitions/page-header"

interface Competition {
  id: string
  title: string
  description: string
  startDeadline: any
  endDeadline: any
  createdAt?: string
  ChallengeCount?: number
  isActive?: boolean
  isLocked?: boolean
  isFeatured?: boolean
  location?: string
  prizeMoney?: string
  level?: string
  hasFinalLeaderboard?: boolean
}

interface DailyChallenge {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  startTime: any
  endTime: any
  status: string
  type: string
  totalSubmissions: number
  createdAt?: any
  createdBy?: string
  problemAudioUrls?: string[]
  guidelinesAudioUrls?: string[]
  visualClueUrls?: string[]
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
  const { toast } = useToast()
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
  const [showAppecInfo, setShowAppecInfo] = useState(true)
  
  // Daily Challenge States
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([])
  const [loadingDailyChallenges, setLoadingDailyChallenges] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    const init = async () => {
      setLoadingInitialFetch(true)
      await checkAuth()

      const profile = await checkAuth()
      if (!profile) return

      // Load competitions and daily challenges in parallel
      await Promise.all([
        loadCompetitions(profile),
        loadDailyChallenges()
      ])
    }

    init()
  }, [])

  const loadDailyChallenges = async () => {
    try {
      setLoadingDailyChallenges(true)
      const data = await fetchDailyChallenges()
      setDailyChallenges(data)
    } catch (error) {
      console.error("Error loading daily challenges:", error)
      // Silently fail - daily challenges are optional
    } finally {
      setLoadingDailyChallenges(false)
    }
  }

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
              const challengesCompleted = participantData?.challengesCompleted || 0
              const challengeCount = competition.ChallengeCount || 0

              // console.log(`Checking competition ${competition.id}: challengesCompleted=${challengesCompleted}, challengeCount=${challengeCount}`)

              if (challengesCompleted === challengeCount && challengeCount > 0) {
                isCompleted = true
                // ✅ update participant doc with `isCompleted: true`
                await setDoc(
                  participantDocRef,
                  { isCompleted: true },
                  { merge: true }
                )
              }
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
      toast({
        title: "Failed to load competitions.",
        variant: "destructive"
      })
      setButtonStatesLoading({})
    } finally {
      setLoadingInitialFetch(false)
      setDataLoaded(true)
    }
}

  const checkAuth = async (): Promise<UserProfile | null> => {
    try {
      // console.log("Checking authentication...")
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_USER_AUTH}`)
      // If no profile, redirect to home
      if (!profile) {
        router.push("/")
        return null
      }

      // Only allow these roles to proceed and return the profile
      const allowedRoles = ["participant", "admin", "judge", "superadmin"]
      if (allowedRoles.includes(profile.role)) {
        setUser(profile)
        return profile
      }

      // Otherwise redirect to home
      router.push("/")
      return null
    } catch (error) {
      router.push("/")
      return null
    } finally {
      setLoadingInitialFetch(false)
    }
  }

  const handleRegister = async (registerInput: string) => {
    if (!selectedCompetition || !user) return
    if (registerInput.trim().toLowerCase() !== "register") {
      toast({
        title: "Please type 'REGISTER' to confirm.",
        variant: "destructive"
      })
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
      toast({
        title: "You have registered successfully",
        description: "You are now enrolled in this competition.",
        variant: "default"
      })
    } catch (error) {
      console.error("Error registering for competition:", error)
      toast({
        title: "Failed to register. Please try again.",
        variant: "destructive"
      })
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

  const handleDailyChallengeView = (challenge: DailyChallenge) => {
    // For now, we'll just log - you can implement a modal or navigate to a challenge page
    // console.log("View daily challenge:", challenge)
    // TODO: Implement daily challenge view/submission flow
    toast({
      title: "Daily Challenge",
      description: "Challenge details will be available soon!",
      variant: "default"
    })
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

  const handleButtonClick = async (competition: Competition) => {
    // Set loading state immediately
    setLoadingMap((prev) => ({ ...prev, [competition.id]: true }))
    const isRegistered = participantMap[competition.id]
    const status = getCompetitionStatus(competition)
    try {
      if (status.status === "ENDED") {
        // Registered users see results, non-registered users see leaderboard
        const isRegistered = participantMap[competition.id]
        await new Promise((resolve) => setTimeout(resolve, 300))
        if (isRegistered) {
          router.push(`/participant/${competition.id}/results`)
        } else {
          router.push(`/participant/${competition.id}/leaderboard`)
        }
      } else if (isRegistered) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        // Route based on competition level
        const level = competition.level || "1"
        console.log("Navigating to competition level:", level)
        if (level === "Level 2") {
          router.push(`/participant/${competition.id}/level2`)
        } else {
          router.push(`/participant/${competition.id}/level1`)
        }
      } else {
        // Registration modal is sync, but keep loader for consistency
        showRegistrationConfirmation(competition)
      }
    } finally {
      // Remove loading state after navigation/modal
      setLoadingMap((prev) => ({ ...prev, [competition.id]: false }))
    }
  }

  const groupCompetitionsByStatus = (competitions: Competition[]) => {
    const groups = {
      featured: [] as Competition[],
      active: [] as Competition[],
      upcoming: [] as Competition[],
      ended: [] as Competition[],
    }

    competitions.forEach((comp) => {
      const status = getCompetitionStatus(comp)
      
      // Add to featured group if applicable
      if (comp.isFeatured) {
        groups.featured.push(comp)
        return
      }
      
      // Add to status-based group
      if (status.status === "ACTIVE") {
        groups.active.push(comp)
      } else if (status.status === "UPCOMING") {
        groups.upcoming.push(comp)
      } else if (status.status === "ENDED") {
        // Always show ended competitions (both registered and non-registered users can view results)
        groups.ended.push(comp)
      }
    })

    // Sort non-featured groups by date
    const sortByDate = (a: Competition, b: Competition) => {
      const dateA = new Date(a.startDeadline?.seconds * 1000 || a.startDeadline).getTime()
      const dateB = new Date(b.startDeadline?.seconds * 1000 || b.startDeadline).getTime()
      return dateB - dateA
    }

    groups.active.sort(sortByDate)
    groups.upcoming.sort(sortByDate)
    groups.ended.sort((a, b) => {
      const isRegisteredA = participantMap[a.id]
      const isRegisteredB = participantMap[b.id]

      // Prioritize registered competitions first
      if (isRegisteredA && !isRegisteredB) return -1
      if (!isRegisteredA && isRegisteredB) return 1

      // If both have same registration status, sort by date
      return sortByDate(a, b)
    })

    return groups
  }

  const filteredCompetitions = competitions.filter((comp: Competition) => {
    // First check if the competition is active
    if (comp.isActive === false) return false

    const matchesSearch = comp.title.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false

    const status = getCompetitionStatus(comp)

    // Check if competition has final leaderboard (only for ended competitions)
    if (status.status === "ENDED" && comp.hasFinalLeaderboard === false) return false

    if (filterStatus === "all") return status.status !== "INACTIVE"
    return status.status.toLowerCase() === filterStatus.toLowerCase()
  })

  const groupedCompetitions = groupCompetitionsByStatus(filteredCompetitions)
  
  // Sort featured competitions by status and time
  const sortedFeaturedCompetitions = groupedCompetitions.featured.sort((a, b) => {
    const statusA = getCompetitionStatus(a)
    const statusB = getCompetitionStatus(b)
    
    // Priority order: ACTIVE > UPCOMING > ENDED
    const statusPriority = { ACTIVE: 0, UPCOMING: 1, ENDED: 2 }
    const priorityA = statusPriority[statusA.status as keyof typeof statusPriority] ?? 3
    const priorityB = statusPriority[statusB.status as keyof typeof statusPriority] ?? 3
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    
    // Within same status, sort by time
    const dateA = new Date(a.startDeadline?.seconds * 1000 || a.startDeadline).getTime()
    const dateB = new Date(b.startDeadline?.seconds * 1000 || b.startDeadline).getTime()
    
    if (statusA.status === "UPCOMING") {
      // For upcoming: soonest first
      return dateA - dateB
    } else {
      // For active and ended: newest first
      return dateB - dateA
    }
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  // Show full page skeleton loader while initial authentication and data loading
  if (!user || loadingInitialFetch) {
    return <PageSkeletonLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <ParticipantBreadcrumb />
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

      {sortedFeaturedCompetitions.length > 0 ? (
        <div className="space-y-6">
          {sortedFeaturedCompetitions.map((featuredComp, index) => (
            <AppecHeroBanner
              key={featuredComp.id}
              competition={featuredComp}
              status={getCompetitionStatus(featuredComp)}
              startDateTime={formatDateTime(featuredComp.startDeadline)}
              endDateTime={formatDateTime(featuredComp.endDeadline)}
              isRegistered={participantMap[featuredComp.id]}
              isCompleted={completionMap[featuredComp.id]}
              isButtonLoading={loadingMap[featuredComp.id]}
              onButtonClick={handleButtonClick}
              showInfoBox={index === 0 && showAppecInfo}
              onInfoBoxDismiss={() => setShowAppecInfo(false)}
              showProgressTimeline={index === 0}
            />
          ))}
        </div>
      ) : (
        showAppecInfo && (
          <div className="w-full px-4 sm:px-6 sm:max-w-7xl sm:mx-auto mt-4 sm:mt-6">
            <AppecInfoBox
              initiallyVisible={showAppecInfo}
              onDismiss={() => setShowAppecInfo(false)}
            />
          </div>
        )
      )}

      <div className="w-full px-4 sm:px-6 sm:max-w-7xl sm:mx-auto">
        <SearchAndFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>

      <div className="w-full px-4 sm:px-6 sm:max-w-7xl sm:mx-auto pb-12 bg-white sm:rounded-xl sm:shadow-sm mb-8">
        <div className="py-6">
          {/* Show spinner while competitions are loading */}
          {!dataLoaded ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <>
              {/* Regular Competitions */}
              {filterStatus === "ended" ? (
                // Show only ended competitions where the user participated
                groupedCompetitions.ended.length === 0 ? (
                <EmptyState
                  searchTerm={searchTerm}
                  filterStatus={filterStatus}
                  title={"You haven't participated in any ended competitions yet"}
                  message={"Once you've participated in a competition and it ends, results will appear here."}
                />
              ) : (
                <div className="space-y-12">
                  <CompetitionSection
                    title="Past competition"
                    competitions={groupedCompetitions.ended}
                    dotColor="bg-gray-400"
                    badgeColor="bg-gray-50 text-gray-600 border-gray-200"
                    viewMode={viewMode}
                    getCompetitionStatus={getCompetitionStatus}
                    formatDateTime={formatDateTime}
                    participantMap={participantMap}
                    completionMap={completionMap}
                    loadingMap={loadingMap}
                    onCardClick={handleCompetitionClick}
                    onButtonClick={handleButtonClick}
                    isFiltered={true}
                  />

                  {/* Daily Challenges Section - Only show on "ended" filter */}
                  <DailyChallengesSection
                    challenges={dailyChallenges}
                    loading={loadingDailyChallenges}
                    onViewDetails={handleDailyChallengeView}
                    userRole={user?.role as "participant" | "admin" | "judge" | "superadmin"}
                  />
                </div>
              )
            ) : filterStatus === "active" || filterStatus === "upcoming" || searchTerm !== "" ? (
              // For other filtered views, present matching grouped sections directly
              // Build a list of sections to show based on groupedCompetitions
              (groupedCompetitions.active.length === 0 && groupedCompetitions.upcoming.length === 0 && groupedCompetitions.ended.length === 0) ? (
                <EmptyState searchTerm={searchTerm} filterStatus={filterStatus} />
              ) : (
                <div className="space-y-12">
                  {groupedCompetitions.active.length > 0 && (
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
                      onCardClick={handleCompetitionClick}
                      onButtonClick={handleButtonClick}
                      isFiltered={true}
                    />
                  )}

                  {groupedCompetitions.upcoming.length > 0 && (
                    <CompetitionSection
                      title="Trial Competitions"
                      competitions={groupedCompetitions.upcoming}
                      dotColor="bg-blue-400"
                      badgeColor="bg-blue-50 text-blue-700 border-blue-200"
                      viewMode={viewMode}
                      getCompetitionStatus={getCompetitionStatus}
                      formatDateTime={formatDateTime}
                      participantMap={participantMap}
                      completionMap={completionMap}
                      loadingMap={loadingMap}
                      onCardClick={handleCompetitionClick}
                      onButtonClick={handleButtonClick}
                      isFiltered={true}
                    />
                  )}

                  {groupedCompetitions.ended.length > 0 && (
                    <CompetitionSection
                      title="Past competition"
                      competitions={groupedCompetitions.ended}
                      dotColor="bg-gray-400"
                      badgeColor="bg-gray-50 text-gray-600 border-gray-200"
                      viewMode={viewMode}
                      getCompetitionStatus={getCompetitionStatus}
                      formatDateTime={formatDateTime}
                      participantMap={participantMap}
                      completionMap={completionMap}
                      loadingMap={loadingMap}
                      onCardClick={handleCompetitionClick}
                      onButtonClick={handleButtonClick}
                      isFiltered={true}
                    />
                  )}
                </div>
              )
            ) : (
              // filterStatus === 'all' (main page): render only non-empty grouped sections and no empty-state per section
              (groupedCompetitions.active.length === 0 && groupedCompetitions.upcoming.length === 0 && groupedCompetitions.ended.length === 0 && groupedCompetitions.featured.length === 0) ? (
                <EmptyState searchTerm={searchTerm} filterStatus={filterStatus} />
              ) : (
                <div className="space-y-12">
                  {groupedCompetitions.active.length > 0 && (
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
                      onCardClick={handleCompetitionClick}
                      onButtonClick={handleButtonClick}
                    />
                  )}

                  {groupedCompetitions.upcoming.length > 0 && (
                    <CompetitionSection
                      title="Trial Competitions"
                      competitions={groupedCompetitions.upcoming}
                      dotColor="bg-blue-400"
                      badgeColor="bg-blue-50 text-blue-700 border-blue-200"
                      viewMode={viewMode}
                      getCompetitionStatus={getCompetitionStatus}
                      formatDateTime={formatDateTime}
                      participantMap={participantMap}
                      completionMap={completionMap}
                      loadingMap={loadingMap}
                      onCardClick={handleCompetitionClick}
                      onButtonClick={handleButtonClick}
                    />
                  )}

                  {groupedCompetitions.ended.length > 0 && (
                    <CompetitionSection
                      title="Past competition"
                      competitions={groupedCompetitions.ended}
                      dotColor="bg-gray-400"
                      badgeColor="bg-gray-50 text-gray-600 border-gray-200"
                      viewMode={viewMode}
                      getCompetitionStatus={getCompetitionStatus}
                      formatDateTime={formatDateTime}
                      participantMap={participantMap}
                      completionMap={completionMap}
                      loadingMap={loadingMap}
                      onCardClick={handleCompetitionClick}
                      onButtonClick={handleButtonClick}
                    />
                  )}

                  {/* Daily Challenges Section - Show on main page after ended competitions */}
                  <DailyChallengesSection
                    challenges={dailyChallenges}
                    loading={loadingDailyChallenges}
                    onViewDetails={handleDailyChallengeView}
                    userRole={user?.role as "participant" | "admin" | "judge" | "superadmin"}
                  />
                </div>
              )
            )}
            </>
          )}
        </div>
      </div>
    </div>
  )

}