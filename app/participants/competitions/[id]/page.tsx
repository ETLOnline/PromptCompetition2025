"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ArrowLeft, Trophy, Clock, LogOut, User, Sparkles, Target, Award } from "lucide-react"
import ChallengeList from "@/components/ChallengeList"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { use } from "react"

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<number | null>(null)
  const [challengeCount, setChallengeCount] = useState<number | null>(null)
  const [currentCompetitionId, setCurrentCompetitionId] = useState<string | null>(null)
  const [startDeadlineReached, setStartDeadlineReached] = useState<boolean>(false)
  const [endDeadlinePassed, setEndDeadlinePassed] = useState<boolean>(false)
  const [checkingDeadline, setCheckingDeadline] = useState(true)

  const resolvedParams = use(params)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const fetchCompetitionMetadata = async () => {
      try {
        const competitionId = resolvedParams.id
        setCurrentCompetitionId(competitionId)

        const challengesRef = collection(db, "competitions", competitionId, "challenges")
        const challengesSnapshot = await getDocs(challengesRef)
        setChallengeCount(challengesSnapshot.size)

        const competitionRef = doc(db, "competitions", competitionId)
        const competitionRefSnap = await getDoc(competitionRef)

        if (competitionRefSnap.exists()) {
          const competitionData = competitionRefSnap.data()
          // Check competition deadlines
          const start = competitionData.startDeadline?.toDate?.() ?? new Date(competitionData.startDeadline)
          const end = competitionData.endDeadline?.toDate?.() ?? new Date(competitionData.endDeadline)
          const now = new Date()
          const extendedEnd = new Date(end.getTime() + 60 * 1000) // end + 1 minutes

          setStartDeadlineReached(now >= start)
          setEndDeadlinePassed(now > extendedEnd)
        }
      } catch (error) {
        console.error("Error fetching competition and challenges:", error)
      } finally {
        setCheckingDeadline(false)
      }
    }

    fetchCompetitionMetadata()

    // Get user submissions count
    if (user?.uid) {
      // Existing submission count logic would go here
    }
  }, [user, router])

  if (!user || checkingDeadline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="container mx-auto p-6">
          <Card className="bg-white shadow-lg rounded-xl border-0 max-w-md mx-auto">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Loading Dashboard
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">Preparing your competition dashboard...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200/60 sticky top-0 z-10">
        <div className="container mx-auto p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-14 h-14 bg-[#10142c] rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Competition Dashboard
                </h1>
                <p className="text-muted-foreground mt-1 font-medium">
                  Welcome back, {user.displayName || "Participant"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="gap-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Competitions</span>
              </Button>
              <Button
                onClick={async () => {
                  await logout()
                  router.push("/")
                }}
                className="bg-[#10142c] text-white gap-2 px-6 py-3 h-12 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-semibold"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6 space-y-8">
        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl border-0 overflow-hidden group">
            <CardHeader className="bg-[#10142c] border-b border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-semibold">Available Challenges</CardTitle>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {challengeCount !== null ? challengeCount : "—"}
                </div>
                <p className="text-muted-foreground font-medium">In current competition</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl border-0 overflow-hidden group">
            <CardHeader className="bg-[#10142c] border-b border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-semibold">My Submissions</CardTitle>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-5 w-5 text-slate-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {submissions !== null ? submissions : "—"}
                </div>
                <p className="text-muted-foreground font-medium">Total submissions made</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl border-0 overflow-hidden group">
            <CardHeader className="bg-[#10142c] border-b border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-semibold">Total Score</CardTitle>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-5 w-5 text-slate-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Pending
                </div>
                <p className="text-muted-foreground font-medium">Across all submissions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Challenges Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-12 h-12 bg-[#10142c] rounded-2xl flex items-center justify-center shadow-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <Target className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Competition Challenges
              </h2>
              <p className="text-muted-foreground font-medium">Available challenges for this competition</p>
            </div>
          </div>

          <Card className="bg-white shadow-lg rounded-xl border-0">
            <CardContent className="p-8">
              {startDeadlineReached && !endDeadlinePassed && currentCompetitionId ? (
                <ChallengeList maincompetitionid={currentCompetitionId} />
              ) : !startDeadlineReached ? (
                <div className="text-center py-16 space-y-6">
                  <div className="relative mx-auto w-20 h-20">
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-sky-200 rounded-3xl flex items-center justify-center">
                      <Clock className="h-10 w-10 text-blue-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                      Competition Not Started
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Challenges will be available once the competition starts. Please check back later.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 space-y-6">
                  <div className="relative mx-auto w-20 h-20">
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
                      <Trophy className="h-10 w-10 text-slate-500" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-400 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                      Competition Ended
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                      The competition has ended and challenges are no longer available for submission.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
