"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ArrowLeft, Trophy, Clock, LogOut, User, ArrowRight, CheckCircle2} from "lucide-react"
import { collection, getDocs, query, doc, getDoc, where} from "firebase/firestore"
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
  const [challenges, setChallenges] = useState<any[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<Record<string, boolean>>({})
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)


  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const loadData = async () => {
      await fetchCompetitionData();
      await fetchUserSubmissions(resolvedParams.id);
    };

    loadData();
  }, [user, router])


  const fetchCompetitionData = async () => {
    try {          
        setCurrentCompetitionId(resolvedParams.id)

        const challengesRef = collection(db, "competitions", resolvedParams.id, "challenges");
        const challengesSnapshot = await getDocs(challengesRef);
        setChallengeCount(challengesSnapshot.size)
        
        const competitionRef = doc(db, "competitions", resolvedParams.id);
        const competitionRefSnap = await getDoc(competitionRef);

        if (competitionRefSnap.exists()) {
          const competitionData = competitionRefSnap.data();

          // Check competition deadlines
          const start = competitionData.startDeadline?.toDate?.() ?? new Date(competitionData.startDeadline);
          const end = competitionData.endDeadline?.toDate?.() ?? new Date(competitionData.endDeadline);
          const now = new Date();
          const extendedEnd = new Date(end.getTime() + 60 * 1000); // end + 1 minutes

          setStartDeadlineReached(now >= start)
          setEndDeadlinePassed(now > extendedEnd)
        }

        const querySnapshot = await getDocs(collection(db, 'competitions', resolvedParams.id, 'challenges'));
        if (!querySnapshot.empty) {
          const challengeList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setChallenges(challengeList);
        }

    } 
    catch (error) 
    {
      console.error("Error fetching competition and challenges:", error)
    } 
    finally 
    {
      setCheckingDeadline(false)
    }
  }
  
  const fetchUserSubmissions = async (competitionId: string) => {
    try {
      setLoadingSubmissions(true);

      if (!competitionId) {
        console.error("competitionId is null or undefined");
        return;
      }
      else
      {
        const submissionsRef = collection(db, "competitions", competitionId, "submissions");
        const q = query(submissionsRef, where("participantId", "==", user.uid));
        const submissionsSnapshot = await getDocs(q);
        
        const userSubmissionMap: Record<string, boolean> = {};

        // If submissions collection exists and has documents
        if (!submissionsSnapshot.empty) 
        {
          submissionsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            userSubmissionMap[data.challengeId] = true;
          });
        }
        
        setUserSubmissions(userSubmissionMap);
        setSubmissions(Object.keys(userSubmissionMap).length);
      }
    } 
    catch (error) 
    {
      console.error("Error fetching user submissions:", error);
      // On error, mark all as unsubmitted
      setUserSubmissions({});
    } 
    finally 
    {
      setLoadingSubmissions(false);
    }
  };

  if (!user || checkingDeadline) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-150 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-150">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-base font-medium text-gray-700">Welcome back, {user.displayName || "Participant"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Go Back Button */}
              <>
              <Button
                variant="outline"
                onClick={() => router.push(`/participants`)} 
                className="hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
                Competitions
              </Button>

              <Button
                variant="outline"
                onClick={async () => {
                  await logout()
                  router.push("/")
                }}
                className="hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4 text-gray-600" />
                Logout
              </Button>
              </>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {startDeadlineReached && !endDeadlinePassed && currentCompetitionId ? (
          <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-white">Available Challenges</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 pb-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">{challengeCount !== null ? challengeCount : "—"}</div>
                <p className="text-sm font-medium text-gray-700">In current challenge</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-white">My Submissions</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 pb-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">{submissions !== null ? submissions : "—"}</div>
                <p className="text-sm font-medium text-gray-700">Total submissions made</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-white">Total Score</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 pb-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">Pending</div>
                <p className="text-sm font-medium text-gray-700">Across all submissions</p>
              </CardContent>
            </Card>
          </div>

            
          {/* Challenge Cards */}
        {challenges.map((challenge) => {
  const isSubmitted = userSubmissions[challenge.id];
  const isLoading = loadingSubmissions;
  
  return (
    <Card key={challenge.id} className="bg-white shadow-sm rounded-xl mb-4 hover:shadow-md transition-all duration-200 border border-gray-100">
      <CardContent className="p-6">
        {/* Header with icon and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isSubmitted 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                : 'bg-gradient-to-r from-gray-700 to-gray-600'
            }`}>
              {isSubmitted ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <Trophy className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{challenge.title}</h2>
              {challenge.difficulty && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                  {challenge.difficulty}
                </span>
              )}
            </div>
          </div>
          
          {/* Dynamic Status Badge */}
          {isLoading ? (
            <div className="px-3 py-1 rounded-full text-xs font-medium uppercase border bg-gray-50 text-gray-500 border-gray-200 flex items-center gap-2">
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              LOADING
            </div>
          ) : isSubmitted ? (
            <span className="px-3 py-1 rounded-full text-xs font-medium uppercase border bg-emerald-50 text-emerald-600 border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" />
              SUBMITTED
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium uppercase border bg-blue-50 text-blue-800 border-blue-200">
              ACTIVE
            </span>
          )}
        </div>

        {/* Description */}
        {challenge.description && (
          <p className="text-gray-700 text-base mb-4 leading-relaxed">
            {challenge.description}
          </p>
        )}

        {/* Challenge Info */}
        <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
          {challenge.points && (
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="font-medium">{challenge.points} points</span>
            </div>
          )}
          {challenge.timeLimit && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{challenge.timeLimit} min limit</span>
            </div>
          )}
        </div>

        {/* Action Button - Color coded based on submission status */}
        <div className="flex justify-center">
          {isLoading ? (
            <Button 
              disabled
              className="bg-gray-300 text-gray-500 cursor-not-allowed flex items-center gap-2"
            >
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </Button>
          ) : isSubmitted ? (
            <div className="flex flex-col items-center gap-2">
              <div className="px-6 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Submission Complete
              </div>
              <Button 
                variant="outline"
                onClick={() => router.push(`/participants/competitions/${currentCompetitionId}/challenge/${challenge.id}`)}
                className="text-xs px-4 py-2 hover:bg-gray-50 transition-all duration-200"
              >
                View Challenge
              </Button>
            </div>
          ) : (   
            <Button 
              onClick={() => router.push(`/participants/competitions/${currentCompetitionId}/challenge/${challenge.id}`)}
              className="bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:from-gray-600 hover:to-gray-500 hover:shadow-md transition-all duration-200 flex items-center gap-2"
            >
              Start Challenge
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
})}

        </>
        ) : !startDeadlineReached ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-rose-400 to-red-500 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">Challenges</h2>
                <p className="text-base font-medium text-gray-700">Available challenges in current competition</p>
              </div>

            </div>
              
            <Card className="bg-white shadow-sm rounded-xl">
              <CardContent className="p-8">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-sky-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Competition Not Started</h3>
                    <p className="text-base font-medium text-gray-700 max-w-md mx-auto">
                      Challenges will be available once the competition starts. Please check back later.
                    </p>
                  </div>
              </CardContent>
            </Card>
          </div>

              ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-rose-400 to-red-500 rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Challenges</h2>
                  <p className="text-base font-medium text-gray-700">Available challenges in current competition</p>
                </div>

              </div>
              
              <Card className="bg-white shadow-sm rounded-xl">
                <CardContent className="p-8">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-slate-400 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Competition Ended</h3>
                  <p className="text-base font-medium text-gray-700 max-w-md mx-auto">
                    The competition has ended and challenges are no longer available for submission.
                  </p>
                </div>
                </CardContent>
              </Card>
            </div>
        )}
      </main>
    </div>
  )
}