// ===============================
// LLM Evaluation Types
// ===============================

export interface LlmEvaluation {
  id: string           // model name or evaluation ID
  modelName: string    // same as Firestore key
  finalScore: number
  criterionScores: Record<string, number>
  description: string
}

// ===============================
// Submission Types
// ===============================

export interface Submission {
  id: string                  // submission document ID: participantId_challengeId
  promptText: string
  llmScores: LlmEvaluation[]  // transformed from Firestore llmScores object
  userId?: string             // maps to participantId
  participantId?: string      // participant ID from backend
  metadata?: Record<string, any>
  status?: "pending" | "evaluated" | "scored"
  llmEvaluated?: boolean
  finalScore?: number
  submissionTime?: string
}

export interface UserProfile {
  id: string
  fullName: string
  email: string
  photoURL?: string
}

// ===============================
// Challenge Types
// ===============================

export interface Challenge {
  id: string
  title?: string
  description?: string
  submissionCount: number
}

// ===============================
// Competition Types
// ===============================

export interface CompetitionLlmEvaluations {
  competitionId: string
  challenges: Challenge[]
  totalSubmissions: number
  totalEvaluations: number
}

// ===============================
// Pagination Types
// ===============================

export interface PaginatedResponse<T> {
  items: T[]
  lastDocId: string | null
  hasMore: boolean
  totalCount?: number
}

// ===============================
// API Request/Response Types
// ===============================

export interface LlmEvaluationStats {
  totalChallenges: number
  totalSubmissions: number
  totalEvaluations: number
  evaluationsByModel: Record<string, number>
}

export interface LlmSubmissionQueryParams {
  competitionId: string
  challengeId?: string
  pageSize?: number
  lastDocId?: string | null
}

export interface LlmSubmissionListProps {
  challengeId: string
  competitionId: string
  initialSubmissions?: Submission[]
}

export interface PaginationState {
  submissions: Submission[]
  lastDocId: string | null
  hasMore: boolean
  isLoading: boolean
  error: string | null
}

export interface LlmSubmissionDetailProps {
  submission: Submission
  challengeId: string
  competitionId: string
  onClose?: () => void
}

export interface ChallengeAccordionProps {
  challenges: Challenge[]
  competitionId: string
}

