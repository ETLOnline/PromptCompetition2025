"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, FileText, Send, AlertCircle, Target, CheckCircle, Image as ImageIcon, Volume2, X } from 'lucide-react'
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, updateDoc, increment, Timestamp } from "firebase/firestore"
import { useRouter, useParams } from "next/navigation"
import { fetchWithAuth } from "@/lib/api"
import ParticipantBreadcrumb from "@/components/participant-breadcrumb"
import { useEffect, useState } from "react"

interface DailyChallenge {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  startTime: Timestamp
  endTime: Timestamp
  status: string
  type: string
  totalSubmissions: number
  problemAudioUrls: string[]
  guidelinesAudioUrls: string[]
  visualClueUrls: string[]
  createdAt?: Timestamp
  createdBy?: string
  createdByEmail?: string
  lastUpdateTime?: Timestamp
  lastUpdatedBy?: string
}

interface UserProfile {
  uid: string
  email: string
  role: string
  displayName?: string | null
  photoURL?: string | null
}

export default function DailyChallengePage() {
  const { logout } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const routeParams = useParams<{ challengeId: string }>()
  const { challengeId } = routeParams
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasPreviousSubmission, setHasPreviousSubmission] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [challengeEndTime, setChallengeEndTime] = useState<Date | null>(null)
  const [submissionType, setSubmissionType] = useState<'new' | 'update' | null>(null)
  
  const [loadingPrompt, setLoadingPrompt] = useState<boolean>(false)
  const [loadingChallenge, setLoadingChallenge] = useState<boolean>(true)
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submissionError, setSubmissionError] = useState<string>('')

  const [user, setUser] = useState<UserProfile | null>(null)
  const [isChallengeEnded, setIsChallengeEnded] = useState(false)
  const [isChallengeActive, setIsChallengeActive] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const profile = await checkAuth()
      if (!profile) return

      try {
        await Promise.all([
          fetchChallengeData(challengeId),
          fetchSubmissionPrompt(challengeId, profile.uid),
        ])
      } catch (error) {
        console.error("Error in parallel fetch:", error)
      }
    }
    
    const checkEnd = async () => {
      const ended = await checkChallengeEnded()
      setIsChallengeEnded(ended)
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

  const checkChallengeEnded = async () => {
    try {
      const challengeRef = doc(db, "dailychallenge", challengeId)
      const challengeDoc = await getDoc(challengeRef)

      if (challengeDoc.exists()) {
        const data = challengeDoc.data()
        const endTime = data.endTime
        const startTime = data.startTime
        const now = new Date()

        // Check if challenge is active (started and not ended)
        const hasStarted = startTime && now.getTime() >= startTime.toDate().getTime()
        const hasEnded = endTime && now.getTime() > endTime.toDate().getTime()
        
        setIsChallengeActive(hasStarted && !hasEnded)
        return hasEnded
      }

      return false
    } catch (error) {
      console.error("Error checking challenge end time:", error)
      return false
    }
  }

  const fetchChallengeData = async (challengeId: string) => {
    try {
      setLoadingChallenge(true)

      const challengeRef = doc(db, "dailychallenge", challengeId)
      const challengeSnap = await getDoc(challengeRef)
      
      if (!challengeSnap.exists()) {
        console.warn("Daily challenge document not found.")
        return
      }
      
      const challengeDataRaw = challengeSnap.data()
      const now = new Date()
      const endTime = challengeDataRaw.endTime?.toDate?.() ?? new Date(challengeDataRaw.endTime)
      const startTime = challengeDataRaw.startTime?.toDate?.(challengeDataRaw.startTime) ?? new Date(challengeDataRaw.startTime)
      
      const isChallengeEnded = endTime && now > endTime
      const isChallengeStarted = startTime && now >= startTime
      
      setIsChallengeActive(isChallengeStarted && !isChallengeEnded)
      setIsChallengeEnded(isChallengeEnded)
      setChallengeEndTime(endTime)

      const challengeData: DailyChallenge = {
        id: challengeId,
        title: challengeDataRaw.title || "",
        problemStatement: challengeDataRaw.problemStatement || "",
        guidelines: challengeDataRaw.guidelines || "",
        startTime: challengeDataRaw.startTime,
        endTime: challengeDataRaw.endTime,
        status: challengeDataRaw.status || "",
        type: challengeDataRaw.type || "",
        totalSubmissions: challengeDataRaw.totalSubmissions || 0,
        problemAudioUrls: challengeDataRaw.problemAudioUrls || [],
        guidelinesAudioUrls: challengeDataRaw.guidelinesAudioUrls || [],
        visualClueUrls: challengeDataRaw.visualClueUrls || [],
        createdAt: challengeDataRaw.createdAt,
        createdBy: challengeDataRaw.createdBy,
        createdByEmail: challengeDataRaw.createdByEmail,
        lastUpdateTime: challengeDataRaw.lastUpdateTime,
        lastUpdatedBy: challengeDataRaw.lastUpdatedBy,
      }

      setChallenge(challengeData)
    } catch (error) {
      console.error("Error fetching daily challenge data:", error)
    } finally {
      setLoadingChallenge(false)
    }
  }

  const fetchSubmissionPrompt = async (challengeId: string, userId: string) => {
    try {
      setLoadingPrompt(true)
      
      const submissionRef = doc(db, "dailychallenge", challengeId, "submissions", userId)
      const submissionSnap = await getDoc(submissionRef)
      
      if (submissionSnap.exists()) {
        const submissionData = submissionSnap.data()
        setPrompt(submissionData.submissionText || "")
        setHasPreviousSubmission(true)
      } else {
        setPrompt("")
        setHasPreviousSubmission(false)
      }
    } catch (error) {
      console.error("Error fetching submission:", error)
      setPrompt("")
      setHasPreviousSubmission(false)
    } finally {
      setLoadingPrompt(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !challenge) return

    setLoading(true)
    setSubmissionStatus('submitting')
    setIsConfirmModalOpen(false)

    try {
      const submissionRef = doc(db, "dailychallenge", challengeId, "submissions", user.uid)
      const statsRef = doc(db, "stats", "dailychallenge")

      // Prepare submission data
      const submissionData = {
        userId: user.uid,
        submissionText: prompt.trim(),
        timestamp: Timestamp.now(),
        voteCount: 0,
      }

      // Check if this is a new submission
      const isNewSubmission = !hasPreviousSubmission

      // Save submission
      await setDoc(submissionRef, submissionData, { merge: true })

      // Update stats only for new submissions
      if (isNewSubmission) {
        await updateDoc(statsRef, {
          totalsubmission: increment(1)
        })

        // Update challenge total submissions
        const challengeRef = doc(db, "dailychallenge", challengeId)
        await updateDoc(challengeRef, {
          totalSubmissions: increment(1)
        })
      }

      setHasPreviousSubmission(true)
      setSubmissionStatus('success')
      
      toast({
        title: isNewSubmission ? "Submission Successful!" : "Submission Updated!",
        description: isNewSubmission 
          ? "Your prompt has been submitted successfully." 
          : "Your submission has been updated.",
      })
    } catch (error) {
      console.error("Error submitting prompt:", error)
      setSubmissionStatus('error')
      setSubmissionError(error instanceof Error ? error.message : "Failed to submit your prompt. Please try again.")
      
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your prompt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChallengeExpiry = () => {
    setIsChallengeEnded(true)
    setIsChallengeActive(false)
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
          </div>
        </>
      ) : !challenge ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="bg-white shadow-2xl border border-gray-100 rounded-xl max-w-md">
            <CardContent className="text-center py-12 px-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Challenge Not Found</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                The challenge you're looking for doesn't exist or has been removed.
              </p>
              <Button
                className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-xl transition-colors duration-200"
                onClick={() => router.push(`/participant`)}
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
                      isChallengeEnded
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : isChallengeActive
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        isChallengeEnded ? "bg-red-500" : isChallengeActive ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                      }`}
                    />
                    {isChallengeEnded ? "Ended" : isChallengeActive ? "Active" : "Not Started"}
                  </Badge>
                  {challenge.endTime && challengeEndTime && isChallengeActive && (
                    <div className="flex items-center gap-3 text-sm mt-2 sm:mt-0 sm:ml-auto bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-sm">
                      <span className="text-gray-600 font-medium">Ends in:</span>
                      <span className="font-bold text-gray-900">
                        {(() => {
                          const now = new Date()
                          const diff = challengeEndTime.getTime() - now.getTime()
                          if (diff <= 0) return "Ended"
                          
                          const hours = Math.floor(diff / (1000 * 60 * 60))
                          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                          
                          if (hours > 24) {
                            const days = Math.floor(hours / 24)
                            return `${days}d ${hours % 24}h`
                          } else if (hours > 0) {
                            return `${hours}h ${minutes}m`
                          } else {
                            return `${minutes}m`
                          }
                        })()}
                      </span>
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
                      <p className="text-gray-700 leading-relaxed">{challenge.problemStatement}</p>
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
                        disabled={isChallengeEnded || !isChallengeActive}
                      />
                    </div>
                    {hasPreviousSubmission && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 mb-2 mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <span>You have already submitted this challenge. You can update your submission below.</span>
                      </div>
                    )}
                    {isChallengeEnded && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200 mb-2 mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <span>Submission time is over. You can no longer submit or update responses for this challenge.</span>
                      </div>
                    )}
                    {!isChallengeActive && !isChallengeEnded && (
                      <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200 mb-2 mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <span>This challenge hasn't started yet. Submissions are not available.</span>
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
                        disabled={!prompt.trim() || isChallengeEnded || !isChallengeActive || loading}
                        title={
                          isChallengeEnded 
                            ? "Submission time is over" 
                            : !isChallengeActive 
                            ? "Challenge is not active" 
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
                              onClick={handleSubmit}
                            >
                              {loading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  {hasPreviousSubmission ? "Updating..." : "Submitting..."}
                                </>
                              ) : (
                                <>Confirm</>
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => setIsConfirmModalOpen(false)}
                              className="border-gray-200 hover:bg-gray-50 font-semibold px-6 py-2 rounded-xl transition-colors duration-200"
                              disabled={loading}
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
                              ? "Your submission has been updated successfully."
                              : "Your prompt has been submitted successfully."}
                          </p>
                          <Button
                            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-xl transition-colors duration-200"
                            onClick={() => {
                              setSubmissionStatus('idle')
                              router.push('/participant')
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
                          <p className="text-gray-600 mb-6">{submissionError || "There was an error submitting your prompt. Please try again."}</p>
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
