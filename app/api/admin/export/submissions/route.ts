import { type NextRequest, NextResponse } from "next/server"
import type { Submission } from "@/types/auth"

// Mock database - in production, use a real database
const submissions: Submission[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const competitionId = searchParams.get("competitionId")

    let filteredSubmissions = submissions
    if (competitionId) {
      filteredSubmissions = submissions.filter((s) => s.competitionId === competitionId)
    }

    // Create CSV content
    const csvHeader =
      "Submission ID,User ID,Competition ID,Average Score,Manual Score,Flagged for Review,Submitted At,Prompt Preview,Output Preview\n"
    const csvContent = filteredSubmissions
      .map(
        (s) =>
          `${s.id},${s.userId},${s.competitionId},${s.averageScore.toFixed(1)},${s.manualReviewScore?.toFixed(1) || "N/A"},${s.flaggedForReview},"${new Date(s.submittedAt).toISOString()}","${s.prompt.substring(0, 100).replace(/"/g, '""')}...","${s.llmOutput.substring(0, 100).replace(/"/g, '""')}..."`,
      )
      .join("\n")

    const csv = csvHeader + csvContent

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=${competitionId ? `submissions-${competitionId}` : "all-submissions"}.csv`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to export submissions" }, { status: 500 })
  }
}
