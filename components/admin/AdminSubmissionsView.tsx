"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, doc, getDoc, Timestamp } from "firebase/firestore"
import { Trophy, User, Star, Eye, FileText, Target, ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"

interface Submission {
  id: string
  userId: string
  submissionText: string
  timestamp: Timestamp
  totalVotes: number
  userFullName?: string
  bayesScore?: number
  ratingAvg?: number
  voteCount?: number
}

interface AdminSubmissionsViewProps {
  challengeId: string
  challengeTitle: string
}

export const AdminSubmissionsView = ({ challengeId, challengeTitle }: AdminSubmissionsViewProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmissionForDetails, setSelectedSubmissionForDetails] = useState<string | null>(null)
  const [challengeDetails, setChallengeDetails] = useState<any>(null)
  const [loadingChallengeDetails, setLoadingChallengeDetails] = useState(false)

  // Fetch challenge details when modal opens
  useEffect(() => {
    if (selectedSubmissionForDetails && !challengeDetails) {
      fetchChallengeDetails()
    }
  }, [selectedSubmissionForDetails])

  const fetchChallengeDetails = async () => {
    try {
      setLoadingChallengeDetails(true)
      const challengeRef = doc(db, "dailychallenge", challengeId)
      const challengeSnap = await getDoc(challengeRef)
      
      if (challengeSnap.exists()) {
        setChallengeDetails(challengeSnap.data())
      }
    } catch (err) {
      console.error("Error fetching challenge details:", err)
    } finally {
      setLoadingChallengeDetails(false)
    }
  }

  const handleOpenSubmissionDetails = (submissionId: string) => {
    setSelectedSubmissionForDetails(submissionId)
    if (!challengeDetails) {
      fetchChallengeDetails()
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(null)

    const submissionsRef = collection(db, "dailychallenge", challengeId, "submissions")
    
    const unsubscribe = onSnapshot(
      submissionsRef,
      async (snapshot) => {
        try {
          const submissionsData: Submission[] = []
          
          const userFetchPromises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data()
            let userFullName = "Anonymous User"

            if (data.userId) {
              try {
                const userDocRef = doc(db, "users", data.userId)
                const userDocSnap = await getDoc(userDocRef)

                if (userDocSnap.exists()) {
                  const userData = userDocSnap.data()
                  userFullName = userData.fullName || userData.username || "Anonymous User"
                }
              } catch (userError) {
                console.error(`Error fetching user ${data.userId}:`, userError)
              }
            }

            return {
              id: docSnap.id,
              userId: data.userId || docSnap.id,
              submissionText: data.submissionText || "",
              timestamp: data.timestamp || Timestamp.now(),
              totalVotes: data.totalVotes || 0,
              bayesScore: data.bayesScore || 0,
              ratingAvg: data.ratingAvg || 0,
              voteCount: data.voteCount || 0,
              userFullName,
            } as Submission
          })

          const resolvedSubmissions = await Promise.all(userFetchPromises)
          
          resolvedSubmissions.sort((a, b) => {
            if (b.bayesScore !== a.bayesScore) {
              return (b.bayesScore || 0) - (a.bayesScore || 0)
            }
            if (b.ratingAvg !== a.ratingAvg) {
              return (b.ratingAvg || 0) - (a.ratingAvg || 0)
            }
            return (b.totalVotes || 0) - (a.totalVotes || 0)
          })
          
          setSubmissions(resolvedSubmissions)
          setLoading(false)
        } catch (err) {
          console.error("Error processing submissions:", err)
          setError("Failed to process submissions")
          setLoading(false)
        }
      },
      (err) => {
        console.error("Error fetching submissions:", err)
        setError("Failed to load submissions. Please try again.")
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [challengeId])

  const formatTimestamp = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "Unknown"
    
    try {
      const date = timestamp.toDate()
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    } catch {
      return "Unknown"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#0f172a] shadow-lg flex-shrink-0">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
              View Daily Prompt Submissions
            </h3>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f172a]"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <p className="text-red-700 font-medium">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (submissions.length === 0) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-8 text-center">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No submissions yet</p>
          <p className="text-gray-500 text-sm mt-1">Submissions will appear here once participants start submitting</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
          <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#0f172a] shadow-lg flex-shrink-0">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
            View Daily Prompt Submissions
          </h3>
          <Badge className="bg-[#0f172a] text-white border-0 font-medium text-xs sm:text-sm">
            {submissions.length}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 pl-0 sm:pl-13">
          Review all participant submissions and their ratings
        </p>
      </div>

      {/* Submissions List View */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-11 gap-4 bg-gray-50 border-b border-gray-200 p-4 font-semibold text-gray-800 text-sm sticky top-0">
          <div className="col-span-2">Participant</div>
          <div className="col-span-4">Submission</div>
          <div className="col-span-2 text-center">Avg Rating</div>
          <div className="col-span-1 text-center">Votes</div>
          <div className="col-span-2 text-center">Bayesian Score</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {submissions.map((submission, index) => {
            return (
              <div key={submission.id} className="hover:bg-gray-50/50 transition-colors">
                {/* Mobile View */}
                <div className="md:hidden p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-[#0f172a] rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {submission.userFullName || "Anonymous User"}
                        </p>
                        <p className="text-xs text-gray-600">{formatTimestamp(submission.timestamp)}</p>
                      </div>
                    </div>
                    {index < 3 && (
                      <Badge 
                        className={`shrink-0 ${
                          index === 0 
                            ? "bg-yellow-100 text-yellow-800" 
                            : index === 1
                            ? "bg-gray-100 text-gray-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        #{index + 1}
                      </Badge>
                    )}
                  </div>

                  {/* Submission Preview */}
                  <button 
                    onClick={() => handleOpenSubmissionDetails(submission.id)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-xs text-gray-600 line-clamp-2">{submission.submissionText}</p>
                    <p className="text-xs text-blue-600 font-semibold mt-1 underline">View Full Submission</p>
                  </button>

                  {/* Rating Stats */}
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${
                              (submission.ratingAvg ?? 0) >= s - 0.5
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold">{submission.ratingAvg ? submission.ratingAvg.toFixed(1) : '0.0'}</span>
                    </div>
                    <Badge className="bg-yellow-600 text-white text-xs">{submission.totalVotes}</Badge>
                  </div>

                  {/* Bayesian Score */}
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
                    Bayesian Score: <span className="font-bold">{(submission.bayesScore || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Desktop View - Table Row */}
                <div className="hidden md:grid grid-cols-11 gap-4 p-4 items-center">
                  {/* Participant Name */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-[#0f172a] rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4.5 w-4.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {submission.userFullName || "Anonymous"}
                        </p>
                        <p className="text-xs text-gray-600">{formatTimestamp(submission.timestamp).split(',')[0]}</p>
                      </div>
                    </div>
                  </div>

                  {/* Submission Text with Show More Modal */}
                  <div className="col-span-4">
                    <button 
                      onClick={() => handleOpenSubmissionDetails(submission.id)}
                      className="w-full text-left p-2.5 bg-gray-50 rounded border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <p className="text-sm text-gray-700 line-clamp-1 group-hover:text-blue-700">{submission.submissionText}</p>
                      <p className="text-xs text-blue-600 font-semibold mt-1.5">View Details</p>
                    </button>
                  </div>

                  {/* Average Rating with Stars */}
                  <div className="col-span-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${(submission.ratingAvg ?? 0) >= s - 0.5 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-gray-900 ml-1 whitespace-nowrap">
                        {submission.ratingAvg ? submission.ratingAvg.toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </div>

                  {/* Number of Votes */}
                  <div className="col-span-1 text-center">
                    <Badge className="bg-blue-100 text-blue-900 text-sm font-semibold whitespace-nowrap">
                      {submission.totalVotes}
                    </Badge>
                  </div>

                  {/* Bayesian Score */}
                  <div className="col-span-2">
                    <div className="text-center p-2.5 bg-blue-50 rounded border border-blue-200">
                      <span className="text-sm font-bold text-blue-900">
                        {(submission.bayesScore || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Submission Details Modal */}
      {selectedSubmissionForDetails && (
        <Dialog open={!!selectedSubmissionForDetails} onOpenChange={(open) => !open && setSelectedSubmissionForDetails(null)}>
          <DialogContent className="bg-white border-0 shadow-2xl max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl font-semibold text-gray-900">Submission Details</DialogTitle>
                  <DialogDescription className="text-gray-600 text-sm">Full submission with challenge context</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-6 mt-4">
              {loadingChallengeDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f172a]"></div>
                </div>
              ) : (
                <>
                  {/* Challenge Title */}
                  {challengeDetails?.title && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 break-words leading-tight">
                        {challengeDetails.title}
                      </h3>
                    </div>
                  )}

                  {/* Problem Statement */}
                  {(challengeDetails?.problemStatement || challengeDetails?.problemAudioUrls?.length > 0) && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <h4 className="text-base font-semibold text-blue-900">Problem Statement</h4>
                      </div>
                      {challengeDetails?.problemStatement && (
                        <div className="bg-white rounded-md p-4 max-h-48 overflow-y-auto border mb-4">
                          <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap">
                            {challengeDetails.problemStatement}
                          </p>
                        </div>
                      )}
                      {challengeDetails?.problemAudioUrls && challengeDetails.problemAudioUrls.length > 0 && (
                        <div className="space-y-3">
                          {challengeDetails.problemAudioUrls.map((url: string, index: number) => (
                            <div key={index} className="bg-white rounded-md p-3 border">
                              <div className="text-sm text-gray-700 mb-2 font-medium">Audio {index + 1}</div>
                              <audio controls src={url} className="w-full h-8" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Guidelines */}
                  {(challengeDetails?.guidelines || challengeDetails?.guidelinesAudioUrls?.length > 0) && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <h4 className="text-base font-semibold text-green-900">Guidelines</h4>
                      </div>
                      {challengeDetails?.guidelines && (
                        <div className="bg-white rounded-md p-4 max-h-48 overflow-y-auto border mb-4">
                          <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap">
                            {challengeDetails.guidelines}
                          </p>
                        </div>
                      )}
                      {challengeDetails?.guidelinesAudioUrls && challengeDetails.guidelinesAudioUrls.length > 0 && (
                        <div className="space-y-3">
                          {challengeDetails.guidelinesAudioUrls.map((url: string, index: number) => (
                            <div key={index} className="bg-white rounded-md p-3 border">
                              <div className="text-sm text-gray-700 mb-2 font-medium">Audio {index + 1}</div>
                              <audio controls src={url} className="w-full h-8" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visual Clues */}
                  {challengeDetails?.visualClueUrls && challengeDetails.visualClueUrls.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ImageIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <h4 className="text-base font-semibold text-amber-900">Visual Clues ({challengeDetails.visualClueUrls.length})</h4>
                      </div>
                      <div className="space-y-4">
                        {challengeDetails.visualClueUrls.map((url: string, index: number) => (
                          <div key={index} className="w-full flex justify-center">
                            <img
                              src={url}
                              alt={`Visual clue ${index + 1}`}
                              className="max-w-full h-auto rounded-md border border-amber-200 mx-auto"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Participant Submission */}
                  {(() => {
                    const submission = submissions.find(s => s.id === selectedSubmissionForDetails)
                    if (!submission) return null
                    return (
                      <div className="border-t pt-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Participant Submission</h4>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-[#0f172a] rounded-full flex items-center justify-center text-white font-semibold">
                              {submission.userFullName?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{submission.userFullName || "Anonymous"}</p>
                              <p className="text-xs text-gray-500">{formatTimestamp(submission.timestamp)}</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-md p-4 border mb-4">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{submission.submissionText}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`h-3 w-3 ${(submission.ratingAvg ?? 0) >= s - 0.5 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-gray-600">Avg Rating</p>
                              <p className="text-lg font-bold text-gray-900">{(submission.ratingAvg || 0).toFixed(1)}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                              <p className="text-xs text-gray-600 mb-1">Total Votes</p>
                              <p className="text-lg font-bold text-gray-900">{submission.voteCount || 0}</p>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-center">
                              <p className="text-xs text-gray-600 mb-1">Bayesian Score</p>
                              <p className="text-lg font-bold text-gray-900">{(submission.bayesScore || 0).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
