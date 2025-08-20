"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Activity, Users, Trophy, BarChart3, Shield, ExternalLink, AlertCircle, ChevronDown, MoreVertical } from "lucide-react"
import GetChallenges from "@/components/GetChallenges"
import JudgeProgress from "@/components/JudgeProgress"
import StartEvaluationButton from "@/components/StartEvaluation"
import GenerateLeaderboardButton from "@/components/GenerateLeaderboard"
import { collection, onSnapshot, query, where, doc, getDoc, getDocs, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Judge } from "@/types/JudgeProgress"
import { fetchWithAuth } from "@/lib/api"

export default function AdminDashboard() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const [totalSubmissions, setSubmissionCount] = useState<number>(0)
  const [stats, setStats] = useState({ totalParticipants: 0, pendingReviews: 0 })
  const [activeTab, setActiveTab] = useState<"challenges" | "judges">("challenges")
  const [role, setRole] = useState(null)
  const [allJudgeEvaluated, setAllJudgeEvaluated] = useState<boolean>(false)
  const [isCheckingJudges, setIsCheckingJudges] = useState<boolean>(false)
  const [generateLeaderboard, setGenerateLeaderboard] = useState<boolean>(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)

  // Function to check if all judges have completed their evaluations
  const checkAllJudgesCompleted = async (): Promise<boolean> => {
    try {
      const judgesRef = collection(db, `competitions/${competitionId}/judges`)
      const judgesSnap = await getDocs(judgesRef)
      
      if (judgesSnap.empty) return false

      const judgesData: Judge[] = []
      
      for (const judgeDoc of judgesSnap.docs) {
        const judgeData = judgeDoc.data()
        const assignedCountTotal = judgeData.assignedCountTotal || 0
        const reviewedCount = judgeData.reviewedCount || 0

        judgesData.push({
          judgeId: judgeDoc.id,
          assignedCountsByChallenge: judgeData.assignedCountsByChallenge || {},
          submissionsByChallenge: judgeData.submissionsByChallenge || {},
          assignedCountTotal,
          completedCount: reviewedCount,
          challengeProgress: [],
          displayName: judgeDoc.id.slice(0, 8),
        })
      }

      return judgesData.every(judge => {
        const overallProgress = judge.assignedCountTotal > 0
          ? (judge.completedCount / judge.assignedCountTotal) * 100
          : 0
        return overallProgress === 100
      })
    } catch (error) {
      console.error("Error checking judges completion:", error)
      return false
    }
  }

  // Function to fetch AllJudgeEvaluated status from competition document
  const fetchAllJudgeEvaluatedStatus = async () => {
    try {
      const competitionRef = doc(db, "competitions", competitionId)
      const competitionDoc = await getDoc(competitionRef)
      
      if (competitionDoc.exists()) {
        const data = competitionDoc.data()
        return data.AllJudgeEvaluated || false
      }
      return false
    } catch (error) {
      console.error("Error fetching AllJudgeEvaluated status:", error)
      return false
    }
  }

  // Function to update AllJudgeEvaluated status in competition document
  const updateAllJudgeEvaluatedStatus = async (status: boolean) => {
    try {
      const competitionRef = doc(db, "competitions", competitionId)
      await updateDoc(competitionRef, {
        AllJudgeEvaluated: status
      })
      console.log(`Updated AllJudgeEvaluated to: ${status}`)
    } catch (error) {
      console.error("Error updating AllJudgeEvaluated status:", error)
    }
  }

  // Function to check and initialize AllJudgeEvaluated status on page load
  const checkAndInitializeAllJudgeEvaluated = async () => {
    try {
      const competitionRef = doc(db, "competitions", competitionId)
      const competitionDoc = await getDoc(competitionRef)
      
      if (competitionDoc.exists()) {
        const data = competitionDoc.data()
        const allJudgeEvaluatedExists = data.hasOwnProperty('AllJudgeEvaluated')
        const allJudgeEvaluatedValue = data.AllJudgeEvaluated || false
        
        // If AllJudgeEvaluated doesn't exist or is false, check the actual judge status
        if (!allJudgeEvaluatedExists || !allJudgeEvaluatedValue) {
          console.log("AllJudgeEvaluated not present or false, checking actual judge status...")
          const actualJudgeStatus = await checkAllJudgesCompleted()
          
          if (actualJudgeStatus) {
            // If all judges are actually completed, update the boolean to true
            await updateAllJudgeEvaluatedStatus(true)
            setAllJudgeEvaluated(true)
            console.log("All judges completed - updated AllJudgeEvaluated to true")
          } else {
            // If not all judges completed, ensure the boolean is false
            if (allJudgeEvaluatedExists && allJudgeEvaluatedValue) {
              await updateAllJudgeEvaluatedStatus(false)
            }
            setAllJudgeEvaluated(false)
            console.log("Not all judges completed - AllJudgeEvaluated remains/set to false")
          }
        } else {
          // AllJudgeEvaluated exists and is true, leave it as is
          setAllJudgeEvaluated(true)
          console.log("AllJudgeEvaluated already true - leaving as is")
        }
      } else {
        console.log("Competition document doesn't exist")
        setAllJudgeEvaluated(false)
      }
    } catch (error) {
      console.error("Error checking and initializing AllJudgeEvaluated:", error)
      setAllJudgeEvaluated(false)
    }
  }

  // Function to handle leaderboard access
  const handleLeaderboardAccess = async () => {
    if (role !== 'superadmin') {
      return // Only superadmins can access
    }

    setIsCheckingJudges(true)
    
    try {
        // If boolean is true, proceed to leaderboard
        router.push(`/admin/competitions/${competitionId}/leaderboard`)
      }
     catch (error) {
      console.error("Error checking leaderboard access:", error)
    } finally {
      setIsCheckingJudges(false)
    }
  }

  useEffect(() => {
    const initializePage = async () => {
      await checkAuthAndLoad()
      // Check and initialize AllJudgeEvaluated status after auth is confirmed
      await checkAndInitializeAllJudgeEvaluated()
    }

    initializePage()

    const unsubParts = onSnapshot(collection(db, `competitions/${competitionId}/participants`), (snap) =>
      setStats((prev) => ({ ...prev, totalParticipants: snap.size })),
    )

    const unsubSubs = onSnapshot(collection(db, `competitions/${competitionId}/submissions`), (snap) =>
      setSubmissionCount(snap.size),
    )

    const unsubPending = onSnapshot(
      query(collection(db, `competitions/${competitionId}/submissions`), where("status", "==", "scored")),
      (snap) => setStats((prev) => ({ ...prev, pendingReviews: snap.size })),
    )

    // Listen to competition document for AllJudgeEvaluated and generateLeaderboard changes
    const unsubCompetition = onSnapshot(doc(db, "competitions", competitionId), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        setAllJudgeEvaluated(data.AllJudgeEvaluated || false)
        setGenerateLeaderboard(data.generateleaderboard || false)
      }
    })

    return () => {
      unsubParts()
      unsubSubs()
      unsubPending()
      unsubCompetition()
    }
  }, [router, competitionId])

  const checkAuthAndLoad = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`)
      setRole(profile.role)
    } catch (error) {
      router.push("/")
      return
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href={`/admin/competitions/${competitionId}/participants`} className="group">
            <Card className="bg-white rounded-2xl shadow-sm p-6 h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 border-transparent hover:border-green-200">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-gray-600 font-medium">Total Participants</h3>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">{stats.totalParticipants}</div>
                  <p className="text-gray-500 text-sm">View participants & leaderboard</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/admin/competitions/${competitionId}/llm-evaluations`} className="group">
            <Card className="bg-white rounded-2xl shadow-sm p-6 h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 border-transparent hover:border-blue-200">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-gray-600 font-medium">Total Submissions</h3>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{totalSubmissions}</div>
                  <p className="text-gray-500 text-sm">View submissions & LLM evaluations</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/admin/competitions/${competitionId}/judge-evaluations`} className="group">
            <Card className="bg-white rounded-2xl shadow-sm p-6 h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 border-transparent hover:border-amber-200">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-gray-600 font-medium">Judge Reviews</h3>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 group-hover:text-amber-700 transition-colors">{stats.pendingReviews}</div>
                  <p className="text-gray-500 text-sm">View judge evaluations</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors">
                  <Activity className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {(role === "admin" || role === "superadmin") && (
            <Card className="bg-white rounded-2xl shadow-sm p-6 h-full">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Admin Controls</h3>
                    <p className="text-gray-600">Manage roles and judges</p>
                  </div>
                </div>

                <Button
                  onClick={() => router.push(`/admin/competitions/${competitionId}/participant-distribution`)}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg"
                >
                  <Users className="h-4 w-4 mr-2" /> Manage Judges
                </Button>
              </div>
            </Card>
          )}

          <Card className="bg-white rounded-2xl shadow-sm p-6 h-full">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Evaluation</h3>
                  <p className="text-gray-600">LLM scoring</p>
                </div>
              </div>
              <div className="space-y-3">
                <StartEvaluationButton competitionId={competitionId} />
              </div>
            </div>
          </Card>

          <Card className="bg-white rounded-2xl shadow-sm p-6 h-full">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Leaderboard Management</h3>
                  <p className="text-gray-600">View and export final rankings</p>
                </div>
              </div>
              <div className="space-y-3">
                {role === 'superadmin' ? (
                  <div className="relative">
                    {!generateLeaderboard ? (
                      // Show Generate Leaderboard as primary with dropdown for View
                      <>
                        <div className="flex">
                          <div className="flex-1">
                            <GenerateLeaderboardButton competitionId={competitionId} />
                          </div>
                          <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="ml-2 px-3 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                        
                        {isDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                handleLeaderboardAccess()
                                setIsDropdownOpen(false)
                              }}
                              disabled={isCheckingJudges}
                              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg disabled:text-gray-400 disabled:cursor-not-allowed flex items-center"
                            >
                              <Trophy className="h-4 w-4 mr-2" />
                              {isCheckingJudges ? 'Checking...' : 'View Leaderboard'}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      // Show View Leaderboard as primary with dropdown for Generate
                      <>
                        <div className="flex">
                          <Button
                            onClick={handleLeaderboardAccess}
                            disabled={isCheckingJudges}
                            className="flex-1 py-3 bg-gray-900 text-white rounded-lg disabled:bg-gray-400"
                          >
                            <Trophy className="h-4 w-4 mr-2" /> 
                            {isCheckingJudges ? 'Checking...' : 'View Leaderboard'}
                          </Button>
                          <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="ml-2 px-3 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                        
                        {isDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <div className="p-2">
                              <GenerateLeaderboardButton competitionId={competitionId} />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center space-x-2 text-gray-500">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">Superadmin access required</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Challenges Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-2">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab("challenges")}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === "challenges"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Trophy className="h-4 w-4" />
                  <span>Challenges</span>
                </div>
              </button>
              {role !== "judge" && (
                <button
                  onClick={() => setActiveTab("judges")}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === "judges"
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Judge Progress</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {activeTab === "challenges" && (
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <GetChallenges competitionId={competitionId} />
              </CardContent>
            </Card>
          )}

          {activeTab === "judges" && <JudgeProgress competitionId={competitionId} />} 
        </div>
      </div>
    </div>
  )
}