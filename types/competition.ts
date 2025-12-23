export interface Competition {
  id: string
  title: string
  description: string
  prizeMoney: string
  startDeadline: string
  endDeadline: string
  mode: string
  venue?: string
  level?: "Level 1" | "Level 2" | "custom"
  TopN?: number
  isActive: boolean
  isLocked: boolean
  isFeatured: boolean
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
  level?: "Level 1" | "Level 2" | "custom"
  TopN?: number
  ChallengeCount: number
  createdAt: string
  systemPrompt: string
  isFeatured: boolean
  isActive: boolean
  isLocked: boolean
  userEmail: string
  userFullName: string
}

export interface EditCompetitionData {
  title?: string
  description?: string
  startDeadline?: string
  endDeadline?: string
  mode?: "online" | "offline"
  venue?: string
  level?: "Level 1" | "Level 2" | "custom"
  TopN?: number
  prizeMoney?: string
  isActive?: boolean
  isLocked?: boolean
  isFeatured?: boolean
  systemPrompt?: string
}
