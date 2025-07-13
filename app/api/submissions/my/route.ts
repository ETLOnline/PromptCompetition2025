import { NextResponse } from "next/server"
import type { Submission } from "@/types/auth"

// Mock database - in production, use a real database
const submissions: Submission[] = []

export async function GET() {
  try {
    // In production, get user ID from authentication
    const userId = "user-1" // Mock user ID

    const userSubmissions = submissions.filter((s) => s.userId === userId)
    return NextResponse.json(userSubmissions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}
