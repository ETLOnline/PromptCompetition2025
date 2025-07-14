import { type NextRequest, NextResponse } from "next/server"
import type { Submission } from "@/types/auth"

// Mock database - in production, use a real database
const submissions: Submission[] = []

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // In production, get user ID from authentication
    const userId = "user-1" // Mock user ID

    const submission = submissions.find((s) => s.userId === userId && s.competitionId === params.id)

    return NextResponse.json(submission || null)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 })
  }
}
