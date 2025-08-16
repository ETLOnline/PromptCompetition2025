// server/routes/judge/scoring.ts

import { db } from "../../config/firebase-admin.js"; // Admin SDK Firestore instance

export interface ScoreData {
  score: number;
  feedback: string;
  rubricScores: Record<string, number>;
}

/**
 * Submit a judge's score for a submission
 */
export async function submitScore(
  competitionId: string,
  submissionId: string,
  judgeId: string,
  scoreData: ScoreData
): Promise<void> {
  try {
    const submissionRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("submissions")
      .doc(submissionId);

    await submissionRef.update({
      [`judges.${judgeId}`]: {
        scores: scoreData.rubricScores,
        totalScore: scoreData.score,
        updatedAt: new Date(),
      },
      status: "scored",
    });
  } catch (error) {
    console.error("Error submitting score:", error);
    throw new Error("Failed to submit score");
  }
}

/**
 * Get a judge's score for a submission
 */
export async function getSubmissionScore(
  competitionId: string,
  submissionId: string,
  judgeId: string
): Promise<ScoreData | null> {
  try {
    const submissionRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("submissions")
      .doc(submissionId);

    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists) return null;

    const data = submissionDoc.data();
    const judgeEntry = data?.judges?.[judgeId];

    if (!judgeEntry) return null;

    return {
      score: judgeEntry.totalScore || 0,
      feedback: "", // Add if feedback is stored in your data model
      rubricScores: judgeEntry.scores || {},
    };
  } catch (error) {
    console.error("Error fetching submission score:", error);
    throw new Error("Failed to fetch submission score");
  }
}

/**
 * Calculate weighted total score from rubric scores
 */
export function calculateWeightedTotal(
  rubricScores: Record<string, number>,
  rubric: Array<{ name: string; weight: number }>
): number {
  if (!rubric || rubric.length === 0) return 0;

  const totalWeight = rubric.reduce((sum, c) => sum + c.weight, 0);

  const weightedSum = rubric.reduce((sum, c) => {
    const score = rubricScores[c.name] || 0;
    const normalizedWeight = c.weight / totalWeight;
    return sum + score * normalizedWeight;
  }, 0);

  return Math.round(weightedSum * 100) / 100;
}
