export interface User {
  id: string
  email: string
  name: string
  institution: string
  role: "participant" | "admin"
  createdAt: string
}

export interface Competition {
  id: string
  title: string
  description: string
  problemStatement: string
  rubric: string
  evaluationCriteria: string
  deadline: string
  isActive: boolean
  isLocked: boolean
  createdAt: string
}

export interface Submission {
  id: string
  userId: string
  competitionId: string
  prompt: string
  llmOutput: string
  submittedAt: string
  evaluationScores: EvaluationScore[]
  averageScore: number
  flaggedForReview: boolean
  manualReviewScore?: number
  manualReviewNotes?: string
}

export interface EvaluationScore {
  id: string
  submissionId: string
  llmModel: string
  score: number
  feedback: string
  evaluatedAt: string
}
