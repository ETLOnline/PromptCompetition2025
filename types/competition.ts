export interface Competition {
  id: string
  title: string
  description: string
  prizeMoney: string
  startDeadline: string
  endDeadline: string
  location: string
  isActive: boolean
  isLocked: boolean
  createdAt?: string
}

export interface CreateCompetitionData {
  title: string
  description: string
  prizeMoney: string
  startDeadline: string
  endDeadline: string
  location: string
  ChallengeCount: number
  createdAt: string
}

export interface EditCompetitionData {
  title: string
  description: string
  startDeadline: string
  endDeadline: string
  location: string
  prizeMoney: string
  isActive: boolean
  isLocked: boolean
}
