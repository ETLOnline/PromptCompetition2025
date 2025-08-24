import { useState, useEffect, useCallback, useRef } from 'react'

export type EvaluationStatus = 'running' | 'paused' | 'completed' | null

interface EvaluationProgress {
  totalSubmissions: number
  evaluatedSubmissions: number
  startTime: string
  lastUpdateTime: string
  evaluationStatus: EvaluationStatus
}

interface UseEvaluationStatusReturn {
  evaluationStatus: EvaluationStatus
  isEvaluated: boolean
  progress: EvaluationProgress | null
  isLoading: boolean
  error: string | null
  refreshStatus: () => Promise<void>
}

export const useEvaluationStatus = (competitionId: string): UseEvaluationStatusReturn => {
  const [evaluationStatus, setEvaluationStatus] = useState<EvaluationStatus>(null)
  const [isEvaluated, setIsEvaluated] = useState(false)
  const [progress, setProgress] = useState<EvaluationProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchStatus = useCallback(async (isInitialFetch = false) => {
    try {
      // Only show loading on initial fetch, not on subsequent updates
      if (isInitialFetch) {
        setIsLoading(true)
      }
      setError(null)
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-evaluate/progress/${competitionId}`)
      
      if (res.ok) {
        const data = await res.json()
        const progressData = data.progress
        
        if (progressData) {
          // For smooth progress updates, debounce non-critical updates
          if (!isInitialFetch && progressData.evaluationStatus === 'running') {
            // Clear any existing timeout
            if (updateTimeoutRef.current) {
              clearTimeout(updateTimeoutRef.current)
            }
            
            // Debounce progress updates to 500ms for smooth UI
            updateTimeoutRef.current = setTimeout(() => {
              setProgress(progressData)
              setEvaluationStatus(progressData.evaluationStatus)
              setIsEvaluated(progressData.evaluationStatus === 'completed')
            }, 500)
          } else {
            // Immediate update for status changes and initial load
            setProgress(progressData)
            setEvaluationStatus(progressData.evaluationStatus)
            setIsEvaluated(progressData.evaluationStatus === 'completed')
          }
        } else {
          setProgress(null)
          setEvaluationStatus(null)
          setIsEvaluated(false)
        }
      } else {
        setProgress(null)
        setEvaluationStatus(null)
        setIsEvaluated(false)
      }
    } catch (err) {
      console.error('Error fetching evaluation status:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch evaluation status')
      // Fallback to not evaluated
      setProgress(null)
      setEvaluationStatus(null)
      setIsEvaluated(false)
    } finally {
      if (isInitialFetch) {
        setIsLoading(false)
        setHasInitialized(true)
      }
    }
  }, [competitionId])

  const refreshStatus = useCallback(async () => {
    // Don't show loading on manual refresh
    await fetchStatus(false)
  }, [fetchStatus])

  // Initial fetch
  useEffect(() => {
    fetchStatus(true)
  }, [fetchStatus])

  // Poll for updates every 5 seconds when evaluation is running
  useEffect(() => {
    if (evaluationStatus === 'running' && hasInitialized) {
      const interval = setInterval(() => fetchStatus(false), 5000)
      return () => clearInterval(interval)
    }
  }, [evaluationStatus, fetchStatus, hasInitialized])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  return {
    evaluationStatus,
    isEvaluated,
    progress,
    isLoading,
    error,
    refreshStatus
  }
}
