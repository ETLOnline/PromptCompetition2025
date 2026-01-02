"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader, Target, CheckCircle2, Clock, ChevronRight, AlertCircle } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { useNotifications } from "@/hooks/useNotifications"
import { Notifications } from "@/components/Notifications"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

interface Challenge {
  id: string
  title: string
}

interface ParticipantStats {
  totalChallenges: number
  evaluatedChallenges: number
  remainingChallenges: number
}

export default function ParticipantSubmissionDashboard() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const batchId = params?.batchId as string
  const participantId = params?.participantId as string

  const [userUID, setUserID] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [competitionTitle, setCompetitionTitle] = useState<string>("")
  const [batchName, setBatchName] = useState<string>("")
  const [participantName, setParticipantName] = useState<string>("")
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [evaluatedChallenges, setEvaluatedChallenges] = useState<string[]>([])
  const [stats, setStats] = useState<ParticipantStats>({
    totalChallenges: 0,
    evaluatedChallenges: 0,
    remainingChallenges: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const { notifications, addNotification, removeNotification } = useNotifications()

  // Auth effect
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_JUDGE_AUTH}`)
      setUserID(profile.uid)
      setIsAuthenticated(true)
    } catch (error) {
      router.push("/")
    }
  }

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated && userUID) {
      loadParticipantData(userUID)
    }
  }, [isAuthenticated, userUID, competitionId, batchId, participantId])

  const loadParticipantData = async (judgeId: string) => {
    try {
      setIsLoading(true)

      // Fetch competition title
      const competitionRef = doc(db, "competitions", competitionId)
      const competitionSnap = await getDoc(competitionRef)
      if (competitionSnap.exists()) {
        const compData = competitionSnap.data()
        setCompetitionTitle(compData?.title || "Competition")

        // Verify it's a Level 2 competition
        if (compData?.level !== "Level 2") {
          addNotification("error", "This is not a Level 2 competition")
          router.push(`/judge/${competitionId}`)
          return
        }
      }

      // Fetch participant name
      const participantRef = doc(db, "competitions", competitionId, "participants", participantId)
      const participantSnap = await getDoc(participantRef)
      if (participantSnap.exists()) {
        const pData = participantSnap.data()
        setParticipantName(pData?.fullName || "Unknown Participant")
      }

      // Fetch batch schedule to get challenge IDs
      const scheduleRef = doc(db, "competitions", competitionId, "schedules", batchId)
      const scheduleSnap = await getDoc(scheduleRef)
      
      if (!scheduleSnap.exists()) {
        addNotification("error", "Batch schedule not found")
        router.push(`/judge/${competitionId}/level2`)
        return
      }

      const scheduleData = scheduleSnap.data()
      setBatchName(scheduleData?.batchName || batchId)
      const challengeIds: string[] = scheduleData?.challengeIds || []

      // Fetch challenge details
      const challengeData: Challenge[] = []
      for (const challengeId of challengeIds) {
        try {
          const challengeRef = doc(db, "competitions", competitionId, "challenges", challengeId)
          const challengeSnap = await getDoc(challengeRef)
          
          if (challengeSnap.exists()) {
            const cData = challengeSnap.data()
            challengeData.push({
              id: challengeId,
              title: cData?.title || `Challenge ${challengeId}`
            })
          }
        } catch (error) {
          console.error(`Error fetching challenge ${challengeId}:`, error)
        }
      }

      setChallenges(challengeData)

      // Fetch evaluation stats from judge document
      // Path: /competitions/{competitionId}/judges/{judgeId}/level2Evaluations/{participantId}
      try {
        const evalRef = doc(db, "competitions", competitionId, "judges", judgeId, "level2Evaluations", participantId)
        const evalSnap = await getDoc(evalRef)
        
        if (evalSnap.exists()) {
          const evalData = evalSnap.data()
          const evaluatedChallenges = evalData?.evaluatedChallenges || []
          const totalChallenges = challengeData.length
          const evaluated = Array.isArray(evaluatedChallenges) ? evaluatedChallenges.length : 0
          
          setEvaluatedChallenges(evaluatedChallenges)
          setStats({
            totalChallenges,
            evaluatedChallenges: evaluated,
            remainingChallenges: totalChallenges - evaluated
          })
        } else {
          // No evaluation data yet - all challenges are pending
          setEvaluatedChallenges([])
          setStats({
            totalChallenges: challengeData.length,
            evaluatedChallenges: 0,
            remainingChallenges: challengeData.length
          })
        }
      } catch (error) {
        console.error("Error fetching evaluation stats:", error)
        // Default stats if error occurs
        setEvaluatedChallenges([])
        setStats({
          totalChallenges: challengeData.length,
          evaluatedChallenges: 0,
          remainingChallenges: challengeData.length
        })
      }

    } catch (error) {
      console.error("Error loading participant data:", error)
      addNotification("error", "Failed to load participant details")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="animate-spin w-8 h-8 text-gray-900" />
          <p className="text-gray-900 font-medium mt-4">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="animate-spin w-8 h-8 text-gray-900" />
          <p className="text-gray-900 font-medium mt-4">Loading submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Notifications notifications={notifications} removeNotification={removeNotification} />

      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{participantName}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {competitionTitle} • {batchName}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/judge/${competitionId}/level2`)}
            >
              Back to Assignments
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Challenges</p>
                  <p className="text-3xl font-bold tracking-tight text-gray-900">
                    {stats.totalChallenges}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Evaluated</p>
                  <p className="text-3xl font-bold tracking-tight text-green-600">
                    {stats.evaluatedChallenges}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                  <p className="text-3xl font-bold tracking-tight text-amber-600">
                    {stats.remainingChallenges}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Challenge List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Challenges</h2>
              <p className="text-gray-600">Click on any challenge to evaluate submissions</p>
            </div>
          </div>

          {challenges.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Challenges Found</h3>
                <p className="text-gray-600">
                  There are no challenges assigned to this batch yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-slate-900 text-white font-bold text-lg">
                            {challenge.id}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1 flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {challenge.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Challenge {challenge.id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {evaluatedChallenges.includes(challenge.id) ? (
                          <Button
                            onClick={() => router.push(`/judge/${competitionId}/level2/${batchId}/${participantId}/${challenge.id}`)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Update Score
                          </Button>
                        ) : (
                          <Button
                            onClick={() => router.push(`/judge/${competitionId}/level2/${batchId}/${participantId}/${challenge.id}`)}
                            className="bg-slate-900 hover:bg-slate-800 text-white"
                          >
                            Open
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
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
