"use client"

import { useEffect, useMemo, useCallback, useReducer } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Shuffle,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader,
  Users,
  Target,
  Award,
  Scale,
  Minus,
  Plus,
  AlertTriangle,
  Grid3X3,
  List,
  RotateCcw,
  Save,
  TrendingUp,
  Layers,
  Settings,
} from "lucide-react"
import {
  writeBatch,
  doc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  setDoc,
  where,
  type Timestamp,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getAuth, onAuthStateChanged, type User } from "firebase/auth"
import { getIdTokenResult } from "firebase/auth"
import { getIdToken } from "@/lib/firebaseAuth"

interface Judge {
  id: string
  name: string
  email: string
  totalAssigned?: number
  status?: "available" | "busy" | "offline"
}

interface Challenge {
  id: string
  name: string
  bucketSize: number
  submissionIds: string[]
}

interface AssignmentMatrix {
  [challengeId: string]: {
    [judgeId: string]: number
  }
}

interface ChallengeBuckets {
  [challengeId: string]: string[]
}

interface DistributionSnapshot {
  matrix: AssignmentMatrix
  topN: number
  strategy: "auto" | "equal" | "manual"
  mode: "overwrite" | "append"
  timestamp: Timestamp
}

type DistributionMode = "overwrite" | "append"
type ViewMode = "cards" | "matrix"

interface NotificationState {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
}

interface AppState {
  // Data state
  totalParticipants: number
  judges: Judge[]
  challenges: Challenge[]
  challengeBuckets: ChallengeBuckets
  assignmentMatrix: AssignmentMatrix
  selectedTopN: number
  savedConfig: { selectedTopN: number; timestamp: Timestamp } | null

  // UI state
  challengeSearch: string
  viewMode: ViewMode
  distributionMode: DistributionMode
  showOnlyRemaining: boolean
  selectedChallengeId: string | null
  notifications: NotificationState[]

  // Loading states
  isLoadingParticipants: boolean
  isLoadingJudges: boolean
  isLoadingChallenges: boolean
  isLoadingSubmissions: boolean
  isLoadingConfig: boolean
  isDistributing: boolean
  isSavingConfig: boolean

  // Dialog states
  showConfigDialog: boolean
  showDistributeDialog: boolean
  showConfirmDialog: boolean
  showChallengeDrawer: boolean

  // Auth state
  currentUser: User | null
  isAuthenticated: boolean
}

type AppAction =
  | { type: "SET_AUTH"; payload: { user: User | null; isAuthenticated: boolean } }
  | { type: "SET_PARTICIPANTS"; payload: number }
  | { type: "SET_JUDGES"; payload: Judge[] }
  | { type: "SET_CHALLENGES"; payload: Challenge[] }
  | { type: "SET_CHALLENGE_BUCKETS"; payload: ChallengeBuckets }
  | { type: "SET_ASSIGNMENT_MATRIX"; payload: AssignmentMatrix }
  | { type: "SET_SELECTED_TOP_N"; payload: number }
  | { type: "SET_SAVED_CONFIG"; payload: { selectedTopN: number; timestamp: Timestamp } | null }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_JUDGE_SEARCH"; payload: string }
  | { type: "SET_CHALLENGE_SEARCH"; payload: string }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }
  | { type: "SET_DISTRIBUTION_MODE"; payload: DistributionMode }
  | { type: "SET_SHOW_ONLY_REMAINING"; payload: boolean }
  | { type: "SET_SELECTED_CHALLENGE"; payload: string | null }
  | { type: "ADD_NOTIFICATION"; payload: NotificationState }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "SET_LOADING"; payload: { key: keyof AppState; value: boolean } }
  | { type: "SET_DIALOG"; payload: { dialog: "config" | "distribute" | "confirm" | "challengeDrawer"; open: boolean } }
  | { type: "UPDATE_MATRIX_CELL"; payload: { challengeId: string; judgeId: string; value: number } }
  | { type: "CLEAR_CHALLENGE_ASSIGNMENTS"; payload: string }
  | { type: "APPLY_EQUAL_DISTRIBUTION"; payload: string }
  | { type: "APPLY_AUTO_DISTRIBUTION"; payload: string }

const initialState: AppState = {
  totalParticipants: 0,
  judges: [],
  challenges: [],
  challengeBuckets: {},
  assignmentMatrix: {},
  selectedTopN: 0,
  savedConfig: null,
  challengeSearch: "",
  viewMode: "cards",
  distributionMode: "overwrite",
  showOnlyRemaining: false,
  selectedChallengeId: null,
  notifications: [],
  isLoadingParticipants: false,
  isLoadingJudges: false,
  isLoadingChallenges: false,
  isLoadingSubmissions: false,
  isLoadingConfig: false,
  isDistributing: false,
  isSavingConfig: false,
  showConfigDialog: false,
  showDistributeDialog: false,
  showConfirmDialog: false,
  showChallengeDrawer: false,
  currentUser: null,
  isAuthenticated: false,
}

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, currentUser: action.payload.user, isAuthenticated: action.payload.isAuthenticated }
    case "SET_PARTICIPANTS":
      return { ...state, totalParticipants: action.payload, isLoadingParticipants: false }
    case "SET_JUDGES":
      return { ...state, judges: action.payload, isLoadingJudges: false }
    case "SET_CHALLENGES":
      return { ...state, challenges: action.payload, isLoadingChallenges: false }
    case "SET_CHALLENGE_BUCKETS":
      return { ...state, challengeBuckets: action.payload, isLoadingSubmissions: false }
    case "SET_ASSIGNMENT_MATRIX":
      return { ...state, assignmentMatrix: action.payload }
    case "SET_SELECTED_TOP_N":
      return { ...state, selectedTopN: action.payload }
    case "SET_SAVED_CONFIG":
      return { ...state, savedConfig: action.payload, isLoadingConfig: false }
    case "SET_CHALLENGE_SEARCH":
      return { ...state, challengeSearch: action.payload }
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload }
    case "SET_DISTRIBUTION_MODE":
      return { ...state, distributionMode: action.payload }
    case "SET_SHOW_ONLY_REMAINING":
      return { ...state, showOnlyRemaining: action.payload }
    case "SET_SELECTED_CHALLENGE":
      return { ...state, selectedChallengeId: action.payload }
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [...state.notifications, action.payload] }
    case "REMOVE_NOTIFICATION":
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.payload) }
    case "SET_LOADING":
      return { ...state, [action.payload.key]: action.payload.value }
    case "SET_DIALOG":
      const dialogKey =
        action.payload.dialog === "challengeDrawer"
          ? "showChallengeDrawer"
          : (`show${action.payload.dialog.charAt(0).toUpperCase() + action.payload.dialog.slice(1)}Dialog` as keyof AppState)
      return { ...state, [dialogKey]: action.payload.open }
    case "UPDATE_MATRIX_CELL":
      return {
        ...state,
        assignmentMatrix: {
          ...state.assignmentMatrix,
          [action.payload.challengeId]: {
            ...state.assignmentMatrix[action.payload.challengeId],
            [action.payload.judgeId]: action.payload.value,
          },
        },
      }
    case "CLEAR_CHALLENGE_ASSIGNMENTS":
      return {
        ...state,
        assignmentMatrix: {
          ...state.assignmentMatrix,
          [action.payload]: {},
        },
      }
    case "APPLY_EQUAL_DISTRIBUTION": {
      const challengeId = action.payload
      const bucketSize = state.challengeBuckets[challengeId]?.length || 0
      const judgeCount = state.judges.length
      if (judgeCount === 0 || bucketSize === 0) return state

      const perJudge = Math.floor(bucketSize / judgeCount)
      const remainder = bucketSize % judgeCount
      const newAssignments: { [judgeId: string]: number } = {}

      state.judges.forEach((judge, index) => {
        newAssignments[judge.id] = perJudge + (index < remainder ? 1 : 0)
      })

      return {
        ...state,
        assignmentMatrix: {
          ...state.assignmentMatrix,
          [challengeId]: newAssignments,
        },
      }
    }
    case "APPLY_AUTO_DISTRIBUTION": {
      const challengeId = action.payload
      const bucketSize = state.challengeBuckets[challengeId]?.length || 0
      if (bucketSize === 0) return state

      // Auto strategy: prefer same-challenge assignment
      // Find judges with least total load and assign entire challenge if possible
      const judgeLoads = state.judges
        .map((judge) => ({
          id: judge.id,
          totalLoad: Object.values(state.assignmentMatrix).reduce(
            (sum, challengeAssignments) => sum + (challengeAssignments[judge.id] || 0),
            0,
          ),
          challengeCount: Object.keys(state.assignmentMatrix).filter(
            (cId) => state.assignmentMatrix[cId]?.[judge.id] > 0,
          ).length,
        }))
        .sort((a, b) => a.totalLoad - b.totalLoad || a.challengeCount - b.challengeCount)

      const newAssignments: { [judgeId: string]: number } = {}

      // Try to assign to single judge first
      if (judgeLoads.length > 0) {
        const leastLoadedJudge = judgeLoads[0]
        if (leastLoadedJudge.totalLoad + bucketSize <= Math.ceil(state.selectedTopN / state.judges.length) * 1.5) {
          newAssignments[leastLoadedJudge.id] = bucketSize
        } else {
          // Split among 2-3 least loaded judges
          const targetJudges = judgeLoads.slice(0, Math.min(3, judgeLoads.length))
          const perJudge = Math.floor(bucketSize / targetJudges.length)
          const remainder = bucketSize % targetJudges.length

          targetJudges.forEach((judge, index) => {
            newAssignments[judge.id] = perJudge + (index < remainder ? 1 : 0)
          })
        }
      }

      return {
        ...state,
        assignmentMatrix: {
          ...state.assignmentMatrix,
          [challengeId]: newAssignments,
        },
      }
    }
    default:
      return state
  }
}

// Avatar color generator - memoized
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
    "bg-rose-500",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Skeleton components
const StatCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    </CardContent>
  </Card>
)

const ChallengeCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </CardContent>
  </Card>
)

export default function ParticipantDistributionTable() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string

  const auth = useMemo(() => getAuth(), [])
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Memoized calculations
  const filteredChallenges = useMemo(() => {
    let filtered = state.challenges.filter(
      (challenge) =>
        challenge.name.toLowerCase().includes(state.challengeSearch.toLowerCase()) ||
        challenge.id.toLowerCase().includes(state.challengeSearch.toLowerCase()),
    )

    if (state.showOnlyRemaining) {
      filtered = filtered.filter((challenge) => {
        const assigned = Object.values(state.assignmentMatrix[challenge.id] || {}).reduce(
          (sum, count) => sum + count,
          0,
        )
        return challenge.bucketSize > assigned
      })
    }

    return filtered
  }, [state.challenges, state.challengeSearch, state.showOnlyRemaining, state.assignmentMatrix])

  const globalSummary = useMemo(() => {
    const judgeToTotals: { [judgeId: string]: number } = {}
    let totalAssigned = 0
    let totalRemaining = 0
    let hasOverflow = false

    state.judges.forEach((judge) => {
      judgeToTotals[judge.id] = 0
    })

    state.challenges.forEach((challenge) => {
      const challengeAssignments = state.assignmentMatrix[challenge.id] || {}
      const challengeAssigned = Object.values(challengeAssignments).reduce((sum, count) => sum + count, 0)
      const challengeRemaining = challenge.bucketSize - challengeAssigned

      totalAssigned += challengeAssigned
      totalRemaining += Math.max(0, challengeRemaining)

      if (challengeAssigned > challenge.bucketSize) {
        hasOverflow = true
      }

      Object.entries(challengeAssignments).forEach(([judgeId, count]) => {
        judgeToTotals[judgeId] += count
      })
    })

    return {
      judgeToTotals,
      totalAssigned,
      totalRemaining,
      hasOverflow,
      totalAvailable: state.challenges.reduce((sum, c) => sum + c.bucketSize, 0),
    }
  }, [state.challenges, state.assignmentMatrix, state.judges])

  const topNValidation = useMemo(() => {
    const max = state.totalParticipants
    const n = state.selectedTopN
    if (!n || Number.isNaN(n)) return { ok: false, msg: "Enter a number greater than 0." }
    if (n < 1) return { ok: false, msg: "Minimum is 1 participant." }
    if (n > max) return { ok: false, msg: `Cannot exceed ${max} participant${max === 1 ? "" : "s"}.` }
    return { ok: true, msg: `You can pick up to ${max}.` }
  }, [state.selectedTopN, state.totalParticipants])

  // Notification system
  const showNotification = useCallback((type: NotificationState["type"], title: string, message: string) => {
    const id = Date.now().toString()
    const notification: NotificationState = { id, type, title, message }
    dispatch({ type: "ADD_NOTIFICATION", payload: notification })
    setTimeout(() => {
      dispatch({ type: "REMOVE_NOTIFICATION", payload: id })
    }, 5000)
  }, [])

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id })
  }, [])

  // Data fetching functions
  const fetchParticipantsCount = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: { key: "isLoadingParticipants", value: true } })
      const leaderboardSnapshot = await getDocs(collection(db, "competitions", competitionId, "leaderboard"))
      dispatch({ type: "SET_PARTICIPANTS", payload: leaderboardSnapshot.size })
    } catch (error) {
      console.error("Error fetching participants:", error)
      dispatch({ type: "SET_LOADING", payload: { key: "isLoadingParticipants", value: false } })
    }
  }, [competitionId])

  const fetchJudges = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: { key: "isLoadingJudges", value: true } })
      const token = await getIdToken()
      const url = `${process.env.NEXT_PUBLIC_API_URL}/superadmin/users?role=judge`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(`Failed to fetch judges: ${res.status}`)
      }
      const data = await res.json()
      const judgeUsers = data.users || []
      if (!Array.isArray(judgeUsers)) {
        showNotification("error", "Invalid Data", "Invalid judge data received")
        return
      }
      const judgesData: Judge[] = judgeUsers.map((user: any) => ({
        id: user.uid,
        name: user.displayName || user.email.split("@")[0] || "Unknown Judge",
        email: user.email,
        totalAssigned: 0,
        status: "available",
      }))
      dispatch({ type: "SET_JUDGES", payload: judgesData })
      return judgesData
    } catch (error) {
      console.error("Error fetching judges:", error)
      showNotification("error", "Data Loading Error", "Failed to load judges from database")
      dispatch({ type: "SET_LOADING", payload: { key: "isLoadingJudges", value: false } })
      return []
    }
  }, [competitionId, showNotification])

  const fetchChallengesAndSubmissions = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: { key: "isLoadingChallenges", value: true } })
      dispatch({ type: "SET_LOADING", payload: { key: "isLoadingSubmissions", value: true } })

      // First get top N participants
      if (state.selectedTopN === 0) {
        dispatch({ type: "SET_CHALLENGES", payload: [] })
        dispatch({ type: "SET_CHALLENGE_BUCKETS", payload: {} })
        return
      }

      const leaderboardQuery = query(
        collection(db, "competitions", competitionId, "leaderboard"),
        orderBy("totalScore", "desc"),
        limit(state.selectedTopN),
      )
      const leaderboardSnapshot = await getDocs(leaderboardQuery)
      const topParticipantIds = leaderboardSnapshot.docs.map((doc) => doc.id)

      if (topParticipantIds.length === 0) {
        dispatch({ type: "SET_CHALLENGES", payload: [] })
        dispatch({ type: "SET_CHALLENGE_BUCKETS", payload: {} })
        return
      }

      // Fetch submissions for top N participants (batched by 10 due to Firestore 'in' limit)
      const submissionsByChallenge: { [challengeId: string]: string[] } = {}
      const batchSize = 10

      for (let i = 0; i < topParticipantIds.length; i += batchSize) {
        const batch = topParticipantIds.slice(i, i + batchSize)
        const submissionsQuery = query(
          collection(db, "competitions", competitionId, "submissions"),
          where("participantId", "in", batch),
        )
        const submissionsSnapshot = await getDocs(submissionsQuery)

        submissionsSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          const challengeId = data.challengeId
          if (challengeId) {
            if (!submissionsByChallenge[challengeId]) {
              submissionsByChallenge[challengeId] = []
            }
            submissionsByChallenge[challengeId].push(doc.id)
          }
        })
      }

      // Sort submissions within each challenge for deterministic behavior
      Object.keys(submissionsByChallenge).forEach((challengeId) => {
        submissionsByChallenge[challengeId].sort()
      })

      // Create challenges array
      const challenges: Challenge[] = Object.entries(submissionsByChallenge).map(([challengeId, submissionIds]) => ({
        id: challengeId,
        name: `Challenge ${challengeId}`, // You can enhance this by fetching actual challenge names
        bucketSize: submissionIds.length,
        submissionIds,
      }))

      dispatch({ type: "SET_CHALLENGES", payload: challenges })
      dispatch({ type: "SET_CHALLENGE_BUCKETS", payload: submissionsByChallenge })
    } catch (error) {
      console.error("Error fetching challenges and submissions:", error)
      showNotification("error", "Data Loading Error", "Failed to load challenges and submissions")
      dispatch({ type: "SET_LOADING", payload: { key: "isLoadingChallenges", value: false } })
      dispatch({ type: "SET_LOADING", payload: { key: "isLoadingSubmissions", value: false } })
    }
  }, [competitionId, state.selectedTopN, showNotification])

  const fetchTopNFromGlobalConfig = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: { key: "isLoadingConfig", value: true } })

      const cfgRef = doc(db, "competitions", competitionId, "distributionConfigs", "current")
      const snap = await getDoc(cfgRef)

      if (snap.exists()) {
        const data = snap.data() as { topN?: number; timestamp?: Timestamp }
        if (typeof data.topN === "number") {
          dispatch({ type: "SET_SELECTED_TOP_N", payload: data.topN })
          dispatch({
            type: "SET_SAVED_CONFIG",
            payload: { selectedTopN: data.topN, timestamp: (data.timestamp as Timestamp) ?? (serverTimestamp() as any) },
          })
        } else {
          dispatch({ type: "SET_LOADING", payload: { key: "isLoadingConfig", value: false } })
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: { key: "isLoadingConfig", value: false } })
      }
    } catch (e) {
      console.error("Error fetching global config:", e)
      dispatch({ type: "SET_LOADING", payload: { key: "isLoadingConfig", value: false } })
    }
  }, [competitionId])


  // Progressive data loading
  const initializeData = useCallback(
    async (user: User) => {
      const criticalDataPromises = [fetchParticipantsCount(), fetchJudges()]
      try {
        const [, judgesData] = await Promise.allSettled(criticalDataPromises)
        if (judgesData.status === "fulfilled") {
          await fetchTopNFromGlobalConfig()
        }
      } catch (error) {
        console.error("Error in progressive data loading:", error)
        showNotification("error", "Loading Error", "Some data failed to load")
      } 
    },
    [fetchParticipantsCount, fetchJudges, fetchTopNFromGlobalConfig, showNotification],
  )

  // Auth effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/")
        return
      }
      try {
        const idTokenResult = await getIdTokenResult(user, true)
        const role = idTokenResult.claims.role
        if (role !== "superadmin") {
          router.push("/")
          return
        }
        dispatch({ type: "SET_AUTH", payload: { user, isAuthenticated: true } })
        initializeData(user)
      } catch (error) {
        console.error("Auth error:", error)
        router.push("/auth/login/admin")
      }
    })
    return () => unsubscribe()
  }, [auth, router, initializeData])

  // Fetch challenges when selectedTopN changes
  useEffect(() => {
    if (state.selectedTopN > 0 && state.isAuthenticated) {
      fetchChallengesAndSubmissions()
    }
  }, [state.selectedTopN, state.isAuthenticated, fetchChallengesAndSubmissions])

  // Config save handler
  // REPLACE the entire function body + signature
  const saveConfigToFirestore = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: { key: "isSavingConfig", value: true } })
      const cfgRef = doc(db, "competitions", competitionId, "distributionConfigs", "current")
      await setDoc(cfgRef, {
        topN: state.selectedTopN,
        timestamp: serverTimestamp(),
        updatedBy: state.currentUser?.uid ?? null,
      }, { merge: true })

      showNotification("success", "Configuration Saved", "Top N saved for this competition")
      dispatch({
        type: "SET_SAVED_CONFIG",
        payload: { selectedTopN: state.selectedTopN, timestamp: serverTimestamp() as any },
      })
      dispatch({ type: "SET_DIALOG", payload: { dialog: "config", open: false } })
    } catch (err) {
      console.error("Save config error:", err)
      showNotification("error", "Save Failed", "Could not save configuration")
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "isSavingConfig", value: false } })
    }
  }, [competitionId, state.selectedTopN, state.currentUser?.uid, showNotification])


  const handleSaveConfig = useCallback(async () => {
    if (!state.currentUser) return
    if (!topNValidation.ok) {
      showNotification("warning", "Invalid number", topNValidation.msg)
      return
    }
    if (state.savedConfig && state.savedConfig.selectedTopN !== state.selectedTopN) {
      dispatch({ type: "SET_DIALOG", payload: { dialog: "confirm", open: true } })
      return
    }
    await saveConfigToFirestore()
  }, [
    state.currentUser,
    state.savedConfig,
    state.selectedTopN,
    topNValidation,
    saveConfigToFirestore,
    showNotification,
  ])

  // Distribution handlers
  const handleEqualAllDistribution = useCallback(() => {
    state.challenges.forEach((challenge) => {
      dispatch({ type: "APPLY_EQUAL_DISTRIBUTION", payload: challenge.id })
    })
    showNotification("success", "Equal Distribution Applied", "All challenges distributed equally among judges")
  }, [state.challenges, showNotification])

  const handleAutoAllDistribution = useCallback(() => {
    state.challenges.forEach((challenge) => {
      dispatch({ type: "APPLY_AUTO_DISTRIBUTION", payload: challenge.id })
    })
    showNotification(
      "success",
      "Auto Distribution Applied",
      "All challenges distributed with same-challenge preference",
    )
  }, [state.challenges, showNotification])

  const handleDistributeSubmissions = useCallback(async () => {
    if (globalSummary.hasOverflow) {
      showNotification("error", "Cannot Distribute", "Some challenges have more assignments than available submissions")
      return
    }

    dispatch({ type: "SET_LOADING", payload: { key: "isDistributing", value: true } })

    try {
      const batch = writeBatch(db)
      const distributionSnapshot: DistributionSnapshot = {
        matrix: state.assignmentMatrix,
        topN: state.selectedTopN,
        strategy: "manual",
        mode: state.distributionMode,
        timestamp: serverTimestamp() as any,
      }

      // Build judge slices
      const judgeSlices: { [judgeId: string]: { [challengeId: string]: string[] } } = {}

      state.judges.forEach((judge) => {
        judgeSlices[judge.id] = {}
      })

      // Slice submissions according to matrix
      Object.entries(state.assignmentMatrix).forEach(([challengeId, judgeAssignments]) => {
        const submissionIds = state.challengeBuckets[challengeId] || []
        let currentIndex = 0

        Object.entries(judgeAssignments).forEach(([judgeId, count]) => {
          if (count > 0) {
            const slice = submissionIds.slice(currentIndex, currentIndex + count)
            judgeSlices[judgeId][challengeId] = slice
            currentIndex += count
          }
        })
      })

      // Write to Firestore
      Object.entries(judgeSlices).forEach(([judgeId, challengeAssignments]) => {
        const judgeDocRef = doc(db, "competitions", competitionId, "judges", judgeId)

        if (state.distributionMode === "overwrite") {
          // build only non-empty challenge slices
          const nonEmpty = Object.entries(challengeAssignments).filter(([, ids]) => ids.length > 0)
          if (nonEmpty.length === 0) {
            return // ⬅️ skip creating/updating this judge doc
          }

          const submissionsByChallenge = Object.fromEntries(nonEmpty)
          const assignedCountsByChallenge = Object.fromEntries(
            nonEmpty.map(([challengeId, ids]) => [challengeId, ids.length]),
          )
          const assignedCountTotal = nonEmpty.reduce((sum, [, ids]) => sum + ids.length, 0)

          batch.set(
            judgeDocRef,
            { submissionsByChallenge, assignedCountsByChallenge, assignedCountTotal },
            { merge: true }
          )
        } else {
          showNotification("warning", "Append Mode", "Append mode not yet implemented, using overwrite")
        }
      })


      // Save distribution snapshot
      const snapshotRef = doc(db, "competitions", competitionId, "distributionConfigs", "current")
      batch.set(snapshotRef, distributionSnapshot,{ merge: true })

      await batch.commit()

      const totalDistributed = Object.values(judgeSlices).reduce(
        (sum, judgeAssignments) =>
          sum + Object.values(judgeAssignments).reduce((judgeSum, submissions) => judgeSum + submissions.length, 0),
        0,
      )

      showNotification("success", "Distribution Complete", `${totalDistributed} submissions distributed successfully!`)
      dispatch({ type: "SET_DIALOG", payload: { dialog: "distribute", open: false } })
    } catch (error) {
      console.error("Distribution error:", error)
      showNotification(
        "error",
        "Distribution Failed",
        `Failed to distribute submissions: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "isDistributing", value: false } })
    }
  }, [
    competitionId,
    state.assignmentMatrix,
    state.challengeBuckets,
    state.judges,
    state.selectedTopN,
    state.distributionMode,
    globalSummary.hasOverflow,
    showNotification,
  ])

  // Matrix cell update handler
  const updateMatrixCell = useCallback(
    (challengeId: string, judgeId: string, value: number) => {
      const challenge = state.challenges.find((c) => c.id === challengeId)
      if (!challenge) return

      const newValue = Math.max(0, Math.min(value, challenge.bucketSize))
      dispatch({ type: "UPDATE_MATRIX_CELL", payload: { challengeId, judgeId, value: newValue } })
    },
    [state.challenges],
  )

  // Render notification
  const renderNotification = useCallback(
    (notification: NotificationState) => {
      const icons = {
        success: CheckCircle2,
        error: AlertCircle,
        warning: AlertTriangle,
        info: Info,
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
    },
    [removeNotification],
  )

  // Challenge Card Component
  const ChallengeCard = useCallback(
    ({ challenge }: { challenge: Challenge }) => {
      const challengeAssignments = state.assignmentMatrix[challenge.id] || {}
      const assigned = Object.values(challengeAssignments).reduce((sum, count) => sum + count, 0)
      const remaining = challenge.bucketSize - assigned
      const hasOverflow = assigned > challenge.bucketSize

      return (
        <Card className={`${hasOverflow ? "border-red-300 bg-red-50/30" : ""}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900">{challenge.name}</CardTitle>
                <CardDescription className="text-gray-600">ID: {challenge.id}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="gap-1">
                  <Layers className="w-3 h-3" />
                  {challenge.bucketSize} Available
                </Badge>
                <Badge
                  variant={hasOverflow ? "destructive" : assigned === challenge.bucketSize ? "default" : "secondary"}
                  className="gap-1"
                >
                  <Target className="w-3 h-3" />
                  {assigned} Assigned
                </Badge>
                
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch({ type: "APPLY_EQUAL_DISTRIBUTION", payload: challenge.id })}
                className="flex items-center gap-1"
              >
                <Scale className="w-3 h-3" />
                Equal
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch({ type: "APPLY_AUTO_DISTRIBUTION", payload: challenge.id })}
                className="flex items-center gap-1"
              >
                <TrendingUp className="w-3 h-3" />
                Auto
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch({ type: "CLEAR_CHALLENGE_ASSIGNMENTS", payload: challenge.id })}
                className="flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Clear
              </Button>
            </div>

            <div className="space-y-3">
              {state.judges.map((judge) => {
                const assignedCount = challengeAssignments[judge.id] || 0
                return (
                  <div key={judge.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={`${getAvatarColor(judge.name)} text-white text-xs font-semibold`}>
                          {judge.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900">{judge.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMatrixCell(challenge.id, judge.id, assignedCount - 1)}
                        disabled={assignedCount <= 0}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max={challenge.bucketSize}
                        value={assignedCount}
                        onChange={(e) => updateMatrixCell(challenge.id, judge.id, Number.parseInt(e.target.value) || 0)}
                        className="w-16 text-center h-7 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateMatrixCell(challenge.id, judge.id, assignedCount + 1)}
                        disabled={assignedCount >= challenge.bucketSize}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )
    },
    [state.assignmentMatrix, state.judges, updateMatrixCell],
  )

  // Matrix View Component
  const MatrixView = useCallback(() => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            Assignment Matrix Overview
          </CardTitle>
          <CardDescription>Click any cell to edit assignments for that challenge-judge combination</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-10 min-w-[200px]">Challenge</TableHead>
                  {state.judges.map((judge) => (
                    <TableHead key={judge.id} className="text-center min-w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className={`${getAvatarColor(judge.name)} text-white text-xs`}>
                            {judge.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{judge.name.split(" ")[0]}</span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.challenges.map((challenge) => {
                  const challengeAssignments = state.assignmentMatrix[challenge.id] || {}
                  const assigned = Object.values(challengeAssignments).reduce((sum, count) => sum + count, 0)
                  const hasOverflow = assigned > challenge.bucketSize

                  return (
                    <TableRow key={challenge.id} className={hasOverflow ? "bg-red-50" : ""}>
                      <TableCell className="sticky left-0 bg-white z-10 font-medium">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{challenge.name}</div>
                            <div className="text-xs text-gray-500">{challenge.bucketSize} available</div>
                          </div>
                          <Badge
                            variant={
                              hasOverflow ? "destructive" : assigned === challenge.bucketSize ? "default" : "secondary"
                            }
                          >
                            {assigned}/{challenge.bucketSize}
                          </Badge>
                        </div>
                      </TableCell>
                      {state.judges.map((judge) => {
                        const count = challengeAssignments[judge.id] || 0
                        return (
                          <TableCell key={judge.id} className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                dispatch({ type: "SET_SELECTED_CHALLENGE", payload: challenge.id })
                                dispatch({ type: "SET_DIALOG", payload: { dialog: "challengeDrawer", open: true } })
                              }}
                              className={`w-12 h-8 ${count > 0 ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-100"}`}
                            >
                              {count || "-"}
                            </Button>
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-center font-medium">
                        <Badge variant={hasOverflow ? "destructive" : "outline"}>{assigned}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }, [state.challenges, state.judges, state.assignmentMatrix])

  // Early return for unauthenticated users
  if (!state.isAuthenticated) {
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
      {state.notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">{state.notifications.map(renderNotification)}</div>
      )}

      {/* Header */}
      <header className="w-full bg-white shadow-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700">
            <Shuffle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Challenge-wise Distribution</h2>
            <p className="text-xs text-gray-600">Intelligent Assignment System</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {state.isLoadingParticipants ? (
            <StatCardSkeleton />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                    <p className="text-3xl font-bold tracking-tight text-gray-900">
                      {state.totalParticipants.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {state.isLoadingJudges ? (
            <StatCardSkeleton />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Available Judges</p>
                    <p className="text-3xl font-bold tracking-tight text-gray-900">
                      {state.judges.length.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50">
                    <Scale className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {state.isLoadingConfig ? (
            <StatCardSkeleton />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Selected Top N</p>
                    <p className="text-3xl font-bold tracking-tight text-gray-900">
                      {state.selectedTopN.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50">
                    <Target className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {state.isLoadingChallenges ? (
            <StatCardSkeleton />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Challenges</p>
                    <p className="text-3xl font-bold tracking-tight text-gray-900">
                      {state.challenges.length.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50">
                    <Layers className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Available Submissions</p>
                  <p className="text-3xl font-bold tracking-tight text-gray-900">
                    {globalSummary.totalAvailable.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50">
                  <Award className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => dispatch({ type: "SET_DIALOG", payload: { dialog: "config", open: true } })}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800"
            disabled={state.isLoadingConfig}
          >
           {state.isLoadingConfig && <Loader className="w-4 h-4 animate-spin" />}
            Select Top N ({state.selectedTopN})
          </Button>

          <Button
            onClick={handleEqualAllDistribution}
            disabled={state.challenges.length === 0 || state.judges.length === 0}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <Scale className="w-4 h-4" />
            Equal All
          </Button>

          <Button
            onClick={handleAutoAllDistribution}
            disabled={state.challenges.length === 0 || state.judges.length === 0}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <TrendingUp className="w-4 h-4" />
            Auto All (Prefer Same-Challenge)
          </Button>
        </div>

        {/* Global Toolbar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={state.viewMode === "cards" ? "default" : "outline"}
                    size="sm"
                    onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: "cards" })}
                    className="flex items-center gap-2"
                  >
                    <List className="w-4 h-4" />
                    Challenge Cards
                  </Button>
                  <Button
                    variant={state.viewMode === "matrix" ? "default" : "outline"}
                    size="sm"
                    onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: "matrix" })}
                    className="flex items-center gap-2"
                  >
                    <Grid3X3 className="w-4 h-4" />
                    Matrix Overview
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="distribution-mode" className="text-sm font-medium">
                    Mode:
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="distribution-mode"
                      checked={state.distributionMode === "append"}
                      onCheckedChange={(checked) =>
                        dispatch({ type: "SET_DISTRIBUTION_MODE", payload: checked ? "append" : "overwrite" })
                      }
                    />
                    <span className="text-sm text-gray-600">
                      {state.distributionMode === "overwrite" ? "Overwrite" : "Append"}
                    </span>
                  </div>
                </div>

                {state.viewMode === "cards" && (
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search challenges..."
                        value={state.challengeSearch}
                        onChange={(e) => dispatch({ type: "SET_CHALLENGE_SEARCH", payload: e.target.value })}
                        className="pl-10 w-64"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="show-remaining"
                        checked={state.showOnlyRemaining}
                        onCheckedChange={(checked) => dispatch({ type: "SET_SHOW_ONLY_REMAINING", payload: checked })}
                      />
                      <Label htmlFor="show-remaining" className="text-sm">
                        Show only with remaining {">"} 0
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {state.selectedTopN === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Configure Participant Selection</h3>
              <p className="text-gray-600 mb-6">
                Select the number of top-ranked participants to distribute among judges
              </p>
              <Button
                onClick={() => dispatch({ type: "SET_DIALOG", payload: { dialog: "config", open: true } })}
                className="bg-gray-900 hover:bg-gray-800"
              >
                Select Top N
              </Button>
            </CardContent>
          </Card>
        ) : state.isLoadingChallenges || state.isLoadingSubmissions ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <ChallengeCardSkeleton key={i} />
            ))}
          </div>
        ) : state.challenges.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Challenges Found</h3>
              <p className="text-gray-600">
                No submissions found for the selected top {state.selectedTopN} participants
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {state.viewMode === "cards" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredChallenges.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            ) : (
              <MatrixView />
            )}
          </>
        )}

        {/* Sticky Summary Bar */}
        {state.challenges.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Judge Totals:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {state.judges.map((judge) => (
                      <Badge key={judge.id} variant="outline" className="text-xs">
                        {judge.name.split(" ")[0]}: {globalSummary.judgeToTotals[judge.id] || 0}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium text-gray-900">Global: </span>
                    <Badge variant="outline" className="ml-1">
                      {globalSummary.totalAssigned}/{globalSummary.totalAvailable} assigned
                    </Badge>
                  </div>
                  {globalSummary.totalRemaining > 0 && (
                    <div>
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        {globalSummary.totalRemaining} remaining
                      </Badge>
                    </div>
                  )}
                  {globalSummary.hasOverflow && (
                    <div>
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Overflow detected
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => dispatch({ type: "SET_DIALOG", payload: { dialog: "distribute", open: true } })}
                disabled={globalSummary.hasOverflow || globalSummary.totalAssigned === 0 || state.isDistributing}
                className="bg-gray-900 hover:bg-gray-800"
              >
                {state.isDistributing ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Distributing...
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4 mr-2" />
                    Distribute ({globalSummary.totalAssigned} submissions)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Configure Participants Dialog */}
      <Dialog
        open={state.showConfigDialog}
        onOpenChange={(open) => dispatch({ type: "SET_DIALOG", payload: { dialog: "config", open } })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Settings className="w-5 h-5" />
              Configure Participants
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Select how many top-ranked participants should be included in the distribution pool.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topN" className="text-gray-900 font-medium">
                Number of Participants
              </Label>
              <Input
                id="topN"
                type="number"
                min={1}
                max={state.totalParticipants}
                value={state.selectedTopN || ""}
                onChange={(e) =>
                  dispatch({
                    type: "SET_SELECTED_TOP_N",
                    payload: Math.max(0, Number.parseInt(e.target.value) || 0),
                  })
                }
                placeholder={`Enter number (max: ${state.totalParticipants})`}
                className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                  ${
                    topNValidation.ok
                      ? "border-gray-300 focus:border-gray-900 focus:ring-gray-900/20"
                      : "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  }
                `}
                style={{ MozAppearance: "textfield" }}
              />
              <p className={`text-sm ${topNValidation.ok ? "text-gray-500" : "text-red-600"}`}>{topNValidation.msg}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 50, 100].map((n) => (
                <Button
                  key={n}
                  onClick={() =>
                    dispatch({ type: "SET_SELECTED_TOP_N", payload: Math.min(n, state.totalParticipants) })
                  }
                  variant={state.selectedTopN === n ? "default" : "outline"}
                  size="sm"
                  disabled={n > state.totalParticipants}
                  className={
                    state.selectedTopN === n
                      ? "bg-gray-900 hover:bg-gray-800"
                      : "border-gray-300 text-gray-900 hover:bg-gray-50"
                  }
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "SET_DIALOG", payload: { dialog: "config", open: false } })}
              className="border-gray-300 text-gray-900 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={!topNValidation.ok || state.isSavingConfig}
              className="bg-gray-900 hover:bg-gray-800 disabled:opacity-60"
            >
              {state.isSavingConfig ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Distribution Confirmation Dialog */}
      <Dialog
        open={state.showDistributeDialog}
        onOpenChange={(open) => dispatch({ type: "SET_DIALOG", payload: { dialog: "distribute", open } })}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Shuffle className="w-5 h-5" />
              Confirm Distribution
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Review the distribution summary before applying changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{globalSummary.totalAssigned}</div>
                <div className="text-sm text-gray-600">Submissions to Distribute</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{state.challenges.length}</div>
                <div className="text-sm text-gray-600">Challenges Involved</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Distribution Mode</Label>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div
                  className={`w-3 h-3 rounded-full ${state.distributionMode === "overwrite" ? "bg-red-500" : "bg-green-500"}`}
                ></div>
                <div>
                  <div className="font-medium text-sm">
                    {state.distributionMode === "overwrite" ? "Overwrite Mode" : "Append Mode"}
                  </div>
                  <div className="text-xs text-gray-600">
                    {state.distributionMode === "overwrite"
                      ? "Replace existing judge assignments completely"
                      : "Add to existing judge assignments (avoiding duplicates)"}
                  </div>
                </div>
              </div>
            </div>

            {globalSummary.hasOverflow && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium text-sm">Assignment Overflow Detected</span>
                </div>
                <p className="text-xs text-red-700 mt-1">
                  Some challenges have more assignments than available submissions. Please adjust before distributing.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "SET_DIALOG", payload: { dialog: "distribute", open: false } })}
              className="border-gray-300 text-gray-900 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDistributeSubmissions}
              disabled={state.isDistributing || globalSummary.hasOverflow || globalSummary.totalAssigned === 0}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {state.isDistributing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Distributing...
                </>
              ) : (
                <>
                  <Shuffle className="w-4 h-4 mr-2" />
                  Confirm Distribution
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configuration Confirmation Dialog */}
      <Dialog
        open={state.showConfirmDialog}
        onOpenChange={(open) => dispatch({ type: "SET_DIALOG", payload: { dialog: "confirm", open } })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Overwrite Configuration?
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              You already saved <strong>{state.savedConfig?.selectedTopN}</strong> participants. Do you want to change
              it to <strong>{state.selectedTopN}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "SET_DIALOG", payload: { dialog: "confirm", open: false } })}
              className="border-gray-300 text-gray-900 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (state.currentUser) {
                  await saveConfigToFirestore()
                  dispatch({ type: "SET_DIALOG", payload: { dialog: "confirm", open: false } })
                }
              }}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={state.isSavingConfig}
            >
              {state.isSavingConfig ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Yes, Overwrite"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Challenge Detail Drawer */}
      <Sheet
        open={state.showChallengeDrawer}
        onOpenChange={(open) => dispatch({ type: "SET_DIALOG", payload: { dialog: "challengeDrawer", open } })}
      >
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Challenge Assignment Details
            </SheetTitle>
            <SheetDescription>Edit assignments for the selected challenge</SheetDescription>
          </SheetHeader>
          {state.selectedChallengeId && (
            <div className="mt-6">
              {(() => {
                const challenge = state.challenges.find((c) => c.id === state.selectedChallengeId)
                return challenge ? <ChallengeCard challenge={challenge} /> : null
              })()}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
