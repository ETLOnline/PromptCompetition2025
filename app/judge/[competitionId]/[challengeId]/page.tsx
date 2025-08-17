"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import { ChallengeHeader } from "@/components/Judge/ChallengeHeader"
import { SubmissionsList } from "@/components/Judge/SubmissionsList"
import { ScoreSheet } from "@/components/Judge/ScoreSheet"
import { NotificationList } from "@/components/Judge/NotificationList"
import { ProgressFooter } from "@/components/Judge/ProgressFooter"
import { LoadingSpinner } from "@/components/Judge/LoadingSpinner"
import { fetchWithAuth } from "@/lib/api"
import { calculateWeightedTotal } from "@/lib/judge/utils"
import { useNotifications } from "@/hooks/useNotifications"
import type { Challenge, CompetitionAssignment, Submission, ScoreData } from "@/types/judge-submission"
import type { DocumentSnapshot } from "firebase/firestore"

export default function ChallengePage() {
  const params = useParams()
  const router = useRouter()
  const competitionId = params?.competitionId as string
  const challengeId = params?.challengeId as string

  // Authentication state
  const [userUID, setUserID] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [assignment, setAssignment] = useState<CompetitionAssignment  | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true)
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(true)
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true)
  const [hasMoreSubmissions, setHasMoreSubmissions] = useState(false)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)

  // Scoring state
  const [showScoreSheet, setShowScoreSheet] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [scoreFormData, setScoreFormData] = useState<ScoreData>({ score: 0, comment: "", rubricScores: {} })
  const [isSavingScore, setIsSavingScore] = useState(false)

  // Progress stats
  const [progressStats, setProgressStats] = useState({
    totalAssigned: 0,
    totalScored: 0,
    graded: 0,
    remaining: 0,
    percentage: 0,
    currentPage: 1,
    totalPages: 1,
  })

  const { notifications, addNotification, removeNotification } = useNotifications()


  // Effects
  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated && userUID) {
      loadChallenge()
      loadAssignment()
    }
  }, [isAuthenticated, userUID])

  useEffect(() => {
    if (assignment && userUID) {
      loadSubmissions(true)
    }
  }, [assignment, userUID])

  // Authentication function
  const checkAuth = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_JUDGE_AUTH}`)
      setUserID(profile.uid)
    } catch (error) {
      router.push("/")
    } finally {
      setIsAuthenticated(true)
    }
  }

  const loadChallenge = async () => {
    try {
      setIsLoadingChallenge(true)

      const challengeData = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/judge/challenge/${competitionId}/${challengeId}`
      )
      setChallenge(challengeData)
    } catch (error) {
      addNotification("error","Failed to load challenge")
    } finally {
      setIsLoadingChallenge(false)
    }
  }

  const loadAssignment = async () => {
    if (!userUID) return
    try {
      setIsLoadingAssignment(true)

      const assignmentData = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/judge/assignment/${userUID}/${competitionId}`
      )
      setAssignment(assignmentData)
    } catch (error) {
      addNotification("error","Failed to load assignment")
    } finally {
      setIsLoadingAssignment(false)
    }
  }

  const loadSubmissions = async (reset = false) => {
    if (!userUID) return
    try {
      setIsLoadingSubmissions(true)
      
      const { submissions: newSubmissions, lastDoc: newLastDoc, hasMore } =
      await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/judge/submissions/${competitionId}/${challengeId}`
      )

      if (reset) {
        setSubmissions(newSubmissions)
      } else {
        setSubmissions((prev) => [...prev, ...newSubmissions])
      }

      setLastDoc(newLastDoc)
      setHasMoreSubmissions(hasMore)

      const totalAssigned = assignment?.assignedCountTotal || newSubmissions.length
      const totalScored = newSubmissions.filter((s: Submission) => Boolean(s.judges?.[userUID])).length
      const percentage = totalAssigned > 0 ? Math.round((totalScored / totalAssigned) * 100) : 0

      setProgressStats({
        totalAssigned,
        totalScored,
        graded: totalScored,
        remaining: totalAssigned - totalScored,
        percentage,
        currentPage: Math.ceil(newSubmissions.length / 10),
        totalPages: Math.ceil(totalAssigned / 10),
      })
    } catch (error) {
      addNotification("error", "Failed to load submissions")
    } finally {
      setIsLoadingSubmissions(false)
    }
  }

  const loadMoreSubmissions = () => {
    if (!isLoadingSubmissions && hasMoreSubmissions) {
      loadSubmissions(false)
    }
  }

  // Scoring functions
  const openScoringSheet = async (submission: Submission) => {
    setSelectedSubmission(submission)
    try {
      const existingScore = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/judge/score/${competitionId}/${submission.id}/${userUID}`
      )
      if (existingScore) {
        setScoreFormData(existingScore)
      } else {
        setScoreFormData({ score: 0, comment: "", rubricScores: {} })
      }
    } catch (error) {
      addNotification("error", "Failed to load existing score")
    }
    setShowScoreSheet(true)
  }

  const closeScoreSheet = () => {
    setShowScoreSheet(false)
    setSelectedSubmission(null)
    setScoreFormData({ score: 0, comment: "", rubricScores: {} })
  }

  const handleScoreChange = (field: keyof ScoreData, value: any) => {
    setScoreFormData((prev) => ({ ...prev, [field]: value }))
  }

  const saveSubmissionScore = async () => {
    if (!selectedSubmission || !challenge) return
    try {
      setIsSavingScore(true)
      const totalScore = calculateWeightedTotal(
        scoreFormData.rubricScores,
        challenge.rubric
      )
  
      await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/judge/score/${competitionId}/${selectedSubmission.id}/${userUID}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...scoreFormData, score: totalScore })
        }
      );


      addNotification("success", "Score saved successfully")
      closeScoreSheet()
      loadSubmissions(true) // Reload submissions to update status
    } catch (error) {
      addNotification("error", "Failed to save score")
    } finally {
      setIsSavingScore(false)
    }
  }

  // Early return for unauthenticated users
  if (!isAuthenticated) {
    return <LoadingSpinner message="Authenticating..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Notifications */}
      <NotificationList notifications={notifications} removeNotification={removeNotification} />

      <div className="container mx-auto p-6 space-y-8">
        {/* Challenge Header */}
        <Suspense fallback={<div>Loading challenge...</div>}>
          <ChallengeHeader challenge={challenge} isLoading={isLoadingChallenge} progressStats={progressStats} />
        </Suspense>

        {/* Submissions List */}
        <Suspense fallback={<div>Loading submissions...</div>}>
          <SubmissionsList
            submissions={submissions}
            isLoadingAssignment={isLoadingAssignment}
            isLoadingSubmissions={isLoadingSubmissions}
            hasMoreSubmissions={hasMoreSubmissions}
            progressStats={progressStats}
            userUID={userUID}
            onOpenScoring={openScoringSheet}
            onLoadMore={loadMoreSubmissions}
          />
        </Suspense>
      </div>

      {/* Progress Footer */}
      {progressStats.totalAssigned > 0 && (
        <ProgressFooter
          progressStats={progressStats}
          hasMoreSubmissions={hasMoreSubmissions}
          isLoadingSubmissions={isLoadingSubmissions}
          onLoadMore={loadMoreSubmissions}
        />
      )}

      {/* Scoring Sheet */}
      <ScoreSheet
        isOpen={showScoreSheet}
        onClose={closeScoreSheet}
        submission={selectedSubmission}
        challenge={challenge}
        scoreFormData={scoreFormData}
        isSavingScore={isSavingScore}
        onScoreChange={handleScoreChange}
        onSave={saveSubmissionScore}
      />
    </div>
  )
}
