"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Activity, Users, Trophy, BarChart3, Shield, ExternalLink, AlertCircle, X } from "lucide-react"
import GetChallenges from "@/components/GetChallenges"
import JudgeProgress from "@/components/JudgeProgress"
import StartEvaluationButton from "@/components/StartEvaluation"
import GenerateLeaderboardButton from "@/components/GenerateLeaderboard"
import DashboardEvaluationProgress from "@/components/DashboardEvaluationProgress"
import { collection, onSnapshot, query, where, doc, getDoc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Judge } from "@/types/JudgeProgress"
import { fetchWithAuth } from "@/lib/api"

import { useNotifications } from "@/hooks/useNotifications";

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
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState<boolean>(false)
  const { addNotification } = useNotifications();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressRefreshKey, setProgressRefreshKey] = useState(0)

  // Function to handle resume evaluation
  const handleResumeEvaluation = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-evaluate/resume-evaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId, userId: 'admin' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to resume evaluation")
      
      addNotification("success", "Evaluation resumed successfully!")
      // Refresh progress after resuming
      setProgressRefreshKey(prev => prev + 1)
    } catch (err: any) {
      addNotification("error", err.message || "Failed to resume evaluation")
    }
  }

  const handlePauseEvaluation = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-evaluate/pause-evaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId, userId: 'admin' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to pause evaluation")
      
      addNotification("success", "Evaluation paused successfully!")
      // Refresh progress after pausing
      setProgressRefreshKey(prev => prev + 1)
    } catch (err: any) {
      addNotification("error", err.message || "Failed to pause evaluation")
    }
  }

  const handleEvaluationStart = () => {
    // Force refresh progress when evaluation starts
    // Use a longer delay to ensure backend has written to database
    setTimeout(() => {
      setProgressRefreshKey(prev => prev + 1)
    }, 1000)
  }

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

  // Function to handle leaderboard access
  const handleLeaderboardAccess = async () => {
    if (role !== 'superadmin') {
      return // Only superadmins can access
    }

    setIsCheckingJudges(true)
    
    try {
      // First check the AllJudgeEvaluated boolean
      const allJudgeEvaluatedStatus = await fetchAllJudgeEvaluatedStatus()
      
      if (allJudgeEvaluatedStatus) {
        // If boolean is true, proceed to leaderboard
        router.push(`/admin/competitions/${competitionId}/leaderboard`)
      } else {
        // If boolean is false, double-check by calling checkAllJudgesCompleted
        const allCompleted = await checkAllJudgesCompleted()
        
        if (allCompleted) {
          // If all judges are actually completed, proceed to leaderboard
          router.push(`/admin/competitions/${competitionId}/leaderboard`)
        } else {
          // Show message that not all judges have completed
          setShowAccessDeniedModal(true)
        }
      }
    } catch (error) {
      console.error("Error checking leaderboard access:", error)
      setShowAccessDeniedModal(true)
    } finally {
      setIsCheckingJudges(false)
    }
  }

  useEffect(() => {
    checkAuthAndLoad()

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

    // Listen to competition document for AllJudgeEvaluated changes
    const unsubCompetition = onSnapshot(doc(db, "competitions", competitionId), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        setAllJudgeEvaluated(data.AllJudgeEvaluated || false)
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

  const generateFinalLeaderboard = async (competitionId: string) => {
    try {
      const data = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/last/${competitionId}/final-leaderboard`,
        { method: "POST" }
      );

      // Show success notification
      addNotification("success", "Final leaderboard generated successfully!");
      return true;
    } catch (err: any) {
      // Show error notification
      addNotification("error", err.message || "Failed to generate final leaderboard");
      throw err;
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Access Denied Modal */}
      {showAccessDeniedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Access Restricted</h3>
                    <p className="text-sm text-gray-600">Leaderboard not available</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAccessDeniedModal(false)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  The leaderboard cannot be accessed because not all judges have completed their evaluations.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-600">
                      <strong>Next steps:</strong> Monitor judge progress in the "Judge Progress" tab and ensure all evaluations reach 100% completion.
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <Button
                  onClick={() => {
                    setShowAccessDeniedModal(false)
                    setActiveTab("judges")
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  View Judge Progress
                </Button>
                <Button
                  onClick={() => setShowAccessDeniedModal(false)}
                  variant="outline"
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
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
                <StartEvaluationButton 
                  competitionId={competitionId} 
                  onEvaluationStart={handleEvaluationStart}
                />
                <GenerateLeaderboardButton competitionId={competitionId} />
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
                  <>
                    <Button
                      onClick={handleLeaderboardAccess}
                      disabled={isCheckingJudges}
                      className="w-full py-3 bg-gray-900 text-white rounded-lg disabled:bg-gray-400"
                    >
                      <Trophy className="h-4 w-4 mr-2" /> 
                      {isCheckingJudges ? 'Checking...' : 'View Leaderboard'}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center space-x-2 text-gray-500">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">Superadmin access required</span>
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={async () => {
                    setIsGenerating(true);
                    try {
                      await generateFinalLeaderboard(competitionId);
                    } catch (err) {
                      // Notification already handled in generateFinalLeaderboard
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generating..." : "Leaderboard"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Evaluation Progress - Displayed below admin buttons and above challenges */}
        <DashboardEvaluationProgress 
          key={progressRefreshKey}
          competitionId={competitionId} 
          onResume={handleResumeEvaluation}
          onPause={handlePauseEvaluation}
        />

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