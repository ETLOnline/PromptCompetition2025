import { NextResponse } from "next/server"

// Mock database - in production, use a real database
const users = []
const submissions = []

export async function GET() {
  try {
    const stats = {
      totalParticipants: users.filter((u) => u.role === "participant").length,
      totalSubmissions: submissions.length,
      pendingReviews: submissions.filter((s) => s.flaggedForReview && !s.manualReviewScore).length,
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
