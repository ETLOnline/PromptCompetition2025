"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, Loader, CheckCircle, Shield, X, AlertCircle, Users, RefreshCw } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase" // Adjust the import path as needed
import { useRouter } from "next/navigation";

import { useNotifications } from "@/hooks/useNotifications";



export default function GenerateLeaderboardButton({ competitionId }: { competitionId: string }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [showRolePopup, setShowRolePopup] = useState(false)
  const [showNotEvaluatedPopup, setShowNotEvaluatedPopup] = useState(false)
  const [showJudgeNotEvaluatedPopup, setShowJudgeNotEvaluatedPopup] = useState(false)
  const [showNoJudgesPopup, setShowNoJudgesPopup] = useState(false)
  const [showAlreadyGeneratedPopup, setShowAlreadyGeneratedPopup] = useState(false)
  const { addNotification } = useNotifications();
  const router = useRouter();
  

  useEffect(() => {
    const fetchProfile = async () => {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`)
      setRole(profile.role)
    }
    fetchProfile()

    if (success) {
      const timeout = setTimeout(() => setSuccess(false), 5000)
      return () => clearTimeout(timeout)
    }
  }, [success])

  const checkIfJudgesExist = async () => {
    try {
      const judgesRef = collection(db, "competitions", competitionId, "judges")
      const judgesSnapshot = await getDocs(judgesRef)
      return !judgesSnapshot.empty
    } catch (error) {
      console.error("Error checking judges collection:", error)
      return false
    }
  }

  // Function to calculate judge progress and update AllJudgeEvaluated if needed
  const calculateAndUpdateJudgeProgress = async () => {
    try {
      const judgesRef = collection(db, "competitions", competitionId, "judges")
      const judgesSnap = await getDocs(judgesRef)
      
      if (judgesSnap.empty) {
        // No judges assigned
        return { hasJudges: false, allCompleted: false }
      }

      // Collect all judge IDs to batch fetch names
      const judgeIds = judgesSnap.docs.map((j) => j.id)
      let usersMap = new Map<string, any>()

      if (judgeIds.length > 0) {
        const usersSnap = await getDocs(
          query(collection(db, "users"), where("__name__", "in", judgeIds))
        )
        usersMap = new Map(usersSnap.docs.map((doc) => [doc.id, doc.data()]))
      }

      const judgesData: any[] = []

      for (const judgeDoc of judgesSnap.docs) {
        const judgeData = judgeDoc.data()
        const judgeId = judgeDoc.id

        const assignedCountsByChallenge = judgeData.assignedCountsByChallenge || {}
        const completedChallenges = judgeData.completedChallenges || {}
        const assignedCountTotal = judgeData.assignedCountTotal || 0
        const reviewedCount = judgeData.reviewedCount || 0

        // Calculate challenge progress using the new structure
        const challengeProgress: Array<{
          challengeId: string
          assigned: number
          completed: number
        }> = []

        Object.keys(assignedCountsByChallenge).forEach((challengeId) => {
          const assignedForChallenge = assignedCountsByChallenge[challengeId] || 0
          const completedForChallenge = completedChallenges[challengeId] || 0

          challengeProgress.push({
            challengeId,
            assigned: assignedForChallenge,
            completed: completedForChallenge,
          })
        })

        const displayName =
          usersMap.get(judgeId)?.fullName || usersMap.get(judgeId)?.displayName || judgeId.slice(0, 8)

        judgesData.push({
          judgeId,
          assignedCountsByChallenge,
          submissionsByChallenge: judgeData.submissionsByChallenge || {}, // Keep for type compatibility
          assignedCountTotal,
          completedCount: reviewedCount, // Use reviewedCount directly
          challengeProgress,
          displayName,
        })
      }

      // Check if all judges have completed their evaluations
      const allCompleted = judgesData.length > 0 && judgesData.every(judge => {
        const overallProgress = judge.assignedCountTotal > 0
          ? (judge.completedCount / judge.assignedCountTotal) * 100
          : 0
        return overallProgress === 100
      })

      // Update AllJudgeEvaluated if all judges are completed
      if (allCompleted) {
        const competitionRef = doc(db, "competitions", competitionId)
        await updateDoc(competitionRef, {
          AllJudgeEvaluated: true
        })
        console.log("AllJudgeEvaluated updated to: true")
      }

      return { hasJudges: true, allCompleted }
    } catch (error) {
      console.error("Error calculating judge progress:", error)
      return { hasJudges: false, allCompleted: false }
    }
  }

  const checkIfAllJudgeEvaluated = async () => {
    try {
      const competitionRef = doc(db, "competitions", competitionId)
      const competitionDoc = await getDoc(competitionRef)
      if (competitionDoc.exists()) {
        const data = competitionDoc.data()
        if ("AllJudgeEvaluated" in data) {
          return data.AllJudgeEvaluated === true
        }
        return false
      }
      return false
    } catch (error) {
      console.error("Error checking judge evaluation status:", error)
      return false
    }
  }

  const checkIfAlreadyEvaluated = async () => {
    try {
      // Check evaluation-progress collection instead of simple boolean flag
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-evaluate/progress/${competitionId}`)
      if (res.ok) {
        const data = await res.json()
        const progress = data.progress
        
        if (progress) {
          // Check if evaluation is completed (all submissions evaluated)
          return progress.evaluationStatus === 'completed'
        }
        // No evaluation progress exists, so not evaluated
        return false
      }
      // API call failed, assume not evaluated
      return false
    } catch (error) {
      console.error("Error checking evaluation status:", error)
      // Fallback to not evaluated
      return false
    }
  }

  const checkIfFinalLeaderboardExists = async () => {
    try {
      const competitionRef = doc(db, "competitions", competitionId)
      const competitionDoc = await getDoc(competitionRef)
      if (competitionDoc.exists()) {
        const data = competitionDoc.data()
        if ("hasFinalLeaderboard" in data) {
          return data.hasFinalLeaderboard === true
        }
        return false
      }
      return false
    } catch (error) {
      console.error("Error checking final leaderboard status:", error)
      return false
    }
  }

    const proceedWithLeaderboardGeneration = async () => {
    try {
      const data = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/last/${competitionId}/final-leaderboard`,
        { method: "POST" }
      );

      // Show success notification
      const competitionRef = doc(db, "competitions", competitionId)
      await updateDoc(competitionRef, { hasFinalLeaderboard: true })
      addNotification("success", "Final leaderboard generated successfully!");
      setSuccess(true)
      router.push(`/admin/competitions/${competitionId}/leaderboard`);

      return true;
    } catch (err: any) {
      // Show error notification
      addNotification("error", err.message || "Failed to generate final leaderboard");
      throw err;
    }
  };

  const handleGenerateLeaderboard = async () => {
    setLoading(true)
    setSuccess(false)

    try {
      // Check role first
      if (role !== "superadmin") {
        setShowRolePopup(true)
        setLoading(false)
        return
      }
      
      // First check if AllJudgeEvaluated is already true
      let isAllJudgeEvaluated = await checkIfAllJudgeEvaluated()
      
      if (!isAllJudgeEvaluated) {
        // AllJudgeEvaluated is false, so calculate judge progress
        const { hasJudges, allCompleted } = await calculateAndUpdateJudgeProgress()
        
        if (!hasJudges) {
          // No judges assigned, show confirmation popup
          setShowNoJudgesPopup(true)
          setLoading(false)
          return
        } else if (!allCompleted) {
          // Judges exist but haven't all completed their evaluations
          setShowJudgeNotEvaluatedPopup(true)
          setLoading(false)
          return
        }
        
        // If we reach here, all judges have completed and AllJudgeEvaluated has been updated
        isAllJudgeEvaluated = true
      }

      // Check if competition is evaluated
      const isEvaluated = await checkIfAlreadyEvaluated()
      
      if (!isEvaluated) {
        setShowNotEvaluatedPopup(true)
        setLoading(false)
        return
      }

      // Check if final leaderboard already exists
      const hasFinalLeaderboard = await checkIfFinalLeaderboardExists()
      
      if (hasFinalLeaderboard) {
        setShowAlreadyGeneratedPopup(true)
        setLoading(false)
        return
      }

      // If all checks pass, proceed with leaderboard generation
      await proceedWithLeaderboardGeneration()
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`)
      setLoading(false)
    }
  }

  const handleProceedWithoutJudges = async () => {
    setShowNoJudgesPopup(false)
    setLoading(true)
    await proceedWithLeaderboardGeneration()
    setLoading(false)
  }

  const handleRegenerateLeaderboard = async () => {
    setShowAlreadyGeneratedPopup(false)
    setLoading(true)
    await proceedWithLeaderboardGeneration()
    setLoading(false)
  }

  return (
    <>
      <Button
        size="lg"
        onClick={handleGenerateLeaderboard}
        disabled={loading || success}
        className="w-full py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-gray-800"
      >
        {loading ? (
          <>
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Checking status...
          </>
        ) : success ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
            Leaderboard generated!
          </>
        ) : (
          <>
            <Trophy className="h-4 w-4 mr-2" />
            Generate Leaderboard
          </>
        )}
      </Button>

      {/* Not Authorized Role Popup */}
      {showRolePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-red-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Access Denied
                </h3>
              </div>
              <button
                onClick={() => setShowRolePopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600">
                You do not have the required permissions to generate leaderboard. 
                Only <strong>Superadmins</strong> can perform this action.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowRolePopup(false)}
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Not Evaluated Popup */}
      {showNotEvaluatedPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Competition Not Evaluated
                </h3>
              </div>
              <button
                onClick={() => setShowNotEvaluatedPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                You need to evaluate the competition first before generating the leaderboard.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Next Steps:</strong><br />
                  1. Click "Start Evaluation" to evaluate all submissions<br />
                  2. Once evaluation is complete, return here to generate the leaderboard
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowNotEvaluatedPopup(false)}
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Judge Not Evaluated Popup */}
      {showJudgeNotEvaluatedPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-purple-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Judge Evaluation Incomplete
                </h3>
              </div>
              <button
                onClick={() => setShowJudgeNotEvaluatedPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                All judge evaluations must be completed before generating the leaderboard.
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                <p className="text-sm text-purple-800">
                  <strong>Next Steps:</strong><br />
                  1. Ensure all judges have completed their evaluations<br />
                  2. Once all judge evaluations are done, return here to generate the leaderboard
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowJudgeNotEvaluatedPopup(false)}
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* No Judges Assigned Popup */}
      {showNoJudgesPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  No Judges Assigned
                </h3>
              </div>
              <button
                onClick={() => setShowNoJudgesPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                You have not assigned any tasks to judges for this competition.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <p className="text-sm text-orange-800">
                  <strong>Would you like to proceed anyway?</strong><br />
                  The leaderboard will be generated based only on automated evaluation without judge input.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowNoJudgesPopup(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProceedWithoutJudges}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Proceed Anyway
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Already Generated Leaderboard Popup */}
      {showAlreadyGeneratedPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <RefreshCw className="h-6 w-6 text-yellow-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Leaderboard Already Generated
                </h3>
              </div>
              <button
                onClick={() => setShowAlreadyGeneratedPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                A final leaderboard has already been generated for this competition.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Would you like to generate another leaderboard?</strong><br />
                  This will create a new leaderboard and may overwrite the existing one.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAlreadyGeneratedPopup(false)}
              >
                No, Keep Existing
              </Button>
              <Button
                onClick={handleRegenerateLeaderboard}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                Yes, Generate New
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}