"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Scale,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Eye,
  EyeOff,
  Save,
  Star,
  TrendingUp,
  Award,
} from "lucide-react"
import {
  doc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { fetchWithAuth } from "@/lib/api";


interface Challenge {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  rubric: Array<{
    name: string
    description: string
    weight: number
  }>
}

interface Submission {
  id: string
  participantId: string
  challengeId: string
  promptText: string
  finalScore?: number
  llmScores?: {
    [modelName: string]: {
      finalScore: number
      description: string
      scores: { [criterionName: string]: number }
    }
  }
  judges?: {
    [judgeId: string]: {
      scores: { [criterionName: string]: number }
      totalScore: number
      updatedAt: any
    }
  }
}

interface JudgeAssignment {
  judgeId: string
  competitionId: string
  competitionTitle: string
  assignedCountTotal: number
  assignedCountsByChallenge: { [challengeId: string]: number }
  submissionsByChallenge: { [challengeId: string]: string[] }
  updatedAt: any
}

interface NotificationState {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
}

interface ScoreFormData {
  [criterionName: string]: number
}

export default function ChallengePage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const challengeId = params?.challengeId as string

  
  const [userUID, setUserID] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [assignment, setAssignment] = useState<JudgeAssignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [assignedSubmissionIds, setAssignedSubmissionIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMoreSubmissions, setHasMoreSubmissions] = useState(true)
  const [gradedSubmissions, setGradedSubmissions] = useState<Set<string>>(new Set())

  // UI state
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true)
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(true)
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)
  const [isSavingScore, setIsSavingScore] = useState(false)
  const [notifications, setNotifications] = useState<NotificationState[]>([])
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set())
  const [expandedModelInsights, setExpandedModelInsights] = useState<Set<string>>(new Set())
  const [isRubricExpanded, setIsRubricExpanded] = useState(false)
  const [showScoreSheet, setShowScoreSheet] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [scoreFormData, setScoreFormData] = useState<ScoreFormData>({})

  const SUBMISSIONS_PER_PAGE = 10

  // Notification system
  const showNotification = useCallback((type: NotificationState["type"], title: string, message: string) => {
    const id = Date.now().toString()
    const notification: NotificationState = { id, type, title, message }
    setNotifications((prev) => [...prev, notification])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 5000)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Auth effect
  useEffect(() => {
    checkAuth();
  }, [router])

  
  const checkAuth = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_JUDGE_AUTH}`);
      setUserID(profile.uid)
    }
    catch (error) 
    {
      router.push("/");
    } 
    finally 
    {
      setIsAuthenticated(true);
    }
  };

  // Fetch challenge details
  const fetchChallenge = useCallback(async () => {
    try {
      setIsLoadingChallenge(true)

      const challengeDocRef = doc(db, "competitions", competitionId, "challenges", challengeId)
      const challengeDoc = await getDoc(challengeDocRef)

      if (!challengeDoc.exists()) {
        showNotification("error", "Challenge Not Found", "The requested challenge does not exist")
        router.push(`/judge/${competitionId}`)
        return
      }

      const data = challengeDoc.data() as DocumentData
      setChallenge({
        id: challengeId,
        title: data.title || `Challenge ${challengeId}`,
        problemStatement: data.problemStatement || "",
        guidelines: data.guidelines || "",
        rubric: data.rubric || [],
      })
    } catch (error) {
      console.error("Error fetching challenge:", error)
      showNotification("error", "Loading Error", "Failed to load challenge details")
    } finally {
      setIsLoadingChallenge(false)
    }
  }, [competitionId, challengeId, showNotification, router])

  // Fetch judge assignment
  const fetchAssignment = useCallback(
    async (userId: string) => {
      try {
        setIsLoadingAssignment(true)

        const judgeDocRef = doc(db, "competitions", competitionId, "judges", userId)
        const judgeDoc = await getDoc(judgeDocRef)

        if (!judgeDoc.exists()) {
          showNotification("error", "Access Denied", "You are not assigned to this competition")
          router.push("/judge")
          return
        }

        const data = judgeDoc.data() as DocumentData
        const assignmentData: JudgeAssignment = {
          judgeId: data.judgeId,
          competitionId: data.competitionId,
          competitionTitle: data.competitionTitle || `Competition ${competitionId}`,
          assignedCountTotal: data.assignedCountTotal || 0,
          assignedCountsByChallenge: data.assignedCountsByChallenge || {},
          submissionsByChallenge: data.submissionsByChallenge || {},
          updatedAt: data.updatedAt,
        }

        setAssignment(assignmentData)

        // Get assigned submission IDs for this challenge
        const submissionIds = assignmentData.submissionsByChallenge[challengeId] || []
        setAssignedSubmissionIds(submissionIds)
        setHasMoreSubmissions(submissionIds.length > SUBMISSIONS_PER_PAGE)
      } catch (error) {
        console.error("Error fetching assignment:", error)
        showNotification("error", "Loading Error", "Failed to load assignment details")
      } finally {
        setIsLoadingAssignment(false)
      }
    },
    [competitionId, challengeId, showNotification, router],
  )

  // Fetch submissions batch
  const fetchSubmissionsBatch = useCallback(
    async (startIndex: number) => {
      if (assignedSubmissionIds.length === 0) return

      try {
        setIsLoadingSubmissions(true)

        const endIndex = Math.min(startIndex + SUBMISSIONS_PER_PAGE, assignedSubmissionIds.length)
        const batchIds = assignedSubmissionIds.slice(startIndex, endIndex)

        if (batchIds.length === 0) {
          setHasMoreSubmissions(false)
          return
        }

        // Batch read submissions by ID
        const submissionsQuery = query(
          collection(db, "competitions", competitionId, "submissions"),
          where("__name__", "in", batchIds),
        )

        const submissionsSnapshot = await getDocs(submissionsQuery)
        const submissionData: Submission[] = []
        const newGradedSubmissions = new Set(gradedSubmissions)

        submissionsSnapshot.docs.forEach((doc) => {
          const data = doc.data() as DocumentData
          const submission: Submission = {
            id: doc.id,
            participantId: data.participantId,
            challengeId: data.challengeId,
            promptText: data.promptText || "",
            finalScore: data.finalScore,
            llmScores: data.llmScores,
            judges: data.judges,
          }

          submissionData.push(submission)

          // Check if this submission is already graded by current judge
          if (userUID && submission.judges?.[userUID]) {
            newGradedSubmissions.add(submission.id)
          }
        })

        // Sort submissions to match the order of assigned IDs
        submissionData.sort((a, b) => {
          const aIndex = batchIds.indexOf(a.id)
          const bIndex = batchIds.indexOf(b.id)
          return aIndex - bIndex
        })

        setSubmissions((prev) => (startIndex === 0 ? submissionData : [...prev, ...submissionData]))
        setGradedSubmissions(newGradedSubmissions)
        setHasMoreSubmissions(endIndex < assignedSubmissionIds.length)
      } catch (error) {
        console.error("Error fetching submissions:", error)
        showNotification("error", "Loading Error", "Failed to load submissions")
      } finally {
        setIsLoadingSubmissions(false)
      }
    },
    [assignedSubmissionIds, competitionId, userUID, gradedSubmissions, showNotification],
  )

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated && userUID) {
      fetchChallenge()
      fetchAssignment(userUID)
    }
  }, [isAuthenticated, userUID, fetchChallenge, fetchAssignment])

  // Load first batch of submissions when assignment is loaded
  useEffect(() => {
    if (!userUID) return;
    if (assignedSubmissionIds.length > 0 && currentPage === 0) {
      fetchSubmissionsBatch(0)
    }
  }, [userUID, assignedSubmissionIds, currentPage, fetchSubmissionsBatch])

  // Load more submissions
  const loadMoreSubmissions = useCallback(() => {
    const nextPage = currentPage + 1
    const startIndex = nextPage * SUBMISSIONS_PER_PAGE
    setCurrentPage(nextPage)
    fetchSubmissionsBatch(startIndex)
  }, [currentPage, fetchSubmissionsBatch])

  // Calculate weighted total score
  const calculateWeightedTotal = useCallback((scores: ScoreFormData, rubric: Challenge["rubric"]) => {
    if (rubric.length === 0) return 0

    const totalWeight = rubric.reduce((sum, criterion) => sum + criterion.weight, 0)
    const weightedSum = rubric.reduce((sum, criterion) => {
      const score = scores[criterion.name] || 0
      const normalizedWeight = criterion.weight / totalWeight
      return sum + score * normalizedWeight
    }, 0)

    return Math.round(weightedSum * 100) / 100
  }, [])

  // Handle score form changes
  const handleScoreChange = useCallback((criterionName: string, value: number) => {
    setScoreFormData((prev) => ({
      ...prev,
      [criterionName]: Math.max(0, Math.min(100, value)),
    }))
  }, [])

  // Save submission score
  const saveSubmissionScore = useCallback(async () => {
    if (!selectedSubmission || !userUID || !challenge) return

    try {
      setIsSavingScore(true)

      const totalScore = calculateWeightedTotal(scoreFormData, challenge.rubric)

      const submissionRef = doc(db, "competitions", competitionId, "submissions", selectedSubmission.id)
      await updateDoc(submissionRef, {
        [`judges.${userUID}`]: {
          scores: scoreFormData,
          totalScore,
          updatedAt: serverTimestamp(),
        },
      })

      // Update local state
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === selectedSubmission.id
            ? {
                ...sub,
                judges: {
                  ...sub.judges,
                  [userUID]: {
                    scores: scoreFormData,
                    totalScore,
                    updatedAt: new Date(),
                  },
                },
              }
            : sub,
        ),
      )

      setGradedSubmissions((prev) => new Set([...prev, selectedSubmission.id]))
      setShowScoreSheet(false)
      setSelectedSubmission(null)
      setScoreFormData({})

      showNotification("success", "Score Saved", "Submission has been scored successfully")
    } catch (error) {
      console.error("Error saving score:", error)
      showNotification("error", "Save Failed", "Failed to save the score")
    } finally {
      setIsSavingScore(false)
    }
  }, [
    selectedSubmission,
    userUID,
    challenge,
    scoreFormData,
    calculateWeightedTotal,
    competitionId,
    showNotification,
  ])

  // Open scoring sheet
  const openScoringSheet = useCallback(
    (submission: Submission) => {
      setSelectedSubmission(submission)

      // Pre-populate form with existing scores if any
      if (userUID && submission.judges?.[userUID]) {
        setScoreFormData(submission.judges[userUID].scores)
      } else {
        setScoreFormData({})
      }

      setShowScoreSheet(true)
    },
    [userUID],
  )

  // Toggle functions
  const toggleSubmissionExpansion = useCallback((submissionId: string) => {
    setExpandedSubmissions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId)
      } else {
        newSet.add(submissionId)
      }
      return newSet
    })
  }, [])

  const toggleModelInsights = useCallback((submissionId: string) => {
    setExpandedModelInsights((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId)
      } else {
        newSet.add(submissionId)
      }
      return newSet
    })
  }, [])

  // Memoized calculations
  const progressStats = useMemo(() => {
    const totalAssigned = assignedSubmissionIds.length
    const graded = gradedSubmissions.size
    const remaining = totalAssigned - graded
    const percentage = totalAssigned > 0 ? Math.round((graded / totalAssigned) * 100) : 0

    return { totalAssigned, graded, remaining, percentage }
  }, [assignedSubmissionIds.length, gradedSubmissions.size])

  // Avatar color generator
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-lime-500",
      "bg-green-500",
      "bg-emerald-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-sky-500",
      "bg-blue-500",
      "bg-indigo-500",
      "bg-violet-500",
      "bg-purple-500",
      "bg-fuchsia-500",
      "bg-pink-500",
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // Render notification
  const renderNotification = (notification: NotificationState) => {
    const icons = {
      success: CheckCircle2,
      error: AlertCircle,
      warning: AlertCircle,
      info: AlertCircle,
    }
    const colors = {
      success: "bg-emerald-50 border-emerald-200 text-emerald-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-amber-50 border-amber-200 text-amber-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
    }
    const Icon = icons[notification.type]

    return (
      <div
        key={notification.id}
        className={`flex items-start gap-3 p-4 rounded-lg border ${colors[notification.type]} shadow-lg backdrop-blur-sm`}
        role="alert"
      >
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{notification.title}</h4>
          <p className="text-sm opacity-90 mt-1">{notification.message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeNotification(notification.id)}
          className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  // Loading skeletons
  const SubmissionCardSkeleton = () => (
    <Card>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="flex gap-2 mt-4">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Early return for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <Loader className="animate-spin w-8 h-8 text-gray-900" />
          </div>
          <p className="text-gray-900 font-medium mt-4">Authenticating...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">{notifications.map(renderNotification)}</div>
      )}

      <div className="container mx-auto p-6 space-y-8">
        {/* Challenge Header */}
        {isLoadingChallenge ? (
          <Card>
            <CardHeader>
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            </CardHeader>
          </Card>
        ) : (
          challenge && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-2xl text-gray-900">{challenge.title}</CardTitle>
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <p>{challenge.problemStatement}</p>
                    </div>
                    {challenge.guidelines && (
                      <div className="text-sm text-gray-600">
                        <strong>Guidelines:</strong> {challenge.guidelines}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Badge variant="outline" className="gap-1">
                      <FileText className="w-3 h-3" />
                      {progressStats.totalAssigned} submissions
                    </Badge>
                    <Badge
                      variant={progressStats.graded === progressStats.totalAssigned ? "default" : "secondary"}
                      className="gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {progressStats.graded} graded
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {/* Rubric Section */}
              {challenge.rubric.length > 0 && (
                <CardContent className="pt-0">
                  <Collapsible open={isRubricExpanded} onOpenChange={setIsRubricExpanded}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between bg-transparent">
                        <span className="flex items-center gap-2">
                          <Scale className="w-4 h-4" />
                          Scoring Rubric ({challenge.rubric.length} criteria)
                        </span>
                        {isRubricExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="grid gap-4">
                        {challenge.rubric.map((criterion, index) => (
                          <div key={index} className="p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <h4 className="font-semibold text-gray-900">{criterion.name}</h4>
                                <p className="text-sm text-gray-600">{criterion.description}</p>
                              </div>
                              <Badge variant="outline" className="ml-3">
                                Weight: {criterion.weight}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              )}
            </Card>
          )
        )}

        {/* Submissions List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Submissions to Score</h2>
              <p className="text-gray-600">
                {progressStats.graded} of {progressStats.totalAssigned} submissions graded ({progressStats.percentage}%)
              </p>
            </div>
            {progressStats.totalAssigned > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${progressStats.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">{progressStats.percentage}%</span>
              </div>
            )}
          </div>

          {isLoadingAssignment ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <SubmissionCardSkeleton key={i} />
              ))}
            </div>
          ) : submissions.length === 0 && !isLoadingSubmissions ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Assigned</h3>
                <p className="text-gray-600">You haven't been assigned any submissions for this challenge yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => {
                const isExpanded = expandedSubmissions.has(submission.id)
                const showModelInsights = expandedModelInsights.has(submission.id)
                const isGraded = gradedSubmissions.has(submission.id)
                const judgeScore = userUID && submission.judges?.[userUID]

                return (
                  <Card key={submission.id} className={`${isGraded ? "border-green-200 bg-green-50/30" : ""}`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback
                              className={`${getAvatarColor(submission.participantId)} text-white font-semibold`}
                            >
                              {submission.participantId.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-gray-900">Participant {submission.participantId}</h3>
                            <p className="text-sm text-gray-600">Submission ID: {submission.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isGraded && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Scored: {judgeScore?.totalScore?.toFixed(1) || "N/A"}
                            </Badge>
                          )}
                          {submission.finalScore !== undefined && (
                            <Badge variant="outline" className="gap-1">
                              <Star className="w-3 h-3" />
                              Final: {submission.finalScore.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Prompt Text */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium text-gray-900">Submission Text</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSubmissionExpansion(submission.id)}
                              className="text-xs"
                            >
                              {isExpanded ? (
                                <>
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  Collapse
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Expand
                                </>
                              )}
                            </Button>
                          </div>
                          <div
                            className={`text-sm text-gray-700 ${isExpanded ? "" : "line-clamp-3"} bg-gray-50 p-3 rounded border`}
                          >
                            {submission.promptText || "No submission text available"}
                          </div>
                        </div>

                        {/* Model Insights */}
                        {submission.llmScores && Object.keys(submission.llmScores).length > 0 && (
                          <div>
                            <Collapsible
                              open={showModelInsights}
                              onOpenChange={() => toggleModelInsights(submission.id)}
                            >
                              <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full justify-between bg-transparent">
                                  <span className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Model Insights ({Object.keys(submission.llmScores).length} models)
                                  </span>
                                  {showModelInsights ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-3">
                                <div className="space-y-3">
                                  {Object.entries(submission.llmScores).map(([modelName, modelScore]) => (
                                    <div key={modelName} className="p-3 border rounded bg-blue-50">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-gray-900">{modelName}</h4>
                                        <Badge variant="outline">Score: {modelScore.finalScore.toFixed(1)}</Badge>
                                      </div>
                                      {modelScore.description && (
                                        <p className="text-sm text-gray-600 mb-2">{modelScore.description}</p>
                                      )}
                                      {modelScore.scores && (
                                        <div className="grid grid-cols-2 gap-2">
                                          {Object.entries(modelScore.scores).map(([criterion, score]) => (
                                            <div key={criterion} className="text-xs">
                                              <span className="font-medium">{criterion}:</span> {score}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => openScoringSheet(submission)}
                            size="sm"
                            className={isGraded ? "bg-green-600 hover:bg-green-700" : "bg-gray-900 hover:bg-gray-800"}
                          >
                            <Award className="w-4 h-4 mr-1" />
                            {isGraded ? "Update Score" : "Score Submission"}
                          </Button>
                          {judgeScore && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>
                                Last scored:{" "}
                                {new Date(judgeScore.updatedAt?.seconds * 1000 || Date.now()).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Loading more submissions */}
              {isLoadingSubmissions && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }, (_, i) => (
                    <SubmissionCardSkeleton key={`loading-${i}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      {progressStats.totalAssigned > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="font-medium text-gray-900">Progress:</span>
                <span className="ml-2">
                  {progressStats.graded} / {progressStats.totalAssigned} graded
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${progressStats.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">{progressStats.percentage}%</span>
              </div>
            </div>

            {hasMoreSubmissions && (
              <Button
                onClick={loadMoreSubmissions}
                disabled={isLoadingSubmissions}
                variant="outline"
                className="bg-transparent"
              >
                {isLoadingSubmissions ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Scoring Sheet */}
      <Sheet open={showScoreSheet} onOpenChange={setShowScoreSheet}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto max-h-screen">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Score Submission
            </SheetTitle>
            <SheetDescription>
              {selectedSubmission && `Scoring submission from Participant ${selectedSubmission.participantId}`}
            </SheetDescription>
          </SheetHeader>

          {selectedSubmission && challenge && (
            <div className="mt-6 space-y-6">
              {/* Submission Preview */}
              <div>
                <Label className="text-sm font-medium text-gray-900">Submission Text</Label>
                <Textarea value={selectedSubmission.promptText} readOnly className="mt-2 min-h-[100px] bg-gray-50" />
              </div>

              {/* Scoring Form */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-900">Scoring Criteria</Label>
                {challenge.rubric.map((criterion, index) => {
                  const currentScore = scoreFormData[criterion.name] || 0
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">{criterion.name}</Label>
                        <Badge variant="outline" className="text-xs">
                          Weight: {criterion.weight}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{criterion.description}</p>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={currentScore}
                          onChange={(e) => handleScoreChange(criterion.name, Number(e.target.value))}
                          className="w-20"
                          placeholder="0-100"
                        />
                        <div className="flex-1">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={currentScore}
                            onChange={(e) => handleScoreChange(criterion.name, Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-8">{currentScore}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Weighted Total */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Weighted Total Score:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {calculateWeightedTotal(scoreFormData, challenge.rubric).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Calculated using normalized weights from the rubric</p>
              </div>

              {/* Save Button */}
              <Button
                onClick={saveSubmissionScore}
                disabled={isSavingScore || challenge.rubric.length === 0}
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                {isSavingScore ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Saving Score...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Score
                  </>
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
