import { Router, Request, Response } from "express";
import { db } from "../config/firebase-admin.js";
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from "../utils/auth.js";

const llmRouter = Router();

interface LLMSubmission {
  submissionId: string;
  challengeId: string;
  promptText: string;
  llmScores: Record<string, {
    description: string;
    finalScore: number;
    scores: Record<string, number>;
  }>;
}

// Route: GET /llm-evaluations/:competitionId
llmRouter.get(
  "/:competitionId",
  authenticateToken,
  authorizeRoles(["admin", "superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId } = req.params;
    const pageSize = Number(req.query.pageSize) || 20;
    const lastDocId = req.query.lastDocId as string | undefined;

    try {
      const submissionsRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions");

      let query = submissionsRef
        .orderBy("__name__")
        .limit(pageSize)
        .select(); // only get document IDs, no fields

      if (lastDocId) {
        const lastDoc = await submissionsRef.doc(lastDocId).get();
        if (lastDoc.exists) query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      const challengesMap: Record<string, { id: string; submissionCount: number }> = {};

      const submissions: LLMSubmission[] = snapshot.docs.map(doc => {
        const submissionId = doc.id;
        const parts = submissionId.split("_");
        const challengeId = parts[1]; // participantId_challengeId

        if (!challengesMap[challengeId]) {
          challengesMap[challengeId] = { id: challengeId, submissionCount: 0 };
        }
        challengesMap[challengeId].submissionCount += 1;

        return {
          submissionId,
          challengeId,
          promptText: "", // not fetched here
          llmScores: {}, // not fetched here
        };
      });

      const challenges = Object.values(challengesMap);
      const lastVisible = snapshot.docs[snapshot.docs.length - 1]?.id || null;
      const hasMore = snapshot.docs.length === pageSize;

      res.json({
        submissions,
        challenges,
        lastDocId: lastVisible,
        hasMore,
        totalSubmissions: submissions.length,
        totalEvaluations: 0, // can calculate if needed
      });
    } catch (error) {
      console.error("Failed to fetch LLM submissions", error);
      res.status(500).json({ error: "Failed to fetch LLM submissions" });
    }
  }
);

llmRouter.get(
  "/:competitionId/challenges/:challengeId/submissions",
  authenticateToken,
  authorizeRoles(["admin", "superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId, challengeId } = req.params;
    const pageSize = Number(req.query.pageSize) || 20;
    const lastDocId = req.query.lastDocId as string | undefined;

    try {
      const submissionsRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions")
        .orderBy("__name__") // ordering by doc ID
        .limit(pageSize);

        
      let query = submissionsRef;
      if (lastDocId) {
        const lastDocSnapshot = await db
          .collection("competitions")
          .doc(competitionId)
          .collection("submissions")
          .doc(lastDocId)
          .get();
        if (lastDocSnapshot.exists) {
          query = query.startAfter(lastDocSnapshot);
        }
      }

      const snapshot = await query.get();
      

      // Filter by challengeId extracted from submissionId
      const submissions = snapshot.docs
      .filter((doc) => doc.data().challengeId === challengeId)
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          challengeId,
          promptText: data.promptText || "",
          llmScores: data.llmScores
            ? Object.entries(data.llmScores).map(([modelName, evalData]: any) => ({
                id: modelName,
                modelName,
                finalScore: evalData.finalScore || 0,
                criterionScores: evalData.scores || {},
                description: evalData.description || "",
              }))
            : [],
        };
      });


      const lastVisible = snapshot.docs[snapshot.docs.length - 1]?.id || null;
      const hasMore = snapshot.docs.length === pageSize;

      res.json({
        items: submissions,
        lastDocId: lastVisible,
        hasMore,
        totalCount: submissions.length,
      });
    } catch (error) {
      console.log("Failed to fetch challenge submissions", error);
      console.error("Failed to fetch challenge submissions", error);
      res.status(500).json({ error: "Failed to fetch challenge submissions" });
    }
  }
);


export default llmRouter;
