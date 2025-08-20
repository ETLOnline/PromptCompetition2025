"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, Loader, CheckCircle, Shield, X, AlertCircle, Users } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase" // Adjust the import path as needed




export default function GenerateLeaderboardButton({ competitionId }: { competitionId: string }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [showRolePopup, setShowRolePopup] = useState(false)
  const [showNotEvaluatedPopup, setShowNotEvaluatedPopup] = useState(false)
  const [showJudgeNotEvaluatedPopup, setShowJudgeNotEvaluatedPopup] = useState(false)
  const [showNoJudgesPopup, setShowNoJudgesPopup] = useState(false)

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
      const competitionRef = doc(db, "competitions", competitionId)
      const competitionDoc = await getDoc(competitionRef)
      if (competitionDoc.exists()) {
        const data = competitionDoc.data()
        if ("IsCompetitionEvaluated" in data) {
          return data.IsCompetitionEvaluated === true
        }
        return false
      }
      return false
    } catch (error) {
      console.error("Error checking evaluation status:", error)
      return false
    }
  }

  const proceedWithLeaderboardGeneration = async () => {
    setLoading(true)
    setSuccess(false)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaderboard/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId }) 
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Generation failed")
      const competitionRef = doc(db, "competitions", competitionId)
      await updateDoc(competitionRef, { generateleaderboard: true })
      setSuccess(true)
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

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

      // Check if competition is evaluated
      const isEvaluated = await checkIfAlreadyEvaluated()
      
      if (!isEvaluated) {
        setShowNotEvaluatedPopup(true)
        setLoading(false)
        return
      }

      // Check if all judges have evaluated
      const isAllJudgeEvaluated = await checkIfAllJudgeEvaluated()
      
      if (!isAllJudgeEvaluated) {
        // Check if judges collection exists
        const judgesExist = await checkIfJudgesExist()
        
        if (!judgesExist) {
          // No judges assigned, show confirmation popup
          setShowNoJudgesPopup(true)
          setLoading(false)
          return
        } else {
          // Judges exist but haven't all evaluated
          setShowJudgeNotEvaluatedPopup(true)
          setLoading(false)
          return
        }
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
    await proceedWithLeaderboardGeneration()
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
    </>
  )
}