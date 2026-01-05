"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Shield, Loader2 } from "lucide-react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { fetchWithAuth, fetchLevel2JudgeProgress } from "@/lib/api"

interface ChallengeProgress {
  challengeId: string
  totalParticipants: number
  evaluatedParticipants: number
}

interface BatchProgress {
  batchName: string
  assignedParticipants: string[]
  challengeProgress: ChallengeProgress[]
}

interface JudgeProgress {
  judgeId: string
  judgeName: string
  totalAssignedParticipants: number
  evaluatedParticipants: number
  batchProgress: {
    [batchId: string]: BatchProgress
  }
}

interface JudgeProgressProps {
  competitionId: string
}

export default function JudgeProgressLevel2({ competitionId }: JudgeProgressProps) {
  const [judges, setJudges] = useState<JudgeProgress[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allJudgesCompleted, setAllJudgesCompleted] = useState(false)
  const router = useRouter()

  // Function to update AllJudgeEvaluated field
  const updateAllJudgeEvaluated = async (value: boolean) => {
    try {
      const competitionRef = doc(db, "competitions", competitionId)
      await updateDoc(competitionRef, {
        AllJudgeEvaluated: value
      })
    } catch (error) {
      console.error("Error updating AllJudgeEvaluated:", error)
    }
  }

  // Function to check if all judges have completed their evaluations
  const checkAllJudgesCompleted = (judgesData: JudgeProgress[]) => {
    if (judgesData.length === 0) return false
    
    return judgesData.every(judge => {
      const overallProgress = judge.totalAssignedParticipants > 0
        ? (judge.evaluatedParticipants / judge.totalAssignedParticipants) * 100
        : 0
      return overallProgress === 100
    })
  }

  useEffect(() => {
    const initialize = async () => {
      const authed = await checkAuthAndLoad()
      if (authed) {
        await fetchJudgeProgress()
      }
    }
    initialize()
  }, [competitionId])

  const checkAuthAndLoad = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`)
      setRole(profile.role)
      return true
    } catch (error) {
      console.error("Auth error:", error)
      router.push("/")
      return false
    }
  }

  const fetchJudgeProgress = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetchLevel2JudgeProgress(competitionId)
      const judgesData: JudgeProgress[] = response.judges || []

      setJudges(judgesData)

      // Check if all judges are completed
      const allCompleted = checkAllJudgesCompleted(judgesData)
      setAllJudgesCompleted(allCompleted)

      // Update AllJudgeEvaluated if conditions are met
      if (allCompleted && role === 'superadmin') {
        await updateAllJudgeEvaluated(true)
      }
    } catch (err: any) {
      console.error("Error fetching judge progress:", err)
      setError(err.message || "Failed to fetch judge progress")
      setJudges([])
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Loading Judge Progress</h3>
              <p className="text-gray-500">Please wait while we fetch the data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm border-0 border-red-200">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-red-100 rounded-full">
              <Users className="h-8 w-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Error Loading Progress</h3>
              <p className="text-gray-500">{error}</p>
              <button
                onClick={fetchJudgeProgress}
                className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state - no judges with assignments
  if (judges.length === 0) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">No Judges Assigned</h3>
              <p className="text-gray-500">No judges have been assigned to participants yet.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Display overall completion status for superadmin */}
      {role === 'superadmin' && (
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Competition Status</h3>
                  <p className="text-sm text-gray-600">All judges evaluation status</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${allJudgesCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                  {allJudgesCompleted ? 'All Complete' : 'In Progress'}
                </div>
                {allJudgesCompleted && (
                  <div className="text-xs text-green-500 font-medium">
                    AllJudgeEvaluated: true
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {judges.map((judge) => {
        const overallProgress =
          judge.totalAssignedParticipants > 0
            ? (judge.evaluatedParticipants / judge.totalAssignedParticipants) * 100
            : 0

        // Collect all challenges from all batches
        const allChallenges: { 
          batchId: string
          batchName: string
          challengeId: string
          totalParticipants: number
          evaluatedParticipants: number 
        }[] = []

        Object.entries(judge.batchProgress).forEach(([batchId, batchData]) => {
          batchData.challengeProgress.forEach(challenge => {
            allChallenges.push({
              batchId,
              batchName: batchData.batchName,
              challengeId: challenge.challengeId,
              totalParticipants: challenge.totalParticipants,
              evaluatedParticipants: challenge.evaluatedParticipants,
            })
          })
        })

        return (
          <Card
            key={judge.judgeId}
            className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden"
          >
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {judge.judgeName}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">
                        {judge.evaluatedParticipants} of {judge.totalAssignedParticipants} participants
                        completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-black">
                      {Math.round(overallProgress)}%
                    </div>
                    <div className="text-sm text-gray-500 font-medium">Complete</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Overall Progress
                    </span>
                    <span className="text-sm text-gray-600">
                      {judge.evaluatedParticipants}/{judge.totalAssignedParticipants}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                      <div
                        className="h-3 rounded-full shadow-sm transition-all duration-500 ease-out relative overflow-hidden"
                        style={{
                          width: `${overallProgress}%`,
                          backgroundColor: "#0f131cff",
                        }}
                      >
                        <div className="absolute inset-0 bg-white opacity-10"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-gray-900">Challenge Breakdown</h4>
                  <div className="px-3 py-1 bg-gray-100 rounded-full">
                    <span className="text-sm font-medium text-gray-600">
                      {allChallenges.length} {allChallenges.length === 1 ? 'Challenge' : 'Challenges'}
                    </span>
                  </div>
                </div>

                {allChallenges.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No challenges assigned yet
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allChallenges.map((challenge, index) => {
                      const challengeProgress =
                        challenge.totalParticipants > 0
                          ? (challenge.evaluatedParticipants / challenge.totalParticipants) * 100
                          : 0

                      const gradientColors = [
                        "from-slate-600 to-slate-900",
                        "from-blue-600 to-indigo-700",
                        "from-emerald-600 to-teal-700",
                        "from-orange-600 to-amber-700",
                        "from-purple-600 to-violet-700",
                      ]

                      const gradientClass = gradientColors[index % gradientColors.length]

                      return (
                        <div
                          key={`${challenge.batchId}-${challenge.challengeId}`}
                          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-3 h-3 rounded-full bg-gradient-to-r ${gradientClass}`}
                              ></div>
                              <div className="text-sm font-bold text-gray-900">
                                Challenge {challenge.challengeId}
                              </div>
                            </div>
                            <div className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                              {challenge.evaluatedParticipants}/{challenge.totalParticipants}
                            </div>
                          </div>

                          <div className="mb-2">
                            <div className="text-xs text-gray-600 font-medium">
                              {challenge.batchName}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="relative">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 shadow-inner">
                                <div
                                  className={`bg-gradient-to-r ${gradientClass} h-2.5 rounded-full shadow-sm transition-all duration-700 ease-out`}
                                  style={{ width: `${challengeProgress}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-700">
                                {Math.round(challengeProgress)}% complete
                              </span>
                              {challengeProgress === 100 && (
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs font-medium text-green-600">
                                    Done
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
