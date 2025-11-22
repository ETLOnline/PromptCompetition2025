export type Role = "participant" | "judge" | "admin" | "superadmin"

export interface UserDocument {
  fullName: string
  email: string
  institution: string
  gender: string
  city: string
  province: string
  majors: string
  category: string
  linkedin: string
  bio: string
  consent: boolean
  createdAt: string
  role: Role
}

export interface User {
  id: string
  email: string
  name: string
  institution: string
  role: string
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
