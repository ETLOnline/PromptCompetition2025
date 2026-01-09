import express, { Request, Response } from "express";
import { db } from "../config/firebase-admin.js";

const router = express.Router();

/**
 * GET /level2-live/:competitionId
 * Fetch Level 2 live competition data for public viewing
 * Returns participants, batches, and judges information
 */
router.get("/:competitionId", async (req: Request, res: Response) => {
  try {
    const { competitionId } = req.params;

    // Fetch participants
    const participantsRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("participants");
    
    const participantsSnap = await participantsRef.get();
    
    const participants = participantsSnap.docs.map((doc) => ({
      userid: doc.id,
      fullName: doc.data().fullName || "",
      rank: doc.data().rank || null,
      assignedBatchId: doc.data().assignedBatchId || "",
      assignedJudgeIds: doc.data().assignedJudgeIds || [],
    }));

    // Fetch batches/schedules
    const schedulesRef = db
      .collection("competitions")
      .doc(competitionId)
      .collection("schedules");
    
    const schedulesSnap = await schedulesRef.get();
    
    const batches = schedulesSnap.docs.map((doc) => ({
      id: doc.id,
      batchName: doc.data().batchName || "",
      startTime: doc.data().startTime || "",
      endTime: doc.data().endTime || "",
      participantIds: doc.data().participantIds || [],
      challengeIds: doc.data().challengeIds || [],
    }));

    // Collect unique judge IDs
    const judgeIds = new Set<string>();
    participants.forEach((p) => {
      p.assignedJudgeIds?.forEach((jid: string) => judgeIds.add(jid));
    });

    // Fetch judge information
    const judges: { [key: string]: { id: string; fullName: string } } = {};
    
    for (const judgeId of judgeIds) {
      try {
        const judgeDoc = await db.collection("users").doc(judgeId).get();
        if (judgeDoc.exists) {
          judges[judgeId] = {
            id: judgeId,
            fullName: judgeDoc.data()?.fullName || "Unknown Judge",
          };
        }
      } catch (error) {
        console.error(`Error fetching judge ${judgeId}:`, error);
      }
    }

    // Find current active batch
    const now = new Date();
    const activeBatch = batches.find((batch) => {
      const start = new Date(batch.startTime);
      const end = new Date(batch.endTime);
      return now >= start && now <= end;
    });

    return res.status(200).json({
      success: true,
      data: {
        participants: participants.sort((a, b) => (a.rank || 999) - (b.rank || 999)),
        batches: batches.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
        judges,
        currentBatchId: activeBatch?.id || null,
      },
    });
  } catch (error) {
    console.error("Error fetching Level 2 live data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Level 2 live data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
