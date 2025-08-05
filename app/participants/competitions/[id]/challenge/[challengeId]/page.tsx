"use client"
import { useAuth } from "@/components/auth-provider"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { submitPrompt } from "@/lib/firebase/submissions"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, FileText, Send, AlertCircle, ClipboardList, Target, ChevronDown } from "lucide-react"
import { use } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

import type { Timestamp } from "firebase-admin/firestore"
import { CountdownDisplay } from "@/components/countdown-display"

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
  const { user, logout } = useAuth()
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasPreviousSubmission, setHasPreviousSubmission] = useState(false)
  const resolvedParams = use(params)
  const { id: competitionId, challengeId } = resolvedParams
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [loadingPrompt, setLoadingPrompt] = useState<boolean>(false)
  const [loadingChallenge, setLoadingChallenge] = useState<boolean>(true)
  const [compid, setCompid] = useState<string | null>(null)

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params
      setCompid(id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
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
      // console.log("competitionId", competitionId, "challengeId", challengeId)
      if (!challengeSnap.exists()) {
        console.warn("Challenge document not found.")
        return
      }
      const data = challengeSnap.data()
      const isCompetitionLocked = data?.endDeadline && new Date() > new Date(data.endDeadline.seconds * 1000)
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
      // console.log("competitionId", competitionId)
      const submissionId = `${participantId}_${challengeId}`
      const submissionRef = doc(db, "competitions", competitionId, "submissions", submissionId)
      const submissionSnap = await getDoc(submissionRef)
      if (submissionSnap.exists()) {
        const submissionData = submissionSnap.data()
        setPrompt(submissionData.promptText || "")
        setHasPreviousSubmission(true)
      } else {
        setPrompt("")
        setHasPreviousSubmission(false)
      }
    } catch (error) {
      console.error("Error fetching submission prompt:", error)
      setPrompt("")
      setHasPreviousSubmission(false)
    } finally {
      setLoadingPrompt(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-900 text-lg font-semibold">Loading challenge...</p>
          <p className="text-gray-600 text-sm mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {loadingChallenge ? (
        <>
          <header className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Challenge Details</h1>
                    <p className="text-gray-600 text-sm mt-1">Overview of the current challenge and submission.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/participants/competitions/${competitionId}`)}
                    className="hidden sm:flex items-center gap-2 h-11 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors duration-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Competitions</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-3 h-11 rounded-xl border-gray-200 hover:bg-gray-50 transition-colors duration-200 bg-transparent"
                      >
                        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                        <div className="hidden md:block text-left">
                          <p className="h-4 w-24 bg-gray-200 rounded-xl animate-pulse" />
                          <p className="h-3 w-20 bg-gray-200 rounded-xl animate-pulse mt-1" />
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-600 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56 rounded-xl shadow-2xl border border-gray-100 bg-white"
                      align="end"
                      forceMount
                    >
                      <DropdownMenuLabel className="font-normal p-4">
                        <div className="flex flex-col space-y-1">
                          <p className="h-4 w-24 bg-gray-200 rounded-xl animate-pulse" />
                          <p className="h-3 w-20 bg-gray-200 rounded-xl animate-pulse" />
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-100" />
                      <div className="h-10 w-20 bg-gray-200 rounded-xl animate-pulse mx-1 my-2" />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
            {/* Loading skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6">
              <div className="h-8 w-64 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-5 w-48 bg-gray-200 rounded-xl animate-pulse sm:ml-auto" />
            </div>
            {/* Challenge Details Card Skeleton */}
            <Card className="bg-white shadow-sm border border-gray-100 rounded-xl">
              <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
                <CardTitle className="text-gray-900 text-xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Challenge Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-5 w-1/4 bg-gray-200 rounded-xl animate-pulse mb-4" />
                <div className="h-4 w-full bg-gray-200 rounded-xl animate-pulse mb-2" />
                <div className="h-4 w-5/6 bg-gray-200 rounded-xl animate-pulse mb-2" />
                <div className="h-4 w-3/4 bg-gray-200 rounded-xl animate-pulse" />
              </CardContent>
            </Card>
            {/* Guidelines Card Skeleton */}
            <Card className="bg-white shadow-sm border border-gray-100 rounded-xl">
              <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
                <CardTitle className="text-gray-900 text-xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  How to Craft Your Prompt
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-4 w-full bg-gray-200 rounded-xl animate-pulse mb-2" />
                <div className="h-4 w-11/12 bg-gray-200 rounded-xl animate-pulse mb-2" />
                <div className="h-4 w-2/3 bg-gray-200 rounded-xl animate-pulse" />
              </CardContent>
            </Card>
            {/* Solution Card Skeleton */}
            <Card className="bg-white shadow-sm border border-gray-100 rounded-xl">
              <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
                <CardTitle className="text-gray-900 text-xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                    <Send className="h-5 w-5 text-white" />
                  </div>
                  Your Solution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 animate-pulse">
                  <div className="h-6 w-40 bg-gray-200 rounded-xl" />
                  <div className="h-64 bg-gray-100 rounded-xl border border-gray-200" />
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-4 w-32 bg-gray-200 rounded-xl" />
                    <div className="h-10 w-40 bg-gray-200 rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : !challenge ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="bg-white shadow-2xl border border-gray-100 rounded-xl max-w-md">
            <CardContent className="text-center py-12 px-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Competition Not Found</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                The challenge you're looking for doesn't exist or has been removed.
              </p>
              <Button
                className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-xl transition-colors duration-200"
                onClick={() => router.push(`/participants/competitions/${compid}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Challenge Details</h1>
                    <p className="text-gray-600 text-sm mt-1">Overview of the current challenge and submission.</p>
                  </div>
                </div>
                {user && (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/participants/competitions/${compid}`)}
                      className="hidden sm:flex items-center gap-2 h-11 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors duration-200"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="text-sm font-medium">Competitions</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center gap-3 h-11 rounded-xl border-gray-200 hover:bg-gray-50 transition-colors duration-200 bg-transparent"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={user.photoURL || "/placeholder.svg?height=100&width=100&query=user-avatar"}
                              alt={user.displayName || "User"}
                            />
                            <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
                              {user.displayName
                                ? user.displayName.charAt(0).toUpperCase()
                                : user.email?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="hidden md:block text-left">
                            <p className="text-sm font-semibold text-gray-900 leading-none">
                              {user.displayName || "User"}
                            </p>
                            <p className="text-xs text-gray-600 leading-none mt-1">{user.email}</p>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-600 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-56 rounded-xl shadow-2xl border border-gray-100 bg-white"
                        align="end"
                        forceMount
                      >
                        <DropdownMenuLabel className="font-normal p-4">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-semibold leading-none text-gray-900">
                              {user.displayName || "User"}
                            </p>
                            <p className="text-xs leading-none text-gray-600">{user.email}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-100" />
                        <DropdownMenuItem
                          onClick={logout}
                          className="cursor-pointer m-1 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                        >
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>
          </header>
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
            {/* Challenge title, badge, and countdown */}
          <Card className="bg-white shadow-sm border border-gray-100 rounded-xl hover:shadow-md transition-shadow duration-200">
            <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{challenge.title}</h2>
                <Badge
                  variant="secondary"
                  className={`font-medium px-3 py-1 rounded-full text-sm ${
                    challenge.isCompetitionLocked
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-green-100 text-green-800 border border-green-200"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      challenge.isCompetitionLocked ? "bg-red-500" : "bg-green-500"
                    }`}
                  />
                  {challenge.isCompetitionLocked ? "Locked" : "Active"}
                </Badge>
                {challenge.endDeadline && (
                  <div className="flex items-center gap-3 text-sm mt-2 sm:mt-0 sm:ml-auto bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-sm">
                    <CountdownDisplay targetDate={challenge.endDeadline.seconds * 1000} />
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

            {/* Challenge Details Card */}
            <Card className="bg-white shadow-sm border border-gray-100 rounded-xl hover:shadow-md transition-shadow duration-200">
              <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
                <CardTitle className="text-gray-900 text-xl font-bold flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-700" />
                  Challenge Details
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Problem Statement</h3>
                  <p className="text-gray-700 leading-relaxed">{challenge.problemStatement}</p>
                </div>
              </CardContent>
            </Card>
            {/* Guidelines Card */}
            <Card className="bg-white shadow-sm border border-gray-100 rounded-xl hover:shadow-md transition-shadow duration-200">
            <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
              <CardTitle className="text-gray-900 text-xl font-bold flex items-center gap-3">
                <Target className="h-6 w-6 text-emerald-600" />
                How to Craft Your Prompt
              </CardTitle>
            </CardHeader>


              <CardContent className="p-6">
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{challenge.guidelines}</div>
              </CardContent>
            </Card>
            {/* Solution Card */}
            <Card className="bg-white shadow-sm border border-gray-100 rounded-xl hover:shadow-md transition-shadow duration-200">
            <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
              <CardTitle className="text-gray-900 text-xl font-bold flex items-center gap-3">
                <Send className="h-6 w-6 text-blue-700" />
                Your Solution
              </CardTitle>
            </CardHeader>

              <CardContent className="p-6 space-y-6">
                {loadingPrompt ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-6 w-40 bg-gray-200 rounded-xl" />
                    <div className="h-64 bg-gray-100 rounded-xl border border-gray-200" />
                    <div className="flex items-center justify-between pt-2">
                      <div className="h-4 w-32 bg-gray-200 rounded-xl" />
                      <div className="h-10 w-40 bg-gray-200 rounded-xl" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="prompt" className="text-gray-900 font-semibold mb-3 block">
                        Prompt Text
                      </Label>
                      <Textarea
                        id="prompt"
                        placeholder="Enter your carefully crafted prompt here..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[280px] font-mono text-sm bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl resize-none"
                        disabled={challenge.isCompetitionLocked}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        Characters: <span className="font-semibold">{prompt.length}</span> | Words:{" "}
                        <span className="font-semibold">{prompt.split(/\s+/).filter(Boolean).length}</span>
                      </div>
                      <Button
                        onClick={() => setIsConfirmModalOpen(true)}
                        disabled={!prompt.trim() || challenge.isCompetitionLocked || loading}
                        className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200 rounded-xl px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {loading ? "Submitting..." : "Submit Prompt"}
                      </Button>
                    </div>
                    {/* Confirmation Modal */}
                    {isConfirmModalOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-2xl p-8 w-[400px] text-center border border-gray-100">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Send className="w-8 h-8 text-blue-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {hasPreviousSubmission ? "Update submission?" : "Submit your prompt?"}
                          </h2>
                          <p className="text-gray-600 mb-6">
                            {hasPreviousSubmission
                              ? "This will replace your previous submission."
                              : "Are you ready to submit your solution?"}
                          </p>
                          <div className="flex justify-center gap-3">
                            <Button
                              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-xl transition-colors duration-200"
                              onClick={async () => {
                                setLoading(true)
                                setIsConfirmModalOpen(false)
                                await submitPrompt(resolvedParams.id, user.uid, resolvedParams.challengeId, prompt)
                                setLoading(false)
                                await fetchSubmissionPrompt(competitionId, challengeId, user.uid)
                              }}
                            >
                              {hasPreviousSubmission ? "Update" : "Submit"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsConfirmModalOpen(false)}
                              className="border-gray-200 hover:bg-gray-50 font-semibold px-6 py-2 rounded-xl transition-colors duration-200"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </main>
  )
}