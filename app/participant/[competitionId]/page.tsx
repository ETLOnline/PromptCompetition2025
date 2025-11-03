"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  Trophy,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  Grid3X3,
  List,
  Edit,
  Eye,
} from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useSubmissionStore } from "@/lib/store"
import { Countdown } from "@/components/countdown"
import { fetchWithAuth } from "@/lib/api"
import ParticipantBreadcrumb from "@/components/participant-breadcrumb"
import { ParticipantCacheContext } from "@/lib/participant-cache-context"
import { CompetitionCacheContext } from "@/lib/competition-cache-context"
import { ViewChallengeDetailsModal } from "@/components/view-challenge-details-modal"

// Skeleton components remain the same
const DashboardCardSkeleton = () => (
  <Card className="bg-white border border-gray-100 rounded-xl shadow-sm animate-pulse">
    <CardHeader className="bg-gray-100 rounded-t-xl h-16 flex items-center justify-between px-6 py-4">
      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
    </CardHeader>
    <CardContent className="pt-6 pb-4">
      <div className="h-8 w-1/2 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
    </CardContent>
  </Card>
)

const ChallengeCardSkeleton = () => (
  <Card className="bg-white border border-gray-100 rounded-xl shadow-sm animate-pulse">
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-16 bg-gray-200 rounded mb-4"></div>
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="h-11 w-full bg-gray-200 rounded-lg"></div>
      </div>
    </CardContent>
  </Card>
)

interface UserProfile {
  uid: string;
  email: string;
  role: string;
  displayName?: string | null;
  photoURL?: string | null;
}

export default function DashboardPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const routeParams = useParams<{ competitionId: string }>()
  const id = routeParams.competitionId

  const { checkParticipantAndGetData } = useContext(ParticipantCacheContext)
  const { getCompetitionMetadata } = useContext(CompetitionCacheContext)

  const [submissions, setSubmissions] = useState<number | null>(null)
  const [challengeCount, setChallengeCount] = useState<number | null>(null)
  const [currentCompetitionId, setCurrentCompetitionId] = useState<string | null>(null)
  const [startDeadlineReached, setStartDeadlineReached] = useState<boolean>(false)
  const [endDeadlinePassed, setEndDeadlinePassed] = useState<boolean>(false)
  const [competitionStartDeadline, setCompetitionStartDeadline] = useState<Date | null>(null)
  const [competitionName, setCompetitionName] = useState("")
  
  const [loadingCompetitionMetadata, setLoadingCompetitionMetadata] = useState(true)
  const [loadingChallengesList, setLoadingChallengesList] = useState(true)
  const [loadingUserSubmissions, setLoadingUserSubmissions] = useState(true)
  
  const [challenges, setChallenges] = useState<any[]>([])
  const [userSubmissions, setUserSubmissions] = useState<Record<string, boolean>>({})

  const [searchTerm, setSearchTerm] = useState("")
  const [filterSubmissionStatus, setFilterSubmissionStatus] = useState<"all" | "submitted" | "not-submitted">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const setStoreValues = useSubmissionStore((state) => state.setValues)

  const [user, setUser] = useState<UserProfile | null>(null)
  
  // Modal state
  const [selectedChallengeForView, setSelectedChallengeForView] = useState<any | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      const profile = await checkAuth()
      if (!profile) return

      await checkParticipantAndLoadData(profile)
    }

    init()
  }, [router, id])

  const checkAuth = async (): Promise<UserProfile | null> => {
    try {
      const profile = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_USER_AUTH}`
      )
      setUser(profile)

      if (!profile || ["admin", "judge", "superadmin"].includes(profile.role)) {
        router.push("/")
        return null
      }

      return profile
    } catch (error) {
      router.push("/")
      return null
    }
  }

  const checkParticipantAndLoadData = async (profile: UserProfile) => {
    try {
      const participantData = await checkParticipantAndGetData(id, profile.uid)

      if (!participantData.exists) {
        router.push("/participant")
        return
      }

      setCurrentCompetitionId(id)
      setSubmissions(participantData.submissions || 0)
      
      const submissionMap: Record<string, boolean> = {}
      if (participantData.completedChallenges) {
        participantData.completedChallenges.forEach(challengeId => {
          submissionMap[challengeId] = true
        })
      }
      setUserSubmissions(submissionMap)
      setLoadingUserSubmissions(false)

      await Promise.all([
        loadCompetitionMetadata(),
        fetchChallenges()
      ])
    } catch (err) {
      console.error("Error checking participant and loading data:", err)
      router.push("/participant")
    }
  }

  const loadCompetitionMetadata = async () => {
    try {
      setLoadingCompetitionMetadata(true)
      
      const metadata = await getCompetitionMetadata(id)
      
      if (!metadata) {
        setChallengeCount(null)
        return
      }

      setCompetitionName(metadata.title)
      setCompetitionStartDeadline(metadata.startDeadline)
      setChallengeCount(metadata.ChallengeCount ?? null)

      const now = new Date()
      const extendedEnd = new Date(metadata.endDeadline.getTime() + 60 * 1000)
      setStartDeadlineReached(now >= metadata.startDeadline)
      setEndDeadlinePassed(now > extendedEnd)
      
    } catch (error) {
      console.error("Error fetching competition metadata:", error)
      setChallengeCount(null)
    } finally {
      setLoadingCompetitionMetadata(false)
    }
  }

  const fetchChallenges = async () => {
    try {
      setLoadingChallengesList(true)
      const challengesRef = collection(db, "competitions", id, "challenges")
      const challengesSnapshot = await getDocs(challengesRef)
      
      if (!challengesSnapshot.empty) {
        const challengeList = challengesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setChallenges(challengeList)
      } else {
        setChallenges([])
      }
    } catch (error) {
      console.error("Error fetching challenges:", error)
      setChallenges([])
    } finally {
      setLoadingChallengesList(false)
    }
  }

  const filteredChallenges = challenges.filter((challenge) => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false

    const isSubmitted = userSubmissions[challenge.id]
    if (filterSubmissionStatus === "all") return true
    if (filterSubmissionStatus === "submitted") return isSubmitted
    if (filterSubmissionStatus === "not-submitted") return !isSubmitted
    return true
  })

  const handleViewChallenge = (challenge: any) => {
    setSelectedChallengeForView(challenge)
    setIsViewModalOpen(true)
  }

  if (!user || loadingCompetitionMetadata || loadingUserSubmissions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <main className="max-w-7xl mx-auto py-12 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <DashboardCardSkeleton />
            <DashboardCardSkeleton />
            <DashboardCardSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <ChallengeCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <ParticipantBreadcrumb />
      
      <main className="max-w-7xl mx-auto py-6 px-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Trophy className="h-7 w-7 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{competitionName}</h1>
              <p className="text-gray-500 mt-1">Participant Dashboard</p>
            </div>
          </div>
        </div>
        
        {startDeadlineReached && !endDeadlinePassed && currentCompetitionId ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-base font-semibold text-gray-700">Available Challenges</CardTitle>
                  <Trophy className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-gray-650 mb-1">
                  {challengeCount !== null ? challengeCount : "—"}
                </div>
                <p className="text-sm text-gray-500">In current competition</p>
              </Card>
              <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-base font-semibold text-gray-700">My Submissions</CardTitle>
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-650 mb-1">{submissions !== null ? submissions : "—"}</div>
                <p className="text-sm text-gray-500">Total submissions made</p>
              </Card>
              <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-base font-semibold text-gray-700">Total Score</CardTitle>
                  <Trophy className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-gray-650 mb-1">Pending</div>
                <p className="text-sm text-gray-500">Across all submissions</p>
              </Card>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Challenges List</h2>
                  <p className="text-gray-600 text-sm">Browse and start challenges for this competition</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search challenges..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <Select value={filterSubmissionStatus} onValueChange={(value: any) => setFilterSubmissionStatus(value)}>
                  <SelectTrigger className="w-40 border-gray-200">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Challenges</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="not-submitted">Not Submitted</SelectItem>
                  </SelectContent>
                </Select>
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
            
            <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
              {loadingChallengesList ? (
                <div className={viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-4"}>
                  {[...Array(4)].map((_, i) => (
                    <ChallengeCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredChallenges.length === 0 ? (
                <Card className="border-0 shadow-none bg-transparent">
                  <CardContent className="p-0 text-center">
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
                          {searchTerm || filterSubmissionStatus !== "all"
                            ? "No challenges match your criteria"
                            : "No challenges available yet"}
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                          {searchTerm || filterSubmissionStatus !== "all"
                            ? "Try adjusting your search terms or filters to find what you're looking for."
                            : "There are currently no challenges available for this competition."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div
                  className={
                    viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-4"
                  }
                >
                  {filteredChallenges.map((challenge) => {
                    const isSubmitted = userSubmissions[challenge.id]
                    return (
                      <Card
                        key={challenge.id}
                        className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 border border-gray-100"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isSubmitted ? "bg-emerald-500" : "bg-gray-900"
                                }`}
                              >
                                {isSubmitted ? (
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                ) : (
                                  <Trophy className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div>
                                <h2 className="text-xl font-bold text-gray-900">{challenge.title}</h2>
                                {challenge.difficulty && (
                                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                    {challenge.difficulty}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {loadingUserSubmissions ? (
                              <Badge className="bg-gray-50 text-gray-500 border-gray-200 font-medium uppercase flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                LOADING
                              </Badge>
                            ) : isSubmitted ? (
                              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 font-medium uppercase flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3" />
                                SUBMITTED
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-50 text-blue-800 border-blue-200 font-medium uppercase">
                                ACTIVE
                              </Badge>
                            )}
                          </div>
                          {challenge.description && (
                            <p className="text-gray-700 text-base mb-4 leading-relaxed">{challenge.description}</p>
                          )}
                          <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
                            {challenge.points && (
                              <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">{challenge.points} points</span>
                              </div>
                            )}
                            {challenge.timeLimit && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">{challenge.timeLimit} min limit</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row justify-center gap-2 mt-4">
                            {loadingUserSubmissions ? (
                              <Button
                                disabled
                                className="w-full bg-gray-200 text-gray-500 cursor-not-allowed flex items-center gap-2"
                              >
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                Loading...
                              </Button>
                            ) : isSubmitted ? (
                              <div className="flex gap-2 w-full">
                                <Button
                                  onClick={() =>
                                    router.push(
                                      `/participant/${currentCompetitionId}/${challenge.id}`,
                                    )
                                  }
                                  className="flex-1 bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleViewChallenge(challenge)}
                                  className="flex-1 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() =>
                                  router.push(
                                    `/participant/${currentCompetitionId}/${challenge.id}`,
                                  )
                                }
                                className="w-full bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                              >
                                Start Challenge
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        ) : !startDeadlineReached ? (
          <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-12 text-center">
              <div className="space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <Clock className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="space-y-4 text-center">
                  <h3 className="text-2xl font-semibold text-gray-900">Competition Not Started</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Challenges will be available when the countdown ends. Get ready!
                  </p>
                  {competitionStartDeadline && (
                    <div className="mt-6">
                      <Countdown
                        targetDate={competitionStartDeadline}
                        onExpire={() => {
                          setStartDeadlineReached(true)
                          loadCompetitionMetadata()
                          fetchChallenges()
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                  <h3 className="text-xl font-semibold text-gray-900">Competition Ended</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    The competition has ended and challenges are no longer available for submission.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* View Challenge Details Modal */}
      <ViewChallengeDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedChallengeForView(null)
        }}
        challenge={selectedChallengeForView}
        competitionId={currentCompetitionId || ""}
        participantId={user?.uid || ""}
      />
    </div>
  )
}