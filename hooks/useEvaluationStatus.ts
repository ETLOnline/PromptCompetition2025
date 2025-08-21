import { useState, useEffect, useCallback } from 'react'

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

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk-evaluate/progress/${competitionId}`)
      
      if (res.ok) {
        const data = await res.json()
        const progressData = data.progress
        
        if (progressData) {
          setProgress(progressData)
          setEvaluationStatus(progressData.evaluationStatus)
          setIsEvaluated(progressData.evaluationStatus === 'completed')
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
      setIsLoading(false)
    }
  }, [competitionId])

  const refreshStatus = useCallback(async () => {
    await fetchStatus()
  }, [fetchStatus])

  // Initial fetch
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Poll for updates every 5 seconds when evaluation is running
  useEffect(() => {
    if (evaluationStatus === 'running') {
      const interval = setInterval(fetchStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [evaluationStatus, fetchStatus])

  return {
    evaluationStatus,
    isEvaluated,
    progress,
    isLoading,
    error,
    refreshStatus
  }
}
