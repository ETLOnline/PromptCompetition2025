// types/leaderboard.ts

/** Final leaderboard entry as stored in Firestore */
export interface FinalLeaderboardEntry {
  email: string
  fullName: string
  finalScore: number
  judgeScore: number
  llmScore: number
  rank: number
}

/** Display entry used in the table component */
export interface DisplayEntry {
  rank: number
  name: string
  llmScore: number
  judgeScore: number | null
  finalScore: number
  institution: string
}

/** Competition metadata */
export interface Competition {
  competitionId: string
  title: string
  TopN: number
  maxScore: number 
  level?: string
}
