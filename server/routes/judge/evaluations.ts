// server/routes/judge/evaluations.ts

import type { Request, Response } from "express";
import { db } from "../../config/firebase-admin.js";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

interface JudgeEvaluation {
  judgeId: string;
  challengeId: string;
  scores: Record<string, number>;
  totalScore: number;
  comment: string;
  updatedAt: FirebaseFirestore.Timestamp;
}

export async function fetchJudgeEvaluations(
  req: Request,
  res: Response
) {
  try {
    const { competitionId } = req.params;
    const { lastDocId, pageSize = 50 } = req.query;

    let submissionsRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("submissions")
      .limit(Number(pageSize));

    // Pagination
    if (lastDocId) {
      const lastDocSnapshot = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions")
        .doc(String(lastDocId))
        .get();

      submissionsRef = submissionsRef.startAfter(
        lastDocSnapshot as QueryDocumentSnapshot
      );
    }

    const snapshot = await submissionsRef.get();
    const evaluations: JudgeEvaluation[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      // submissionId = participantId_challengeId
      const [_participantId, challengeId] = doc.id.split("_");

      if (!data.judges) return;

      Object.keys(data.judges).forEach((judgeId) => {
        const judgeData = data.judges[judgeId];
        evaluations.push({
          judgeId,
          challengeId,
          scores: judgeData.scores,
          totalScore: judgeData.totalScore,
          comment: judgeData.comment,
          updatedAt: judgeData.updatedAt,
        });
      });
    });

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
