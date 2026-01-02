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

// NEW Route: GET /llm-evaluations/:competitionId/overview
llmRouter.get(
  "/:competitionId/overview",
  authenticateToken,
  authorizeRoles(["admin", "superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId } = req.params;

    try {
      const challengesRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("challenges");

      // get all challenges (no pagination)
      const challengesSnapshot = await challengesRef.get();
      const challenges = challengesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // get only IDs of submissions to count them
      const submissionsRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions");
      const submissionsSnapshot = await submissionsRef.select().get();

      res.json({
        challenges,                  // all challenges
        totalSubmissions: submissionsSnapshot.size,
      });
    } catch (error) {
      console.error("Failed to fetch overview", error);
      res.status(500).json({ error: "Failed to fetch overview" });
    }
  }
);


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
      // 🔹 Submissions query (still paginated)
      const submissionsRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions");

      let query = submissionsRef.orderBy("__name__").limit(pageSize).select();

      if (lastDocId) {
        const lastDoc = await submissionsRef.doc(lastDocId).get();
        if (lastDoc.exists) query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      const submissions: LLMSubmission[] = snapshot.docs.map((doc) => {
        const submissionId = doc.id;
        const parts = submissionId.split("_");
        const challengeId = parts[1]; // participantId_challengeId

        return {
          submissionId,
          challengeId,
          promptText: "", // not fetched here
          llmScores: {}, // not fetched here
        };
      });

      // 🔹 Load ALL challenges (no pagination)
      const challengesRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("challenges");

      const challengesSnapshot = await challengesRef.get();
      const challenges = challengesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1]?.id || null;
      const hasMore = snapshot.docs.length === pageSize;

      // 🔹 Global submissions count
      const countSnap = await submissionsRef.count().get();
      const totalSubmissions = countSnap.data().count || 0;

      res.json({
        submissions,
        challenges,       
        lastDocId: lastVisible,
        hasMore,
        totalSubmissions,
        pageCount: submissions.length,
        totalEvaluations: 0, 
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
        .where("challengeId", "==", challengeId);

      // Pagination query
      let query = submissionsRef.orderBy("__name__").limit(pageSize);

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

      const submissions = snapshot.docs.map((doc) => {
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

      // 🔹 Global submissions count
      const countSnap = await submissionsRef.count().get();
      const totalSubmissions = countSnap.data().count || 0;

      res.json({
        items: submissions,
        lastDocId: lastVisible,
        hasMore,
        pageCount: submissions.length,
        totalSubmissions, // Global count
      });
    } catch (error) {
      console.error("Failed to fetch challenge submissions", error);
      res.status(500).json({ error: "Failed to fetch challenge submissions" });
    }
  }
);

// NEW Route: GET /llm-evaluations/:competitionId/challenges/:challengeId/submissions/participant/:participantId
// Fetch submissions for a specific participant in a specific challenge
llmRouter.get(
  "/:competitionId/challenges/:challengeId/submissions/participant/:participantId",
  authenticateToken,
  authorizeRoles(["admin", "superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId, challengeId, participantId } = req.params;

    try {
      const submissionsRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions");

      // Query all documents that start with participantId_
      // Since Firestore doesn't support startsWith, we'll fetch by range
      const startDocId = `${participantId}_`;
      const endDocId = `${participantId}_\uf8ff`; // \uf8ff is the highest Unicode character

      const snapshot = await submissionsRef
        .where("__name__", ">=", startDocId)
        .where("__name__", "<=", endDocId)
        .where("challengeId", "==", challengeId)
        .get();

      const submissions = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          challengeId: data.challengeId,
          participantId,
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

      res.json({
        items: submissions,
        participantId,
        totalSubmissions: submissions.length,
      });
    } catch (error) {
      console.error("Failed to fetch participant submissions", error);
      res.status(500).json({ error: "Failed to fetch participant submissions" });
    }
  }
);

// NEW Route: GET /llm-evaluations/:competitionId/participant/:participantId/all-submissions
// Fetch ALL submissions for a specific participant across ALL challenges
llmRouter.get(
  "/:competitionId/participant/:participantId/all-submissions",
  authenticateToken,
  authorizeRoles(["admin", "superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { competitionId, participantId } = req.params;

    try {
      const submissionsRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("submissions");

      // Query all documents that start with participantId_
      const startDocId = `${participantId}_`;
      const endDocId = `${participantId}_\uf8ff`; // \uf8ff is the highest Unicode character

      const snapshot = await submissionsRef
        .where("__name__", ">=", startDocId)
        .where("__name__", "<=", endDocId)
        .get();

      const submissions = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          challengeId: data.challengeId || doc.id.split("_")[1],
          participantId,
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

      // Group submissions by challenge
      const submissionsByChallenge: Record<string, any[]> = {};
      submissions.forEach((sub) => {
        if (!submissionsByChallenge[sub.challengeId]) {
          submissionsByChallenge[sub.challengeId] = [];
        }
        submissionsByChallenge[sub.challengeId].push(sub);
      });

      res.json({
        items: submissions,
        submissionsByChallenge,
        participantId,
        totalSubmissions: submissions.length,
        challengesCount: Object.keys(submissionsByChallenge).length,
      });
    } catch (error) {
      console.error("Failed to fetch all participant submissions", error);
      res.status(500).json({ error: "Failed to fetch all participant submissions" });
    }
  }
);
  



export default llmRouter;
