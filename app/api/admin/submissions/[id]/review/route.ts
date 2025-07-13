import { type NextRequest, NextResponse } from "next/server"
import type { Submission } from "@/types/auth"

// Mock database - in production, use a real database
const submissions: Submission[] = []

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { manualReviewScore, manualReviewNotes } = await request.json()

    const submissionIndex = submissions.findIndex((s) => s.id === params.id)

    if (submissionIndex === -1) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    submissions[submissionIndex].manualReviewScore = manualReviewScore
    submissions[submissionIndex].manualReviewNotes = manualReviewNotes

    // Additional logic can be added here if needed

    return NextResponse.json({
      message: "Manual review saved successfully",
      submission: submissions[submissionIndex],
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save manual review" }, { status: 500 })
  }
}
