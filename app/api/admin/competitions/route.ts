import { type NextRequest, NextResponse } from "next/server"
import type { Competition } from "@/types/auth"

// Mock database - in production, use a real database
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

export async function GET() {
  try {
    return NextResponse.json(competitions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch competitions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const competitionData = await request.json()

    const newCompetition: Competition = {
      id: `comp-${Date.now()}`,
      ...competitionData,
      isLocked: false,
      createdAt: new Date().toISOString(),
    }

    competitions.push(newCompetition)

    return NextResponse.json({
      message: "Competition created successfully",
      competition: newCompetition,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create competition" }, { status: 500 })
  }
}
