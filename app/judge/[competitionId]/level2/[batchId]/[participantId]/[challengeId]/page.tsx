"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, PlayCircle, Image as ImageIcon, Scale, FileText, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { useNotifications } from "@/hooks/useNotifications"
import { Notifications } from "@/components/Notifications"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { calculateWeightedTotal } from "@/lib/judge/utils"

interface Challenge {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  rubric: Array<{
    name: string
    description: string
    weight: number
  }>
  problemAudioUrls?: string[]
  guidelinesAudioUrls?: string[]
  visualClueUrls?: string[]
}

interface Submission {
  id: string
  promptText: string
  participantId: string
  challengeId: string
  submittedAt: any
}

interface ScoreData {
  score: number
  comment: string
  rubricScores: Record<string, number>
}

export default function Level2ChallengeEvaluation() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const batchId = params?.batchId as string
  const participantId = params?.participantId as string
  const challengeId = params?.challengeId as string

  const [userUID, setUserUID] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [hasSubmission, setHasSubmission] = useState(true)
  const [participantName, setParticipantName] = useState<string>("")
  const [competitionTitle, setCompetitionTitle] = useState<string>("")
  const [batchName, setBatchName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isEvaluated, setIsEvaluated] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Score state
  const [scoreFormData, setScoreFormData] = useState<ScoreData>({
    score: 0,
    comment: "",
    rubricScores: {}
  })

  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_JUDGE_AUTH}`)
      setUserUID(profile.uid)
      setIsAuthenticated(true)
    } catch (error) {
      router.push("/")
    }
  }

  useEffect(() => {
    if (isAuthenticated && userUID) {
      loadData(userUID)
    }
  }, [isAuthenticated, userUID, competitionId, batchId, participantId, challengeId])

  const loadData = async (judgeId: string) => {
    try {
      setIsLoading(true)

      // Fetch competition title
      const competitionRef = doc(db, "competitions", competitionId)
      const competitionSnap = await getDoc(competitionRef)
      if (competitionSnap.exists()) {
        setCompetitionTitle(competitionSnap.data()?.title || "Competition")
      }

      // Fetch batch name
      const scheduleRef = doc(db, "competitions", competitionId, "schedules", batchId)
      const scheduleSnap = await getDoc(scheduleRef)
      if (scheduleSnap.exists()) {
        setBatchName(scheduleSnap.data()?.batchName || batchId)
      }

      // Fetch participant name
      const participantRef = doc(db, "competitions", competitionId, "participants", participantId)
      const participantSnap = await getDoc(participantRef)
      if (participantSnap.exists()) {
        setParticipantName(participantSnap.data()?.fullName || "Unknown Participant")
      }

      // Fetch challenge details
      const challengeRef = doc(db, "competitions", competitionId, "challenges", challengeId)
      const challengeSnap = await getDoc(challengeRef)
      
      if (!challengeSnap.exists()) {
        addNotification("error", "Challenge not found")
        router.push(`/judge/${competitionId}/level2/${batchId}/${participantId}`)
        return
      }

      const challengeData = challengeSnap.data()
      setChallenge({
        id: challengeId,
        title: challengeData?.title || `Challenge ${challengeId}`,
        problemStatement: challengeData?.problemStatement || "",
        guidelines: challengeData?.guidelines || "",
        rubric: challengeData?.rubric || [],
        problemAudioUrls: challengeData?.problemAudioUrls || [],
        guidelinesAudioUrls: challengeData?.guidelinesAudioUrls || [],
        visualClueUrls: challengeData?.visualClueUrls || []
      })

      // Fetch submission
      const submissionId = `${participantId}_${challengeId}`
      const submissionRef = doc(db, "competitions", competitionId, "submissions", submissionId)
      const submissionSnap = await getDoc(submissionRef)

      if (submissionSnap.exists()) {
        const subData = submissionSnap.data()
        setSubmission({
          id: submissionId,
          promptText: subData?.promptText || "",
          participantId: participantId,
          challengeId: challengeId,
          submittedAt: subData?.submittedAt
        })
        setHasSubmission(true)
      } else {
        setHasSubmission(false)
        setSubmission(null)
      }

      // Load existing evaluation if any
      const evalRef = doc(db, "competitions", competitionId, "judges", judgeId, "level2Evaluations", participantId)
      const evalSnap = await getDoc(evalRef)

      if (evalSnap.exists()) {
        const evalData = evalSnap.data()
        const evaluations = evalData?.evaluations || {}
        
        if (evaluations[challengeId]) {
          const existingEval = evaluations[challengeId]
          setScoreFormData({
            score: existingEval.score || 0,
            comment: existingEval.comment || "",
            rubricScores: existingEval.rubricScores || {}
          })
          setIsEvaluated(true)
        } else {
          // Initialize rubric scores
          const initialRubricScores: Record<string, number> = {}
          challengeData?.rubric?.forEach((criterion: any) => {
            initialRubricScores[criterion.name] = 0
          })
          setScoreFormData({
            score: 0,
            comment: "",
            rubricScores: initialRubricScores
          })
          setIsEvaluated(false)
        }
      } else {
        // Initialize rubric scores for new evaluation
        const initialRubricScores: Record<string, number> = {}
        challengeData?.rubric?.forEach((criterion: any) => {
          initialRubricScores[criterion.name] = 0
        })
        setScoreFormData({
          score: 0,
          comment: "",
          rubricScores: initialRubricScores
        })
        setIsEvaluated(false)
      }

    } catch (error) {
      console.error("Error loading data:", error)
      addNotification("error", "Failed to load evaluation data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRubricScoreChange = (criterionName: string, value: string) => {
    const numValue = Math.max(0, Math.min(100, parseFloat(value) || 0))
    setScoreFormData(prev => ({
      ...prev,
      rubricScores: {
        ...prev.rubricScores,
        [criterionName]: numValue
      }
    }))
  }

  const handleSaveEvaluation = async () => {
    if (!userUID || !challenge) return

    try {
      setIsSaving(true)

      // Calculate total weighted score
      const totalScore = calculateWeightedTotal(scoreFormData.rubricScores, challenge.rubric)

      // Save to judge's level2Evaluations subcollection
      const evalRef = doc(db, "competitions", competitionId, "judges", userUID, "level2Evaluations", participantId)
      const evalSnap = await getDoc(evalRef)

      let evaluatedChallenges: string[] = []
      let evaluations: any = {}

      if (evalSnap.exists()) {
        const evalData = evalSnap.data()
        evaluatedChallenges = evalData?.evaluatedChallenges || []
        evaluations = evalData?.evaluations || {}
      }

      // Add challenge to evaluated list if not already there
      if (!evaluatedChallenges.includes(challengeId)) {
        evaluatedChallenges.push(challengeId)
      }

      // Update evaluations object
      evaluations[challengeId] = {
        score: totalScore,
        rubricScores: scoreFormData.rubricScores,
        comment: scoreFormData.comment,
        evaluatedAt: serverTimestamp(),
        hasSubmission: hasSubmission
      }

      // Save evaluation data
      await setDoc(evalRef, {
        participantId,
        judgeId: userUID,
        batchId,
        evaluatedChallenges,
        evaluations,
        lastUpdated: serverTimestamp()
      }, { merge: true })

      // If submission exists, also save score to submission document
      if (hasSubmission) {
        const submissionId = `${participantId}_${challengeId}`
        const submissionRef = doc(db, "competitions", competitionId, "submissions", submissionId)
        
        await updateDoc(submissionRef, {
          [`judgeScores.${userUID}`]: {
            totalScore: totalScore,
            rubricScores: scoreFormData.rubricScores,
            comment: scoreFormData.comment,
            evaluatedAt: serverTimestamp()
          }
        })
      } else {
        // Create a placeholder submission document for tracking purposes
        const submissionId = `${participantId}_${challengeId}`
        const submissionRef = doc(db, "competitions", competitionId, "submissions", submissionId)
        
        await setDoc(submissionRef, {
          participantId,
          challengeId,
          promptText: "",
          hasSubmission: false,
          judgeScores: {
            [userUID]: {
              totalScore: totalScore,
              rubricScores: scoreFormData.rubricScores,
              comment: scoreFormData.comment,
              evaluatedAt: serverTimestamp()
            }
          }
        }, { merge: true })
      }

      setIsEvaluated(true)
      addNotification("success", "Evaluation saved successfully")

    } catch (error) {
      console.error("Error saving evaluation:", error)
      addNotification("error", "Failed to save evaluation")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          <p className="text-gray-900 font-medium mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Challenge Not Found</h3>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Notifications notifications={notifications} removeNotification={removeNotification} />

      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{challenge.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{participantName}</span>
                  <span>•</span>
                  <span>{batchName}</span>
                  <span>•</span>
                  <span>Challenge {challengeId}</span>
                </div>
              </div>
              <Badge className={isEvaluated ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                {isEvaluated ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" /> Evaluated</>
                ) : (
                  <><Clock className="w-3 h-3 mr-1" /> Pending</>
                )}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Challenge Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Challenge Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Problem Statement */}
            {challenge.problemStatement && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Problem Statement</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{challenge.problemStatement}</p>
              </div>
            )}

            {/* Problem Audio */}
            {challenge.problemAudioUrls && challenge.problemAudioUrls.length > 0 && (
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Problem Audio Files
                </h3>
                <div className="space-y-2">
                  {challenge.problemAudioUrls.map((url, index) => (
                    <audio key={index} controls src={url} className="w-full" />
                  ))}
                </div>
              </div>
            )}

            {/* Guidelines */}
            {challenge.guidelines && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Guidelines</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{challenge.guidelines}</p>
              </div>
            )}

            {/* Guidelines Audio */}
            {challenge.guidelinesAudioUrls && challenge.guidelinesAudioUrls.length > 0 && (
              <div className="bg-emerald-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Guidelines Audio Files
                </h3>
                <div className="space-y-2">
                  {challenge.guidelinesAudioUrls.map((url, index) => (
                    <audio key={index} controls src={url} className="w-full" />
                  ))}
                </div>
              </div>
            )}

            {/* Visual Clues */}
            {challenge.visualClueUrls && challenge.visualClueUrls.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Visual Clues
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {challenge.visualClueUrls.map((url, index) => (
                    <img key={index} src={url} alt={`Visual clue ${index + 1}`} className="rounded-lg border" />
                  ))}
                </div>
              </div>
            )}

            {/* Rubric */}
            {challenge.rubric && challenge.rubric.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Evaluation Rubric
                </h3>
                <div className="space-y-3">
                  {challenge.rubric.map((criterion, index) => (
                    <div key={index} className="bg-white rounded-md p-3 border border-purple-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{criterion.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          Weight: {criterion.weight}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{criterion.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission */}
        <Card>
          <CardHeader>
            <CardTitle>Participant Submission</CardTitle>
          </CardHeader>
          <CardContent>
            {hasSubmission && submission ? (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                  {submission.promptText}
                </pre>
              </div>
            ) : (
              <div className="bg-red-50 rounded-lg p-6 text-center border border-red-200">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h3 className="font-semibold text-red-900 mb-1">No Submission</h3>
                <p className="text-sm text-red-700">
                  This participant did not submit a solution for this challenge. You can still assign a score of 0.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scoring Section */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluation & Scoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rubric Scores */}
            {challenge.rubric && challenge.rubric.length > 0 && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Rubric Scores</Label>
                <p className="text-sm text-gray-600 mb-4">Assign scores between 0-100 for each criterion. The weighted total will be calculated automatically.</p>
                {challenge.rubric.map((criterion, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`rubric-${index}`} className="text-sm font-medium">
                        {criterion.name} <span className="text-gray-500">(Weight: {criterion.weight})</span>
                      </Label>
                    </div>
                    <Input
                      id={`rubric-${index}`}
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={scoreFormData.rubricScores[criterion.name] || 0}
                      onChange={(e) => handleRubricScoreChange(criterion.name, e.target.value)}
                      className="max-w-xs"
                      placeholder="0-100"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Total Score Display */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Weighted Total Score:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {calculateWeightedTotal(scoreFormData.rubricScores, challenge.rubric).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Feedback & Comments</Label>
              <Textarea
                id="comment"
                placeholder="Provide detailed feedback for the participant..."
                value={scoreFormData.comment}
                onChange={(e) => setScoreFormData(prev => ({ ...prev, comment: e.target.value }))}
                rows={5}
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-600">
                {isEvaluated ? "You can update your evaluation anytime" : "Save your evaluation to mark this challenge as complete"}
              </p>
              <Button
                onClick={handleSaveEvaluation}
                disabled={isSaving}
                className={isEvaluated ? "bg-green-600 hover:bg-green-700" : "bg-slate-900 hover:bg-slate-800"}
              >
                {isSaving ? "Saving..." : isEvaluated ? "Update Evaluation" : "Save Evaluation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
