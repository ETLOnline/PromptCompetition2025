export interface Judge {
  judgeId: string
  assignedCountsByChallenge: Record<string, number>
  submissionsByChallenge: Record<string, string[]>
  assignedCountTotal: number
  completedCount: number
  challengeProgress: Array<{
    challengeId: string
    assigned: number
    completed: number
  }>
  displayName?: string
}

export interface JudgeProgressProps {
  competitionId: string
}
