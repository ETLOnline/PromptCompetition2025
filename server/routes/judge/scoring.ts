// server/routes/judge/scoring.ts

import { db } from "../../config/firebase-admin.js"; // Admin SDK Firestore instance
import type { ScoreData } from "../../types/judge-submission.js";

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
        comment: scoreData.comment
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
      comment: judgeEntry.comment || "", 
      rubricScores: judgeEntry.scores || {},
    };
  } catch (error) {
    console.error("Error fetching submission score:", error);
    throw new Error("Failed to fetch submission score");
  }
}
