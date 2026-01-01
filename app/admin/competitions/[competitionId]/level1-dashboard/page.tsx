"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Users, Trophy, BarChart3, Shield, ExternalLink, AlertCircle } from "lucide-react"
import GetChallenges from "@/components/GetChallenges"
import StartEvaluationButton from "@/components/StartEvaluation"
import Generate_level1_Leaderboard from "@/components/Generate_level1_Leaderboard"
import DashboardEvaluationProgress from "@/components/DashboardEvaluationProgress"
import { collection, onSnapshot, query, where, doc, getDoc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { fetchWithAuth } from "@/lib/api"

import { useNotifications } from "@/hooks/useNotifications";
import { useEvaluationStatus } from "@/hooks/useEvaluationStatus";

export default function AdminDashboard() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const [totalSubmissions, setSubmissionCount] = useState<number>(0)
  const [stats, setStats] = useState({ totalParticipants: 0 })
  const [role, setRole] = useState(null)
  const [competitionName, setCompetitionName] = useState("")
  const { addNotification } = useNotifications();
  const [progressRefreshKey, setProgressRefreshKey] = useState(0)
  const [competitionEndDeadline, setCompetitionEndDeadline] = useState<Date | null>(null)
  const [isCompetitionEnded, setIsCompetitionEnded] = useState(false)
  
  // Use the shared evaluation status hook
  const { 
    evaluationStatus, 
    isEvaluated, 
    progress, 
    isLoading: statusLoading, 
    error: statusError, 
    refreshStatus 
  } = useEvaluationStatus(competitionId)

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
      // Also refresh evaluation status
      refreshStatus()
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
      // Also refresh evaluation status
      refreshStatus()
    } catch (err: any) {
      addNotification("error", err.message || "Failed to pause evaluation")
    }
  }



  const handleEvaluationStart = () => {
    // Force refresh progress when evaluation starts
    // Use a longer delay to ensure backend has written to database
    setTimeout(() => {
      setProgressRefreshKey(prev => prev + 1)
      // Also refresh evaluation status
      refreshStatus()
    }, 1000)
  }

  useEffect(() => {
    const initializePage = async () => {
      await checkAuthAndLoad()
      // Fetch competition name and end deadline
      const competitionDoc = await getDoc(doc(db, 'competitions', competitionId))
      if (competitionDoc.exists()) {
        const data = competitionDoc.data()
        setCompetitionName(data.title)
        
        // Get end deadline and check if competition has ended
        if (data.endDeadline) {
          const endDate = data.endDeadline.toDate ? data.endDeadline.toDate() : new Date(data.endDeadline)
          setCompetitionEndDeadline(endDate)
          
          // Check if current time is greater than end deadline
          const now = new Date()
          setIsCompetitionEnded(now > endDate)
        }
      }
      // Note: fetchEvaluationStatus is now handled by the useEvaluationStatus hook
    }

    initializePage()

    const unsubParts = onSnapshot(collection(db, `competitions/${competitionId}/participants`), (snap) =>
      setStats((prev) => ({ ...prev, totalParticipants: snap.size })),
    )

    const unsubSubs = onSnapshot(collection(db, `competitions/${competitionId}/submissions`), (snap) =>
      setSubmissionCount(snap.size),
    )

    return () => {
      unsubParts()
      unsubSubs()
    }
  }, [router, competitionId])

  const checkAuthAndLoad = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`)
      setRole(profile.role)
      // console.log("User role:", profile.role)
    } catch (error) {
      router.push("/")
      return
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-0 space-y-8">
        {/* Competition Title */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Trophy className="h-7 w-7 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{competitionName}</h1>
              <p className="text-gray-500 mt-1">Competition Dashboard</p>
            </div>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
              href={
                isEvaluated
                  ? `/admin/competitions/${competitionId}/leaderboard`
                  : `/admin/competitions/${competitionId}/participants`
              }
              className="group"
            >
              <Card className="bg-white rounded-2xl shadow-sm p-6 h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 border-transparent hover:border-green-200">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-gray-600 font-medium">Total Participants</h3>
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </div>
                    <div className="text-4xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                      {stats.totalParticipants}
                    </div>
                    <p className="text-gray-500 text-sm">
                      {isEvaluated ? "View leaderboard" : "View participants"}
                    </p>
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
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">

          <Card className="bg-white rounded-2xl shadow-sm p-6 h-full">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Evaluation</h3>
                  <p className="text-gray-600">LLM scoring</p>
                </div>
              </div>
              <div className="space-y-3">
                {role === 'superadmin' ? (
                  !isCompetitionEnded ? (
                    <div className="text-center py-4">
                      <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-sm">Competition must end before evaluation</span>
                        {competitionEndDeadline && (
                          <span className="text-xs text-gray-400">
                            Ends: {competitionEndDeadline.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <StartEvaluationButton 
                      competitionId={competitionId} 
                      onEvaluationStart={handleEvaluationStart}
                    />
                  )
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
                !isCompetitionEnded ? (
                  <div className="text-center py-4">
                    <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm">Competition must end to generate leaderboard</span>
                      {competitionEndDeadline && (
                        <span className="text-xs text-gray-400">
                          Ends: {competitionEndDeadline.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <Generate_level1_Leaderboard competitionId={competitionId} />
                  </div>
                )
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
        {/* Evaluation Progress - Displayed below admin buttons and above challenges */}
        <DashboardEvaluationProgress 
          key={progressRefreshKey}
          competitionId={competitionId} 
          onResume={handleResumeEvaluation}
          onPause={handlePauseEvaluation}
          isCompetitionEnded={isCompetitionEnded}
        />

        {/* Challenges Section */}
        <div className="space-y-6">
          <Card className="bg-white rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Challenges</h3>
                  <p className="text-gray-600 text-sm">View and manage competition challenges</p>
                </div>
              </div>
              <GetChallenges competitionId={competitionId} from="level1-dashboard" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}