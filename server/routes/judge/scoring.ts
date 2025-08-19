// server/routes/judge/scoring.ts

import { db, admin } from "../../config/firebase-admin.js";
import type { ScoreData } from "../../types/judge-submission.js";

/**
 * this submitScore is legacy keeping it just incase
 */
// export async function submitScore(
//   competitionId: string,
//   submissionId: string,
//   judgeId: string,
//   scoreData: ScoreData
// ): Promise<void> {
//   try {
//     const submissionRef = db
//       .collection("competitions")
//       .doc(competitionId)
//       .collection("submissions")
//       .doc(submissionId);

//     await submissionRef.update({
//       [`judges.${judgeId}`]: {
//         scores: scoreData.rubricScores,
//         totalScore: scoreData.score,
//         comment: scoreData.comment
//       },
//       status: "scored",
//     });
//   } catch (error) {
//     console.error("Error submitting score:", error);
//     throw new Error("Failed to submit score");
//   }
// }


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
    // Extract challengeId from submissionId
    const challengeId = submissionId.split("_")[1];

    // References
    const submissionRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("submissions")
      .doc(submissionId);

    const judgeRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("judges")
      .doc(judgeId);

    // Batch write
    const batch = db.batch();

    batch.update(submissionRef, {
      [`judgeScore.${judgeId}`]: {
        scores: scoreData.rubricScores,
        totalScore: scoreData.score,
        comment: scoreData.comment,
        updatedAt: admin.firestore.Timestamp.now(),
      },
      status: "scored",
    });

    batch.update(judgeRef, {
      [`completedChallenges.${challengeId}`]: admin.firestore.FieldValue.increment(1),
      reviewedCount: admin.firestore.FieldValue.increment(1),
      lastReviewedAt: admin.firestore.Timestamp.now(),
    });

    // Commit batch
    await batch.commit();
  } catch (error) {
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
