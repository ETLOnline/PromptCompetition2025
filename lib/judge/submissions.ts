import type { Submission } from "@/types/judge-submission"
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  type DocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function fetchSubmissions(
  competitionId: string,
  challengeId: string,
  pageSize = 10,
  lastDoc?: DocumentSnapshot | null
): Promise<{ submissions: Submission[]; lastDoc: DocumentSnapshot | null; hasMore: boolean }> {
  try {
    let submissionsQuery = query(
      collection(db, "competitions", competitionId, "submissions"),
      where("challengeId", "==", challengeId),
      limit(pageSize),
    );

    if (lastDoc) {
      submissionsQuery = query(submissionsQuery, startAfter(lastDoc));
    }

    const snapshot = await getDocs(submissionsQuery);
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


    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null
    const hasMore = snapshot.docs.length === pageSize

    return { submissions, lastDoc: lastVisible, hasMore }
  } catch (error) {
    console.error("Error fetching submissions:", error)
    throw new Error("Failed to fetch submissions")
  }
}
