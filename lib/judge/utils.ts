/**
 * Utility functions for judge-related operations
 */

// Predefined avatar color classes for consistent judge identification
const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-pink-500",
] as const

/**
 * Generate a consistent avatar color class for a judge based on their name
 * Uses a simple hash function to ensure the same judge always gets the same color
 */
export function getAvatarColor(judgeName: string): string {
  if (!judgeName) {
    return AVATAR_COLORS[0] // Default to first color if no name provided
  }

  // Simple hash function to convert string to number
  let hash = 0
  for (let i = 0; i < judgeName.length; i++) {
    const char = judgeName.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get consistent index
  const colorIndex = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[colorIndex]
}

/**
 * Extract initials from a judge name for avatar display
 */
export function getJudgeInitials(name: string): string {
  if (!name) return "J"

  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)
}

/**
 * Format judge display name consistently
 */
export function formatJudgeName(name: string): string {
  if (!name) return "Unknown Judge"

  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export function formatDate(timestamp: any): string {
  if (!timestamp) return "Recently assigned"

  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp)

  return `Updated ${date.toLocaleDateString()}`
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Calculate weighted total score from rubric scores
export function calculateWeightedTotal(
  rubricScores: Record<string, number>,
  rubric: Array<{ name: string; weight: number }>,
): number {
  if (!rubric || rubric.length === 0) return 0

  const totalWeight = rubric.reduce((sum, c) => sum + c.weight, 0)

  const weightedSum = rubric.reduce((sum, c) => {
    const score = rubricScores[c.name] || 0
    const normalizedWeight = c.weight / totalWeight
    return sum + score * normalizedWeight
  }, 0)

  return Math.round(weightedSum * 100) / 100
}
