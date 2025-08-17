"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Shield } from "lucide-react"
import { collection, onSnapshot, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Judge {
  judgeId: string
  assignedCountsByChallenge: Record<string, number>
  submissionsByChallenge: Record<string, string[]>
  assignedCountTotal: number
  completedCount: number
  challengeProgress: Array<{
    challengeId: string
    assigned: number
    completed: number
  }>
  displayName?: string
}

interface JudgeProgressProps {
  competitionId: string
}

export default function JudgeProgress({ competitionId }: JudgeProgressProps) {
  const [judges, setJudges] = useState<Judge[]>([])

  useEffect(() => {
    const judgesRef = collection(db, `competitions/${competitionId}/judges`)
    const submissionsRef = collection(db, `competitions/${competitionId}/submissions`)

    // Listen to both collections
    const unsubJudges = onSnapshot(judgesRef, async (judgesSnap) => {
      const unsubSubmissions = onSnapshot(submissionsRef, async (submissionsSnap) => {
        // Build submissions map for O(1) lookups
        const submissionsMap = new Map(
          submissionsSnap.docs.map((doc) => [doc.id, doc.data()])
        )

        // Collect all judge IDs to batch fetch names
        const judgeIds = judgesSnap.docs.map((j) => j.id)
        let usersMap = new Map<string, any>()

        if (judgeIds.length > 0) {
          const usersSnap = await getDocs(
            query(collection(db, "users"), where("__name__", "in", judgeIds))
          )
          usersMap = new Map(usersSnap.docs.map((doc) => [doc.id, doc.data()]))
        }

        const judgesData: Judge[] = []

        for (const judgeDoc of judgesSnap.docs) {
          const judgeData = judgeDoc.data()
          const judgeId = judgeDoc.id

          const assignedCountsByChallenge = judgeData.assignedCountsByChallenge || {}
          const submissionsByChallenge = judgeData.submissionsByChallenge || {}
          const assignedCountTotal = judgeData.assignedCountTotal || 0

          // Calculate completed submissions for this judge
          let completedCount = 0
          const challengeProgress: Array<{
            challengeId: string
            assigned: number
            completed: number
          }> = []

          Object.keys(assignedCountsByChallenge).forEach((challengeId) => {
            const assignedForChallenge = assignedCountsByChallenge[challengeId] || 0
            const submissionIds = submissionsByChallenge[challengeId] || []

            let completedForChallenge = 0

            submissionIds.forEach((submissionId) => {
              const submissionData = submissionsMap.get(submissionId)
              if (submissionData?.status === "scored") {
                completedForChallenge++
                completedCount++
              }
            })

            challengeProgress.push({
              challengeId,
              assigned: assignedForChallenge,
              completed: completedForChallenge,
            })
          })

          const displayName =
            usersMap.get(judgeId)?.displayName || judgeId.slice(0, 8)

          judgesData.push({
            judgeId,
            assignedCountsByChallenge,
            submissionsByChallenge,
            assignedCountTotal,
            completedCount,
            challengeProgress,
            displayName,
          })
        }

        setJudges(judgesData)
      })

      return unsubSubmissions
    })

    return () => {
      unsubJudges()
    }
  }, [competitionId])

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
              <p className="text-gray-500">No judges have been assigned to this competition yet.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {judges.map((judge) => {
        const overallProgress =
          judge.assignedCountTotal > 0
            ? (judge.completedCount / judge.assignedCountTotal) * 100
            : 0

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
                        {judge.displayName || `Judge ${judge.judgeId.slice(0, 8)}`}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">
                        {judge.completedCount} of {judge.assignedCountTotal} evaluations
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
                      {judge.completedCount}/{judge.assignedCountTotal}
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
                      {judge.challengeProgress.length} Challenges
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {judge.challengeProgress.map((challenge, index) => {
                    const challengeProgress =
                      challenge.assigned > 0
                        ? (challenge.completed / challenge.assigned) * 100
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
                        key={challenge.challengeId}
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
                            {challenge.completed}/{challenge.assigned}
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
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
