import { Router, Request, Response } from "express";
import { admin, db } from "../config/firebase-admin.js";

import { authenticateToken, authorizeRoles, AuthenticatedRequest } from "../utils/auth.js";

const lastRouter = Router();

/**
 * Generate Final Leaderboard (LLM + Judge)
 * Trigger manually after all judge evaluations are completed.
 *
 * Route: POST /api/competitions/:competitionId/final-leaderboard
 */
lastRouter.post(
  "/:competitionId/final-leaderboard",
  authenticateToken,
  authorizeRoles(["superadmin"]),        // Only allow superadmin to trigger final leaderboard
  async (req: AuthenticatedRequest, res: Response) => {

    const { competitionId } = req.params;

    try {
      // --- 1. Fetch competition info (TopN) -------------------------------
      const competitionSnap = await db.collection("competitions").doc(competitionId).get();
      if (!competitionSnap.exists) {
        return res.status(404).json({ error: "Competition not found" });
      }
      const competitionData = competitionSnap.data();
      const topN = competitionData?.TopN ?? 0;

      // --- 2. Fetch existing LLM leaderboard ------------------------------
      const llmLeaderboardSnap = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("leaderboard")
        .get();

      // Build a base map of participants with their llmScore
      const participants: {
        [userId: string]: {
          fullName: string;
          email: string;
          llmScore: number;
          judgeScore: number;
          finalScore: number;
        };
      } = {};

      llmLeaderboardSnap.forEach((doc) => {
        const data = doc.data();
        participants[doc.id] = {
          fullName: data.fullName,
          email: data.email,
          llmScore: data.totalScore || 0,
          judgeScore: 0,
          finalScore: 0,
        };
      });

      // --- 3. Fetch submissions and aggregate judgeScore per user ---------
      const subsSnap = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions")
        .get();

      subsSnap.forEach((subDoc) => {
        const submission = subDoc.data();
        const userId = submission.participantId;
        // Skip if participant didn't complete any challenge (not in llm leaderboard)
        if (!participants[userId]) return;

        const judgeScoreObj = submission.judgeScore;
        if (judgeScoreObj) {
          // Only one judge per submission → get first (and only) entry
          const judgeId = Object.keys(judgeScoreObj)[0];
          const totalScore = judgeScoreObj[judgeId]?.totalScore || 0;
          participants[userId].judgeScore += totalScore;
        }
      });

      // --- 4. Build arrays: topCandidates + otherCandidates ---------------
      const topCandidates: any[] = [];
      const otherCandidates: any[] = [];

      Object.entries(participants).forEach(([userId, data]) => {
        const finalScore = (data.llmScore + data.judgeScore) / 2;
        data.finalScore = finalScore;

        if (data.judgeScore > 0) {
          topCandidates.push({ userId, ...data });
        } else {
          otherCandidates.push({ userId, ...data });
        }
      });

      // Sort topCandidates by finalScore DESC
      topCandidates.sort((a, b) => b.finalScore - a.finalScore);

      // Sort LLM-only by llmScore DESC
      otherCandidates.sort((a, b) => b.llmScore - a.llmScore);

      // If topN < number of topCandidates, keep only topN in the first group
      const firstGroup = topCandidates.slice(0, topN);
      const secondGroup = [...topCandidates.slice(topN), ...otherCandidates];

      // --- 5. Apply tie-aware ranking ------------------------------------
      let currentRank = 0;
      let prevScore: number | null = null;
      let index = 0;
      const finalList = [...firstGroup, ...secondGroup];

      finalList.forEach((entry) => {
        const scoreForRank = entry.judgeScore > 0 ? entry.finalScore : entry.llmScore;
        if (prevScore === null || scoreForRank < prevScore) {
          currentRank = index + 1; // assign new rank
        }
        // else same score → keep currentRank
        entry.rank = currentRank;
        prevScore = scoreForRank;
        index++;
      });

      // --- 6. Write to /finalLeaderboard/{userId} -------------------------
      const batch = db.batch();

      finalList.forEach((entry) => {
        const finalRef = db
          .collection("competitions")
          .doc(competitionId)
          .collection("finalLeaderboard")
          .doc(entry.userId);

        batch.set(finalRef, {
          fullName: entry.fullName,
          email: entry.email,
          llmScore: entry.llmScore,
          judgeScore: entry.judgeScore,
          finalScore: entry.finalScore,
          rank: entry.rank,
        });
      });

      await batch.commit();

      // --- 7. Set hasFinalLeaderboard flag in the competition doc ---
      await db.collection("competitions").doc(competitionId).update({
        hasFinalLeaderboard: true,
        finalLeaderboardGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
      });


      res.status(200).json({ message: "Final leaderboard generated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate final leaderboard" });
    }
  }
);

export default lastRouter;
