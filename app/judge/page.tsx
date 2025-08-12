"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Scale, Trophy, ChevronRight, Loader, AlertCircle, CheckCircle2, X, Users } from "lucide-react"
import { collectionGroup, query, where, getDocs, type DocumentData } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getAuth, onAuthStateChanged, type User } from "firebase/auth"
import { getIdTokenResult } from "firebase/auth"

interface JudgeAssignment {
  judgeId: string
  competitionId: string
  competitionTitle: string
  assignedCountTotal: number
  assignedCountsByChallenge: { [challengeId: string]: number }
  updatedAt: any
}

interface NotificationState {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
}

export default function JudgeLandingPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationState[]>([])

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
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth/login/admin")
        return
      }

      try {
        const idTokenResult = await getIdTokenResult(user, true)
        const role = idTokenResult.claims.role
        if (role !== "judge") {
          router.push("/")
          return
        }
        setCurrentUser(user)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Auth error:", error)
        router.push("/auth/login/admin")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Fetch judge assignments
  const fetchAssignments = useCallback(
    async (userId: string) => {
      try {
        setIsLoading(true)

        // Single collection-group query as specified
        const judgesQuery = query(collectionGroup(db, "judges"), where("judgeId", "==", userId))

        const snapshot = await getDocs(judgesQuery)
        const assignmentData: JudgeAssignment[] = []

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as DocumentData
          assignmentData.push({
            judgeId: data.judgeId,
            competitionId: data.competitionId,
            competitionTitle: data.competitionTitle || `Competition ${data.competitionId}`,
            assignedCountTotal: data.assignedCountTotal || 0,
            assignedCountsByChallenge: data.assignedCountsByChallenge || {},
            updatedAt: data.updatedAt,
          })
        })

        setAssignments(assignmentData)
      } catch (error) {
        console.error("Error fetching assignments:", error)
        showNotification("error", "Loading Error", "Failed to load your assignments")
      } finally {
        setIsLoading(false)
      }
    },
    [showNotification],
  )

  // Load assignments when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchAssignments(currentUser.uid)
    }
  }, [isAuthenticated, currentUser, fetchAssignments])

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

  // Loading skeleton
  const AssignmentCardSkeleton = () => (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="space-y-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
            </div>
          </div>
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Active Competitions</p>
                  <p className="text-3xl font-bold tracking-tight text-gray-900">
                    {isLoading ? "-" : assignments.length.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <Trophy className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                  <p className="text-3xl font-bold tracking-tight text-gray-900">
                    {isLoading ? "-" : assignments.reduce((sum, a) => sum + a.assignedCountTotal, 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Challenges</p>
                  <p className="text-3xl font-bold tracking-tight text-gray-900">
                    {isLoading
                      ? "-"
                      : assignments
                          .reduce((sum, a) => sum + Object.keys(a.assignedCountsByChallenge).length, 0)
                          .toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50">
                  <Scale className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Assignments</h2>
              <p className="text-gray-600">Competitions where you are assigned as a judge</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <AssignmentCardSkeleton key={i} />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Scale className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assignments Yet</h3>
                <p className="text-gray-600">
                  You haven't been assigned to any competitions yet. Check back later or contact your administrator.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {assignments.map((assignment) => (
                <Card key={assignment.competitionId} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg text-gray-900 line-clamp-2">
                          {assignment.competitionTitle}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          {Object.keys(assignment.assignedCountsByChallenge).length} challenge
                          {Object.keys(assignment.assignedCountsByChallenge).length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className="gap-1 shrink-0">
                        <Users className="w-3 h-3" />
                        {assignment.assignedCountTotal}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback
                            className={`${getAvatarColor(assignment.competitionTitle)} text-white font-semibold`}
                          >
                            {assignment.competitionTitle
                              .split(" ")
                              .map((word) => word[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">
                            Assigned: {assignment.assignedCountTotal} submissions
                          </p>
                          <p className="text-xs text-gray-600">
                            {assignment.updatedAt
                              ? `Updated ${new Date(assignment.updatedAt.seconds * 1000).toLocaleDateString()}`
                              : "Recently assigned"}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => router.push(`/judge/${assignment.competitionId}`)}
                        size="sm"
                        className="bg-gray-900 hover:bg-gray-800"
                      >
                        Open
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
