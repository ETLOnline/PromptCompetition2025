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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Shuffle,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Hash,
  Info,
  Loader,
  Users,
  Target,
  Zap,
  ChevronRight,
  Award,
  MoreVertical,
  ChevronLeft,
  Scale,
  Eye,
  Minus,
  Plus,
  AlertTriangle,
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
  institution?: string
  totalAssigned?: number
  status?: "available" | "busy" | "offline"
}

interface JudgeCapacity {
  judgeId: string
  capacity: number
}

type AssignmentMethod = "Round-Robin" | "Weighted" | "Automatic"

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
  judgeAssignments: { [key: string]: number }
  existingAssignments: { [key: string]: number }
  selectedTopN: number
  savedConfig: { selectedTopN: number; timestamp: Timestamp } | null

  // UI state
  currentPage: number
  judgeSearch: string
  assignmentMethod: AssignmentMethod | null
  notifications: NotificationState[]

  // Loading states
  isInitializing: boolean
  isLoadingParticipants: boolean
  isLoadingJudges: boolean
  isLoadingAssignments: boolean
  isLoadingConfig: boolean
  isDistributing: boolean
  isSavingConfig: boolean

  // Dialog states
  showConfigDialog: boolean
  showDistributeDialog: boolean
  showConfirmDialog: boolean

  // Auth state
  currentUser: User | null
  isAuthenticated: boolean
}

type AppAction =
  | { type: "SET_AUTH"; payload: { user: User | null; isAuthenticated: boolean } }
  | { type: "SET_PARTICIPANTS"; payload: number }
  | { type: "SET_JUDGES"; payload: Judge[] }
  | { type: "SET_ASSIGNMENTS"; payload: { [key: string]: number } }
  | { type: "SET_EXISTING_ASSIGNMENTS"; payload: { [key: string]: number } }
  | { type: "SET_SELECTED_TOP_N"; payload: number }
  | { type: "SET_SAVED_CONFIG"; payload: { selectedTopN: number; timestamp: Timestamp } | null }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_JUDGE_SEARCH"; payload: string }
  | { type: "SET_ASSIGNMENT_METHOD"; payload: AssignmentMethod | null }
  | { type: "ADD_NOTIFICATION"; payload: NotificationState }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "SET_LOADING"; payload: { key: keyof AppState; value: boolean } }
  | { type: "SET_DIALOG"; payload: { dialog: "config" | "distribute" | "confirm"; open: boolean } }
  | { type: "UPDATE_JUDGE_ASSIGNMENT"; payload: { judgeId: string; value: number } }

const initialState: AppState = {
  totalParticipants: 0,
  judges: [],
  judgeAssignments: {},
  existingAssignments: {},
  selectedTopN: 0,
  savedConfig: null,
  currentPage: 1,
  judgeSearch: "",
  assignmentMethod: null,
  notifications: [],
  isInitializing: true,
  isLoadingParticipants: false,
  isLoadingJudges: false,
  isLoadingAssignments: false,
  isLoadingConfig: false,
  isDistributing: false,
  isSavingConfig: false,
  showConfigDialog: false,
  showDistributeDialog: false,
  showConfirmDialog: false,
  currentUser: null,
  isAuthenticated: false,
}

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_AUTH":
      return { ...state, ...action.payload }
    case "SET_PARTICIPANTS":
      return { ...state, totalParticipants: action.payload, isLoadingParticipants: false }
    case "SET_JUDGES":
      return { ...state, judges: action.payload, isLoadingJudges: false }
    case "SET_ASSIGNMENTS":
      return { ...state, judgeAssignments: action.payload }
    case "SET_EXISTING_ASSIGNMENTS":
      return { ...state, existingAssignments: action.payload, isLoadingAssignments: false }
    case "SET_SELECTED_TOP_N":
      return { ...state, selectedTopN: action.payload }
    case "SET_SAVED_CONFIG":
      return { ...state, savedConfig: action.payload, isLoadingConfig: false }
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload }
    case "SET_JUDGE_SEARCH":
      return { ...state, judgeSearch: action.payload, currentPage: 1 }
    case "SET_ASSIGNMENT_METHOD":
      return { ...state, assignmentMethod: action.payload }
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [...state.notifications, action.payload] }
    case "REMOVE_NOTIFICATION":
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.payload) }
    case "SET_LOADING":
      return { ...state, [action.payload.key]: action.payload.value }
    case "SET_DIALOG":
      const dialogKey =
        `show${action.payload.dialog.charAt(0).toUpperCase() + action.payload.dialog.slice(1)}Dialog` as keyof AppState
      return { ...state, [dialogKey]: action.payload.open }
    case "UPDATE_JUDGE_ASSIGNMENT":
      return {
        ...state,
        judgeAssignments: {
          ...state.judgeAssignments,
          [action.payload.judgeId]: action.payload.value,
        },
      }
    default:
      return state
  }
}

const ITEMS_PER_PAGE = 10

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

// Skeleton components for progressive loading
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

const JudgeRowSkeleton = () => (
  <TableRow>
    <TableCell>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
        </div>
      </div>
    </TableCell>
    <TableCell>
      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
    </TableCell>
    <TableCell>
      <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
    </TableCell>
    <TableCell>
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </TableCell>
    <TableCell>
      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
    </TableCell>
  </TableRow>
)

export default function ParticipantDistributionTable() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string

  // Memoized auth instance
  const auth = useMemo(() => getAuth(), [])

  // State management with useReducer
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Memoized calculations
  const filteredJudges = useMemo(() => {
    return state.judges.filter(
      (j) =>
        j.name.toLowerCase().includes(state.judgeSearch.toLowerCase()) ||
        j.email.toLowerCase().includes(state.judgeSearch.toLowerCase()),
    )
  }, [state.judges, state.judgeSearch])

  const totalPages = Math.ceil(filteredJudges.length / ITEMS_PER_PAGE)
  const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedJudges = filteredJudges.slice(startIndex, endIndex)

  const totalAssigned = useMemo(
    () => Object.values(state.judgeAssignments).reduce((sum, val) => sum + val, 0),
    [state.judgeAssignments],
  )

  const totalExistingAssignments = useMemo(
    () => Object.values(state.existingAssignments).reduce((sum, val) => sum + val, 0),
    [state.existingAssignments],
  )

  const topNValidation = useMemo(() => {
    const max = state.totalParticipants;
    const n = state.selectedTopN;

    if (!n || Number.isNaN(n)) return { ok: false, msg: "Enter a number greater than 0." };
    if (n < 1) return { ok: false, msg: "Minimum is 1 participant." };
    if (n > max) return { ok: false, msg: `Cannot exceed ${max} participant${max === 1 ? "" : "s"}.` };

    return { ok: true, msg: `You can pick up to ${max}.` };
  }, [state.selectedTopN, state.totalParticipants]);


  // Optimized notification system
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

  // Parallel data fetching functions
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

  const fetchExistingAssignments = useCallback(
    async (judgesData: Judge[]) => {
      try {
        dispatch({ type: "SET_LOADING", payload: { key: "isLoadingAssignments", value: true } })

        // Parallel fetch of all judge documents
        const judgeDocRefs = judgesData.map((j) => doc(db, "competitions", competitionId, "judges", j.id))
        const judgeDocs = await Promise.all(judgeDocRefs.map(getDoc))

        const assignments: { [key: string]: number } = {}
        judgeDocs.forEach((doc, i) => {
          if (doc.exists()) {
            const data = doc.data()
            if (data.assignedCount && data.assignedCount > 0) {
              assignments[judgesData[i].id] = data.assignedCount
            }
          }
        })

        dispatch({ type: "SET_EXISTING_ASSIGNMENTS", payload: assignments })
        dispatch({ type: "SET_ASSIGNMENTS", payload: assignments })
      } catch (error) {
        console.error("Error fetching existing assignments:", error)
        dispatch({ type: "SET_LOADING", payload: { key: "isLoadingAssignments", value: false } })
      }
    },
    [competitionId],
  )

  const fetchSavedConfig = useCallback(async (userId: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: { key: "isLoadingConfig", value: true } })
      const configDocRef = doc(db, "competitions", competitionId, "leaderboard", "configurations")
      const configSnapshot = await getDoc(configDocRef)

      if (configSnapshot.exists()) {
        const data = configSnapshot.data()
        if (data[userId]?.selectedTopN) {
          dispatch({ type: "SET_SELECTED_TOP_N", payload: data[userId].selectedTopN })
          dispatch({
            type: "SET_SAVED_CONFIG",
            payload: {
              selectedTopN: data[userId].selectedTopN,
              timestamp: data[userId].timestamp,
            },
          })
        } else {
          dispatch({ type: "SET_LOADING", payload: { key: "isLoadingConfig", value: false } })
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: { key: "isLoadingConfig", value: false } })
      }
    } catch (error) {
      console.error("Error fetching saved config:", error)
      dispatch({ type: "SET_LOADING", payload: { key: "isLoadingConfig", value: false } })
    }
  }, [])

  // Progressive data loading strategy
  const initializeData = useCallback(
    async (user: User) => {
      // Phase 1: Critical data (participants count and judges) - parallel
      const criticalDataPromises = [fetchParticipantsCount(), fetchJudges()]

      try {
        const [, judgesData] = await Promise.allSettled(criticalDataPromises)

        // Phase 2: Secondary data (assignments and config) - parallel, but after judges are loaded
        if (judgesData.status === "fulfilled" && judgesData.value) {
          const secondaryDataPromises = [fetchExistingAssignments(judgesData.value), fetchSavedConfig(user.uid)]

          await Promise.allSettled(secondaryDataPromises)
        }
      } catch (error) {
        console.error("Error in progressive data loading:", error)
        showNotification("error", "Loading Error", "Some data failed to load")
      } finally {
        dispatch({ type: "SET_LOADING", payload: { key: "isInitializing", value: false } })
      }
    },
    [fetchParticipantsCount, fetchJudges, fetchExistingAssignments, fetchSavedConfig, showNotification],
  )

  // Non-blocking authentication
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

        // Start progressive data loading immediately after auth
        initializeData(user)
      } catch (error) {
        console.error("Auth error:", error)
        router.push("/auth/login/admin")
      }
    })

    return () => unsubscribe()
  }, [auth, router, initializeData])

  const saveConfigToFirestore = useCallback(
    async (uid: string) => {
      try {
        dispatch({ type: "SET_LOADING", payload: { key: "isSavingConfig", value: true } })
        const cfgRef = doc(db, "competitions", competitionId, "leaderboard", "configurations")
        await setDoc(
          cfgRef,
          {
            [uid]: {
              userId: uid,
              timestamp: serverTimestamp(),
              selectedTopN: state.selectedTopN,
            },
          },
          { merge: true },
        )
        showNotification("success", "Configuration Saved", "Configuration saved successfully")
        dispatch({
          type: "SET_SAVED_CONFIG",
          payload: {
            selectedTopN: state.selectedTopN,
            timestamp: serverTimestamp() as any,
          },
        })
        dispatch({ type: "SET_DIALOG", payload: { dialog: "config", open: false } })
      } catch (err) {
        console.error("Save config error:", err)
        showNotification("error", "Save Failed", "Could not save configuration")
      } finally {
        dispatch({ type: "SET_LOADING", payload: { key: "isSavingConfig", value: false } })
      }
    },
    [competitionId, state.selectedTopN, showNotification],
  )

  // Optimized handlers
  const handleSaveConfig = useCallback(async () => {
    if (!state.currentUser) return;

    if (!topNValidation.ok) {
      showNotification("warning", "Invalid number", topNValidation.msg);
      return;
    }

    if (state.savedConfig && state.savedConfig.selectedTopN !== state.selectedTopN) {
      dispatch({ type: "SET_DIALOG", payload: { dialog: "confirm", open: true } });
      return;
    }

    await saveConfigToFirestore(state.currentUser.uid);
  }, [state.currentUser, state.savedConfig, state.selectedTopN, topNValidation, saveConfigToFirestore, showNotification]);

  const handleDistributeParticipants = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: { key: "isDistributing", value: true } })
    try {
      // Fetch top N participants
      const leaderboardQuery = query(
        collection(db, "competitions", competitionId, "leaderboard"),
        orderBy("totalScore", "desc"),
        limit(state.selectedTopN),
      )
      const leaderboardSnapshot = await getDocs(leaderboardQuery)
      const participants = leaderboardSnapshot.docs.map((doc) => doc.id)

      if (!participants || participants.length === 0) {
        throw new Error("No participants found")
      }

      // Get available judges
      let availableJudges: string[] = []
      if (state.assignmentMethod === "Round-Robin") {
        availableJudges = state.judges.map((j) => j.id)
      } else if (state.assignmentMethod === "Weighted") {
        availableJudges = Object.entries(state.judgeAssignments)
          .filter(([_, capacity]) => capacity > 0)
          .map(([judgeId, _]) => judgeId)
      }

      if (availableJudges.length === 0) {
        throw new Error("No judges available for assignment")
      }

      // Distribute participants
      const assignments: { [key: string]: string[] } = {}
      if (state.assignmentMethod === "Round-Robin") {
        participants.forEach((pid, index) => {
          const judgeId = availableJudges[index % availableJudges.length]
          if (!assignments[judgeId]) assignments[judgeId] = []
          assignments[judgeId].push(pid)
        })
      } else if (state.assignmentMethod === "Weighted") {
        let remainingParticipants = [...participants]
        for (const judgeId of availableJudges) {
          const capacity = state.judgeAssignments[judgeId] || 0
          if (capacity > 0 && remainingParticipants.length > 0) {
            const assignCount = Math.min(capacity, remainingParticipants.length)
            assignments[judgeId] = remainingParticipants.slice(0, assignCount)
            remainingParticipants = remainingParticipants.slice(assignCount)
          }
        }
      }

      // Save to Firestore
      const batch = writeBatch(db)
      Object.entries(assignments).forEach(([judgeId, pids]) => {
        const ref = doc(db, "competitions", competitionId, "judges", judgeId)
        batch.set(
          ref,
          {
            participants: pids,
            assignedCount: pids.length,
          },
          { merge: true },
        )
      })

      await batch.commit()

      const assignedCount = Object.values(assignments).reduce((sum, pids) => sum + pids.length, 0)
      showNotification("success", "Distribution Complete", `${assignedCount} participants distributed successfully!`)

      // Update existing assignments
      const newAssignments: { [key: string]: number } = {}
      Object.entries(assignments).forEach(([judgeId, pids]) => {
        newAssignments[judgeId] = pids.length
      })
      dispatch({ type: "SET_EXISTING_ASSIGNMENTS", payload: newAssignments })
      dispatch({ type: "SET_DIALOG", payload: { dialog: "distribute", open: false } })
    } catch (err) {
      console.error("Distribution error:", err)
      showNotification(
        "error",
        "Distribution Failed",
        `Failed to distribute participants: ${err instanceof Error ? err.message : "Unknown error"}`,
      )
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "isDistributing", value: false } })
    }
  }, [
    competitionId,
    state.selectedTopN,
    state.assignmentMethod,
    state.judges,
    state.judgeAssignments,
    showNotification,
  ])

  const handleEqualDistribution = useCallback(() => {
    const participantsPerJudge = Math.floor(state.selectedTopN / state.judges.length)
    const remainder = state.selectedTopN % state.judges.length

    const newAssignments: { [key: string]: number } = {}
    state.judges.forEach((judge, index) => {
      newAssignments[judge.id] = participantsPerJudge + (index < remainder ? 1 : 0)
    })

    dispatch({ type: "SET_ASSIGNMENTS", payload: newAssignments })
    showNotification("success", "Equal Distribution", "Participants distributed equally among all judges")
  }, [state.selectedTopN, state.judges, showNotification])

  const updateJudgeAssignment = useCallback(
    (judgeId: string, value: number) => {
      const newValue = Math.max(0, Math.min(value, state.selectedTopN))
      dispatch({ type: "UPDATE_JUDGE_ASSIGNMENT", payload: { judgeId, value: newValue } })
    },
    [state.selectedTopN],
  )

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-50 text-emerald-800 border-emerald-200"
      case "busy":
        return "bg-amber-50 text-amber-800 border-amber-200"
      case "offline":
        return "bg-gray-100 text-gray-600 border-gray-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }, [])

  const getStatusDot = useCallback((status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-500"
      case "busy":
        return "bg-amber-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }, [])

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

  // Pagination component
  const PaginationComponent = useCallback(() => {
    if (totalPages <= 1) return null

    const startItem = (state.currentPage - 1) * ITEMS_PER_PAGE + 1
    const endItem = Math.min(state.currentPage * ITEMS_PER_PAGE, filteredJudges.length)

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t">
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {filteredJudges.length} judges
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "SET_CURRENT_PAGE", payload: state.currentPage - 1 })}
            disabled={state.currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (state.currentPage <= 3) {
                pageNum = i + 1
              } else if (state.currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = state.currentPage - 2 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={state.currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => dispatch({ type: "SET_CURRENT_PAGE", payload: pageNum })}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "SET_CURRENT_PAGE", payload: state.currentPage + 1 })}
            disabled={state.currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    )
  }, [totalPages, state.currentPage, filteredJudges.length])

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
            <h2 className="font-bold text-gray-900">Participant Distribution</h2>
            <p className="text-xs text-gray-600">Intelligent Assignment System</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-8">
        {/* Stats Overview with Progressive Loading */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    <p className="text-sm font-medium text-muted-foreground">Selected for Review</p>
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

          {state.isLoadingAssignments ? (
            <StatCardSkeleton />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Currently Assigned</p>
                    <p className="text-3xl font-bold tracking-tight text-gray-900">
                      {totalExistingAssignments.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
          onClick={() => dispatch({ type: "SET_DIALOG", payload: { dialog: "config", open: true } })}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800"
          disabled={state.isLoadingConfig}
        >
          {state.isLoadingConfig ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : null}
          Set Participant Distribution ({state.selectedTopN})
        </Button>


          <Button
            onClick={() => dispatch({ type: "SET_DIALOG", payload: { dialog: "distribute", open: true } })}
            disabled={state.selectedTopN === 0 || state.isLoadingJudges}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800"
          >
            <Shuffle className="w-4 h-4" />
            Distribution Settings
          </Button>

          <Button
            onClick={handleEqualDistribution}
            disabled={state.selectedTopN === 0 || state.judges.length === 0 || state.isLoadingJudges}
            variant="outline"
            className="flex items-center gap-2 border-gray-300 text-gray-900 hover:bg-gray-50 bg-transparent"
          >
            <Zap className="w-4 h-4" />
            Equal Distribution
          </Button>
        </div>

        {/* Judges Table with Progressive Loading */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900">
                  Judge Management {!state.isLoadingJudges && `(${filteredJudges.length})`}
                  {state.isLoadingJudges && (
                    <span className="inline-flex items-center ml-2">
                      <Loader className="w-4 h-4 animate-spin" />
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Assign participants to judges and manage distribution settings
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                {state.selectedTopN > 0 && !state.isLoadingAssignments && (
                  <div className="text-sm text-muted-foreground">
                    <span
                      className={`font-semibold ${
                        totalAssigned > state.selectedTopN
                          ? "text-red-600"
                          : totalAssigned === state.selectedTopN
                            ? "text-green-600"
                            : "text-amber-600"
                      }`}
                    >
                      {totalAssigned}
                    </span>
                    <span> / {state.selectedTopN} assigned</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Search */}
            <div className="p-6 border-b">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search judges..."
                  value={state.judgeSearch}
                  onChange={(e) => dispatch({ type: "SET_JUDGE_SEARCH", payload: e.target.value })}
                  className="pl-10 pr-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900/20"
                  disabled={state.isLoadingJudges}
                />
                {state.judgeSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: "SET_JUDGE_SEARCH", payload: "" })}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Table with Progressive Loading */}
            {state.isLoadingJudges ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-900 font-semibold">Judge</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Current Assignments</TableHead>
                      <TableHead className="text-gray-900 font-semibold">New Assignment</TableHead>
                      <TableHead className="w-[100px] text-gray-900 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }, (_, i) => (
                      <JudgeRowSkeleton key={i} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : paginatedJudges.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Scale className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">No judges found</h3>
                    <p className="text-muted-foreground">
                      {state.judgeSearch ? "Try adjusting your search criteria" : "No judges are available"}
                    </p>
                  </div>
                  {state.judgeSearch && (
                    <Button
                      variant="outline"
                      onClick={() => dispatch({ type: "SET_JUDGE_SEARCH", payload: "" })}
                      className="border-gray-300 text-gray-900 hover:bg-gray-50"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-900 font-semibold">Judge</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Current Assignments</TableHead>
                      <TableHead className="text-gray-900 font-semibold">New Assignment</TableHead>
                      <TableHead className="w-[100px] text-gray-900 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedJudges.map((judge) => (
                      <TableRow key={judge.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`${getAvatarColor(judge.name)} text-white font-semibold`}>
                                  {judge.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusDot(
                                  judge.status || "available",
                                )}`}
                              ></div>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium leading-none text-gray-900">{judge.name}</p>
                              <p className="text-sm text-gray-600">{judge.email}</p>
                              {judge.institution && <p className="text-xs text-gray-500">{judge.institution}</p>}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className={`${getStatusColor(judge.status || "available")} border font-medium`}>
                            {judge.status || "available"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {state.isLoadingAssignments ? (
                              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                              <>
                                <Badge variant="outline" className="gap-1 border-gray-300">
                                  <Users className="w-3 h-3" />
                                  {state.existingAssignments[judge.id] || 0}
                                </Badge>
                                {state.existingAssignments[judge.id] > 0 && (
                                  <span className="text-xs text-gray-500">participants</span>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateJudgeAssignment(judge.id, (state.judgeAssignments[judge.id] || 0) - 1)
                              }
                              disabled={
                                !state.judgeAssignments[judge.id] ||
                                state.judgeAssignments[judge.id] <= 0 ||
                                state.isLoadingAssignments
                              }
                              className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              max={state.selectedTopN}
                              value={state.judgeAssignments[judge.id] || 0}
                              onChange={(e) => {
                                const value = Math.max(0, Number.parseInt(e.target.value) || 0)
                                updateJudgeAssignment(judge.id, value)
                              }}
                              className="w-16 text-center h-8 border-gray-300 focus:border-gray-900 focus:ring-gray-900/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              style={{ MozAppearance: "textfield" }}
                              disabled={state.isLoadingAssignments}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateJudgeAssignment(judge.id, (state.judgeAssignments[judge.id] || 0) + 1)
                              }
                              disabled={
                                state.selectedTopN === 0 ||
                                (state.judgeAssignments[judge.id] || 0) >= state.selectedTopN ||
                                state.isLoadingAssignments
                              }
                              className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="text-gray-900">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 text-gray-700 hover:bg-gray-50">
                                <Eye className="w-4 h-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateJudgeAssignment(judge.id, 0)}
                                className="gap-2 text-gray-700 hover:bg-gray-50"
                              >
                                <X className="w-4 h-4" />
                                Clear Assignment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!state.isLoadingJudges && <PaginationComponent />}
          </CardContent>
        </Card>
      </div>

      {/* Configure Participants Dialog */}
      <Dialog
        open={state.showConfigDialog}
        onOpenChange={(open) => dispatch({ type: "SET_DIALOG", payload: { dialog: "config", open } })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              Configure Participants
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Select how many top-ranked participants should be distributed to judges.
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
                  ${topNValidation.ok
                    ? "border-gray-300 focus:border-gray-900 focus:ring-gray-900/20"
                    : "border-red-300 focus:border-red-500 focus:ring-red-500/20"}
                `}
                style={{ MozAppearance: "textfield" }}
              />
              <p className={`text-sm ${topNValidation.ok ? "text-gray-500" : "text-red-600"}`}>
                {topNValidation.msg}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 50, 100].map((n) => (
                <Button
                  key={n}
                  onClick={() => dispatch({ type: "SET_SELECTED_TOP_N", payload: Math.min(n, state.totalParticipants) })}
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
                "Save Configuration"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Distribution Settings Dialog */}
      <Dialog
        open={state.showDistributeDialog}
        onOpenChange={(open) => dispatch({ type: "SET_DIALOG", payload: { dialog: "distribute", open } })}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Shuffle className="w-5 h-5" />
              Distribution Settings
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Choose how participants should be distributed among judges.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-4">
              <label className="flex items-start gap-4 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="assignmentMethod"
                  value="Round-Robin"
                  checked={state.assignmentMethod === "Round-Robin"}
                  onChange={(e) =>
                    dispatch({ type: "SET_ASSIGNMENT_METHOD", payload: e.target.value as AssignmentMethod })
                  }
                  className="w-4 h-4 mt-1 accent-gray-900"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Round-Robin Distribution</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Automatically distribute participants evenly across all judges
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="assignmentMethod"
                  value="Weighted"
                  checked={state.assignmentMethod === "Weighted"}
                  onChange={(e) =>
                    dispatch({ type: "SET_ASSIGNMENT_METHOD", payload: e.target.value as AssignmentMethod })
                  }
                  className="w-4 h-4 mt-1 accent-gray-900"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Weighted Distribution</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Distribute based on individual judge capacity settings
                  </div>
                </div>
              </label>
            </div>

            {state.assignmentMethod === "Weighted" && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-medium mb-2 text-gray-900">Assignment Summary</div>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="font-semibold text-gray-900">{state.selectedTopN}</div>
                    <div className="text-gray-600">To Assign</div>
                  </div>
                  <div>
                    <div
                      className={`font-semibold ${
                        totalAssigned > state.selectedTopN ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {totalAssigned}
                    </div>
                    <div className="text-gray-600">Assigned</div>
                  </div>
                  <div>
                    <div className="font-semibold text-amber-600">{state.selectedTopN - totalAssigned}</div>
                    <div className="text-gray-600">Remaining</div>
                  </div>
                </div>
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
              onClick={handleDistributeParticipants}
              disabled={state.isDistributing || !state.assignmentMethod || state.selectedTopN === 0}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {state.isDistributing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Distributing...
                </>
              ) : (
                "Distribute Participants"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
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
                  await saveConfigToFirestore(state.currentUser.uid)
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
    </div>
  )
}
