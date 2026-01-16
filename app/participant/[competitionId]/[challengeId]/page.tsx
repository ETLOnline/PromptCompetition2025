"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { submitPrompt, checkExistingSubmission } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, FileText, Send, AlertCircle, Target, CheckCircle, Image as ImageIcon, Volume2, X } from 'lucide-react'
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useRouter, useParams } from "next/navigation"
import type { Timestamp } from "firebase/firestore"
import { CountdownDisplay } from "@/components/countdown-display"
import { fetchWithAuth } from "@/lib/api"
import ParticipantBreadcrumb from "@/components/participant-breadcrumb"
import { useEffect, useState } from "react"

interface Challenge {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  endDeadline: Timestamp
  isCompetitionLocked: boolean
  problemAudioUrls: string[]
  guidelinesAudioUrls: string[]
  visualClueUrls: string[]
}


interface UserProfile {
  uid: string
  email: string
  role: string
  displayName?: string | null
  photoURL?: string | null
}

export default function ChallengePage() {
  const { logout } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const routeParams = useParams<{ competitionId: string; challengeId: string }>()
  const { competitionId, challengeId } = routeParams
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasPreviousSubmission, setHasPreviousSubmission] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [competitionendDeadline, setCompetitionendDeadline] = useState<Date | null>(null)
  const [submissionType, setSubmissionType] = useState<'new' | 'update' | null>(null)
  
  const [loadingPrompt, setLoadingPrompt] = useState<boolean>(false)
  const [loadingChallenge, setLoadingChallenge] = useState<boolean>(true)
  const [compid, setCompid] = useState<string | null>(null)
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submissionError, setSubmissionError] = useState<string>('')

  const [user, setUser] = useState<UserProfile | null>(null)
  const [isCompetitionEnded, setIsCompetitionEnded] = useState(false)
  const [isCompetitionActive, setIsCompetitionActive] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const profile = await checkAuth()
      if (!profile) return

      const { competitionId: id } = routeParams
      setCompid(id)

      const participantRef = doc(db, "competitions", id, "participants", profile.uid)
      const participantSnap = await getDoc(participantRef)
      if (!participantSnap.exists()) {
        router.push("/participant")
        return
      }

      try {
        await Promise.all([
          fetchChallengeData(id, challengeId),
          fetchSubmissionPrompt(id, challengeId, profile.uid),
        ])
      } catch (error) {
        console.error("Error in parallel fetch:", error)
      }
    }
    
    const checkEnd = async () => {
      const ended = await checkCompetitionEnded()
      setIsCompetitionEnded(ended)
    }
    
    init()
    checkEnd()
  }, [router, routeParams, challengeId])

  const checkAuth = async (): Promise<UserProfile | null> => {
    try {
      const profile = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_USER_AUTH}`
      )
      setUser(profile)

      if (!profile || ["admin", "judge", "superadmin"].includes(profile.role)) {
        router.push("/")
        return null
      }

      return profile
    } catch (error) {
      router.push("/")
      return null
    }
  }

  const checkCompetitionEnded = async () => {
    try {
      const competitionRef = doc(db, "competitions", competitionId)
      const competitionDoc = await getDoc(competitionRef)

      if (competitionDoc.exists()) {
        const data = competitionDoc.data()
        const endDeadline = data.endDeadline || null
        const isCompetitionActive = data.isActive || false
        setIsCompetitionActive(isCompetitionActive)

        if (endDeadline) {
          const endDate = new Date(endDeadline)
          const now = new Date()
          return now.getTime() > endDate.getTime()
        }
      }

      return false
    } catch (error) {
      console.error("Error checking competition end date:", error)
      return false
    }
  }

  const fetchChallengeData = async (competitionId: string, challengeId: string) => {
    try {
      setLoadingChallenge(true)

      const challengeRef = doc(db, "competitions", competitionId, "challenges", challengeId)
      const challengeSnap = await getDoc(challengeRef)
      if (!challengeSnap.exists()) {
        console.warn("Challenge document not found.")
        return
      }
      const challengeDataRaw = challengeSnap.data()

      const competitionRef = doc(db, "competitions", competitionId)
      const competitionSnap = await getDoc(competitionRef)
      if (!competitionSnap.exists()) {
        console.warn("Competition document not found.")
        return
      }
      const competitionData = competitionSnap.data()

      const isCompetitionLocked =
        competitionData?.endDeadline &&
        new Date() > new Date(competitionData.endDeadline)
      
      const enddead = competitionData?.endDeadline?.toDate?.() ?? new Date(competitionData.endDeadline)
      setCompetitionendDeadline(enddead || null)

      const challengeData: Challenge & { endDeadline?: Timestamp } = {
        id: challengeId,
        title: challengeDataRaw.title,
        problemStatement: challengeDataRaw.problemStatement,
        guidelines: challengeDataRaw.guidelines,
        isCompetitionLocked: isCompetitionLocked,
        endDeadline: competitionData.endDeadline,
        problemAudioUrls: challengeDataRaw.problemAudioUrls || [],
        guidelinesAudioUrls: challengeDataRaw.guidelinesAudioUrls || [],
        visualClueUrls: challengeDataRaw.visualClueUrls || [],
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

  const handleCompetitionExpiry = () => {
    if (challenge) {
      setChallenge(prev => prev ? { ...prev, isCompetitionLocked: true } : null)
    }
    setIsCompetitionEnded(true)
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
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6">
              <div className="h-8 w-64 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-5 w-48 bg-gray-200 rounded-xl animate-pulse sm:ml-auto" />
            </div>
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
                onClick={() => router.push(`/participant/${compid}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <ParticipantBreadcrumb />
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
                  {challenge.endDeadline && competitionendDeadline && (
                    <div className="flex items-center gap-3 text-sm mt-2 sm:mt-0 sm:ml-auto bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-sm">
                      <CountdownDisplay 
                        targetDate={competitionendDeadline} 
                        onExpire={handleCompetitionExpiry}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Problem Statement Card */}
            {(challenge.problemStatement || (challenge.problemAudioUrls && challenge.problemAudioUrls.length > 0)) && (
              <Card className="bg-white shadow-sm border border-gray-100 rounded-xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
                  <CardTitle className="text-gray-900 text-xl font-bold flex items-center gap-3">
                    <FileText className="h-6 w-6 text-blue-700" />
                    Problem Statement
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {challenge.problemStatement && (
                    <div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{challenge.problemStatement}</p>
                    </div>
                  )}
                  
                  {challenge.problemAudioUrls && challenge.problemAudioUrls.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Volume2 className="h-5 w-5 text-orange-600" />
                        Audio Instructions
                      </h4>
                      {challenge.problemAudioUrls.map((audioUrl, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Audio {index + 1}
                          </div>
                          <audio controls className="w-full">
                            <source src={audioUrl} type="audio/mpeg" />
                            <source src={audioUrl} type="audio/wav" />
                            <source src={audioUrl} type="audio/ogg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Visual Clues Card */}
            {challenge.visualClueUrls && challenge.visualClueUrls.length > 0 && (
              <Card className="bg-white shadow-sm border border-gray-100 rounded-xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
                  <CardTitle className="text-gray-900 text-xl font-bold flex items-center gap-3">
                    <ImageIcon className="h-6 w-6 text-purple-600" />
                    Visual Clues
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {challenge.visualClueUrls.map((imageUrl, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={`Visual clue ${index + 1}`}
                        className="max-w-full max-h-96 mx-auto cursor-pointer hover:opacity-90 transition-opacity object-contain"
                        onClick={() => setPreviewImage(imageUrl)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Guidelines & Instructions Card */}
            {(challenge.guidelines || (challenge.guidelinesAudioUrls && challenge.guidelinesAudioUrls.length > 0)) && (
              <Card className="bg-white shadow-sm border border-gray-100 rounded-xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
                  <CardTitle className="text-gray-900 text-xl font-bold flex items-center gap-3">
                    <Target className="h-6 w-6 text-emerald-600" />
                    Guidelines & Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {challenge.guidelines && (
                    <div>
                      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{challenge.guidelines}</div>
                    </div>
                  )}
                  
                  {challenge.guidelinesAudioUrls && challenge.guidelinesAudioUrls.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Volume2 className="h-5 w-5 text-orange-600" />
                        Audio Guidelines
                      </h4>
                      {challenge.guidelinesAudioUrls.map((audioUrl, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Audio {index + 1}
                          </div>
                          <audio controls className="w-full">
                            <source src={audioUrl} type="audio/mpeg" />
                            <source src={audioUrl} type="audio/wav" />
                            <source src={audioUrl} type="audio/ogg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}



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
                        onPaste={(e) => {
                          e.preventDefault()
                          toast({
                            title: "Paste Disabled",
                            description: "Please type your prompt manually.",
                            variant: "destructive",
                          })
                        }}
                        onCopy={(e) => {
                          e.preventDefault()
                          toast({
                            title: "Copy Disabled",
                            description: "Copying text is not allowed.",
                            variant: "destructive",
                          })
                        }}
                        onCut={(e) => {
                          e.preventDefault()
                          toast({
                            title: "Cut Disabled",
                            description: "Cutting text is not allowed.",
                            variant: "destructive",
                          })
                        }}
                        className="min-h-[280px] font-mono text-sm bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl resize-none"
                        disabled={challenge.isCompetitionLocked}
                      />
                    </div>
                    {hasPreviousSubmission && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 mb-2 mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <span>You have already submitted this challenge. You can update your submission below.</span>
                      </div>
                    )}
                    {(isCompetitionEnded || !isCompetitionActive) && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200 mb-2 mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          {isCompetitionEnded 
                            ? "Submission time is over. You can no longer submit or update responses for this challenge."
                            : "This competition is currently not active. Submissions are disabled."}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        Characters: <span className="font-semibold">{prompt.length}</span> | Words:{" "}
                        <span className="font-semibold">{prompt.split(/\s+/).filter(Boolean).length}</span>
                      </div>
                      <Button
                        onClick={() => {
                          setSubmissionType(hasPreviousSubmission ? 'update' : 'new')
                          setIsConfirmModalOpen(true)
                        }}
                        disabled={!prompt.trim() || isCompetitionEnded || loading || !isCompetitionActive}
                        title={
                          isCompetitionEnded 
                            ? "Submission time is over" 
                            : !isCompetitionActive 
                            ? "Competition is not active" 
                            : !prompt.trim() 
                            ? "Please enter your prompt" 
                            : ""
                        }
                        className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200 rounded-xl px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {loading
                          ? hasPreviousSubmission
                            ? "Updating..."
                            : "Submitting..."
                          : hasPreviousSubmission
                          ? "Update Prompt"
                          : "Submit Prompt"}
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
                                const hasEnded = await checkCompetitionEnded()
                                if (hasEnded) {
                                  setIsConfirmModalOpen(false)
                                  setSubmissionStatus("error")
                                  setSubmissionError("Submission time is over. You can no longer submit responses for this challenge.")
                                  return
                                }

                                setLoading(true)
                                setIsConfirmModalOpen(false)
                                setSubmissionStatus("submitting")

                                try {
                                  const result = await submitPrompt(routeParams.competitionId, routeParams.challengeId, prompt)
                                  if (!result.success) {
                                    let errorMessage = result.error || "Unknown error occurred"
                                    
                                    if (errorMessage.includes("Competition has ended")) {
                                      errorMessage = "Submission time is over. You can no longer submit responses for this challenge."
                                    } else if (errorMessage.includes("Competition has not started yet")) {
                                      errorMessage = "The competition has not started yet. Please wait until it begins."
                                    } else if (errorMessage.includes("Competition is not active")) {
                                      errorMessage = "This competition is currently not active. Please contact the administrator."
                                    } else if (errorMessage.includes("Rate limit exceeded")) {
                                      errorMessage = "You're submitting too quickly. Please wait a moment and try again."
                                    } else if (errorMessage.includes("size exceeds")) {
                                      errorMessage = "Your submission is too large. Please reduce the size and try again."
                                    }
                                    
                                    setSubmissionError(errorMessage)
                                    setSubmissionStatus("error")
                                    return
                                  }

                                  setSubmissionStatus("success")
                                  toast({
                                    title: "Submission Successful",
                                    description: hasPreviousSubmission
                                      ? "Your submission has been updated."
                                      : "Your submission has been submitted.",
                                  })
                                  await fetchSubmissionPrompt(routeParams.competitionId, routeParams.challengeId, user.uid)
                                } catch (error: any) {
                                  console.error("Error submitting prompt:", error)
                                  
                                  let errorMessage = "Error submitting prompt. Please try again later."
                                  
                                  if (error.message && error.message.includes("Competition has ended")) {
                                    errorMessage = "Submission time is over. You can no longer submit responses for this challenge."
                                  } else if (error.message && error.message.includes("network")) {
                                    errorMessage = "Network error. Please check your connection and try again."
                                  }
                                  
                                  setSubmissionStatus("error")
                                  setSubmissionError(errorMessage)
                                } finally {
                                  setLoading(false)
                                }
                              }}
                            >
                              {loading
                                ? hasPreviousSubmission
                                  ? "Updating..."
                                  : "Submitting..."
                                : hasPreviousSubmission
                                ? "Update"
                                : "Submit"}
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
                    
                    {/* Success Modal */}
                    {submissionStatus === 'success' && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-2xl p-8 w-[400px] text-center border border-gray-100">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {submissionType === 'update' ? "Updated Successfully!" : "Submission Successful!"}
                          </h2>
                          <p className="text-gray-600 mb-6">
                            {submissionType === 'update'
                              ? "Your prompt has been updated successfully."
                              : "Your prompt has been successfully submitted."}
                          </p>
                          <Button
                            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-xl transition-colors duration-200"
                            onClick={() => {
                              router.push(`/participant/${routeParams.competitionId}`)
                            }}
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Error Modal */}
                    {submissionStatus === 'error' && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-2xl p-8 w-[400px] text-center border border-gray-100">
                          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900 mb-2">Submission Failed</h2>
                          <p className="text-gray-600 mb-6">{submissionError}</p>
                          <Button
                            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-xl transition-colors duration-200"
                            onClick={() => {
                              setSubmissionStatus('idle')
                              setSubmissionError('')
                            }}
                          >
                            Close
                          </Button>
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </main>
  )
}