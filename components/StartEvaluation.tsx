"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { BarChart3, Loader, AlertCircle, CheckCircle } from "lucide-react"

export default function StartEvaluationButton({ 
  competitionId, 
  onEvaluationStart 
}: { 
  competitionId: string
  onEvaluationStart?: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
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
    if (success) {
      const timeout = setTimeout(() => {
        setSuccess(false)
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [success])

  const handleStartEvaluation = async () => {
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
    <div className="space-y-4">
      {/* Start/Resume Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Button
          size="lg"
          onClick={handleStartEvaluation}
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Loader className="h-4 w-4 animate-spin" />
              Starting...
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
    </div>
  )
}
