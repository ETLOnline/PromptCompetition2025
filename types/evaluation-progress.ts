export interface EvaluationProgress {
  totalSubmissions: number
  evaluatedSubmissions: number
  startTime: string
  lastUpdateTime: string
  evaluationStatus: 'running' | 'completed' | 'paused'
  pauseReason?: string // Optional field for tracking why evaluation was paused
}

export interface GlobalEvaluationLock {
  isLocked: boolean
  lockedBy: string | null // competitionId
  lockedByUser: string | null // admin userId
  lockedAt: string | null // ISO date string
  lockReason: string | null
}


