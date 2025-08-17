// route/result.ts
import express, { Request, Response } from "express";
import { db } from "../config/firebase-admin.js";
import { authenticateToken, AuthenticatedRequest } from "../utils/auth.js";

const router = express.Router();

interface Submission {
  id: string;
  challengeId: string;
  finalScore: number | null;
  llmScores:
    | Record<
        string,
        {
          description: string;
          finalScore: number | null;
          scores: Record<string, number>;
        }
      >
    | null;
  submittedAt: any;
  status?: "pending" | "evaluated" | "failed";
}

interface Competition {
  id: string;
  title: string;
  status: string;
  endDeadline: any;
}

// GET /results/:id - fetch results for logged-in participant in a competition
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const competitionId = req.params.id;
      const userId = req.user?.uid;

      if (!competitionId) {
        return res.status(400).json({ error: "Invalid competition ID" });
      }

      // Fetch competition details
      const competitionDoc = await db
        .collection("competitions")
        .doc(competitionId)
        .get();

      if (!competitionDoc.exists) {
        return res.status(404).json({ error: "Competition not found" });
      }

      const competitionData = {
        id: competitionDoc.id,
        ...competitionDoc.data(),
      } as Competition;

      // Fetch user submissions for this competition
      const submissionsSnapshot = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions")
        .where("participantId", "==", userId)
        .get();

      const submissions: Submission[] = submissionsSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Submission
      );

      return res.status(200).json({
        competition: competitionData,
        submissions,
      });
    } catch (err: any) {
      console.error("Error fetching competition results:", err);

      return res
        .status(500)
        .json({ error: "Failed to fetch results", detail: err.message });
    }
  }
);

export default router;
