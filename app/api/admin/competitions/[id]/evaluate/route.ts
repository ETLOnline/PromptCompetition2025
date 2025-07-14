import { type NextRequest, NextResponse } from "next/server"
import type { Submission, EvaluationScore } from "@/types/auth"

// Mock database - in production, use a real database
const submissions: Submission[] = []

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const competitionSubmissions = submissions.filter((s) => s.competitionId === params.id)

    // Trigger evaluation for all submissions in this competition
    for (const submission of competitionSubmissions) {
      await evaluateSubmission(submission)
    }

    return NextResponse.json({
      message: "Evaluation triggered successfully",
      evaluatedCount: competitionSubmissions.length,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to trigger evaluation" }, { status: 500 })
  }
}

async function evaluateSubmission(submission: Submission) {
  // Mock LLM evaluation - in production, integrate with actual LLM APIs
  const llmModels = ["gpt-4", "claude-3", "gemini-pro"]
  const evaluationScores: EvaluationScore[] = []

  for (const model of llmModels) {
    // Simulate LLM evaluation with random scores for demo
    const score = Math.random() * 40 + 60 // Random score between 60-100

    evaluationScores.push({
      id: `eval-${Date.now()}-${model}`,
      submissionId: submission.id,
      llmModel: model,
      score,
      feedback: `Evaluated by ${model}: Good prompt structure and clear output.`,
      evaluatedAt: new Date().toISOString(),
    })
  }

  // Calculate average score
  const averageScore = evaluationScores.reduce((sum, score) => sum + score.score, 0) / evaluationScores.length

  // Update submission with evaluation results
  const submissionIndex = submissions.findIndex((s) => s.id === submission.id)
  if (submissionIndex >= 0) {
    submissions[submissionIndex].evaluationScores = evaluationScores
    submissions[submissionIndex].averageScore = averageScore
    submissions[submissionIndex].flaggedForReview = averageScore >= 85 // Flag top performers
  }
}
