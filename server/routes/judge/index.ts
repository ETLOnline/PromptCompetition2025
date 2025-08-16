import { Router, Request, Response } from "express";

// Judge route functions
import { fetchAssignments, fetchAssignment } from "./assignments.js";
import { fetchChallenge } from "./challenges.js";
import { fetchSubmissions } from "./submissions.js";
import { submitScore, getSubmissionScore } from "./scoring.js";

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
      const assignments = await fetchAssignments(judgeId);
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
 * Get challenge details
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
      const { competitionId, challengeId } = req.params;
      const submissions = await fetchSubmissions(competitionId, challengeId);
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

export default judgeRouter;
