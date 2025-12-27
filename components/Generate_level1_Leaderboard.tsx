"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, Loader, CheckCircle, Shield, X, AlertCircle, RefreshCw } from "lucide-react"
import { generateLevel1FinalLeaderboard } from "@/lib/api"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/hooks/useNotifications"
import { useAuth } from "@clerk/nextjs"

export default function Generate_level1_Leaderboard({ competitionId }: { competitionId: string }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [showRolePopup, setShowRolePopup] = useState(false)
  const [showNotEvaluatedPopup, setShowNotEvaluatedPopup] = useState(false)
  const [showAlreadyGeneratedPopup, setShowAlreadyGeneratedPopup] = useState(false)
  const { addNotification } = useNotifications()
  const router = useRouter()
  const { getToken } = useAuth()
  

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`,
          {
            headers: {
              Authorization: `Bearer ${await getToken()}`,
            },
          }
        )
        if (response.ok) {
          const profile = await response.json()
          setRole(profile.role)
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      }
    }
    fetchProfile()

    if (success) {
      const timeout = setTimeout(() => setSuccess(false), 5000)
      return () => clearTimeout(timeout)
    }
  }, [success, getToken])

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
      const data = await generateLevel1FinalLeaderboard(competitionId, getToken);

      // Show success notification
      const competitionRef = doc(db, "competitions", competitionId)
      await updateDoc(competitionRef, { hasFinalLeaderboard: true })
      addNotification("success", "Level 1 final leaderboard generated successfully!");
      setSuccess(true)
      router.push(`/admin/competitions/${competitionId}/leaderboard`);

      return true;
    } catch (err: any) {
      // Show error notification
      addNotification("error", err.message || "Failed to generate Level 1 final leaderboard");
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

      // Check if competition is evaluated (LLM evaluation only)
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