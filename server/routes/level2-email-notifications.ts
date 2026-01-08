import express, { Request, Response } from "express";
import { db } from "../config/firebase-admin.js";
import { transporter } from "../config/email.js";
import { authenticateToken, AuthenticatedRequest } from "../utils/auth.js";

const router = express.Router();

// ============================================================================
// INTERFACES
// ============================================================================

interface EmailRecipient {
  name: string;
  email: string;
  content: string;
}

interface SendEmailsRequest {
  batchId: string;
  batchName: string;
  batchStartTime: string;
  batchEndTime: string;
  participantEmails: EmailRecipient[];
  judgeEmails: EmailRecipient[];
  zoomLinks: { [participantId: string]: string };
}

// ============================================================================
// SEND LEVEL 2 EMAILS
// ============================================================================

/**
 * POST /api/level2-emails/:competitionId/send
 * Send Level 2 notification emails to participants and judges
 * Requires: superadmin role
 */
router.post(
  "/:competitionId/send",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId } = req.params;
      const {
        batchId,
        batchName,
        batchStartTime,
        batchEndTime,
        participantEmails,
        judgeEmails,
        zoomLinks,
      } = req.body as SendEmailsRequest;

      // Verify user is superadmin
      const userDoc = await db.collection("users").doc(req.user?.uid || "").get();
      const userData = userDoc.data();

      if (userData?.role !== "superadmin") {
        return res.status(403).json({
          error: "Access denied. Only superadmins can send Level 2 emails.",
        });
      }

      // Validate required fields
      if (!batchId || !participantEmails || !judgeEmails) {
        return res.status(400).json({
          error: "Missing required fields: batchId, participantEmails, judgeEmails",
        });
      }

      console.log(`📧 Starting email send for batch ${batchName} (${batchId})`);
      console.log(`   Participants: ${participantEmails.length}`);
      console.log(`   Judges: ${judgeEmails.length}`);

      // ========================================================================
      // SEND EMAILS
      // ========================================================================

      const sentEmails: Array<{
        recipient: string;
        email: string;
        type: "participant" | "judge";
        status: "sent" | "failed";
        timestamp: Date;
        error?: string;
      }> = [];

      // Send participant emails
      for (const participant of participantEmails) {
        try {
          await transporter.sendMail({
            from: `"Prompt Idol Pakistan" <${process.env.EMAIL_SENDER}>`,
            to: participant.email,
            subject: `🎉 Congratulations! Level 2 Invitation - ${batchName}`,
            text: participant.content,
            html: participant.content.replace(/\n/g, "<br>"),
          });

          sentEmails.push({
            recipient: participant.name,
            email: participant.email,
            type: "participant",
            status: "sent",
            timestamp: new Date(),
          });

          console.log(`   ✓ Sent to participant: ${participant.email}`);
        } catch (error: any) {
          console.error(`   ✗ Failed to send to participant ${participant.email}:`, error);
          sentEmails.push({
            recipient: participant.name,
            email: participant.email,
            type: "participant",
            status: "failed",
            timestamp: new Date(),
            error: error.message,
          });
        }
      }

      // Send judge emails
      for (const judge of judgeEmails) {
        try {
          await transporter.sendMail({
            from: `"Prompt Idol Pakistan" <${process.env.EMAIL_SENDER}>`,
            to: judge.email,
            subject: `Judge Assignment - Level 2 ${batchName}`,
            text: judge.content,
            html: judge.content.replace(/\n/g, "<br>"),
          });

          sentEmails.push({
            recipient: judge.name,
            email: judge.email,
            type: "judge",
            status: "sent",
            timestamp: new Date(),
          });

          console.log(`   ✓ Sent to judge: ${judge.email}`);
        } catch (error: any) {
          console.error(`   ✗ Failed to send to judge ${judge.email}:`, error);
          sentEmails.push({
            recipient: judge.name,
            email: judge.email,
            type: "judge",
            status: "failed",
            timestamp: new Date(),
            error: error.message,
          });
        }
      }

      // ========================================================================
      // STORE EMAIL RECORD IN DATABASE
      // ========================================================================

      const emailRecordRef = db
        .collection("competitions")
        .doc(competitionId)
        .collection("emailRecords")
        .doc();

      const emailRecord = {
        recordId: emailRecordRef.id,
        batchId,
        batchName,
        batchStartTime: new Date(batchStartTime),
        batchEndTime: new Date(batchEndTime),
        sentBy: req.user?.uid || "Unknown",
        sentByEmail: userData?.email || "Unknown",
        timestamp: new Date(),
        sentEmails,
        zoomLinks,
        participantCount: participantEmails.length,
        judgeCount: judgeEmails.length,
        successCount: sentEmails.filter((e) => e.status === "sent").length,
        failureCount: sentEmails.filter((e) => e.status === "failed").length,
        sentTo: {
          participants: participantEmails.map((e) => e.email),
          judges: judgeEmails.map((e) => e.email),
        },
      };

      await emailRecordRef.set(emailRecord);

      // ========================================================================
      // UPDATE ZOOM LINKS IN PARTICIPANT DOCUMENTS
      // ========================================================================

      const batch = db.batch();
      for (const [participantId, zoomLink] of Object.entries(zoomLinks)) {
        const participantRef = db
          .collection("competitions")
          .doc(competitionId)
          .collection("participants")
          .doc(participantId);

        batch.update(participantRef, {
          zoomLink,
          zoomLinkUpdatedAt: new Date(),
        });
      }

      // ========================================================================
      // UPDATE ZOOM LINKS IN JUDGE DOCUMENTS
      // ========================================================================

      // Fetch all participants in this batch to get their judge assignments
      const participantsSnapshot = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("participants")
        .where("assignedBatchId", "==", batchId)
        .get();

      // Group zoom links by judge
      const judgeZoomLinks: { [judgeId: string]: { [participantId: string]: string } } = {};

      participantsSnapshot.docs.forEach((doc) => {
        const participantData = doc.data();
        const participantId = doc.id;
        const assignedJudgeIds = participantData.assignedJudgeIds || [];
        const zoomLink = zoomLinks[participantId];

        if (zoomLink && assignedJudgeIds.length > 0) {
          assignedJudgeIds.forEach((judgeId: string) => {
            if (!judgeZoomLinks[judgeId]) {
              judgeZoomLinks[judgeId] = {};
            }
            judgeZoomLinks[judgeId][participantId] = zoomLink;
          });
        }
      });

      // Update each judge's document
      for (const [judgeId, participantZoomLinks] of Object.entries(judgeZoomLinks)) {
        const judgeRef = db
          .collection("competitions")
          .doc(competitionId)
          .collection("judges")
          .doc(judgeId);

        // Get current judge document to preserve existing zoom links from other batches
        const judgeDoc = await judgeRef.get();
        const judgeData = judgeDoc.exists ? judgeDoc.data() : {};
        const existingZoomLinks = judgeData.zoomLinks || {};

        // Update zoom links for this batch
        existingZoomLinks[batchId] = participantZoomLinks;

        batch.update(judgeRef, {
          zoomLinks: existingZoomLinks,
          zoomLinksUpdatedAt: new Date(),
        });
      }

      await batch.commit();

      console.log(`✅ Email record saved with ID: ${emailRecordRef.id}`);
      console.log(`   Success: ${emailRecord.successCount}/${sentEmails.length}`);
      console.log(`   Failed: ${emailRecord.failureCount}/${sentEmails.length}`);
      console.log(`   Updated zoom links for ${Object.keys(judgeZoomLinks).length} judges`);

      // ========================================================================
      // RESPONSE
      // ========================================================================

      res.status(200).json({
        success: true,
        message: "Emails sent successfully",
        recordId: emailRecordRef.id,
        sentCount: emailRecord.successCount,
        failedCount: emailRecord.failureCount,
        details: {
          participantsSent: sentEmails.filter(
            (e) => e.type === "participant" && e.status === "sent"
          ).length,
          judgesSent: sentEmails.filter(
            (e) => e.type === "judge" && e.status === "sent"
          ).length,
        },
        sentEmails,
      });
    } catch (error: any) {
      console.error("Error sending Level 2 emails:", error);
      res.status(500).json({
        error: "Failed to send emails",
        message: error.message,
      });
    }
  }
);

// ============================================================================
// GET EMAIL RECORDS FOR A COMPETITION
// ============================================================================

/**
 * GET /api/level2-emails/:competitionId/records
 * Get all email records for a competition
 * Requires: superadmin role
 */
router.get(
  "/:competitionId/records",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId } = req.params;

      // Verify user is superadmin
      const userDoc = await db.collection("users").doc(req.user?.uid || "").get();
      const userData = userDoc.data();

      if (userData?.role !== "superadmin") {
        return res.status(403).json({
          error: "Access denied. Only superadmins can view email records.",
        });
      }

      // Fetch all email records
      const emailRecordsSnapshot = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("emailRecords")
        .orderBy("timestamp", "desc")
        .get();

      const emailRecords = emailRecordsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({
        success: true,
        count: emailRecords.length,
        records: emailRecords,
      });
    } catch (error: any) {
      console.error("Error fetching email records:", error);
      res.status(500).json({
        error: "Failed to fetch email records",
        message: error.message,
      });
    }
  }
);

// ============================================================================
// GET EMAIL RECORD BY ID
// ============================================================================

/**
 * GET /api/level2-emails/:competitionId/records/:recordId
 * Get a specific email record
 * Requires: superadmin role
 */
router.get(
  "/:competitionId/records/:recordId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { competitionId, recordId } = req.params;

      // Verify user is superadmin
      const userDoc = await db.collection("users").doc(req.user?.uid || "").get();
      const userData = userDoc.data();

      if (userData?.role !== "superadmin") {
        return res.status(403).json({
          error: "Access denied. Only superadmins can view email records.",
        });
      }

      // Fetch email record
      const emailRecordDoc = await db
        .collection("competitions")
        .doc(competitionId)
        .collection("emailRecords")
        .doc(recordId)
        .get();

      if (!emailRecordDoc.exists) {
        return res.status(404).json({
          error: "Email record not found",
        });
      }

      res.status(200).json({
        success: true,
        record: {
          id: emailRecordDoc.id,
          ...emailRecordDoc.data(),
        },
      });
    } catch (error: any) {
      console.error("Error fetching email record:", error);
      res.status(500).json({
        error: "Failed to fetch email record",
        message: error.message,
      });
    }
  }
);

export default router;
