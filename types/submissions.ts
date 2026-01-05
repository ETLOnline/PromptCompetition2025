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
}

export interface CompetitionSubmissions {
  submissions: Submission[]
  totalCount: number
  competitionId: string
}