"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { JudgeStats } from "@/components/Judge/JudgeStats"
import { JudgeAssignmentsList } from "@/components/Judge/JudgeAssignmentsList"
import { Notifications } from "@/components/Notifications"
import { fetchWithAuth } from "@/lib/api"
import type { JudgeAssignment, JudgeStats as JudgeStatsType } from "@/types/judge-submission"
import { useNotifications } from "@/hooks/useNotifications"

export default function JudgePage() {
  const router = useRouter()
  const [userID, setUserID] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const { notifications, removeNotification } = useNotifications()

  const checkAuth = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_JUDGE_AUTH}`)
      setUserID(profile.uid)

      const userAssignments = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/judge/assignments/${profile.uid}`
      )
      // console.log("judge assigned assignments:", userAssignments)
      setAssignments(userAssignments)
    } catch (error) {
      console.error("Authentication failed:", error)
      router.push("/")
      return
    } finally {
      setIsAuthenticated(true)
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()    
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6 space-y-8">
          <JudgeStatsSkeleton />
          <JudgeAssignmentsListSkeleton />
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !userID) {
    return null
  }

  const stats: JudgeStatsType = {
    activeCompetitions: assignments.length,
    totalSubmissions: assignments.reduce((sum, a) => sum + a.submissionCount, 0),
    challenges: assignments.reduce(
      (sum, a) => sum + Object.keys(a.assignedCountsByChallenge).length,
      0
    ),
    evaluatedSubmissions: assignments.reduce((sum, a) => sum + (a.evaluatedCount || 0), 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Notifications
        notifications={notifications}
        removeNotification={removeNotification}
      />


      <div className="container mx-auto p-6 space-y-8">
        <JudgeStats stats={stats} />
        <JudgeAssignmentsList assignments={assignments} />
      </div>
    </div>
  )
}

// Skeleton components
function JudgeStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

function JudgeAssignmentsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
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
          </div>
        ))}
      </div>
    </div>
  )
}
