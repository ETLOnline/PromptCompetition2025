"use client"

import { useEffect, useState, useMemo } from "react"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, doc, Timestamp, getDoc, setDoc, query, where, getDocs, runTransaction } from "firebase/firestore"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Trophy, User, Calendar, ThumbsUp, Send, CheckCircle2, Star, FileText, Target, Eye, Image as ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filter, setFilter] = useState<'all' | 'voted' | 'not_voted'>('all')
  const [selectedScores, setSelectedScores] = useState<Record<string, number>>({})
  const [submittingVotes, setSubmittingVotes] = useState<Record<string, boolean>>({})
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({})
  const [userVotes, setUserVotes] = useState<Record<string, { score: number, votedAt: Timestamp }>>({})
   const [selectedSubmissionForDetails, setSelectedSubmissionForDetails] = useState<string | null>(null)
   const [challengeDetails, setChallengeDetails] = useState<any>(null)
   const [loadingChallengeDetails, setLoadingChallengeDetails] = useState(false)
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

 const handleCloseSubmissionDetails = () => {
   setSelectedSubmissionForDetails(null)
 }

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
          
          // Sort by bayesian score descending, then ratingAvg, then votes
          resolvedSubmissions.sort((a, b) => {
            const bsA = a.bayesScore ?? 0
            const bsB = b.bayesScore ?? 0
            if (bsA !== bsB) return bsB - bsA
            const raA = a.ratingAvg ?? 0
            const raB = b.ratingAvg ?? 0
            if (raA !== raB) return raB - raA
            return (b.totalVotes ?? 0) - (a.totalVotes ?? 0)
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

  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return submissions.filter((s) => {
      const name = (s.userFullName || "").toLowerCase()
      if (q && !name.includes(q)) return false
      if (filter === 'voted') return !!userVotes[s.id]
      if (filter === 'not_voted') return !userVotes[s.id]
      return true
    })
  }, [submissions, searchQuery, filter, userVotes])

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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions for the Daily challenge Yet</h3>
          <p className="text-gray-600">Be the first to submit a solution for this challenge!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mt-12 pt-8 border-t border-gray-200">
        <DailyChallengeLeaderboard
          challengeId={challengeId}
          challengeTitle={challengeTitle}
          topN={10}
        />
      </div>
      {/* Section Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
          <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#0f172a] shadow-lg flex-shrink-0">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Vote to Daily Prompt Submissions
          </h3>
          <Badge className="bg-[#0f172a] text-white border-0 font-medium text-xs sm:text-sm">
            {filteredSubmissions.length}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 pl-0 sm:pl-13">
          Review and rate submissions from 1-5 stars. Help rank the best responses.
        </p>

        <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by participant name"
            className="w-full md:w-64 px-3 py-2 border border-gray-200 rounded-md text-sm"
          />

          <Select value={filter} onValueChange={(v) => setFilter(v as 'all' | 'voted' | 'not_voted')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="voted">Voted</SelectItem>
              <SelectItem value="not_voted">Not Voted</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-gray-600 ml-auto">
            Showing {filteredSubmissions.length} of {submissions.length}
          </div>
        </div>
      </div>

      {/* Submissions List View */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-11 gap-4 bg-gray-50 border-b border-gray-200 p-4 font-semibold text-gray-800 text-sm sticky top-0">
          <div className="col-span-2">Participant</div>
          <div className="col-span-4">Submission</div>
          <div className="col-span-2 text-center">Avg Rating</div>
          <div className="col-span-1 text-center">Votes</div>
          <div className="col-span-2">Your Rating</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredSubmissions.map((submission, index) => {
            const isSubmitting = submittingVotes[submission.id] || false
            const selectedScore = selectedScores[submission.id]
            const hasVoted = !!userVotes[submission.id]
            const votedScore = userVotes[submission.id]?.score
            const isOwnSubmission = submission.userId === currentUserId

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
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="w-full text-left p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <p className="text-xs text-gray-600 line-clamp-2">{submission.submissionText}</p>
                        <p className="text-xs text-blue-600 font-semibold mt-1 underline">View Full Submission</p>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl">{submission.userFullName}'s Submission</DialogTitle>
                        <DialogDescription>Full submission text</DialogDescription>
                      </DialogHeader>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{submission.submissionText}</p>
                      </div>
                    </DialogContent>
                  </Dialog>

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

                  {/* Voting Interface Mobile */}
                  {isOwnSubmission ? (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
                      You cannot vote on your own submission.
                    </div>
                  ) : hasVoted ? (
                    <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-700">
                      ✓ You gave {votedScore} star{votedScore !== 1 ? 's' : ''}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-1 justify-center">
                        {[1,2,3,4,5].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleScoreChange(submission.id, String(s))}
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            <Star className={`w-5 h-5 mx-auto ${(selectedScore ?? 0) >= s ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                      <Button
                        onClick={() => handleSubmitScore(submission.id, submission.userId)}
                        disabled={selectedScore === undefined || isSubmitting}
                        className="w-full h-8 bg-[#0f172a] hover:bg-slate-800 text-white text-xs"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Vote"}
                      </Button>
                    </div>
                  )}
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

                  {/* Rating Input */}
                  <div className="col-span-2">
                    {isOwnSubmission ? (
                      <div className="text-sm text-center text-blue-700 font-semibold p-2.5 bg-blue-50 rounded border border-blue-200">
                        Your submission
                      </div>
                    ) : hasVoted ? (
                      <div className="text-sm text-center text-green-700 font-semibold p-2.5 bg-green-50 rounded border border-green-200 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        You rated {votedScore} star{votedScore !== 1 ? 's' : ''}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 w-full">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <button
                              key={s}
                              onClick={() => handleScoreChange(submission.id, String(s))}
                              disabled={isSubmitting}
                              className="p-0.5"
                              title={`${s} stars`}
                            >
                              <Star className={`w-4.5 h-4.5 transition-colors ${(selectedScore ?? 0) >= s ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400 hover:text-yellow-400'}`} />
                            </button>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleSubmitScore(submission.id, submission.userId)}
                          disabled={selectedScore === undefined || isSubmitting}
                          size="sm"
                          className="h-8 px-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold flex-shrink-0"
                        >
                          {isSubmitting ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily Challenge Leaderboard - Below the submissions */}
       {/* Submission Details Modal */}
       {selectedSubmissionForDetails && (
         <Dialog open={!!selectedSubmissionForDetails} onOpenChange={(open) => { if (!open) handleCloseSubmissionDetails() }}>
           <DialogContent 
             className="bg-white border-0 shadow-2xl max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto"
             onPointerDownOutside={(e) => {
               e.preventDefault()
             }}
           >
             <DialogHeader className="space-y-3">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                   <Eye className="w-5 h-5 text-blue-600" />
                 </div>
                 <div className="min-w-0 flex-1">
                   <DialogTitle className="text-xl font-semibold text-gray-900">Challenge & Submission Details</DialogTitle>
                   <p className="text-gray-600 text-sm">Review the challenge requirements and participant submission</p>
                 </div>
               </div>
             </DialogHeader>
           
             {loadingChallengeDetails ? (
               <div className="flex items-center justify-center py-12">
                 <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
               </div>
             ) : (
               <div className="space-y-6">
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
                   
                     {challengeDetails.problemStatement && (
                       <div className="bg-white rounded-md p-4 max-h-48 overflow-y-auto border mb-4">
                         <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap">
                           {challengeDetails.problemStatement}
                         </p>
                       </div>
                     )}
                   
                     {challengeDetails.problemAudioUrls && challengeDetails.problemAudioUrls.length > 0 && (
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
                   
                     {challengeDetails.guidelines && (
                       <div className="bg-white rounded-md p-4 max-h-48 overflow-y-auto border mb-4">
                         <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap">
                           {challengeDetails.guidelines}
                         </p>
                       </div>
                     )}
                   
                     {challengeDetails.guidelinesAudioUrls && challengeDetails.guidelinesAudioUrls.length > 0 && (
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
                   const currentSubmission = submissions.find(s => s.id === selectedSubmissionForDetails)
                   return currentSubmission && (
                     <div className="bg-purple-50 rounded-lg p-4">
                       <div className="flex items-center gap-2 mb-3">
                         <Send className="w-5 h-5 text-purple-600 flex-shrink-0" />
                         <h4 className="text-base font-semibold text-purple-900">{currentSubmission.userFullName}'s Submission</h4>
                       </div>
                       <div className="bg-white rounded-md p-4 max-h-64 overflow-y-auto border">
                         <p className="text-gray-700 leading-relaxed text-sm break-words whitespace-pre-wrap">
                           {currentSubmission.submissionText}
                         </p>
                       </div>
                       {currentSubmission.submissionText && (
                         <div className="mt-2 text-xs text-purple-700 bg-purple-100 px-3 py-1 rounded-full inline-block">
                           Characters: {currentSubmission.submissionText.length} | Words: {currentSubmission.submissionText.split(/\s+/).filter(Boolean).length}
                         </div>
                       )}
                     </div>
                   )
                 })()}
               </div>
             )}
           </DialogContent>
         </Dialog>
       )}

       {/* Image Preview Modal removed: visual clues now full-width in the dialog */}

    
    </div>
  )
}
