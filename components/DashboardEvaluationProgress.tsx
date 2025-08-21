"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Loader, Play, CheckCircle, AlertCircle, RefreshCw, Clock, BarChart3, Pause } from "lucide-react"
import { useEvaluationProgress } from "@/hooks/useEvaluationProgress"
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
  const { progress, loading, error, retry, hasStarted, forceRefresh } = useEvaluationProgress(competitionId)
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
        className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6"
      >
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Evaluation Progress</h3>
              <p className="text-sm text-gray-600">Checking evaluation status...</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading progress information...</p>
        </div>
      </motion.div>
    )
  }

  // Don't render if no evaluation has started
  if (!hasStarted) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Evaluation Progress</h3>
              <p className="text-sm text-gray-600">Real-time evaluation status</p>
            </div>
          </div>
          
          {/* Timer Display */}
          {progress?.evaluationStatus === 'running' && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200"
            >
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-mono text-sm font-medium text-gray-900">
                {elapsedTime}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-gray-600">Loading progress...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 mb-3">{error}</p>
              <Button onClick={retry} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </motion.div>
          ) : !progress ? (
            <motion.div
              key="no-progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 text-gray-500"
            >
              <p>No progress data found</p>
            </motion.div>
          ) : (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Progress Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-900">Evaluation Progress</span>
                </div>
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    progress.evaluationStatus === 'running' 
                      ? 'bg-blue-100 text-blue-800' 
                      : progress.evaluationStatus === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : progress.evaluationStatus === 'paused'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {progress.evaluationStatus === 'running' ? 'Running' : 
                   progress.evaluationStatus === 'completed' ? 'Completed' : 
                   progress.evaluationStatus === 'paused' ? 'Paused' : 'Unknown'}
                </motion.div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">
                    {progress.evaluatedSubmissions} of {progress.totalSubmissions} submissions
                  </span>
                </div>
                
                <div className="relative">
                  <Progress 
                    value={(progress.evaluatedSubmissions / progress.totalSubmissions) * 100} 
                    className="h-3"
                  />
                  <motion.div
                    className="absolute inset-0 bg-green-500 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (progress.evaluatedSubmissions / progress.totalSubmissions) }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ transformOrigin: "left" }}
                  />
                </div>
                
                <div className="text-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {Math.round((progress.evaluatedSubmissions / progress.totalSubmissions) * 100)}%
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {progress.evaluationStatus === 'running' ? 'Calculating...' : 
                     progress.evaluationStatus === 'completed' ? 'Evaluation completed!' : 
                     progress.evaluationStatus === 'paused' ? 'Evaluation paused' : 'Evaluation status unknown'}
                  </p>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {progress.evaluatedSubmissions}
                  </div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">0</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>

              {/* Resume Button - Only show if paused and not completed */}
              {progress.evaluationStatus === 'paused' && progress.evaluatedSubmissions < progress.totalSubmissions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <Button
                    onClick={onResume}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    disabled={isResuming}
                  >
                    {isResuming ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {isResuming ? 'Resuming...' : 'Resume Evaluation'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Resume from where you left off
                  </p>
                </motion.div>
              )}

              {/* Pause Button - Only show if running and not completed */}
              {progress.evaluationStatus === 'running' && progress.evaluatedSubmissions < progress.totalSubmissions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <Button
                    onClick={onPause}
                    size="lg"
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50 gap-2"
                    disabled={isPausing}
                  >
                    {isPausing ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                    {isPausing ? 'Pausing...' : 'Pause Evaluation'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    You can pause and resume evaluation at any time
                  </p>
                </motion.div>
              )}
              
              {/* Completion Message - Show if completed */}
              {progress.evaluationStatus === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="text-center py-4"
                >
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                    <CheckCircle className="w-6 h-6" />
                    <span className="text-lg font-semibold">Evaluation Completed!</span>
                  </div>
                  <p className="text-gray-600">
                    All {progress.totalSubmissions} submissions have been evaluated successfully.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
