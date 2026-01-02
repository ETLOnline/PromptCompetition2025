"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { JudgeStats } from "@/components/Judge/JudgeStats"
import { JudgeAssignmentsList } from "@/components/Judge/JudgeAssignmentsList"
import { Notifications } from "@/components/Notifications"
import { fetchWithAuth } from "@/lib/api"
import type { JudgeAssignment, JudgeStats as JudgeStatsType } from "@/types/judge-submission"
import { useNotifications } from "@/hooks/useNotifications"
import { Spinner } from "@/components/ui/spinner"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"


export default function JudgePage() {
  const router = useRouter()
  const [userID, setUserID] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([])
  const [authLoading, setAuthLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)

  const { notifications, removeNotification } = useNotifications()

  const calculateLevel2Stats = async (judgeId: string, competitionId: string) => {
    try {
      let totalParticipants = 0
      let totalChallenges = 0
      let evaluatedSubmissions = 0
      let isFullyEvaluated = true

      // Get judge document for this competition
      const judgeRef = doc(db, "competitions", competitionId, "judges", judgeId)
      const judgeSnap = await getDoc(judgeRef)

      if (judgeSnap.exists()) {
        const judgeData = judgeSnap.data()
        const assignments = judgeData?.assignments || {}

        // Process each batch assignment
        for (const [batchId, participantIds] of Object.entries(assignments)) {
          if (batchId === "competitionId" || batchId === "judgeId" || batchId === "judgeName") continue
          if (!Array.isArray(participantIds)) continue

          // Get batch schedule to know total challenges
          const scheduleRef = doc(db, "competitions", competitionId, "schedules", batchId)
          const scheduleSnap = await getDoc(scheduleRef)

          let challengesInBatch = 0
          if (scheduleSnap.exists()) {
            const challengeIds = scheduleSnap.data()?.challengeIds || []
            challengesInBatch = challengeIds.length
          }

          // Count participants and challenges
          totalParticipants += participantIds.length
          totalChallenges += participantIds.length * challengesInBatch

          // Check evaluation status for each participant
          for (const participantId of participantIds as string[]) {
            const evalRef = doc(db, "competitions", competitionId, "judges", judgeId, "level2Evaluations", participantId)
            const evalSnap = await getDoc(evalRef)

            if (evalSnap.exists()) {
              const evalData = evalSnap.data()
              const evaluatedChallengeIds = evalData?.evaluatedChallenges || []
              const evaluatedCount = Array.isArray(evaluatedChallengeIds) ? evaluatedChallengeIds.length : 0
              evaluatedSubmissions += evaluatedCount

              // Check if this participant is fully evaluated
              if (evaluatedCount < challengesInBatch) {
                isFullyEvaluated = false
              }
            } else {
              // No evaluation data means not fully evaluated
              isFullyEvaluated = false
            }
          }
        }
      }

      return {
        totalParticipants,
        totalChallenges,
        evaluatedSubmissions,
        isFullyEvaluated
      }
    } catch (error) {
      console.error("Error calculating Level 2 stats:", error)
      return {
        totalParticipants: 0,
        totalChallenges: 0,
        evaluatedSubmissions: 0,
        isFullyEvaluated: false
      }
    }
  }

  const checkAuth = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_JUDGE_AUTH}`)
      setUserID(profile.uid)
      setIsAuthenticated(true)
      setAuthLoading(false)

      // Load assignments after auth completes
      const userAssignments = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/judge/assignments/${profile.uid}`
      ) 
      console.log("Fetched assignments:", userAssignments)
      
      // Update Level 2 assignments with correct stats
      const updatedAssignments = await Promise.all(
        userAssignments.map(async (assignment: any) => {
          if (assignment.level === "Level 2") {
            // Calculate Level 2 stats in runtime
            const level2Stats = await calculateLevel2Stats(profile.uid, assignment.competitionId)
            return {
              ...assignment,
              participantCount: level2Stats.totalParticipants,
              submissionCount: level2Stats.totalChallenges, // Total challenges (participant * challenges per participant)
              evaluatedCount: level2Stats.evaluatedSubmissions,
              AllChallengesEvaluated: level2Stats.isFullyEvaluated
            }
          }
          return assignment
        })
      )
      
      setAssignments(updatedAssignments)
    } catch (error) {
      console.error("Authentication failed:", error)
      router.push("/")
      return
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()    
  }, [])

  // Stage 1: Show full page spinner during authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    )
  }

  if (!isAuthenticated || !userID) {
    return null
  }

  // Stage 2: Show skeleton components while loading data
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 p-6 space-y-8">
          <JudgeStatsSkeleton />
          <JudgeAssignmentsListSkeleton />
        </div>
      </div>
    )
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
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
