export interface User {
  id: string
  fullName: string
  email: string
}

export interface Competition {
  id: string
  title: string
  configurations: {
    selectedTopN: number
    timestamp: Date
    userId: string
  }
}

export interface Challenge {
  id: string
  title: string
}

export interface Submission {
  id: string // participantId_challengeId
  participantId: string
  challengeId: string
  promptText: string
  finalScore?: number
  llmEvaluated: boolean
  status: "pending" | "evaluated" | "selected_for_manual_review"
}

export interface Participant {
  id: string // userId
  fullName: string
  email: string
  registeredAt: Date
  challengesCompleted: number
}

export interface LeaderboardEntry {
  id: string // userId
  fullName: string
  totalScore: number
  rank: number
}

export interface Judge {
  id: string // judgeId
  fullName: string
  email: string
  assignedSubmissions: string[]
  assignedCount: number
  reviewedCount: number
  status: "Not Started" | "Completed" | "In Progress"
  lastReviewedAt?: Date
  assignedAt: Date
}

export interface Assignment {
  judgeId: string
  judgeName: string
  challengeId: string
  submissions: Submission[]
  submissionCount: number
}

export interface DistributionResult {
  assignments: Assignment[]
  totalChallenges: number
  totalJudges: number
  totalSubmissionsAssigned: number
  unassignedChallenges: string[]
}

export interface UserIndex {
  judgeId: string
  competitionIds: Record<string, string[]> // competitionId -> [challengeId1, challengeId2]
}
