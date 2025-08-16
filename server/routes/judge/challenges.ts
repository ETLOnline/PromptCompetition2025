// server/routes/judge/challenges.ts

import type { Challenge } from "../../types/judge-submission.js";
import { db } from "../../config/firebase-admin.js"; // Admin SDK Firestore instance

/**
 * Fetch a single challenge by competitionId and challengeId
 */
export async function fetchChallenge(
  competitionId: string,
  challengeId: string
): Promise<Challenge | null> {
  try {
    const challengeDocRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("challenges")
      .doc(challengeId);

    const challengeDoc = await challengeDocRef.get();

    if (!challengeDoc.exists) {
      return null;
    }

    const data = challengeDoc.data();

    return {
      id: challengeDoc.id,
      title: data.title,
      description: data.description,
      problemStatement: data.problemStatement || data.description,
      guidelines: data.guidelines,
      rubric: data.rubric || [],
      maxScore: data.maxScore || 100,
      competitionId: data.competitionId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Error fetching challenge:", error);
    throw new Error("Failed to fetch challenge");
  }
}
