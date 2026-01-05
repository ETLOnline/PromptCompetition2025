"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader, Calendar, Clock, Users, BookOpen, CheckCircle2 } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { useNotifications } from "@/hooks/useNotifications"
import { Notifications } from "@/components/Notifications"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore"

interface BatchSchedule {
  batchId: string
  batchName: string
  startTime: Date
  endTime: Date
  challengeIds: string[]
  participantIds: string[]
}

interface ParticipantInfo {
  uid: string
  fullName: string
  email: string
}

interface BatchAssignment {
  batchId: string
  schedule: BatchSchedule
  assignedParticipants: ParticipantInfo[]
  participantEvaluationStatus: { [participantId: string]: { evaluated: number; total: number } }
}

export default function Level2JudgeDashboard() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string

  const [userUID, setUserID] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [competitionTitle, setCompetitionTitle] = useState<string>("")
  const [batchAssignments, setBatchAssignments] = useState<BatchAssignment[]>([])
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
      loadLevel2Data(userUID)
    }
  }, [isAuthenticated, userUID, competitionId])

  const loadLevel2Data = async (userId: string) => {
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

      // Fetch judge document to get assignments
      const judgeRef = doc(db, "competitions", competitionId, "judges", userId)
      const judgeSnap = await getDoc(judgeRef)

      if (!judgeSnap.exists()) {
        addNotification("error", "You are not assigned to this competition")
        router.push("/judge")
        return
      }

      const judgeData = judgeSnap.data()
      const assignments = judgeData?.assignments || {}

      // Fetch batch schedules and participant info
      const batchData: BatchAssignment[] = []

      for (const [batchId, participantIds] of Object.entries(assignments)) {
        if (batchId === "competitionId" || batchId === "judgeId" || batchId === "judgeName") continue
        if (!Array.isArray(participantIds)) continue

        // Fetch batch schedule
        const scheduleRef = doc(db, "competitions", competitionId, "schedules", batchId)
        const scheduleSnap = await getDoc(scheduleRef)

        if (scheduleSnap.exists()) {
          const scheduleData = scheduleSnap.data()
          
          // Fetch participant information and evaluation status
          const participantInfos: ParticipantInfo[] = []
          const evaluationStatus: { [participantId: string]: { evaluated: number; total: number } } = {}
          
          for (const participantId of participantIds as string[]) {
            try {
              const participantRef = doc(db, "competitions", competitionId, "participants", participantId)
              const participantSnap = await getDoc(participantRef)
              
              if (participantSnap.exists()) {
                const pData = participantSnap.data()
                participantInfos.push({
                  uid: participantId,
                  fullName: pData?.fullName || "Unknown Participant",
                  email: pData?.email || "No email"
                })

                // Check evaluation status for this participant
                const evalRef = doc(db, "competitions", competitionId, "judges", userId, "level2Evaluations", participantId)
                const evalSnap = await getDoc(evalRef)
                
                const totalChallenges = scheduleData.challengeIds?.length || 0
                let evaluatedChallenges = 0
                
                if (evalSnap.exists()) {
                  const evalData = evalSnap.data()
                  const evaluatedChallengeIds = evalData?.evaluatedChallenges || []
                  evaluatedChallenges = Array.isArray(evaluatedChallengeIds) ? evaluatedChallengeIds.length : 0
                }
                
                evaluationStatus[participantId] = {
                  evaluated: evaluatedChallenges,
                  total: totalChallenges
                }
              }
            } catch (error) {
              console.error(`Error fetching participant ${participantId}:`, error)
            }
          }

          batchData.push({
            batchId,
            schedule: {
              batchId,
              batchName: scheduleData.batchName || batchId,
              startTime: scheduleData.startTime?.toDate?.() || new Date(scheduleData.startTime),
              endTime: scheduleData.endTime?.toDate?.() || new Date(scheduleData.endTime),
              challengeIds: scheduleData.challengeIds || [],
              participantIds: scheduleData.participantIds || []
            },
            assignedParticipants: participantInfos,
            participantEvaluationStatus: evaluationStatus
          })
        }
      }

      // Sort batches by start time
      batchData.sort((a, b) => a.schedule.startTime.getTime() - b.schedule.startTime.getTime())
      setBatchAssignments(batchData)

    } catch (error) {
      console.error("Error loading Level 2 data:", error)
      addNotification("error", "Failed to load competition details")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit"
    })
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
          <p className="text-gray-900 font-medium mt-4">Loading assignments...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{competitionTitle}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-purple-100 text-purple-700">Level 2</Badge>
                <Badge variant="outline" className="text-gray-600">
                  <Users className="w-3 h-3 mr-1" />
                  {batchAssignments.reduce((sum, ba) => sum + ba.assignedParticipants.length, 0)} participants assigned
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/judge")}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Batch Assignments */}
        {batchAssignments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assignments Yet</h3>
              <p className="text-gray-600">
                You haven't been assigned any participants for this competition yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {batchAssignments.map((batchAssignment) => (
              <Card key={batchAssignment.batchId} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        {batchAssignment.schedule.batchName}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(batchAssignment.schedule.startTime)}</span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <span>{formatTime(batchAssignment.schedule.startTime)} - {formatTime(batchAssignment.schedule.endTime)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-white">
                        <Users className="w-3 h-3 mr-1" />
                        {batchAssignment.assignedParticipants.length} assigned
                      </Badge>
                      <Badge variant="secondary" className="bg-white">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {batchAssignment.schedule.challengeIds.length} challenges
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Challenge IDs */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Challenges</h4>
                    <div className="flex flex-wrap gap-2">
                      {batchAssignment.schedule.challengeIds.map((challengeId) => (
                        <Badge key={challengeId} variant="outline" className="text-xs">
                          Challenge {challengeId}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Assigned Participants */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Assigned Participants</h4>
                    <div className="space-y-3">
                      {batchAssignment.assignedParticipants.map((participant) => (
                        <div
                          key={participant.uid}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarFallback className="bg-slate-900 text-white font-semibold">
                                {participant.fullName
                                  .split(" ")
                                  .map((word) => word[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {participant.fullName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {participant.email}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => router.push(`/judge/${competitionId}/level2/${batchAssignment.batchId}/${participant.uid}`)}
                            size="sm"
                            className={`ml-3 flex-shrink-0 ${
                              batchAssignment.participantEvaluationStatus[participant.uid]?.evaluated === 
                              batchAssignment.participantEvaluationStatus[participant.uid]?.total
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-slate-900 hover:bg-slate-800"
                            } text-white`}
                          >
                            {batchAssignment.participantEvaluationStatus[participant.uid]?.evaluated === 
                             batchAssignment.participantEvaluationStatus[participant.uid]?.total ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Update Score
                              </>
                            ) : (
                              "View Submissions"
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
