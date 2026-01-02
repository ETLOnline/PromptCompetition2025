import express, { Request, Response } from "express";
import { db } from "../config/firebase-admin.js";
import { authenticateToken, AuthenticatedRequest } from "../utils/auth.js";
import { FieldValue } from "firebase-admin/firestore";

const router = express.Router();

/**
 * GET /batch/:competitionId/participant/:participantId
 * Fetch batch details for a participant including assignedBatchId and schedule
 */
router.get(
  "/:competitionId/participant/:participantId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId, participantId } = req.params;
      const userId = req.user?.uid;

      // Security: Ensure user can only access their own batch details
      if (userId !== participantId) {
        return res.status(403).json({
          success: false,
          message: "You can only access your own batch details",
        });
      }

      // Fetch participant document
      const participantRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("participants")
        .doc(participantId);

      const participantDoc = await participantRef.get();

      if (!participantDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Participant not found in this competition",
        });
      }

      const participantData = participantDoc.data();
      const assignedBatchId = participantData?.assignedBatchId;

      if (!assignedBatchId) {
        return res.status(404).json({
          success: false,
          message: "No batch assigned to this participant",
        });
      }

      // Fetch batch schedule
      const scheduleRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("schedules")
        .doc(assignedBatchId);

      const scheduleDoc = await scheduleRef.get();

      if (!scheduleDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Batch schedule not found",
        });
      }

      const scheduleData = scheduleDoc.data();

      res.status(200).json({
        success: true,
        data: {
          assignedBatchId,
          batchName: scheduleData?.batchName || assignedBatchId,
          startTime: scheduleData?.startTime,
          endTime: scheduleData?.endTime,
          challengeIds: scheduleData?.challengeIds || [],
        },
      });
    } catch (error) {
      console.error("Error fetching batch details:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

/**
 * GET /batch/:competitionId/challenges/:batchId
 * Fetch challenges for a specific batch with time-based access control
 */
router.get(
  "/:competitionId/challenges/:batchId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId, batchId } = req.params;
      const userId = req.user?.uid;

      // Verify user is assigned to this batch
      const participantRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("participants")
        .doc(userId!);

      const participantDoc = await participantRef.get();

      if (!participantDoc.exists) {
        return res.status(403).json({
          success: false,
          message: "You are not registered for this competition",
        });
      }

      const participantData = participantDoc.data();
      const assignedBatchId = participantData?.assignedBatchId;

      // Security: Ensure user can only access their assigned batch
      if (assignedBatchId !== batchId) {
        return res.status(403).json({
          success: false,
          message: "You can only access challenges from your assigned batch",
        });
      }

      // Fetch batch schedule
      const scheduleRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("schedules")
        .doc(batchId);

      const scheduleDoc = await scheduleRef.get();

      if (!scheduleDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Batch schedule not found",
        });
      }

      const scheduleData = scheduleDoc.data();
      const startTime = scheduleData?.startTime?.toDate?.() || new Date(scheduleData?.startTime);
      const endTime = scheduleData?.endTime?.toDate?.() || new Date(scheduleData?.endTime);
      const challengeIds = scheduleData?.challengeIds || [];

      // Time-based access control: Return empty array if before batch start time
      const now = new Date();
      if (now < startTime) {
        return res.status(200).json({
          success: true,
          data: {
            challenges: [],
            message: "Batch has not started yet",
            startTime: startTime.toISOString(),
          },
        });
      }

      // Fetch all challenges in this batch
      if (challengeIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            challenges: [],
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          },
        });
      }

      const challengesRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("challenges");

      // Fetch challenges in parallel
      const challengePromises = challengeIds.map((challengeId: string) =>
        challengesRef.doc(challengeId).get()
      );

      const challengeDocs = await Promise.all(challengePromises);

      const challenges = challengeDocs
        .filter((doc) => doc.exists)
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

      res.status(200).json({
        success: true,
        data: {
          challenges,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          batchId,
        },
      });
    } catch (error) {
      console.error("Error fetching batch challenges:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

export default router;
