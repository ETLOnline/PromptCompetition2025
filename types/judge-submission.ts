export interface JudgeAssignment {
  id: string
  title: string
  submissionCount: number
  competitionId: string
  assignedDate: string
  assignedCountsByChallenge: { [challengeId: string]: number }
  evaluatedCount?: number
  AllChallengesEvaluated?: boolean
  level?: "Level 1" | "Level 2" | "custom"
  level2Assignments?: { [batch: string]: string[] }  // For Level 2: batch -> participant IDs
  participantCount?: number  // For Level 2: count of participants assigned
}

export interface CompetitionAssignment {
  judgeId: string
  competitionId: string
  competitionTitle: string
  assignedCountTotal: number
  assignedCountsByChallenge: { [challengeId: string]: number }
  submissionsByChallenge: { [challengeId: string]: string[] }
  challengesEvaluated?: { [challengeId: string]: boolean }
  AllChallengesEvaluated?: boolean
  updatedAt: any
}

export interface JudgeStats {
  activeCompetitions: number
  totalSubmissions: number
  challenges: number
  evaluatedSubmissions?: number
}

export interface JudgeProfile {
  uid: string
  name: string
  email: string
  role: "judge"
  specializations: string[]
  experience: string
}

export interface Submission {
  id: string
  participantId: string
  challengeId: string
  promptText: string
  submissionTime: any
  status: "pending" | "evaluated" | "selected_for_manual_review"
  finalScore?: number

  llmScores?: {
    [modelName: string]: {
      finalScore: number
      description: string
      scores: Record<string, number>
    }
  }

  // Manual judge scoring (map of judgeIds → their scores)
  judgeScore?: {
    [judgeId: string]: {
      totalScore: number
      updatedAt: any
      scores: Record<string, number>
    }
  }
}

export interface Notification {
  id: string
  message: string
  type: "success" | "error" | "info" | "warning"
  timestamp: string
  autoDismiss?: boolean
  timeout?: number
}

export interface JudgeData {
  assignments: JudgeAssignment[]
  stats: JudgeStats
  profile: JudgeProfile
}

export interface Challenge {
  id: string
  title: string
  description: string
  problemStatement: string
  guidelines?: string
  competitionId: string
  maxScore: number
  rubric: {
    name: string
    description: string
    weight: number
    maxPoints?: number
  }[]
  createdAt: any
  updatedAt: any
  // NEW MULTIMEDIA FIELDS
  problemAudioUrls?: string[]
  guidelinesAudioUrls?: string[]
  visualClueUrls: string[]
}

export interface ScoreData {
  score: number
  comment: string
  rubricScores: Record<string, number>
}