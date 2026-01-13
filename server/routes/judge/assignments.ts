// server/routes/judge/assignments.ts

import type { JudgeAssignment, CompetitionAssignment } from "../../types/judge-submission.js";
import { db } from "../../config/firebase-admin.js"; // Admin SDK Firestore instance

/**
 * Fetch all assignments for a specific judge
 */
export async function fetchAssignments(userId: string): Promise<JudgeAssignment[]> {
  try {
    console.log("Searching for userId:", userId);
    console.log("userId type:", typeof userId);
    
    // First, let's try to find all judge documents to see what's there
    const allJudgesSnapshot = await db.collectionGroup("judges").get();
    console.log("Total judge documents found:", allJudgesSnapshot.size);
    allJudgesSnapshot.docs.forEach((doc, index) => {
      console.log(`Judge doc ${index}:`, doc.ref.path, doc.data());
    });
    
    const snapshot = await db.collectionGroup("judges").where("judgeId", "==", userId).get();
    console.log("Results found for userId query:", snapshot.size);
    console.log("Empty?", snapshot.empty);
    if (snapshot.empty) return [];

    // Log found documents
    snapshot.docs.forEach((doc, index) => {
      console.log(`Matching document ${index}:`, doc.ref.path, doc.data());
    });

    // Fetch all assignments and their competition details
    const assignments = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const competitionId = data.competitionId;

        // Fetch competition level and title
        let competitionLevel: "Level 1" | "Level 2" | "custom" | undefined;
        let competitionTitle: string = data.competitionTitle || `Competition ${competitionId}`;
        try {
          const competitionDoc = await db.collection("competitions").doc(competitionId).get();
          if (competitionDoc.exists) {
            const competitionData = competitionDoc.data();
            competitionLevel = competitionData?.level;
            // Use competition title if judge document doesn't have it
            if (!data.competitionTitle && competitionData?.title) {
              competitionTitle = competitionData.title;
            }
          }
        } catch (error) {
          console.error(`Error fetching competition ${competitionId}:`, error);
        }

        // For Level 2, calculate both participant count and submission count
        let submissionCount = 0;
        let participantCount: number | undefined;
        let level2Assignments: { [batch: string]: string[] } | undefined;

        if (competitionLevel === "Level 2" && data.assignments) {
          // Level 2: count participants from batch assignments
          level2Assignments = data.assignments;
          const allParticipants = new Set<string>();
          Object.values(data.assignments).forEach((participantIds: any) => {
            if (Array.isArray(participantIds)) {
              participantIds.forEach((id) => allParticipants.add(id));
            }
          });
          participantCount = allParticipants.size;
          
          // For Level 2, submissionCount should be total number of actual submissions (participant * challenges)
          // This will be calculated from actual submission data
          submissionCount = data.assignedCountTotal || 0;
        } else {
          // Level 1 or custom: use existing count
          submissionCount = data.assignedCountTotal || 0;
        }

        return {
          id: data.judgeId,
          title: competitionTitle,
          competitionId: competitionId,
          submissionCount: submissionCount,
          assignedDate: data.updatedAt,
          assignedCountsByChallenge: data.assignedCountsByChallenge || {},
          evaluatedCount: data.CountEvaluatedSubmission || 0,
          AllChallengesEvaluated: data.AllChallengesEvaluated ?? false,
          level: competitionLevel,
          level2Assignments: level2Assignments,
          participantCount: participantCount,
        };
      })
    );

    return assignments;
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
