import { type NextRequest, NextResponse } from "next/server"
import type { NextApiRequest } from "next"
import type { Competition } from "@/types/auth"
import type { NextRequestContext } from "next/server"

// Mock database
const competitions: Competition[] = [
  {
    id: "comp-1",
    title: "Creative Writing Assistant",
    description: "Design prompts that help AI generate creative and engaging stories",
    problemStatement:
      "Create a prompt that guides an AI to write a compelling short story (500-800 words) about a character who discovers they can communicate with plants. The story should include dialogue, character development, and a meaningful resolution.",
    rubric:
      "Scoring will be based on: 1) Creativity and originality (25 points), 2) Story structure and coherence (25 points), 3) Character development (20 points), 4) Dialogue quality (15 points), 5) Resolution satisfaction (15 points). Total: 100 points.",
    evaluationCriteria:
      "Stories will be evaluated for creativity, narrative structure, character depth, dialogue authenticity, and satisfying conclusion. Bonus points for unique perspectives and emotional resonance.",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    isLocked: false,
    createdAt: new Date().toISOString(),
  },
]

export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const { id } = await context.params

  const competition = competitions.find((c) => c.id === id)

  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 })
  }

  return NextResponse.json(competition)
}
