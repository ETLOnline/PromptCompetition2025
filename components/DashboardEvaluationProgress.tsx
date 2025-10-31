"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Loader, Play, CheckCircle, AlertCircle, RefreshCw, Clock, Pause } from "lucide-react"
import { useEvaluationStatus } from "@/hooks/useEvaluationStatus"
import { useState, useEffect } from "react"

interface DashboardEvaluationProgressProps {
  competitionId: string
  onResume: () => void
  onPause: () => void
}

export default function DashboardEvaluationProgress({ 
  competitionId, 
  onResume,
  onPause
}: DashboardEvaluationProgressProps) {
  const { progress, isLoading: loading, error, refreshStatus: retry, isEvaluated, refreshStatus: forceRefresh } = useEvaluationStatus(competitionId)
  
  // Check if evaluation has started (progress exists)
  const hasStarted = !!progress
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00")
  const [isPausing, setIsPausing] = useState(false)
  const [isResuming, setIsResuming] = useState(false)

  // Timer effect
  useEffect(() => {
    if (!progress?.startTime || progress.evaluationStatus !== 'running') {
      setElapsedTime("00:00:00")
      return
    }

    const updateTimer = () => {
      const startTime = new Date(progress.startTime).getTime()
      const now = new Date().getTime()
      const elapsed = now - startTime

      const hours = Math.floor(elapsed / (1000 * 60 * 60))
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)

      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [progress?.startTime, progress?.evaluationStatus])

  // Don't render anything until we've checked for progress
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <Loader className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading evaluation progress...</span>
        </div>
      </motion.div>
    )
  }

  // Don't render if no evaluation has started
  if (!hasStarted) {
    return null
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-600">{error}</span>
          </div>
          <Button onClick={retry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </motion.div>
    )
  }

  if (!progress) {
    return null
  }

  const progressPercentage = Math.round((progress.evaluatedSubmissions / progress.totalSubmissions) * 100)
  const isRunning = progress.evaluationStatus === 'running'
  const isCompleted = progress.evaluationStatus === 'completed'
  const isPaused = progress.evaluationStatus === 'paused'
  const hasUnevaluatedSubmissions = progress.evaluatedSubmissions < progress.totalSubmissions

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Progress info */}
        <div className="flex items-center gap-4 flex-1">
          {/* Status indicator */}
          <div className={`w-3 h-3 rounded-full ${
            isRunning ? 'bg-blue-500 animate-pulse' :
            isCompleted ? 'bg-green-500' :
            isPaused ? 'bg-orange-500' : 'bg-gray-400'
          }`} />
          
          {/* Progress text */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-900 transition-all duration-300">
              {progress.evaluatedSubmissions} of {progress.totalSubmissions}
            </span>
            <span className="text-sm text-gray-500 transition-all duration-300">({progressPercentage}%)</span>
          </div>

          {/* Progress bar */}
          <div className="flex-1">
            {/* Progress label */}
            <div className="text-xs text-gray-500 mb-1 font-medium">
              LLM Evaluation
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right side - Timer and controls */}
        <div className="flex items-center gap-3">
          {/* Timer */}
          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{elapsedTime}</span>
            </div>
          )}

          {/* Status badge */}
          <div className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-300 ${
            isRunning ? 'bg-blue-100 text-blue-800' : 
            isCompleted ? 'bg-green-100 text-green-800' :
            isPaused ? 'bg-orange-100 text-orange-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            {isRunning ? 'Running' : 
             isCompleted ? 'Completed' : 
             isPaused ? 'Paused' : 'Unknown'}
          </div>

          {/* Control buttons */}
          {isPaused && hasUnevaluatedSubmissions && (
            <Button
              onClick={onResume}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isResuming}
            >
              {isResuming ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          )}

          {isRunning && hasUnevaluatedSubmissions && (
            <Button
              onClick={onPause}
              size="sm"
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
              disabled={isPausing}
            >
              {isPausing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
