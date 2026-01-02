"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, Loader, CheckCircle, Shield, X, AlertCircle, RefreshCw } from "lucide-react"
import { fetchWithAuth, fetchLevel2JudgeProgress } from "@/lib/api"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";

export default function GenerateLeaderboardLevel2Button({ competitionId }: { competitionId: string }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [showRolePopup, setShowRolePopup] = useState(false)
  const [showJudgeNotEvaluatedPopup, setShowJudgeNotEvaluatedPopup] = useState(false)
  const [showAlreadyGeneratedPopup, setShowAlreadyGeneratedPopup] = useState(false)
  const [judgeDetails, setJudgeDetails] = useState<string>("")
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

  // Function to check if all Level 2 judges have completed their evaluations
  const checkLevel2JudgesCompleted = async () => {
    try {
      const response = await fetchLevel2JudgeProgress(competitionId)
      const judgesData = response.judges || []

      if (judgesData.length === 0) {
        return { 
          allCompleted: false, 
          details: "No judges assigned to participants" 
        }
      }

      const incompleteJudges = judgesData.filter((judge: any) => {
        const overallProgress = judge.totalAssignedParticipants > 0
          ? (judge.evaluatedParticipants / judge.totalAssignedParticipants) * 100
          : 0
        return overallProgress < 100
      })

      if (incompleteJudges.length > 0) {
        const details = incompleteJudges.map((judge: any) => 
          `${judge.judgeName} (${judge.evaluatedParticipants}/${judge.totalAssignedParticipants})`
        ).join(", ")
        
        return { 
          allCompleted: false, 
          details: `Incomplete evaluations: ${details}` 
        }
      }

      return { 
        allCompleted: true, 
        details: "All judges have completed their evaluations" 
      }
    } catch (error) {
      console.error("Error checking Level 2 judge progress:", error)
      return { 
        allCompleted: false, 
        details: "Error checking judge status" 
      }
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
      addNotification("success", "Level 2 final leaderboard generated successfully!");
      setSuccess(true)
      router.push(`/admin/competitions/${competitionId}/level2-leaderboard`);

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
      
      // Check if all Level 2 judges have completed their evaluations
      const judgeCheck = await checkLevel2JudgesCompleted()
      
      if (!judgeCheck.allCompleted) {
        setJudgeDetails(judgeCheck.details)
        setShowJudgeNotEvaluatedPopup(true)
        setLoading(false)
        return
      }

      // Update AllJudgeEvaluated if all judges completed
      const competitionRef = doc(db, "competitions", competitionId)
      await updateDoc(competitionRef, {
        AllJudgeEvaluated: true
      })

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

      {/* Judge Not Evaluated Popup */}
      {showJudgeNotEvaluatedPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-purple-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Judge Evaluation Required
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
                Level 2 competitions rely entirely on judge feedback for scoring.
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                <p className="text-sm text-purple-800">
                  <strong>Status:</strong><br />
                  {judgeDetails}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                <p className="text-sm text-blue-800">
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
