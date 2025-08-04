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
import { ArrowLeft, Clock, FileText, Send, AlertCircle, Trophy, Target } from "lucide-react"
import { use } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import type { Timestamp } from "firebase-admin/firestore"

interface Challenge {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  startDeadline: Timestamp
  endDeadline: Timestamp
  isCompetitionLocked: boolean
}

export default function ChallengePage({ params }: { params: Promise<{ id: string; challengeId: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  // unwrap the promise
  const resolvedParams = use(params)
  const { id: competitionId, challengeId } = resolvedParams
  // Pop-up massage to confirm resubmission
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  // Inline load for Prompt fetching
  const [loadingPrompt, setLoadingPrompt] = useState<boolean>(false)
  const [loadingChallenge, setLoadingChallenge] = useState<boolean>(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    // Run both fetches in parallel
    Promise.all([
      fetchChallengeData(competitionId, challengeId),
      fetchSubmissionPrompt(competitionId, challengeId, user.uid),
    ]).catch((error) => {
      console.error("Error in parallel fetch:", error)
    })
  }, [user, competitionId, challengeId, router])

  const fetchChallengeData = async (competitionId: string, challengeId: string) => {
    try {
      setLoadingChallenge(true)
      const challengeRef = doc(db, "competitions", competitionId, "challenges", challengeId)
      const challengeSnap = await getDoc(challengeRef)
      if (!challengeSnap.exists()) {
        console.warn("Challenge document not found.")
        return
      }
      const data = challengeSnap.data()
      const isCompetitionLocked = data?.endDeadline && new Date() > new Date(data.endDeadline.seconds * 1000)
      console.log("Is competition locked:", isCompetitionLocked)
      const challengeData: Challenge = {
        id: challengeId,
        title: data.title,
        problemStatement: data.problemStatement,
        guidelines: data.guidelines,
        isCompetitionLocked: isCompetitionLocked,
        endDeadline: data.endDeadline,
      }
      setChallenge(challengeData)
    } catch (error) {
      console.error("Error fetching challenge data:", error)
    } finally {
      setLoadingChallenge(false)
    }
  }

  const fetchSubmissionPrompt = async (competitionId: string, challengeId: string, participantId: string) => {
    try {
      setLoadingPrompt(true)
      const submissionId = `${participantId}_${challengeId}`
      const submissionRef = doc(db, "competitions", competitionId, "submissions", submissionId)
      const submissionSnap = await getDoc(submissionRef)
      if (submissionSnap.exists()) {
        const submissionData = submissionSnap.data()
        setPrompt(submissionData.promptText || "")
      } else {
        setPrompt("")
      }
    } catch (error) {
      console.error("Error fetching submission prompt:", error)
      setPrompt("")
    } finally {
      setLoadingPrompt(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading challenge...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="py-8 px-6 sm:px-16 lg:px-8">
      {loadingChallenge ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
          <header className="bg-white shadow-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <Trophy className="h-8 w-8 text-gray-900" />
                  <div className="flex flex-col gap-1">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <Button variant="ghost" disabled className="text-gray-400">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </header>
          <div className="max-w-7xl mx-auto space-y-8 py-8">
            <Card className="bg-white shadow-lg border border-gray-100 rounded-xl hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-900" />
                  Challenge Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="h-5 w-1/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="mt-6 h-5 w-1/3 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
            <Card className="bg-white shadow-lg border border-gray-100 rounded-xl hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-gray-900" />
                  How to Craft Your Prompt
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-11/12 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
            <Card className="bg-white shadow-lg border border-gray-100 rounded-xl hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                  <Send className="h-5 w-5 text-gray-900" />
                  Your Solution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-48 bg-gray-100 rounded-md border border-gray-200 animate-pulse" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : !challenge ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
          <Card className="bg-white shadow-xl border border-gray-100 rounded-xl max-w-md">
            <CardContent className="text-center py-8">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Competition Not Found</h2>
              <p className="text-gray-700 mb-6">The challenge you're looking for doesn't exist or has been removed.</p>
              <Button
                className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-2 shadow-md"
                onClick={() => router.push(`/participants/competitions/${competitionId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
          <header className="bg-white shadow-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <Trophy className="h-8 w-8 text-gray-900" />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{challenge.title}</h1>
                    <Badge
                      variant="secondary"
                      className={`font-medium px-3 py-1 rounded-full ${
                        challenge.isCompetitionLocked
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-green-100 text-green-700 border-green-200"
                      }`}
                    >
                      {challenge.isCompetitionLocked ? "Locked" : "Active"}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/participants/competitions/${competitionId}`)}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </header>
          <div className="max-w-7xl mx-auto space-y-8 py-8">
            <Card className="bg-white shadow-lg border border-gray-100 rounded-xl hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-900" />
                  Challenge Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Problem Statement</h3>
                  <p className="text-gray-700 leading-relaxed">{challenge.problemStatement}</p>
                </div>
                <Card className="mt-6 bg-gray-50 border border-gray-100 rounded-lg">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      Competition Timeline
                    </h3>
                    <div className="text-gray-700">
                      {challenge.endDeadline &&
                        (() => {
                          const deadlineDate = new Date(challenge.endDeadline.seconds * 1000)
                          return (
                            <div>
                              <strong>Ends:</strong> {deadlineDate.toLocaleDateString()} at{" "}
                              {deadlineDate.toLocaleTimeString()}
                            </div>
                          )
                        })()}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-lg border border-gray-100 rounded-xl hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-gray-900" />
                  How to Craft Your Prompt
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{challenge.guidelines}</div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-lg border border-gray-100 rounded-xl hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                <CardTitle className="text-gray-900 text-lg font-semibold flex items-center gap-2">
                  <Send className="h-5 w-5 text-gray-900" />
                  Your Solution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {loadingPrompt ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-5 w-32 bg-gray-200 rounded" />
                    <div className="h-48 bg-gray-100 rounded-md border border-gray-200" />
                    <div className="flex items-center justify-between pt-2">
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                      <div className="h-8 w-32 bg-gray-200 rounded-md" />
                    </div>
                  </div>
                ) : (
                  <>
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
                        className="min-h-[250px] font-mono text-sm bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                        disabled={challenge.isCompetitionLocked}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-gray-500">
                        Characters: {prompt.length} | Words: {prompt.split(/\s+/).filter(Boolean).length}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            setIsConfirmModalOpen(true)
                          }}
                          disabled={!prompt.trim() || challenge.isCompetitionLocked || loading}
                          size="sm"
                          className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-md"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {loading ? "Submitting..." : "Submit Prompt"}
                        </Button>
                      </div>
                      {isConfirmModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                          <div className="bg-white rounded-xl shadow-2xl p-6 w-[300px] text-center">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Update submission?</h2>
                            <div className="flex justify-center gap-4">
                              <Button
                                className="bg-gray-900 hover:bg-gray-800 text-white"
                                onClick={async () => {
                                  setLoading(true)
                                  setIsConfirmModalOpen(false)
                                  await submitPrompt(resolvedParams.id, user.uid, resolvedParams.challengeId, prompt)
                                  setLoading(false)
                                }}
                              >
                                Yes
                              </Button>
                              <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)}>
                                No
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  )
}
