import { Request, Response } from "express";
import { db } from "../../config/firebase-admin.js";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

interface JudgeEvaluation {
  judgeId: string;
  challengeId: string;
  scores: Record<string, number>;
  totalScore: number;
  comment: string;
  updatedAt: any;
}

export async function fetchJudgeEvaluations(
  req: Request,
  res: Response
) {
  try {
    const { competitionId } = req.params;
    const { lastDocId, pageSize = 50 } = req.query;

    // Step 1: Query scored submissions only
    let submissionsRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("submissions")
      .where("status", "==", "scored")
      .limit(Number(pageSize));

    // Step 2: Apply pagination
    if (lastDocId) {
      const lastDocSnapshot = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions")
        .doc(String(lastDocId))
        .get();

      if (!lastDocSnapshot.exists) {
        return res.status(400).json({ message: "Invalid lastDocId for pagination" });
      }

      submissionsRef = submissionsRef.startAfter(
        lastDocSnapshot as QueryDocumentSnapshot
      );
    }

    // Step 3: Fetch submissions
    const snapshot = await submissionsRef.get();
    const evaluations: JudgeEvaluation[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      
      console.log(data);

      // Skip if no judgeScore exists
      if (!data.judgeScore) return;

      const challengeId = data.challengeId;

      // Since only one judge exists, extract first judge
      const judgeId = Object.keys(data.judgeScore)[0];
      const judgeData = data.judgeScore[judgeId];

      if (!judgeData?.updatedAt) return; // skip if updatedAt missing

      evaluations.push({
        judgeId,
        challengeId,
        scores: judgeData.scores,
        totalScore: judgeData.totalScore,
        comment: judgeData.comment,
        updatedAt: judgeData.updatedAt,
      });
    });

    // Step 4: Determine last document for pagination
    const lastVisible =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1].id
        : null;

    res.status(200).json({
      evaluations,
      lastDocId: lastVisible,
      hasMore: snapshot.docs.length === Number(pageSize),
    });
  } catch (error) {
    console.error("Failed to fetch judge evaluations:", error);
    res.status(500).json({ message: "Failed to fetch judge evaluations" });
  }
}
