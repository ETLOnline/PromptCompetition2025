import type { Submission } from "../../types/judge-submission.js";
import { db } from "../../config/firebase-admin.js";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

/**
 * Fetch submissions for a judge using only assigned submission IDs
 */
export async function fetchSubmissions(
  competitionId: string,
  assignedSubmissionIds: string[], // explicit IDs assigned to judge
  pageSize = 10,
  lastDoc?: QueryDocumentSnapshot | null
): Promise<{ submissions: Submission[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> {
  try {
    if (!assignedSubmissionIds || assignedSubmissionIds.length === 0) {
      return { submissions: [], lastDoc: null, hasMore: false };
    }

    const submissions: Submission[] = [];
    let lastVisibleSnapshot: QueryDocumentSnapshot | null = lastDoc || null;

    // Firestore 'in' query limit is 10
    const chunkSize = 10;
    let remainingIds = assignedSubmissionIds;

    while (remainingIds.length > 0 && submissions.length < pageSize) {
      const currentChunk = remainingIds.slice(0, chunkSize);
      remainingIds = remainingIds.slice(chunkSize);

      let submissionsRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions");

      let submissionsQuery = submissionsRef
        .where("__name__", "in", currentChunk)
        .limit(pageSize - submissions.length);

      if (lastVisibleSnapshot) {
        submissionsQuery = submissionsQuery.startAfter(lastVisibleSnapshot);
      }

      const snapshot = await submissionsQuery.get();
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
          judgeScore: data.judgeScore || {},
        });
      });

      if (snapshot.docs.length > 0) {
        lastVisibleSnapshot = snapshot.docs[snapshot.docs.length - 1];
      }

      if (snapshot.docs.length < currentChunk.length) break; // no more docs in this batch
    }

    const hasMore = remainingIds.length > 0;

    return { submissions, lastDoc: lastVisibleSnapshot, hasMore };
  } catch (error) {
    throw new Error("Failed to fetch submissions");
  }
}
