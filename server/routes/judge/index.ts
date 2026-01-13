import { Router, Request, Response } from "express";

// Judge route functions
import { fetchAssignments, fetchAssignment, updateChallengeEvaluationStatus } from "./assignments.js";
import { fetchChallenge } from "./challenges.js";
import { fetchSubmissions } from "./submissions.js";
import { submitScore, getSubmissionScore } from "./scoring.js";

// fetch judges for admin
import { fetchJudgeEvaluations } from "./evaluations.js";
import { fetchLevel2JudgeEvaluations } from "./level2-evaluations.js";
import { fetchLevel2JudgeProgress } from "./level2-progress.js";
import { fetchParticipantSubmissionHistory, fetchParticipantDetails } from "./participant-history.js";

// Auth utilities
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from "../../utils/auth.js";

const judgeRouter = Router();

/**
 * Get all assignments for a judge
 * GET /judge/assignments/:judgeId
 */
judgeRouter.get(
  "/assignments/:judgeId",
  authenticateToken,
  authorizeRoles(["judge"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { judgeId } = req.params;
      console.log("Route received judgeId:", judgeId);
      console.log("Auth user uid:", req.user?.uid);
      const assignments = await fetchAssignments(judgeId);
      console.log("Assignments returned:", assignments.length);
      res.json(assignments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  }
);

/**
 * Get a single assignment
 * GET /judge/assignment/:judgeId/:competitionId
 */
judgeRouter.get(
  "/assignment/:judgeId/:competitionId",
  authenticateToken,
  authorizeRoles(["judge"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { judgeId, competitionId } = req.params;
      const assignment = await fetchAssignment(judgeId, competitionId);
      res.json(assignment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch assignment" });
    }
  }
);

/**
 * Update challenge evaluation status
 * PATCH /judge/assignment/:judgeId/:competitionId
 * body: { "challengesEvaluated.01": true }
 */
judgeRouter.patch(
  "/assignment/:judgeId/:competitionId",
  authenticateToken,
  authorizeRoles(["judge"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { judgeId, competitionId } = req.params;
      const updates = req.body;

      // Validate that updates contain only challengesEvaluated.* fields or AllChallengesEvaluated boolean
      const validKeys = Object.entries(updates).every(([key, value]) => {
        if (key === "AllChallengesEvaluated") {
          return typeof value === "boolean";
        }
        if (key.startsWith("challengesEvaluated.")) {
          return typeof value === "boolean";
        }
        return false;
      });

      if (!validKeys) {
        return res.status(400).json({ 
          error: "Only challengesEvaluated.* or AllChallengesEvaluated can be updated and must be boolean" 
        });
      }

      await updateChallengeEvaluationStatus(competitionId, judgeId, updates);
      res.json({ message: "Challenge evaluation status updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update challenge evaluation status" });
    }
  }
);

/**
 * Get challenge detals
 * GET /judge/challenge/:competitionId/:challengeId
 */
judgeRouter.get(
  "/challenge/:competitionId/:challengeId",
  authenticateToken,
  authorizeRoles(["judge"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId, challengeId } = req.params;
      const challenge = await fetchChallenge(competitionId, challengeId);
      res.json(challenge);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch challenge" });
    }
  }
);

/**
 * Fetch submissions
 * GET /judge/submissions/:competitionId/:challengeId
 */
judgeRouter.get(
  "/submissions/:competitionId/:challengeId",
  authenticateToken,
  authorizeRoles(["judge"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId } = req.params;
      const idsQuery = req.query.ids as string | undefined;
      const assignedSubmissionIds = idsQuery ? idsQuery.split(",") : [];

      if (assignedSubmissionIds.length === 0) {
        return res.json({ submissions: [], lastDoc: null, hasMore: false });
      }

      const submissions = await fetchSubmissions(competitionId, assignedSubmissionIds);
      res.json(submissions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  }
);

/**
 * Submit a score
 * POST /judge/score/:competitionId/:submissionId/:judgeId
 * body: { score, feedback, rubricScores }
 */
judgeRouter.post(
  "/score/:competitionId/:submissionId/:judgeId",
  authenticateToken,
  authorizeRoles(["judge"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId, submissionId, judgeId } = req.params;
      await submitScore(competitionId, submissionId, judgeId, req.body);
      res.json({ message: "Score submitted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to submit score" });
    }
  }
);

/**
 * Get a judge’s score for a submission
 * GET /judge/score/:competitionId/:submissionId/:judgeId
 */
judgeRouter.get(
  "/score/:competitionId/:submissionId/:judgeId",
  authenticateToken,
  authorizeRoles(["judge"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId, submissionId, judgeId } = req.params;
      const score = await getSubmissionScore(competitionId, submissionId, judgeId);
      res.json(score);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch submission score" });
    }
  }
);

judgeRouter.get(
  "/judge-evaluations/:competitionId",
  authenticateToken,
  authorizeRoles(["admin", "superadmin"]),
  fetchJudgeEvaluations
);

judgeRouter.get(
  "/level2-judge-evaluations/:competitionId",
  authenticateToken,
  authorizeRoles(["admin", "superadmin"]),
  fetchLevel2JudgeEvaluations
);

judgeRouter.get(
  "/level2-judge-progress/:competitionId",
  authenticateToken,
  authorizeRoles(["admin", "superadmin"]),
  fetchLevel2JudgeProgress
);

/**
 * Get participant submission history across all competitions
 * GET /judge/participant-submission-history/:participantId
 */
judgeRouter.get(
  "/participant-submission-history/:participantId",
  authenticateToken,
  authorizeRoles(["judge", "admin", "superadmin"]),
  fetchParticipantSubmissionHistory
);

/**
 * Get participant details
 * GET /judge/participants/:participantId
 */
judgeRouter.get(
  "/participants/:participantId",
  authenticateToken,
  authorizeRoles(["judge", "admin", "superadmin"]),
  fetchParticipantDetails
);


export default judgeRouter;
