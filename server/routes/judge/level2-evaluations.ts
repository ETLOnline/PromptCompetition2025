import { Request, Response } from "express";
import { db } from "../../config/firebase-admin.js";

interface Level2Evaluation {
  judgeId: string;
  judgeName: string;
  batchId: string;
  participantId: string;
  participantName: string;
  evaluatedChallenges: string[];
  evaluations: {
    [challengeId: string]: {
      rubricScores: Record<string, number>;
      score: number;
      comment: string;
      evaluatedAt: any;
      hasSubmission: boolean;
    };
  };
  lastUpdated: any;
}

interface BatchInfo {
  batchId: string;
  batchName: string;
  judgeCount: number;
  participantCount: number;
  evaluationCount: number;
  challengeCount: number;
}

export async function fetchLevel2JudgeEvaluations(
  req: Request,
  res: Response
) {
  try {
    const { competitionId } = req.params;

    // Step 1: Fetch all schedules (batches) for this competition
    const schedulesSnapshot = await db
      .collection("competitions")
      .doc(competitionId)
      .collection("schedules")
      .get();

    if (schedulesSnapshot.empty) {
      return res.status(200).json({
        evaluations: [],
        batches: [],
        judges: {},
        participants: {},
      });
    }

    const allEvaluations: Level2Evaluation[] = [];
    const batchesInfo: BatchInfo[] = [];
    const judgeMap: Record<string, string> = {};
    const participantMap: Record<string, string> = {};

    // Step 2: Fetch all judges first (to avoid redundant queries)
    const judgesSnapshot = await db
      .collection("competitions")
      .doc(competitionId)
      .collection("judges")
      .get();

    // Build judge map
    for (const judgeDoc of judgesSnapshot.docs) {
      const judgeData = judgeDoc.data();
      const judgeId = judgeDoc.id;
      const judgeName = judgeData.judgeName || judgeData.name || judgeData.email || `Judge ${judgeId.slice(0, 8)}`;
      judgeMap[judgeId] = judgeName;
    }

    // Step 3: For each batch, fetch judge evaluations
    for (const scheduleDoc of schedulesSnapshot.docs) {
      const scheduleData = scheduleDoc.data();
      const batchId = scheduleDoc.id;
      const batchName = scheduleData.batchName || `Batch ${batchId}`;
      const challengeIds = scheduleData.challengeIds || [];
      const participantIds = scheduleData.participantIds || [];

      let batchEvaluationCount = 0;
      const batchJudges = new Set<string>();

      // Fetch participant names for this batch
      for (const participantId of participantIds) {
        if (!participantMap[participantId]) {
          try {
            const participantDoc = await db
              .collection("competitions")
              .doc(competitionId)
              .collection("participants")
              .doc(participantId)
              .get();

            if (participantDoc.exists) {
              const participantData = participantDoc.data();
              participantMap[participantId] = participantData?.name || participantData?.email || `Participant ${participantId.slice(0, 8)}`;
            } else {
              participantMap[participantId] = `Participant ${participantId.slice(0, 8)}`;
            }
          } catch (error) {
            participantMap[participantId] = `Participant ${participantId.slice(0, 8)}`;
          }
        }
      }

      // Step 4: For each judge, check if they have evaluations for this batch
      for (const judgeDoc of judgesSnapshot.docs) {
        const judgeId = judgeDoc.id;
        const judgeData = judgeDoc.data();
        const judgeName = judgeMap[judgeId];

        // Check if this judge is assigned to this batch
        const assignments = judgeData.assignments || {};
        if (!assignments[batchId]) {
          continue; // Judge not assigned to this batch
        }

        // Fetch evaluations for participants in this batch
        const evaluationsSnapshot = await db
          .collection("competitions")
          .doc(competitionId)
          .collection("judges")
          .doc(judgeId)
          .collection("level2Evaluations")
          .where("batchId", "==", batchId)
          .get();

        for (const evalDoc of evaluationsSnapshot.docs) {
          const evalData = evalDoc.data();
          const participantId = evalDoc.id;

          batchJudges.add(judgeId);
          batchEvaluationCount++;

          allEvaluations.push({
            judgeId,
            judgeName,
            batchId,
            participantId,
            participantName: participantMap[participantId] || `Participant ${participantId.slice(0, 8)}`,
            evaluatedChallenges: evalData.evaluatedChallenges || [],
            evaluations: evalData.evaluations || {},
            lastUpdated: evalData.lastUpdated,
          });
        }
      }

      batchesInfo.push({
        batchId,
        batchName,
        judgeCount: batchJudges.size,
        participantCount: participantIds.length,
        evaluationCount: batchEvaluationCount,
        challengeCount: challengeIds.length,
      });
    }

    res.status(200).json({
      evaluations: allEvaluations,
      batches: batchesInfo,
      judges: judgeMap,
      participants: participantMap,
    });
  } catch (error) {
    console.error("Failed to fetch Level 2 judge evaluations:", error);
    res.status(500).json({ message: "Failed to fetch Level 2 judge evaluations" });
  }
}
