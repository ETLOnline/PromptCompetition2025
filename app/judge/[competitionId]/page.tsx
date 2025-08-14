"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Scale,
  ChevronRight,
  Loader,
  AlertCircle,
  CheckCircle2,
  X,
  Users,
  Target,
} from "lucide-react"
import { doc, getDoc, type DocumentData } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { fetchWithAuth } from "@/lib/api";

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

export default function CompetitionPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string

  const [userUID, setUserID] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [assignment, setAssignment] = useState<JudgeAssignment | null>(null)
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

  // Fetch judge assignment for this competition
  const fetchAssignment = useCallback(
    async (userId: string) => {
      try {
        setIsLoading(true)

        // Single doc read as specified
        const judgeDocRef = doc(db, "competitions", competitionId, "judges", userId)
        const judgeDoc = await getDoc(judgeDocRef)

        if (!judgeDoc.exists()) {
          showNotification("error", "Access Denied", "You are not assigned to this competition")
          router.push("/judge")
          return
        }

        const data = judgeDoc.data() as DocumentData
        setAssignment({
          judgeId: data.judgeId,
          competitionId: data.competitionId,
          competitionTitle: data.competitionTitle || `Competition ${competitionId}`,
          assignedCountTotal: data.assignedCountTotal || 0,
          assignedCountsByChallenge: data.assignedCountsByChallenge || {},
          submissionsByChallenge: data.submissionsByChallenge || {},
          updatedAt: data.updatedAt,
        })
      } catch (error) {
        console.error("Error fetching assignment:", error)
        showNotification("error", "Loading Error", "Failed to load competition details")
      } finally {
        setIsLoading(false)
      }
    },
    [competitionId, showNotification, router],
  )

  // Load assignment when authenticated
  useEffect(() => {
    if (isAuthenticated && userUID) {
      fetchAssignment(userUID)
    }
  }, [isAuthenticated, fetchAssignment])

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
  const ChallengeRowSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
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
        {/* Stats Overview */}
        {assignment && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                    <p className="text-3xl font-bold tracking-tight text-gray-900">
                      {assignment.assignedCountTotal.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50">
                    <Users className="w-6 h-6 text-blue-600" />
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
                      {Object.keys(assignment.assignedCountsByChallenge).length.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50">
                    <Target className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-lg font-bold tracking-tight text-gray-900">
                      {assignment.updatedAt
                        ? new Date(assignment.updatedAt.seconds * 1000).toLocaleDateString()
                        : "Recently"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50">
                    <Scale className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Challenges List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Assigned Challenges</h2>
              <p className="text-gray-600">Click on any challenge to start scoring submissions</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, i) => (
                <ChallengeRowSkeleton key={i} />
              ))}
            </div>
          ) : !assignment ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Competition Not Found</h3>
                <p className="text-gray-600">You don't have access to this competition or it doesn't exist.</p>
              </CardContent>
            </Card>
          ) : Object.keys(assignment.assignedCountsByChallenge).length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Challenges Assigned</h3>
                <p className="text-gray-600">You haven't been assigned to any challenges in this competition yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(assignment.assignedCountsByChallenge)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([challengeId, count]) => (
                  <Card key={challengeId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className={`${getAvatarColor(challengeId)} text-white font-bold`}>
                              {challengeId.toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-gray-900">Challenge {challengeId}</h3>
                            <p className="text-sm text-gray-600">
                              {count} submission{count !== 1 ? "s" : ""} assigned to you
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="gap-1">
                            <Users className="w-3 h-3" />
                            {count}
                          </Badge>
                          <Button
                            onClick={() => router.push(`/judge/${competitionId}/${challengeId}`)}
                            size="sm"
                            className="bg-gray-900 hover:bg-gray-800"
                          >
                            Start Scoring
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
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
