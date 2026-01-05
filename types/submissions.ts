export interface Submission {
  id: string
  challengeId: string
  participantId: string
  promptText: string
  submissionTime: string
  status?: string
  user?: {
    fullName: string
    email: string
    displayName?: string
  }
  // Evaluation-related fields (may be present depending on submission state)
  finalScore?: number
  llmEvaluated?: boolean
}

export interface CompetitionSubmissions {
  submissions: Submission[]
  totalCount: number
  competitionId: string
}