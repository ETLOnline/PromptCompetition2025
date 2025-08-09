import type { Timestamp } from "firebase/firestore"

export type SubmissionStatus = "pending" | "selected_for_manual_review" | "evaluated"

export type JudgeScore = {
  judgeId: string
  score: number
  comment: string
  evaluatedAt: Timestamp
}

export type SubmissionContent = {
  text?: string
  files?: Array<{ name: string; url: string; type: string }>
  metadata?: Record<string, any>
}

export type Submission = {
  id: string
  participantId: string
  challengeId: string
  submittedAt: Timestamp
  status: SubmissionStatus
  content?: SubmissionContent
  judgeScore?: JudgeScore
}

export type Challenge = {
  id: string
  title: string
  description?: string
  problemStatement?: string
  rubric?: {
    criteria: Array<{
      name: string
      description: string
      maxPoints: number
    }>
    totalPoints: number
  }
}

export type CompetitionData = {
  id: string
  title: string
  challenges: Challenge[]
  submissions: Submission[]
}
