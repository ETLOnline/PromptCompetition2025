"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { useNotifications } from "@/hooks/useNotifications"
import { CompetitionStats } from "@/components/Judge/CompetitionStats"
import { ChallengeList } from "@/components/Judge/ChallengeList"
import { Notifications } from "@/components/Notifications"
import type { CompetitionAssignment } from "@/types/judge-submission"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function CompetitionPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string

  const [userUID, setUserID] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [assignment, setAssignment] = useState<CompetitionAssignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { notifications, addNotification, removeNotification } = useNotifications();


  // Auth effect
  useEffect(() => {
    checkAuth()
  }, [router])

  const checkAuth = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_JUDGE_AUTH}`)
      setUserID(profile.uid)
    } catch (error) {
      router.push("/")
    } finally {
      setIsAuthenticated(true)
    }
  }

  // Load assignment when authenticated
  useEffect(() => {
    if (isAuthenticated && userUID) {
      loadAssignment(userUID)
    }
  }, [isAuthenticated, userUID])

  const loadAssignment = async (userId: string) => {
    try {
      setIsLoading(true)

      // Check if this is a Level 2 competition and redirect if necessary
      const competitionRef = doc(db, "competitions", competitionId)
      const competitionSnap = await getDoc(competitionRef)
      
      if (competitionSnap.exists()) {
        const competitionData = competitionSnap.data()
        if (competitionData?.level === "Level 2") {
          // Redirect to Level 2 dashboard
          router.push(`/judge/${competitionId}/level2`)
          return
        }
      }

      const assignmentData = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/judge/assignment/${userId}/${competitionId}`
      )

      if (!assignmentData) {
        addNotification("error", "You are not assigned to this competition")
        router.push("/judge")
        return
      }

      // Ensure challengesEvaluated exists to simplify UI logic in ChallengeList
      setAssignment({
        ...assignmentData,
        challengesEvaluated: assignmentData.challengesEvaluated ?? {}
      })
    } catch (error) {
      addNotification("error", "Failed to load competition details")
    } finally {
      setIsLoading(false)
    }
  }

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
      <Notifications notifications={notifications} removeNotification={removeNotification} />

      <div className="container mx-auto px-6 space-y-6">
        {assignment && <CompetitionStats assignment={assignment} isLoading={isLoading} />}

        <ChallengeList
          assignment={assignment}
          isLoading={isLoading}
          competitionId={competitionId}
          onNavigate={(challengeId) => router.push(`/judge/${competitionId}/${challengeId}`)}
        />
      </div>
    </div>
  )
}
