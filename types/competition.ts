export interface Competition {
  id: string
  title: string
  description: string
  prizeMoney: string
  startDeadline: string
  endDeadline: string
  mode: string
  venue?: string
  isActive: boolean
  isLocked: boolean
  createdAt?: string
  systemPrompt: string
}

export interface CreateCompetitionData {
  title: string
  description: string
  prizeMoney: string
  startDeadline: string
  endDeadline: string
  mode: "online" | "offline"
  venue?: string
  ChallengeCount: number
  createdAt: string
  systemPrompt: string
}

export interface EditCompetitionData {
  title?: string
  description?: string
  startDeadline?: string
  endDeadline?: string
  mode?: "online" | "offline"
  venue?: string
  prizeMoney?: string
  isActive?: boolean
  isLocked?: boolean
  systemPrompt?: string
}
