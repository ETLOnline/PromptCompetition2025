// server/routes/judge/submissions.ts

import type { Submission } from "../../types/judge-submission.js";
import { db } from "../../config/firebase-admin.js"; // Admin SDK Firestore instance
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

/**
 * Fetch submissions for a challenge with optional pagination
 */
export async function fetchSubmissions(
  competitionId: string,
  challengeId: string,
  pageSize = 10,
  lastDoc?: QueryDocumentSnapshot | null
): Promise<{ submissions: Submission[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> {
  try {
    let submissionsRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("submissions");

    let submissionsQuery = submissionsRef
      .where("challengeId", "==", challengeId)
      .limit(pageSize);

    if (lastDoc) {
      submissionsQuery = submissionsQuery.startAfter(lastDoc);
    }

    const snapshot = await submissionsQuery.get();
    const submissions: Submission[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      submissions.push({
        id: doc.id,
        participantId: data.participantId,
        challengeId: data.challengeId,
        promptText: data.promptText,
        submissionTime: data.submissionTime,
        status: data.status,
        finalScore: data.finalScore,
        llmScores: data.llmScores || {},
        judges: data.judges || {},
      });
    });

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
    const hasMore = snapshot.docs.length === pageSize;

    return { submissions, lastDoc: lastVisible, hasMore };
  } catch (error) {
    throw new Error("Failed to fetch submissions");
  }
}
