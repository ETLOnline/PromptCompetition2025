"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, doc, Timestamp, getDoc, setDoc, query, where, getDocs, runTransaction } from "firebase/firestore"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Trophy, User, Calendar, ThumbsUp, Send, CheckCircle2, Star } from "lucide-react"
import { DailyChallengeLeaderboard } from "./DailyChallengeLeaderboard"

interface Submission {
  id: string
  userId: string
  submissionText: string
  timestamp: Timestamp
  totalVotes: number
  userFullName?: string
  bayesScore?: number
  ratingAvg?: number
}

interface ChallengeVotingSectionProps {
  challengeId: string
  challengeTitle: string
}

export const ChallengeVotingSection = ({ challengeId, challengeTitle }: ChallengeVotingSectionProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedScores, setSelectedScores] = useState<Record<string, number>>({})
  const [submittingVotes, setSubmittingVotes] = useState<Record<string, boolean>>({})
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({})
  const [userVotes, setUserVotes] = useState<Record<string, { score: number, votedAt: Timestamp }>>({})
  const { toast } = useToast()
  
  // Get current user from Clerk
  const { user, isLoaded } = useUser()
  const currentUserId = user?.id || null

  // Fetch user's votes for all submissions in this challenge
  useEffect(() => {
    if (!currentUserId) return

    const fetchUserVotes = async () => {
      try {
        const votesRef = collection(db, "dailychallenge", challengeId, "votes")
        const q = query(votesRef, where("voterId", "==", currentUserId))
        const querySnapshot = await getDocs(q)
        
        const votes: Record<string, { score: number, votedAt: Timestamp }> = {}
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          votes[data.submissionId] = {
            score: data.score,
            votedAt: data.votedAt
          }
        })
        
        setUserVotes(votes)
      } catch (err) {
        console.error("Error fetching user votes:", err)
      }
    }

    fetchUserVotes()
  }, [currentUserId, challengeId])

  useEffect(() => {
    setLoading(true)
    setError(null)

    const submissionsRef = collection(db, "dailychallenge", challengeId, "submissions")
    // console.log("Listening to submissions at:", submissionsRef.path)
    // Real-time listener for submissions
    const unsubscribe = onSnapshot(
      submissionsRef,
      async (snapshot) => {
        try {
          const submissionsData: Submission[] = []
          
          // Fetch user names for all submissions
          const userFetchPromises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data()
            const userId = data.userId || docSnap.id
            // console.log(`Processing submission from userId: ${userId}`)
            
            // Fetch user's full name from users collection
            let userFullName = "Anonymous User"
            try {
              const userDoc = await getDoc(doc(db, "users", userId))
            //   console.log(`Fetched user doc for ${userId}:`, userDoc.data())
              if (userDoc.exists()) {
                userFullName = userDoc.data()?.fullName || "Anonymous User"
              }
            } catch (err) {
              console.error(`Error fetching user ${userId}:`, err)
            }

            const voteCount = data.voteCount ?? data.totalVotes ?? 0
            const bayesScore = data.bayesScore ?? 0
            const ratingAvg = data.ratingAvg ?? undefined
            return {
              id: docSnap.id,
              userId: userId,
              submissionText: data.submissionText || "",
              timestamp: data.timestamp,
              totalVotes: voteCount,
              userFullName: userFullName,
              bayesScore,
              ratingAvg,
            }
          })

          const resolvedSubmissions = await Promise.all(userFetchPromises)
          
          // Sort by bayesian score (fallback to votes count)
          resolvedSubmissions.sort((a, b) => {
            const bsB = b.bayesScore ?? 0
            const bsA = a.bayesScore ?? 0
            if (bsB !== bsA) return bsB - bsA
            return b.totalVotes - a.totalVotes
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

    // Cleanup listener on unmount
    return () => unsubscribe()
  }, [challengeId])

  const handleScoreChange = (submissionId: string, score: string) => {
    setSelectedScores((prev) => ({
      ...prev,
      [submissionId]: parseInt(score, 10),
    }))
  }

  const handleSubmitScore = async (submissionId: string, userId: string) => {
    console.log("handleSubmitScore called:", { submissionId, userId, currentUserId })
    
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to vote on submissions.",
        variant: "destructive",
      })
      return
    }

    // Prevent users from voting on their own submission
    // submissionId and userId are the same (both are the submission owner's userId)
    if (submissionId === currentUserId) {
      toast({
        title: "Cannot Vote on Own Submission",
        description: "You cannot vote on your own submission.",
        variant: "destructive",
      })
      return
    }

    // Check if user has already voted for this submission
    if (userVotes[submissionId]) {
      toast({
        title: "Already Voted",
        description: `You already gave ${userVotes[submissionId].score} point${userVotes[submissionId].score !== 1 ? 's' : ''} to this submission.`,
        variant: "destructive",
      })
      return
    }

    const score = selectedScores[submissionId]

    if (score === undefined || score < 1 || score > 5) {
      toast({
        title: "Invalid Rating",
        description: "Please select a rating between 1 and 5.",
        variant: "destructive",
      })
      return
    }

    setSubmittingVotes((prev) => ({ ...prev, [submissionId]: true }))

    try {
      const submissionRef = doc(db, "dailychallenge", challengeId, "submissions", userId)
      const voteId = `${currentUserId}_${submissionId}`
      const voteRef = doc(db, "dailychallenge", challengeId, "votes", voteId)
      // Use a concrete document id under the stats collection (even segments required)
      const statsRef = doc(db, "dailychallenge", challengeId, "stats", "global")

      await runTransaction(db, async (tx) => {
        // Ensure no duplicate vote
        const existingVote = await tx.get(voteRef)
        if (existingVote.exists()) {
          throw new Error("Already voted for this submission")
        }

        // Load global stats (for C and m)
        const statsSnap = await tx.get(statsRef)
        let globalVoteCount = 0
        let globalRatingSum = 0
        let m = 2 // default minimum votes threshold; lowered to 2 for better sensitivity with low vote counts
        if (statsSnap.exists()) {
          const s = statsSnap.data() as any
          globalVoteCount = s.globalVoteCount ?? 0
          globalRatingSum = s.globalRatingSum ?? 0
          if (typeof s.m === "number") m = s.m
        }

        // Load submission aggregate
        const subSnap = await tx.get(submissionRef)
        if (!subSnap.exists()) {
          throw new Error("Submission not found")
        }
        const sub = subSnap.data() as any
        const prevCount = sub.voteCount ?? 0
        const prevSum = sub.ratingSum ?? 0

        // Apply this vote
        const newCount = prevCount + 1
        const newSum = prevSum + score
        const R = newSum / newCount

        const newGlobalCount = globalVoteCount + 1
        const newGlobalSum = globalRatingSum + score
        const C = newGlobalCount > 0 ? newGlobalSum / newGlobalCount : 0

        const denom = newCount + m
        const bayesScore = denom > 0 ? (newCount / denom) * R + (m / denom) * C : 0

        // Persist: vote, submission aggregates, and global stats
        tx.set(voteRef, {
          voterId: currentUserId,
          submissionId,
          submissionOwnerId: userId,
          score,
          votedAt: Timestamp.now(),
        })

        tx.set(
          statsRef,
          {
            globalVoteCount: newGlobalCount,
            globalRatingSum: newGlobalSum,
            globalAverage: C,
            m,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        )

        tx.update(submissionRef, {
          voteCount: newCount,
          ratingSum: newSum,
          ratingAvg: R,
          bayesScore,
          lastVotedAt: Timestamp.now(),
        })
      })

      // Update local state to reflect the vote
      setUserVotes((prev) => ({
        ...prev,
        [submissionId]: { score, votedAt: Timestamp.now() }
      }))

      toast({
        title: "Rating Submitted!",
        description: `You gave ${score} star${score !== 1 ? 's' : ''} to this submission.`,
      })

      // Clear selected score after successful submission
      setSelectedScores((prev) => {
        const updated = { ...prev }
        delete updated[submissionId]
        return updated
      })
    } catch (err) {
      console.error("Error submitting rating:", err)
      toast({
        title: "Submission Failed",
        description: "Failed to submit your rating. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingVotes((prev) => ({ ...prev, [submissionId]: false }))
    }
  }

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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0f172a] rounded-xl flex items-center justify-center">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-32 bg-gray-200 rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-24 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-800">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trophy className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold">Error Loading Submissions</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (submissions.length === 0) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
          <p className="text-gray-600">Be the first to submit a solution for this challenge!</p>
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
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            <span className="sm:hidden">Vote to Submissions</span>
            <span className="hidden sm:inline">Vote to Daily Prompt Submissions</span>
          </h3>
          <Badge className="bg-[#0f172a] text-white border-0 font-medium text-xs sm:text-sm">
            {submissions.length}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 pl-0 sm:pl-13">
          Review and rate submissions from 1-5 stars.
        </p>
      </div>

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {submissions.map((submission, index) => {
          const isSubmitting = submittingVotes[submission.id] || false
          const selectedScore = selectedScores[submission.id]
          const hasVoted = !!userVotes[submission.id]
          const votedScore = userVotes[submission.id]?.score
          const isOwnSubmission = submission.userId === currentUserId

          return (
            <Card 
              key={submission.id} 
              className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-200 flex flex-col"
            >
              <CardHeader className="bg-gray-50 border-b border-gray-200 pb-3 sm:pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#0f172a] rounded-full flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {submission.userFullName || "Anonymous User"}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5 min-w-0">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate text-xs">{formatTimestamp(submission.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rank Badge for top 3 */}
                  {index < 3 && (
                    <Badge 
                      className={`shrink-0 ${
                        index === 0 
                          ? "bg-yellow-100 text-yellow-800 border-yellow-300" 
                          : index === 1
                          ? "bg-gray-100 text-gray-800 border-gray-300"
                          : "bg-orange-100 text-orange-800 border-orange-300"
                      }`}
                    >
                      #{index + 1}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-5 flex-1 flex flex-col space-y-3 sm:space-y-4">
                {/* Submission Text */}
                <div className="flex-1">
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-100">
                    <p className={`text-xs sm:text-sm text-gray-700 leading-relaxed ${
                      expandedSubmissions[submission.id] ? "" : "line-clamp-2"
                    }`}>
                      {submission.submissionText}
                    </p>
                    {submission.submissionText.length > 100 && (
                      <button
                        onClick={() => setExpandedSubmissions(prev => ({
                          ...prev,
                          [submission.id]: !prev[submission.id]
                        }))}
                        className="text-xs text-[#0f172a] hover:text-slate-700 font-semibold mt-2 underline"
                      >
                        {expandedSubmissions[submission.id] ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Rating Average Display */}
                <div className="flex items-center justify-between py-2 px-2 sm:px-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const rating = submission.ratingAvg ?? 0
                        const filled = rating >= s - 0.5
                        return (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${
                              filled
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        )
                      })}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-800">
                      {submission.ratingAvg ? `${submission.ratingAvg.toFixed(1)}/5.0` : '0.0/5.0'}
                    </span>
                  </div>
                  <Badge className="bg-yellow-600 text-white border-0 text-xs sm:text-sm font-bold px-2 py-1">
                    {submission.totalVotes} {submission.totalVotes <= 1 ? 'vote' : 'votes'}
                  </Badge>
                </div>

                {/* Scoring Interface */}
                <div className="space-y-2 sm:space-y-3 pt-2 border-t border-gray-200">
                  {isOwnSubmission ? (
                    // Show own submission status
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-blue-800 mb-1">
                        <User className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="font-semibold text-xs sm:text-sm">Your Submission</span>
                      </div>
                      <p className="text-xs sm:text-sm text-blue-700">
                        You cannot vote on your own submission.
                      </p>
                    </div>
                  ) : hasVoted ? (
                    // Show voted status
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-green-800 mb-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="font-semibold text-xs sm:text-sm">Already Voted</span>
                      </div>
                      <p className="text-xs sm:text-sm text-green-700">
                        You gave <span className="font-bold">{votedScore}</span> star{votedScore !== 1 ? 's' : ''} to this submission.
                      </p>
                    </div>
                  ) : (
                    // Show voting interface
                    <>
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-tight">
                        Rating
                      </label>
                      <div className="flex items-center gap-2 w-full">
                        {[1,2,3,4,5].map((s) => {
                          const active = (selectedScore ?? 0) >= s
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleScoreChange(submission.id, String(s))}
                              disabled={isSubmitting}
                              aria-label={`${s} star`}
                              className={`flex-1 p-2 rounded flex items-center justify-center ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 transition-transform'}`}
                            >
                              <Star className={`${active ? 'text-yellow-500' : 'text-gray-300'} h-6 w-6`} />
                            </button>
                          )
                        })}
                        <span className="ml-3 text-xs text-gray-600 whitespace-nowrap">{selectedScore ? `${selectedScore} / 5` : 'Select rating'}</span>
                      </div>

                      <Button
                        onClick={() => handleSubmitScore(submission.id, submission.userId)}
                        disabled={selectedScore === undefined || isSubmitting}
                        className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm py-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2" />
                            <span className="hidden sm:inline">Submitting...</span>
                            <span className="sm:hidden">Submitting</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            <span className="hidden sm:inline">Submit Rating</span>
                            <span className="sm:hidden">Vote</span>
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Daily Challenge Leaderboard - Below the submissions */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <DailyChallengeLeaderboard
          challengeId={challengeId}
          challengeTitle={challengeTitle}
          topN={10}
        />
      </div>
    </div>
  )
}
