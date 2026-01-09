import { Router, Response } from "express";
import { db } from "../config/firebase-admin.js";
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from "../utils/auth.js";

const participantsRouter = Router();

/**
 * Get participant details by ID
 * GET /participants/:participantId
 */
participantsRouter.get(
  "/:participantId",
  authenticateToken,
  authorizeRoles(["judge", "admin", "superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { participantId } = req.params;

      if (!participantId) {
        return res.status(400).json({ error: "Participant ID is required" });
      }

      // Try to find the participant in any competition
      const competitionsSnapshot = await db.collection("competitions").get();

      for (const competitionDoc of competitionsSnapshot.docs) {
        const participantDoc = await db
          .collection("competitions")
          .doc(competitionDoc.id)
          .collection("participants")
          .doc(participantId)
          .get();

        if (participantDoc.exists) {
          const participantData = participantDoc.data();
          return res.json({
            id: participantId,
            fullName: participantData?.fullName || "Unknown Participant",
            email: participantData?.email || "",
            photoURL: participantData?.photoURL || null,
            competitionId: competitionDoc.id,
          });
        }
      }

      // If not found in any competition, try to get from users collection
      try {
        const userDoc = await db.collection("users").doc(participantId).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          return res.json({
            id: participantId,
            fullName: userData?.fullName || "Unknown Participant",
            email: userData?.email || "",
            photoURL: userData?.photoURL || null,
          });
        }
      } catch (error) {
        console.error("Error fetching from users collection:", error);
      }

      return res.status(404).json({ error: "Participant not found" });
    } catch (error) {
      console.error("Error fetching participant details:", error);
      return res.status(500).json({ 
        error: "Failed to fetch participant details",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

export default participantsRouter;
