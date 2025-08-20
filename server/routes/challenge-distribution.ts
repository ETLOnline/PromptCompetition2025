import express, { Response } from "express";
import { db, admin } from "../config/firebase-admin.js";
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from "../utils/auth.js";

const router = express.Router();

/**
 * GET /challenge-distribution/:competitionId/meta
 * Competition metadata (kept minimal; remove fields here if unused in UI)
 */
router.get(
  "/:competitionId/meta",
  authenticateToken,
  authorizeRoles(["superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId } = req.params;

    try {
      const competitionDoc = await db.collection("competitions").doc(competitionId).get();

      if (!competitionDoc.exists) {
        return res.status(404).json({ error: "Competition not found" });
      }

      const data = competitionDoc.data();
      return res.status(200).json({
        title: data?.title || "",
      });
    } catch (err: any) {
      console.error("Error fetching competition meta:", err);
      return res.status(500).json({
        error: "Failed to fetch competition metadata",
        detail: err.message,
      });
    }
  }
);

/**
 * GET /challenge-distribution/:competitionId/participants-count
 * Returns leaderboard size for the competition
 */
router.get(
  "/:competitionId/participants-count",
  authenticateToken,
  authorizeRoles(["superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId } = req.params;

    try {
      const leaderboardSnapshot = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("leaderboard")
        .get();

      return res.status(200).json({
        count: leaderboardSnapshot.size,
        competitionId,
      });
    } catch (err: any) {
      console.error("Error fetching participants count:", err);
      return res.status(500).json({
        error: "Failed to fetch participants count",
        detail: err.message,
      });
    }
  }
);

/**
 * GET /challenge-distribution/:competitionId/challenges-submissions
 * Returns full pool of submissions (for top N participants) grouped by challenge,
 * plus current assignment matrix (counts only) for UI display.
 * NOTE: Does NOT exclude already-assigned submissions (to allow reassignment).
 */
router.get(
  "/:competitionId/challenges-submissions",
  authenticateToken,
  authorizeRoles(["superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId } = req.params;
    const { topN } = req.query;

    if (!topN || isNaN(Number(topN)) || Number(topN) < 1) {
      return res.status(400).json({ error: "Valid topN parameter is required" });
    }

    try {
      const topNNum = Number(topN);

      // Top N participants
      const leaderboardSnapshot = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("leaderboard")
        .orderBy("totalScore", "desc")
        .limit(topNNum)
        .get();

      const topParticipantIds = leaderboardSnapshot.docs.map((doc) => doc.id);

      if (topParticipantIds.length === 0) {
        return res.status(200).json({
          challenges: [],
          challengeBuckets: {},
          assignmentMatrix: {},
          competitionId,
          topN: topNNum,
        });
      }

      // Current counts per challenge/judge for UI (totals/overflow)
      const matrix = await getAssignmentMatrix(competitionId);

      // Pull ALL submissions for those top-N participants, grouped by challenge (allow reassignment)
      const submissionsByChallenge: Record<string, string[]> = {};

      // Firestore 'in' clause supports up to 10 values
      for (let i = 0; i < topParticipantIds.length; i += 10) {
        const batchIds = topParticipantIds.slice(i, i + 10);
        const snap = await db
          .collection("competitions")
          .doc(competitionId)
          .collection("submissions")
          .where("participantId", "in", batchIds)
          .get();

        snap.forEach((d) => {
          const data = d.data() as { challengeId?: string };
          const cid = data.challengeId;
          if (!cid) return;
          if (!submissionsByChallenge[cid]) submissionsByChallenge[cid] = [];
          submissionsByChallenge[cid].push(d.id);
        });
      }

      // Sort deterministically (once)
      Object.keys(submissionsByChallenge).forEach((cid) => submissionsByChallenge[cid].sort());

      // bucketSize == TOTAL available in pool
      const challenges = Object.entries(submissionsByChallenge).map(([challengeId, submissionIds]) => ({
        id: challengeId,
        name: `Challenge ${challengeId}`,
        bucketSize: submissionIds.length,
        submissionIds,
      }));

      return res.status(200).json({
        challenges,
        challengeBuckets: submissionsByChallenge,
        assignmentMatrix: matrix,
        competitionId,
        topN: topNNum,
      });
    } catch (err: any) {
      console.error("Error fetching challenges and submissions:", err);
      return res.status(500).json({
        error: "Failed to fetch challenges and submissions",
        detail: err.message,
      });
    }
  }
);

/**
 * GET /challenge-distribution/:competitionId/config
 * Returns saved distribution configuration (no matrix stored).
 */
router.get(
  "/:competitionId/config",
  authenticateToken,
  authorizeRoles(["superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId } = req.params;

    try {
      const configDoc = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("distributionConfigs")
        .doc("current")
        .get();

      if (!configDoc.exists) {
        return res.status(200).json({
          topN: null,
          maxPerJudge: null,
          timestamp: null,
          updatedBy: null,
        });
      }

      const data = configDoc.data();
      return res.status(200).json({
        topN: data?.topN ?? null,
        maxPerJudge: data?.maxPerJudge ?? null,
        timestamp: data?.timestamp ?? null,
        updatedBy: data?.updatedBy ?? null,
      });
    } catch (err: any) {
      console.error("Error fetching distribution config:", err);
      return res.status(500).json({
        error: "Failed to fetch distribution configuration",
        detail: err.message,
      });
    }
  }
);

/**
 * POST /challenge-distribution/:competitionId/config
 * Save config (topN and optional maxPerJudge; no matrix persisted).
 */
// router.post(
//   "/:competitionId/config",
//   authenticateToken,
//   authorizeRoles(["superadmin"]),
//   async (req: AuthenticatedRequest, res: Response) => {
//     const { competitionId } = req.params;
//     const { topN, maxPerJudge } = req.body as { topN?: number; maxPerJudge?: number };

//     if (!topN || isNaN(Number(topN)) || Number(topN) < 1) {
//       return res.status(400).json({ error: "Valid topN parameter is required" });
//     }

//     try {
//       const configRef = db
//         .collection("competitions")
//         .doc(competitionId)
//         .collection("distributionConfigs")
//         .doc("current");

//       await configRef.set(
//         {
//           topN: Number(topN),
//           ...(typeof maxPerJudge === "number" ? { maxPerJudge: Number(maxPerJudge) } : {}),
//           timestamp: new Date(),
//           updatedBy: req.user?.uid || null,
//         },
//         { merge: true }
//       );

//       return res.status(200).json({
//         message: "Configuration saved successfully",
//         topN: Number(topN),
//         maxPerJudge: typeof maxPerJudge === "number" ? Number(maxPerJudge) : null,
//         timestamp: new Date(),
//         updatedBy: req.user?.uid || null,
//       });
//     } catch (err: any) {
//       console.error("Error saving distribution config:", err);
//       return res.status(500).json({
//         error: "Failed to save distribution configuration",
//         detail: err.message,
//       });
//     }
//   }
// );


/**
 * POST /challenge-distribution/:competitionId/config
 * Save config (topN and optional maxPerJudge; no matrix persisted).
 */
router.post(
  "/:competitionId/config",
  authenticateToken,
  authorizeRoles(["superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId } = req.params;
    const { topN, maxPerJudge } = req.body as { topN?: number; maxPerJudge?: number };

    if (!topN || isNaN(Number(topN)) || Number(topN) < 1) {
      return res.status(400).json({ error: "Valid topN parameter is required" });
    }

    try {
      const configRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("distributionConfigs")
        .doc("current");

      const competitionRef = db
        .collection("competitions")
        .doc(competitionId);

      // Save topN (and optional maxPerJudge) under /distributionConfigs/current
      await configRef.set(
        {
          topN: Number(topN),
          ...(typeof maxPerJudge === "number" ? { maxPerJudge: Number(maxPerJudge) } : {}),
          timestamp: new Date(),
          updatedBy: req.user?.uid || null,
        },
        { merge: true }
      );

      // ALSO save topN on the competition document itself
      await competitionRef.set(
        {
          TopN: Number(topN),
        },
        { merge: true }
      );

      return res.status(200).json({
        message: "Configuration saved successfully",
        topN: Number(topN),
        maxPerJudge: typeof maxPerJudge === "number" ? Number(maxPerJudge) : null,
        timestamp: new Date(),
        updatedBy: req.user?.uid || null,
      });
    } catch (err: any) {
      console.error("Error saving distribution config:", err);
      return res.status(500).json({
        error: "Failed to save distribution configuration",
        detail: err.message,
      });
    }
  }
);


/**
 * POST /challenge-distribution/:competitionId/distribute
 * Applies the **overwrite** plan from the incoming assignmentMatrix.
 * Only judges with >0 total after this run are stored; judges that drop to 0 are deleted.
 * No snapshot/matrix is stored under distributionConfigs.
 */
router.post(
  "/:competitionId/distribute",
  authenticateToken,
  authorizeRoles(["superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId } = req.params;
    const { assignmentMatrix, competitionTitle, topN, challengeBuckets } = req.body as {
      assignmentMatrix?: Record<string, Record<string, number>>;
      competitionTitle?: string;
      topN?: number;
      challengeBuckets?: Record<string, string[]>;
    };

    if (!assignmentMatrix || !topN) {
      return res.status(400).json({
        error: "assignmentMatrix and topN are required",
      });
    }

    try {
      const batch = db.batch();

      // Build judge slices from matrix
      const judgeSlices: { [judgeId: string]: { [challengeId: string]: string[] } } = {};
      const assignmentMatrixObj = assignmentMatrix as Record<string, Record<string, number>>;

      // Initialize from BOTH: existing judge docs + any judge IDs in matrix
      const judgesSnapshot = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("judges")
        .get();

      const judgeIdsInMatrix = new Set<string>();
      for (const byJudge of Object.values(assignmentMatrixObj)) {
        for (const jid of Object.keys(byJudge)) {
          judgeIdsInMatrix.add(jid);
        }
      }
      judgesSnapshot.docs.forEach((doc) => judgeIdsInMatrix.add(doc.id));

      judgeIdsInMatrix.forEach((jid) => {
        judgeSlices[jid] = {};
      });

      // Buckets (from client or fetch all)
      const buckets: Record<string, string[]> = challengeBuckets || {};
      if (Object.keys(buckets).length === 0) {
        const submissionsSnapshot = await db
          .collection("competitions")
          .doc(competitionId)
          .collection("submissions")
          .get();

        submissionsSnapshot.docs.forEach((doc) => {
          const data = doc.data() as { challengeId?: string };
          const challengeId = data.challengeId;
          if (challengeId) {
            if (!buckets[challengeId]) {
              buckets[challengeId] = [];
            }
            buckets[challengeId].push(doc.id);
          }
        });
      }

      // Slice per matrix
      for (const [challengeId, judgeAssignments] of Object.entries(assignmentMatrixObj)) {
        const submissionIds = buckets[challengeId] || [];
        let currentIndex = 0;

        for (const [judgeId, count] of Object.entries(judgeAssignments)) {
          if (count > 0) {
            const slice = submissionIds.slice(currentIndex, currentIndex + count);
            if (!judgeSlices[judgeId]) judgeSlices[judgeId] = {};
            judgeSlices[judgeId][challengeId] = slice;
            currentIndex += count;
          }
        }
      }

      // Apply overwrite behavior, ensure only judges with >0 remain
      for (const [judgeId, challengeAssignments] of Object.entries(judgeSlices)) {
        const judgeDocRef = db
          .collection("competitions")
          .doc(competitionId)
          .collection("judges")
          .doc(judgeId);

        // Only challenges with > 0 new assignments
        const nonEmpty = Object.entries(challengeAssignments).filter(([, ids]) => ids.length > 0);
        const assignedCountTotal = nonEmpty.reduce((sum, [, ids]) => sum + ids.length, 0);

        // If nothing left for this judge => delete their doc
        if (assignedCountTotal === 0) {
          batch.delete(judgeDocRef);
          continue;
        }

        const submissionsByChallenge = Object.fromEntries(nonEmpty);
        const assignedCountsByChallenge = Object.fromEntries(
          nonEmpty.map(([challengeId, ids]) => [challengeId, ids.length])
        );

        // Remove any previously assigned challenges that are now zero
        const prevSnap = await judgeDocRef.get();
        const deletions: Record<string, FirebaseFirestore.FieldValue> = {};
        if (prevSnap.exists) {
          const prev = prevSnap.data() || {};
          const prevKeys: string[] = Object.keys(prev.submissionsByChallenge || {});
          const keepKeys = new Set<string>(Object.keys(submissionsByChallenge));
          for (const cid of prevKeys) {
            if (!keepKeys.has(cid)) {
              deletions[`submissionsByChallenge.${cid}`] = admin.firestore.FieldValue.delete();
              deletions[`assignedCountsByChallenge.${cid}`] = admin.firestore.FieldValue.delete();
            }
          }
          if (Object.keys(deletions).length) {
            batch.update(judgeDocRef, deletions);
          }
        }

        // Upsert the new maps/totals
        batch.set(
          judgeDocRef,
          {
            judgeId,
            competitionId,
            competitionTitle: competitionTitle || "",
            updatedAt: new Date(),
            submissionsByChallenge,
            assignedCountsByChallenge,
            assignedCountTotal,
          },
          { merge: true }
        );
      }

      // No snapshot/matrix persisted to distributionConfigs

      await batch.commit();

      const totalDistributed = Object.values(judgeSlices).reduce(
        (sum, judgeAssignments) =>
          sum + Object.values(judgeAssignments).reduce((judgeSum, submissions) => judgeSum + submissions.length, 0),
        0
      );

      return res.status(200).json({
        message: "Distribution completed successfully",
        totalDistributed,
        competitionId,
      });
    } catch (err: any) {
      console.error("Error distributing submissions:", err);
      return res.status(500).json({
        error: "Failed to distribute submissions",
        detail: err.message,
      });
    }
  }
);

/**
 * Helper: build current assignment matrix (counts only)
 */
async function getAssignmentMatrix(competitionId: string) {
  const matrix: { [challengeId: string]: { [judgeId: string]: number } } = {};

  const qSnap = await db
    .collection("competitions")
    .doc(competitionId)
    .collection("judges")
    .get();

  qSnap.forEach((d) => {
    const data = d.data() as {
      submissionsByChallenge?: Record<string, string[]>;
    };
    if (!data?.submissionsByChallenge) return;

    Object.entries(data.submissionsByChallenge).forEach(([challengeId, ids]) => {
      if (!matrix[challengeId]) matrix[challengeId] = {};
      matrix[challengeId][d.id] = (matrix[challengeId][d.id] || 0) + (ids?.length || 0);
    });
  });

  return matrix;
}

export default router;
