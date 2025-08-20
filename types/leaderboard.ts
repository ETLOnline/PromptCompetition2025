export interface Competition {
  competitionId: string
  title: string
  TopN: number
  AllJudgeEvaluated: boolean
}

export interface LeaderboardEntry {
  participantId: string
  fullName: string
  llmScore: number
}

export interface JudgeScore {
  participantId: string
  totalScore: number
}

export interface DisplayEntry {
  rank: number
  name: string
  llmScore: number
  judgeScore: number | null
  finalScore: number
}

export interface LeaderboardProps {
  competition: Competition
  displayData: DisplayEntry[]
  judgeEvaluationsComplete: boolean
}
