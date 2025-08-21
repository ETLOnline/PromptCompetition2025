import { useState, useEffect, useCallback, useRef } from 'react'

interface ProgressData {
  totalSubmissions: number
  evaluatedSubmissions: number
  startTime: string
  lastUpdateTime: string
  evaluationStatus: 'running' | 'completed' | 'paused'
}

interface UseEvaluationProgressReturn {
  progress: ProgressData | null
  loading: boolean
  error: string | null
  retry: () => void
  hasStarted: boolean
  forceRefresh: () => void
}

export function useEvaluationProgress(competitionId: string): UseEvaluationProgressReturn {
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true) // Start with loading true
  const [error, setError] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const pollInterval = useRef<NodeJS.Timeout | null>(null)
  const isInitialized = useRef(false)

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-evaluate/progress/${competitionId}`)
      
      if (res.ok) {
        const data = await res.json()
        
        if (data.progress) {
          setProgress(data.progress)
          setHasStarted(true)
          setError(null)
          
          // Set up polling ONLY if evaluation status is 'running'
          if (data.progress.evaluationStatus === 'running') {
            if (!pollInterval.current) {
              pollInterval.current = setInterval(() => {
                fetchProgress()
              }, 5000) // Poll every 5 seconds when running
            }
          } else {
            // Clear polling if evaluation is not running
            if (pollInterval.current) {
              clearInterval(pollInterval.current)
              pollInterval.current = null
            }
          }
        } else {
          setHasStarted(false)
          setProgress(null)
        }
      } else {
        const errorData = await res.json().catch(() => ({}))
        setError(errorData.error || `HTTP ${res.status}`)
        setHasStarted(false)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch progress'
      setError(errorMessage)
      setHasStarted(false)
    } finally {
      setLoading(false)
    }
  }, [competitionId])

  // Force refresh progress - useful after starting evaluation
  const forceRefresh = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current)
      pollInterval.current = null
    }
    fetchProgress()
    
    // Check again after a short delay to catch newly started evaluations
    setTimeout(() => {
      fetchProgress()
    }, 1000)
  }, [fetchProgress])

  const retry = useCallback(() => {
    fetchProgress()
  }, [fetchProgress])

  // Initial fetch - only once
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true
      fetchProgress()
    }
    
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current)
      }
    }
  }, [fetchProgress])

  return {
    progress,
    loading,
    error,
    retry,
    hasStarted,
    forceRefresh
  }
}
