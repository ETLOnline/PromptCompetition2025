// server/routes/judge/assignments.ts

import type { JudgeAssignment, CompetitionAssignment } from "../../types/judge-submission.js";
import { db } from "../../config/firebase-admin.js"; // Admin SDK Firestore instance

/**
 * Fetch all assignments for a specific judge
 */
export async function fetchAssignments(userId: string): Promise<JudgeAssignment[]> {
  try {
    const snapshot = await db.collectionGroup("judges").where("judgeId", "==", userId).get();
// console.log("Searching for userId:", userId);
// console.log("userId type:", typeof userId);
// const snapshot = await db.collectionGroup("judges").where("judgeId", "==", userId).get();
// console.log("Results found:", snapshot);
    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: data.judgeId,
        title: data.competitionTitle || `Competition ${data.competitionId}`,
        competitionId: data.competitionId,
        submissionCount: data.assignedCountTotal || 0,
        assignedDate: data.updatedAt,
        assignedCountsByChallenge: data.assignedCountsByChallenge || {},
        AllChallengesEvaluated: data.AllChallengesEvaluated ?? false,
      };
    });
  } catch (error: any) {
    // Handle Firestore collectionGroup precondition error gracefully
    if (error.code === 9 || error.message?.includes("FAILED_PRECONDITION")) {
      console.warn("No 'judges' subcollection exists yet. Returning empty list.");
      return [];
    }

    console.error("Unexpected error fetching judge assignments:", error);
    return [];
  }
}



/**
 * Fetch a single assignment for a specific judge and competition
 */
export async function fetchAssignment(
  userId: string,
  competitionId: string
): Promise<CompetitionAssignment | null> {
  try {
    const judgeDocRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("judges")
      .doc(userId);

    const judgeDoc = await judgeDocRef.get();

    if (!judgeDoc.exists) return null;

    const data = judgeDoc.data();

    return {
      judgeId: data.judgeId,
      competitionId: data.competitionId,
      competitionTitle: data.competitionTitle || `Competition ${competitionId}`,
      assignedCountTotal: data.assignedCountTotal || 0,
      assignedCountsByChallenge: data.assignedCountsByChallenge || {},
      submissionsByChallenge: data.submissionsByChallenge || {},
      challengesEvaluated: data.challengesEvaluated || {},
      AllChallengesEvaluated: data.AllChallengesEvaluated ?? false,
      updatedAt: data.updatedAt?.toDate?.() || null,
    };
  } catch (error) {
    throw new Error("Failed to fetch judge assignment");
  }
}

/**
 * Update challenge evaluation status for a judge
 * Updates nested field using dot notation
 */
export async function updateChallengeEvaluationStatus(
  competitionId: string,
  judgeId: string,
  updates: Record<string, boolean>
): Promise<void> {
  try {
    const judgeDocRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("judges")
      .doc(judgeId);

    // Check if judge document exists
    const judgeDoc = await judgeDocRef.get();
    if (!judgeDoc.exists) {
      throw new Error("Judge assignment not found");
    }

    // Update using Firestore update (supports dot notation)
    await judgeDocRef.update(updates);
  } catch (error) {
    console.error("Error updating challenge evaluation status:", error);
    throw new Error("Failed to update challenge evaluation status");
  }
}
