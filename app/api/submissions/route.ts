import { type NextRequest, NextResponse } from "next/server"
import type { Submission, EvaluationScore } from "@/types/auth"

// Mock database - in production, use a real database
const submissions: Submission[] = []

export async function POST(request: NextRequest) {
  try {
    const { competitionId, prompt, llmOutput } = await request.json()

    // In production, get user ID from authentication
    const userId = "user-1" // Mock user ID

    // Check if user already has a submission for this competition
    const existingSubmissionIndex = submissions.findIndex(
      (s) => s.userId === userId && s.competitionId === competitionId,
    )

    const submissionData = {
      id: existingSubmissionIndex >= 0 ? submissions[existingSubmissionIndex].id : Date.now().toString(),
      userId,
      competitionId,
      prompt,
      llmOutput,
      submittedAt: new Date().toISOString(),
      evaluationScores: [],
      averageScore: 0,
      flaggedForReview: false,
    }

    if (existingSubmissionIndex >= 0) {
      // Update existing submission
      submissions[existingSubmissionIndex] = submissionData
    } else {
      // Create new submission
      submissions.push(submissionData)
    }

    // Trigger automatic evaluation
    await evaluateSubmission(submissionData)

    return NextResponse.json({
      message: "Submission saved successfully",
      submission: submissionData,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 })
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
