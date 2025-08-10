// User and Judge combined (role added to User, Judge has extended fields)
export interface User {
  id: string
  fullName: string
  email: string
  role?: string // e.g. "judge", "participant", "admin"
}

export interface Judge extends User {
  assignedSubmissions: string[]            // IDs of submissions assigned
  assignedCount: number                    // number of assigned submissions
  reviewedCount: number                    // number of reviewed submissions
  status: "Not Started" | "Completed" | "In Progress"
  lastReviewedAt?: Date
  assignedAt: Date
}

// Competition info with configs
export interface Competition {
  id: string
  title: string
  configurations: {
    selectedTopN: number
    timestamp: Date
    userId: string
  }
}

// Challenge info (merged optional fields)
export interface Challenge {
  id: string
  title: string
  description?: string
  maxSubmissions?: number
  createdAt?: Date
}

// Submission unified with status variations and fields
export interface Submission {
  id: string                // e.g. participantId_challengeId or just id
  participantId?: string    // aka userId, optional for backward compatibility
  userId?: string           // alias for participantId
  challengeId: string
  promptText?: string       // for prompt-based challenges
  title?: string            // optional title
  description?: string
  fileUrl?: string
  submittedAt?: Date
  finalScore?: number
  llmEvaluated?: boolean
  status: "pending" | "evaluated" | "selected_for_manual_review" | "approved" | "rejected"
}

// Participant info (basically a User with extra fields)
export interface Participant extends User {
  registeredAt: Date
  challengesCompleted: number
}

// Leaderboard entry
export interface LeaderboardEntry {
  id: string
  fullName: string
  totalScore: number
  rank: number
}

// Assignment interface representing what is assigned to a judge per challenge
export interface Assignment {
  judgeId: string
  judgeName: string
  challengeId: string
  submissions: Submission[]
  submissionCount: number
}

// DistributionResult summarizes the distribution outcome
export interface DistributionResult {
  assignments: Assignment[]
  totalChallenges: number
  totalJudges: number
  totalSubmissionsAssigned: number
  unassignedChallenges: string[]
}

// UserIndex for storing competition assignments per judge
export interface UserIndex {
  judgeId: string
  competitionIds: Record<string, string[]> // competitionId -> [challengeId1, challengeId2]
}

// Legacy / old style JudgeAssignment interface (optional to keep)
export interface JudgeAssignment {
  judgeId: string
  challengeId: string
  assignedCount: number
  assignedAt: Date
  status: "assigned" | "completed"
}
