"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { submitPrompt } from "@/lib/firebase/submissions"
import type { Competition } from "@/types/auth"
import {
  ArrowLeft,
  Clock,
  FileText,
  Send,
  AlertCircle,
  Trophy,
  Target,
  Sparkles,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

export default function CompetitionPage({
  params,
}: {
  params: Promise<{ id: string; competitionattempt: string }>
}) {
  const { id: competitionId, competitionattempt: challengeId } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const confirmActionRef = useRef<() => void>(null)
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    fetchCompetitionData()
  }, [user, competitionId, challengeId, router])

  const fetchCompetitionData = async () => {
    console.log("Fetching competition data for:", competitionId, challengeId)
    try {
      const challengeRef = doc(db, "competitions", competitionId, "challenges", challengeId)
      const challengeSnap = await getDoc(challengeRef)

      if (challengeSnap.exists()) {
        const firebaseData = challengeSnap.data()
        const competitionData: Competition = {
          id: competitionId,
          title: firebaseData.title,
          problemStatement: firebaseData.problemStatement,
          startDeadline: firebaseData.startDeadline?.toDate?.() || firebaseData.startDeadline,
          endDeadline: firebaseData.endDeadline?.toDate?.() || firebaseData.endDeadline,
          isLocked: false,
          guidelines: firebaseData.guidelines,
        }
        setCompetition(competitionData)
      }
    } catch (error) {
      console.error("Error fetching competition data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Enhanced loading state
  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="container mx-auto p-6">
          <Card className="bg-white shadow-lg rounded-xl border-0 max-w-md mx-auto">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Loading Challenge
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">Preparing your challenge details...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Enhanced error state
  if (!competition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="container mx-auto p-6">
          <Card className="bg-white shadow-lg rounded-xl border-0 max-w-md mx-auto">
            <CardContent className="text-center py-16">
              <div className="space-y-6">
                <div className="relative mx-auto w-20 h-20">
                  <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-red-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Challenge Not Found
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    The challenge you're looking for doesn't exist or has been removed.
                  </p>
                </div>
                <Button
                  onClick={() => router.push(`/participants/competitions/${competitionId}}`)}
                  className="bg-[#10142c] text-white gap-2 px-6 py-3 h-12 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-semibold"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isCompetitionLocked = competition.endDeadline && new Date() > new Date(competition.endDeadline)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200/60 sticky top-0 z-10">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                onClick={() => router.push(`/participants/competitions/${competitionId}`)}
                className="gap-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#10142c] rounded-2xl flex items-center justify-center shadow-lg">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    {competition.title}
                  </h1>
                  <Badge
                    className={`font-medium px-3 py-1 rounded-lg ${
                      isCompetitionLocked
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {isCompetitionLocked ? (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Locked
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6 space-y-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Challenge Details Card */}
          <Card className="bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl border-0">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <CardTitle className="text-slate-800 font-semibold flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-slate-600" />
                </div>
                Challenge Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-3">
                  Problem Statement
                </h3>
                <p className="text-slate-700 leading-relaxed">{competition.problemStatement}</p>
              </div>

              {/* Timeline Card */}
              <Card className="bg-slate-50 border border-slate-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Competition Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-600">Starts:</span>
                      <span className="text-slate-700">
                        {new Date(competition.startDeadline).toLocaleDateString()} at{" "}
                        {new Date(competition.startDeadline).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-600">Ends:</span>
                      <span className="text-slate-700">
                        {new Date(competition.endDeadline).toLocaleDateString()} at{" "}
                        {new Date(competition.endDeadline).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Guidelines Card */}
          <Card className="bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl border-0">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <CardTitle className="text-slate-800 font-semibold flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Target className="h-4 w-4 text-slate-600" />
                </div>
                How to Craft Your Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{competition.guidelines}</div>
            </CardContent>
          </Card>

          {/* Solution Card */}
          <Card className="bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl border-0">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <CardTitle className="text-slate-800 font-semibold flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Send className="h-4 w-4 text-slate-600" />
                </div>
                Your Solution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label htmlFor="prompt" className="text-slate-800 font-medium mb-3 block">
                  Prompt Text
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Enter your carefully crafted prompt here..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[250px] font-mono text-sm bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors rounded-lg"
                  disabled={isCompetitionLocked}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  Characters: {prompt.length} | Words: {prompt.split(/\s+/).filter(Boolean).length}
                </div>
                <Button
                  onClick={async () => {
                    if (hasSubmittedOnce) {
                      confirmActionRef.current = async () => {
                        setSubmitting(true)
                        await submitPrompt(user.uid, competitionId, prompt)
                        setSubmitting(false)
                      }
                      setIsConfirmModalOpen(true)
                    } else {
                      setSubmitting(true)
                      await submitPrompt(user.uid, challengeId, prompt)
                      setSubmitting(false)
                      setHasSubmittedOnce(true)
                    }
                  }}
                  disabled={!prompt.trim() || isCompetitionLocked || submitting}
                  className="bg-[#10142c] text-white gap-2 px-6 py-3 h-12 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Prompt"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Enhanced Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Card className="bg-white shadow-2xl rounded-2xl border-0 w-full max-w-md mx-4">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-center text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Update Submission?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <p className="text-center text-muted-foreground mb-6">
                Are you sure you want to update your previous submission?
              </p>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    setIsConfirmModalOpen(false)
                    if (confirmActionRef.current) {
                      await confirmActionRef.current()
                      setHasSubmittedOnce(true)
                    }
                  }}
                  className="flex-1 bg-[#10142c] text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 font-semibold"
                >
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
