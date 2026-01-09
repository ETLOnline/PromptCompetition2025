import { Response } from "express";
import { db } from "../../config/firebase-admin.js";
import { AuthenticatedRequest } from "../../utils/auth.js";

/**
 * Fetch all previous submissions for a participant across all competitions
 * This is used by judges to review a participant's submission history
 * 
 * PERFORMANCE NOTE: This function queries all competitions and their submissions.
 * For better performance in production with many competitions:
 * 1. Add Firestore composite indexes on submissions collection
 * 2. Consider caching frequently accessed submission histories
 * 3. Implement pagination if submission count grows large
 */
export async function fetchParticipantSubmissionHistory(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { participantId } = req.params;

    if (!participantId) {
      return res.status(400).json({ error: "Participant ID is required" });
    }

    const submissions: any[] = [];

    // Get all competitions
    const competitionsSnapshot = await db.collection("competitions").get();

    // For each competition, search for submissions with this participant ID
    for (const competitionDoc of competitionsSnapshot.docs) {
      const competitionId = competitionDoc.id;
      const competitionData = competitionDoc.data();
      const competitionTitle = competitionData.title || "Untitled Competition";

      // Get all submissions for this competition
      const submissionsSnapshot = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions")
        .get();

      // Filter submissions that belong to this participant
      for (const submissionDoc of submissionsSnapshot.docs) {
        const submissionId = submissionDoc.id;
        
        // Submission ID format: {participantId}_{challengeId}
        // participantId can contain underscores (e.g., user_36d42UXmf71MNZssyjS4jRy6uYp)
        // So we need to extract challengeId by removing the participantId prefix
        if (submissionId.startsWith(`${participantId}_`)) {
          const submissionData = submissionDoc.data();
          
          // Extract challengeId by removing the participantId prefix
          const challengeId = submissionId.substring(participantId.length + 1);

          // Fetch challenge details
          let challengeTitle = `Challenge ${challengeId}`;
          try {
            const challengeDoc = await db
              .collection("competitions")
              .doc(competitionId)
              .collection("challenges")
              .doc(challengeId)
              .get();

            if (challengeDoc.exists) {
              const challengeData = challengeDoc.data();
              challengeTitle = challengeData?.title || `Challenge ${challengeId}`;
            }
          } catch (error) {
            console.error(`Error fetching challenge ${challengeId}:`, error);
          }

          // Check if submission has judge scores
          const hasScore = submissionData.judgeScores && 
                          Object.keys(submissionData.judgeScores).length > 0;

          // Handle both Firestore Timestamp and ISO string dates
          let submittedAt = submissionData.submittedAt || submissionData.submissionTime || null;
          
          submissions.push({
            submissionId,
            competitionId,
            competitionTitle,
            challengeId,
            challengeTitle,
            promptText: submissionData.promptText || "",
            submittedAt,
            hasSubmission: submissionData.hasSubmission !== false,
            hasScore,
            judgeScores: submissionData.judgeScores || null,
            llmScores: submissionData.llmScores || null,
          });
        }
      }
    }

    // Sort submissions by submission date (most recent first)
    submissions.sort((a, b) => {
      if (!a.submittedAt) return 1;
      if (!b.submittedAt) return -1;
      
      // Handle both Firestore Timestamp and ISO string formats
      let dateA: number;
      let dateB: number;
      
      if (typeof a.submittedAt === 'string') {
        dateA = new Date(a.submittedAt).getTime();
      } else if (a.submittedAt._seconds || a.submittedAt.seconds) {
        dateA = (a.submittedAt._seconds || a.submittedAt.seconds) * 1000;
      } else {
        dateA = 0;
      }
      
      if (typeof b.submittedAt === 'string') {
        dateB = new Date(b.submittedAt).getTime();
      } else if (b.submittedAt._seconds || b.submittedAt.seconds) {
        dateB = (b.submittedAt._seconds || b.submittedAt.seconds) * 1000;
      } else {
        dateB = 0;
      }
      
      return dateB - dateA;
    });

    return res.json({
      participantId,
      submissions,
      totalSubmissions: submissions.length,
    });
  } catch (error) {
    console.error("Error fetching participant submission history:", error);
    return res.status(500).json({ 
      error: "Failed to fetch participant submission history",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Fetch participant details by ID
 * This can be used to get participant information from any competition they've participated in
 */
export async function fetchParticipantDetails(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { participantId } = req.params;

    if (!participantId) {
      return res.status(400).json({ error: "Participant ID is required" });
    }

    // Try to find the participant in any competition
    const competitionsSnapshot = await db.collection("competitions").get();

    for (const competitionDoc of competitionsSnapshot.docs) {
      const participantDoc = await db
        .collection("competitions")
        .doc(competitionDoc.id)
        .collection("participants")
        .doc(participantId)
        .get();

      if (participantDoc.exists) {
        const participantData = participantDoc.data();
        return res.json({
          id: participantId,
          fullName: participantData?.fullName || "Unknown Participant",
          email: participantData?.email || "",
          photoURL: participantData?.photoURL || null,
          competitionId: competitionDoc.id,
        });
      }
    }

    // If not found in any competition, try to get from users collection
    try {
      const userDoc = await db.collection("users").doc(participantId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        return res.json({
          id: participantId,
          fullName: userData?.fullName || "Unknown Participant",
          email: userData?.email || "",
          photoURL: userData?.photoURL || null,
        });
      }
    } catch (error) {
      console.error("Error fetching from users collection:", error);
    }

    return res.status(404).json({ error: "Participant not found" });
  } catch (error) {
    console.error("Error fetching participant details:", error);
    return res.status(500).json({ 
      error: "Failed to fetch participant details",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
