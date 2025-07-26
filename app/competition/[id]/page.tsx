"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { submitPrompt } from "@/lib/firebase/submissions"
import { Badge } from "@/components/ui/badge"
import type { Competition, Submission } from "@/types/auth"
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  Send, 
  CheckCircle, 
  RefreshCw, 
  AlertCircle,
  Trophy,
  Target
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { use } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"


// Extended interface to include Firebase data
export default function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const resolvedParams = use(params)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    fetchCompetitionData()
  }, [user, resolvedParams.id, router])

  const fetchCompetitionData = async () => {
    try {
      // Fetch from Firebase first
      const challengeRef = doc(db, process.env.NEXT_PUBLIC_CHALLENGE_DATABASE, resolvedParams.id)
      const challengeSnap = await getDoc(challengeRef)
      
      let competitionData = null
      
      if (challengeSnap.exists()) {
        const firebaseData = challengeSnap.data()
        // Convert Firebase data to match your Competition interface
        competitionData = {
          id: resolvedParams.id,
          title: firebaseData.title,
          problemStatement: firebaseData.problemStatement, 
          deadline: firebaseData.deadline?.toDate?.() || firebaseData.deadline,
          isLocked: false, // Add your logic here
          guidelines: firebaseData.guidelines,
          // Add other fields as needed
        }
        setCompetition(competitionData)
      }
    } catch (error) {
      console.error("Error fetching competition data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-[#56ffbc] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading competition...</p>
        </div>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="bg-white shadow-xl border-0 max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Competition Not Found</h2>
            <p className="text-gray-600 mb-6">The competition you're looking for doesn't exist or has been removed.</p>
            <Button 
              className="bg-[#56ffbc] hover:bg-[#45e6a8] text-gray-800 font-semibold px-6 py-2 shadow-md" 
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Derived values
  const isCompetitionLocked = competition.isLocked || new Date() > new Date(competition.deadline)
  const hasSubmission = submission !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/dashboard")} 
                className="mr-4 text-gray-700 hover:text-[#56ffbc] hover:bg-[#56ffbc] transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="h-8 w-8 text-[#56ffbc]" />
                  <h1 className="text-3xl font-bold text-gray-800">{competition.title}</h1>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="secondary" 
                    className={`font-medium px-3 py-1 ${
                      isCompetitionLocked 
                        ? "bg-red-100 text-red-700 border-red-200" 
                        : "bg-green-100 text-green-700 border-green-200"
                    }`}
                  >
                    {isCompetitionLocked ? "Locked" : "Active"}
                  </Badge>
                  {hasSubmission && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Submitted
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-[175px] py-8 px-6 sm:px-16 lg:px-8">
    
          <div className="space-y-8">
            {/* Guidelines Card */}
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-[#56ffbc] to-blue-50 border-b border-gray-100">
                <CardTitle className="text-gray-800 text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#07073a]" />
                  Submission Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {competition.guidelines}
                  </div>
              </CardContent>
            </Card>

            {/* Competition Details Card */}
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-[#07073a] to-blue-200">
                <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#56ffbc]" />
                  Competition Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{competition.problemStatement}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Deadline
                  </h3>
                  <p className="text-gray-700 bg-orange-50 p-3 rounded-lg border border-orange-200">
                    {new Date(competition.deadline).toLocaleDateString()} at{" "}
                    {new Date(competition.deadline).toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Prompt Input Card */}
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-[#56ffbc] to-green-50 border-b border-gray-100">
                <CardTitle className="text-gray-800 text-lg font-semibold flex items-center gap-2">
                  <Send className="h-5 w-5 text-[#07073a]" />
                  Your Solution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-gray-800 font-medium mb-2 block">
                    Prompt Text
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="Enter your carefully crafted prompt here..."
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value)
                    }}
                    className="min-h-[250px] font-mono text-sm bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-500 focus:border-[#56ffbc] focus:ring-[#56ffbc] focus:bg-white transition-colors"
                    disabled={isCompetitionLocked}
                  />
                </div>
                
                {/* Stats and Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-500">
                    Characters: {prompt.length} | Words: {prompt.split(/\s+/).filter(Boolean).length}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={async () => {await submitPrompt(user.uid, resolvedParams.id, prompt)}}
                      disabled={!prompt.trim() || submitting || isCompetitionLocked}
                      size="sm"
                      className="bg-[#56ffbc] hover:bg-[#45e6a8] text-gray-800 font-semibold shadow-md"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Prompt
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  )
}