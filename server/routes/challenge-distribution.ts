import express, { Request, Response } from "express";
import { db, admin } from "../config/firebase-admin.js";
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from "../utils/auth.js";

const router = express.Router();

// GET /challenge-distribution/:competitionId/meta - Get competition metadata
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
        description: data?.description || "",
        startDeadline: data?.startDeadline || "",
        endDeadline: data?.endDeadline || "",
        isActive: data?.isActive || false,
        isLocked: data?.isLocked || false,
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

// GET /challenge-distribution/:competitionId/participants-count - Get total participants count
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

// GET /challenge-distribution/:competitionId/challenges-submissions
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

      // We still compute the existing matrix (for UI totals/overflow),
      // but we DO NOT use it to filter out submissions anymore.
      const { matrix } = await getExistingAssignments(competitionId);

      // Pull ALL submissions for those top-N participants, grouped by challenge
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
          // NOTE: we do NOT exclude already-assigned IDs; available == total pool
          submissionsByChallenge[cid].push(d.id);
        });
      }

      // Sort deterministically (once)
      Object.keys(submissionsByChallenge).forEach((cid) => submissionsByChallenge[cid].sort());

      // bucketSize now represents TOTAL available in pool (matches original behavior)
      const challenges = Object.entries(submissionsByChallenge).map(([challengeId, submissionIds]) => ({
        id: challengeId,
        name: `Challenge ${challengeId}`,
        bucketSize: submissionIds.length,
        submissionIds,
      }));

      return res.status(200).json({
        challenges,
        challengeBuckets: submissionsByChallenge, // full pool; allows reassignment
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

// GET /challenge-distribution/:competitionId/existing-assignments - Get current judge assignments
router.get(
  "/:competitionId/existing-assignments",
  authenticateToken,
  authorizeRoles(["superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId } = req.params;

    try {
      const { matrix, alreadyAssigned } = await getExistingAssignments(competitionId);

      return res.status(200).json({
        assignmentMatrix: matrix,
        alreadyAssigned: Object.fromEntries(
          Object.entries(alreadyAssigned).map(([challengeId, set]) => [challengeId, Array.from(set)])
        ),
        competitionId,
      });
    } catch (err: any) {
      console.error("Error fetching existing assignments:", err);
      return res.status(500).json({
        error: "Failed to fetch existing assignments",
        detail: err.message,
      });
    }
  }
);

// GET /challenge-distribution/:competitionId/config - Get saved distribution configuration
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
          timestamp: null,
          updatedBy: null,
        });
      }

      const data = configDoc.data();
      return res.status(200).json({
        topN: data?.topN || null,
        timestamp: data?.timestamp || null,
        updatedBy: data?.updatedBy || null,
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

// POST /challenge-distribution/:competitionId/config - Save distribution configuration
router.post(
  "/:competitionId/config",
  authenticateToken,
  authorizeRoles(["superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId } = req.params;
    const { topN } = req.body;

    if (!topN || isNaN(Number(topN)) || Number(topN) < 1) {
      return res.status(400).json({ error: "Valid topN parameter is required" });
    }

    try {
      const configRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("distributionConfigs")
        .doc("current");

      await configRef.set(
        {
          topN: Number(topN),
          timestamp: new Date(),
          updatedBy: req.user?.uid || null,
        },
        { merge: true }
      );

      return res.status(200).json({
        message: "Configuration saved successfully",
        topN: Number(topN),
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

// POST /challenge-distribution/:competitionId/distribute - Distribute submissions to judges
router.post(
  "/:competitionId/distribute",
  authenticateToken,
  authorizeRoles(["superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId } = req.params;
    const { assignmentMatrix, distributionMode, competitionTitle, topN } = req.body;

    if (!assignmentMatrix || !distributionMode || !topN) {
      return res.status(400).json({
        error: "assignmentMatrix, distributionMode, and topN are required",
      });
    }

    try {
      const batch = db.batch();

      // NOTE: removed `matrix` from snapshot since it's not used anywhere.
      const distributionSnapshot = {
        topN: topN,
        strategy: "manual",
        mode: distributionMode,
        timestamp: new Date(),
      };

      // Build judge slices
      const judgeSlices: { [judgeId: string]: { [challengeId: string]: string[] } } = {};

      // Make the incoming matrix concrete for TypeScript
      const assignmentMatrixObj = assignmentMatrix as Record<string, Record<string, number>>;

      // Initialize from BOTH: existing judge docs + any judge IDs present in the incoming assignmentMatrix
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

      // Final init
      judgeIdsInMatrix.forEach((jid) => {
        judgeSlices[jid] = {};
      });

      // Get challenge buckets from the request body (frontend sends this)
      const challengeBuckets: Record<string, string[]> = req.body.challengeBuckets || {};

      // If challengeBuckets not provided, we need to fetch them
      if (Object.keys(challengeBuckets).length === 0) {
        const submissionsSnapshot = await db
          .collection("competitions")
          .doc(competitionId)
          .collection("submissions")
          .get();

        submissionsSnapshot.docs.forEach((doc) => {
          const data = doc.data() as { challengeId?: string };
          const challengeId = data.challengeId;
          if (challengeId) {
            if (!challengeBuckets[challengeId]) {
              challengeBuckets[challengeId] = [];
            }
            challengeBuckets[challengeId].push(doc.id);
          }
        });
      }

      // Slice submissions according to matrix
      for (const [challengeId, judgeAssignments] of Object.entries(assignmentMatrixObj)) {
        const submissionIds = challengeBuckets[challengeId] || [];
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

      // Write to Firestore
      for (const [judgeId, challengeAssignments] of Object.entries(judgeSlices)) {
        const judgeDocRef = db
          .collection("competitions")
          .doc(competitionId)
          .collection("judges")
          .doc(judgeId);

        if (distributionMode === "overwrite") {
          // Only challenges with > 0 new assignments for this judge
          const nonEmpty = Object.entries(challengeAssignments).filter(([, ids]) => ids.length > 0);
          const assignedCountTotal = nonEmpty.reduce((sum, [, ids]) => sum + ids.length, 0);

          // If this judge ends up with nothing, delete the entire doc and continue
          if (assignedCountTotal === 0) {
            batch.delete(judgeDocRef);
            continue;
          }

          // New state to upsert
          const submissionsByChallenge = Object.fromEntries(nonEmpty);
          const assignedCountsByChallenge = Object.fromEntries(
            nonEmpty.map(([challengeId, ids]) => [challengeId, ids.length])
          );

          // Remove any previously assigned challenges that are now zeroed out
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
      }

      // Save distribution snapshot (without matrix)
      const snapshotRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("distributionConfigs")
        .doc("current");

      batch.set(snapshotRef, distributionSnapshot, { merge: true });

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
        distributionMode,
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

// Helper function to get existing assignments
async function getExistingAssignments(competitionId: string) {
  const assignmentsByJudge: Record<string, Record<string, string[]>> = {};
  const qSnap = await db
    .collection("competitions")
    .doc(competitionId)
    .collection("judges")
    .get();

  qSnap.forEach((d) => {
    const data = d.data() as {
      submissionsByChallenge?: Record<string, string[]>;
    };
    if (data?.submissionsByChallenge) {
      assignmentsByJudge[d.id] = data.submissionsByChallenge;
    }
  });

  // Build matrix and a set of already-assigned ids per challenge
  const matrix: { [challengeId: string]: { [judgeId: string]: number } } = {};
  const alreadyAssigned: Record<string, Set<string>> = {};

  Object.entries(assignmentsByJudge).forEach(([judgeId, byChallenge]) => {
    Object.entries(byChallenge).forEach(([challengeId, ids]) => {
      if (!matrix[challengeId]) matrix[challengeId] = {};
      matrix[challengeId][judgeId] = (matrix[challengeId][judgeId] || 0) + ids.length;

      if (!alreadyAssigned[challengeId]) alreadyAssigned[challengeId] = new Set();
      ids.forEach((sid) => alreadyAssigned[challengeId].add(sid));
    });
  });

  return { matrix, alreadyAssigned };
}

export default router;
