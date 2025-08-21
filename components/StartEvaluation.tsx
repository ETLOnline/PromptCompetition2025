"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { BarChart3, Loader, CheckCircle, AlertCircle, Clock, X, Shield, AlertTriangle } from "lucide-react"
import { db } from "@/lib/firebase" // Adjust the import path as needed
import { fetchWithAuth } from "@/lib/api"
import { generateLeaderboard } from "@/lib/api"
import { doc, getDoc, updateDoc } from "firebase/firestore"

export default function StartEvaluationButton({ 
  competitionId, 
  onEvaluationStart 
}: { 
  competitionId: string
  onEvaluationStart?: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [competitionEndDate, setCompetitionEndDate] = useState<Date | null>(null)
  const [showEarlyPopup, setShowEarlyPopup] = useState(false)
  const [showRolePopup, setShowRolePopup] = useState(false)
  const [showReEvaluatePopup, setShowReEvaluatePopup] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [lockedBy, setLockedBy] = useState<string | null>(null)

  // Check if evaluation is locked by another competition
  useEffect(() => {
    const checkLockStatus = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-evaluate/check-lock`)
        if (res.ok) {
          const data = await res.json()
          setIsLocked(data.isLocked)
          setLockedBy(data.lockedBy)
        }
      } catch (error) {
        console.error("Failed to check lock status:", error)
      }
    }

    checkLockStatus()
    const interval = setInterval(checkLockStatus, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`)
        setRole(profile.role)
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      }
    }
    fetchProfile()
    if (success) {
      const timeout = setTimeout(() => {
        setSuccess(false)
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [success])

  const checkCompetitionEnded = async () => {
    try {
      const competitionRef = doc(db, "competitions", competitionId)
      const competitionDoc = await getDoc(competitionRef)

      if (competitionDoc.exists()) {
        const data = competitionDoc.data()
        const endDeadline = data.endDeadline || null

        if (endDeadline) {
          // Ensure proper Date object
          const endDate = new Date(endDeadline)
          setCompetitionEndDate(endDate)

          const now = new Date()
          // Compare full datetime (both date and time)
          return now.getTime() > endDate.getTime()
        }
      }

      return false
    } catch (error) {
      console.error("Error checking competition end date:", error)
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

  const proceedWithEvaluation = async () => {
    setLoading(true)
    setSuccess(false)

    try {
      const requestBody = { competitionId, userId: 'admin' }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-evaluate/start-evaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Evaluation failed")
      
        // Call generateLeaderboard after successful evaluation
      try {
        await generateLeaderboard(competitionId)
        // console.log('Leaderboard generated successfully', competitionId)

        const competitionRef = doc(db, "competitions", competitionId)
        await updateDoc(competitionRef, { IsCompetitionEvaluated: true })


      }
       catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
          console.error('Failed to generate leaderboard:', errorMessage)
      }
      
      setSuccess(true)
      
      // Wait a moment for backend to write to database, then notify parent
      setTimeout(() => {
        if (onEvaluationStart) {
          onEvaluationStart()
        }
      }, 500)
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleResumeEvaluation = async () => {
    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-evaluate/resume-evaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId, userId: 'admin' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to resume evaluation")
      
      setSuccess(true)
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStartEvaluation = async () => {
    setLoading(true)
    setSuccess(false)

    try {
      // Check role first
      if (role !== "superadmin") {
        setShowRolePopup(true)
        setLoading(false)
        return
      }

      // Check if competition has ended
      const hasEnded = await checkCompetitionEnded()
      
      if (!hasEnded) {
        setShowEarlyPopup(true)
        setLoading(false)
        return
      }

      // Check if already evaluated
      const isAlreadyEvaluated = await checkIfAlreadyEvaluated()
      
      if (isAlreadyEvaluated) {
        setShowReEvaluatePopup(true)
        setLoading(false)
        return
      }

      // If all checks pass, proceed with evaluation
      await proceedWithEvaluation()
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`)
      setLoading(false)
    }
  }

  const handleReEvaluateConfirm = () => {
    setShowReEvaluatePopup(false)
    proceedWithEvaluation()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Show locked state if another evaluation is running
  if (isLocked && lockedBy !== competitionId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full p-4 border border-orange-200 bg-orange-50 rounded-lg"
      >
        <div className="flex items-center gap-2 text-orange-700">
          <AlertCircle className="h-4 w-4" />
          <span className="font-medium">Another evaluation is currently running</span>
        </div>
        <p className="text-sm text-orange-600 mt-1">
          Please wait for it to complete before starting a new evaluation.
        </p>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Button
          size="lg"
          onClick={handleStartEvaluation}
          disabled={loading || success}
          className="w-full py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Loader className="h-4 w-4 animate-spin" />
              Checking competition status...
            </motion.div>
          ) : success ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4 text-green-400" />
              Evaluation completed!
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Start Evaluation
            </motion.div>
          )}
        </Button>
      </motion.div>

      {/* Competition Not Ended Popup */}
      {showEarlyPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Competition Still Active
                </h3>
              </div>
              <button
                onClick={() => setShowEarlyPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                The evaluation cannot be started yet as the competition is still ongoing.
              </p>
              {competitionEndDate && (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                  <p className="text-sm text-orange-800">
                    <strong>Competition ends:</strong><br />
                    {formatDate(competitionEndDate)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowEarlyPopup(false)}
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}

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
                You do not have the required permissions to start evaluation. 
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

      {/* Re-evaluate Confirmation Popup */}
      {showReEvaluatePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-amber-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Competition Already Evaluated
                </h3>
              </div>
              <button
                onClick={() => setShowReEvaluatePopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                This competition has already been evaluated. Running the evaluation again will overwrite the existing results.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> This action cannot be undone and may affect existing rankings and results.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowReEvaluatePopup(false)}
              >
                No, Cancel
              </Button>
              <Button
                onClick={handleReEvaluateConfirm}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Yes, Re-evaluate
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}