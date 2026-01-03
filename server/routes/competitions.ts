import express, { Request, Response } from "express";
import { db } from "../config/firebase-admin.js";
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from "../utils/auth.js";

const router = express.Router();

// GET /competitions - Fetch all competitions (public or protected as needed)
router.get("/", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("competitions").orderBy("createdAt", "desc").get()
    const competitions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    return res.status(200).json(competitions)
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch competitions", detail: err.message })
  }
})

// POST /competitions - Create a new competition (superadmin only)
router.post(
  "/",
  authenticateToken,
  authorizeRoles(["superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      title,
      description,
      startDeadline,
      endDeadline,
      mode,          // CHANGED from 'location'
      venue,         // NEW FIELD
      level,         // NEW FIELD
      TopN,          // NEW FIELD
      systemPrompt,
      prizeMoney,
      isActive,      // NEW FIELD
      isLocked,      // NEW FIELD
      userEmail,     // NEW: From frontend
      userFullName,  // NEW: From frontend
    } = req.body;

    // Update validation
    const isSystemPromptRequired = level !== "Level 2";
    if (!title || !description || !startDeadline || !endDeadline || !mode || !prizeMoney || !level || !userEmail || !userFullName || (isSystemPromptRequired && !systemPrompt)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // NEW VALIDATION: Validate venue for offline mode
    if (mode === "offline" && !venue) {
      return res.status(400).json({ error: "Venue is required for offline competitions" });
    }

    // NEW VALIDATION: Validate TopN for Level 1 and Level 2
    if ((level === "Level 1" || level === "Level 2") && !TopN) {
      return res.status(400).json({ error: "TopN is required for Level 1 and Level 2 competitions" });
    }

    if ((level === "Level 1" || level === "Level 2") && TopN && (isNaN(TopN) || TopN <= 0)) {
      return res.status(400).json({ error: "TopN must be a positive number" });
    }

    try {
      const competitionData: any = {
        title,
        description,
        systemPrompt,
        startDeadline,
        endDeadline,
        mode,          // CHANGED from 'location'
        level,         // NEW FIELD
        prizeMoney,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        isLocked: typeof isLocked === 'boolean' ? isLocked : false,
        isFeatured: req.body.isFeatured || false,
        ChallengeCount: 0,
        AllJudgeEvaluated: false,
        hasFinalLeaderboard: false,
        generateleaderboard: false,
        createdAt: req.body.createdAt || new Date().toISOString(),
        createdBy: {
          uid: req.user?.uid || "",
          email: userEmail,        // Use frontend-provided email
          name: userFullName,      // Use frontend-provided full name
        },
      };

      // NEW: Only add venue if it exists (offline mode)
      if (venue) {
        competitionData.venue = venue;
      }

      // NEW: Only add TopN if it exists and level is Level 1 or Level 2
      if ((level === "Level 1" || level === "Level 2") && TopN) {
        competitionData.TopN = TopN;
      }

      const newDoc = await db.collection("competitions").add(competitionData);

      return res.status(201).json({ id: newDoc.id, message: "Competition created" });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to create competition", detail: err.message });
    }
  }
);

// PATCH /competitions/:id - Update competition (superadmin only)
router.patch(
  "/:id",
  authenticateToken,
  authorizeRoles(["superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // NEW VALIDATION: Check venue for offline mode
    if (updateData.mode === "offline" && updateData.venue !== undefined && !updateData.venue) {
      return res.status(400).json({ error: "Venue is required for offline competitions" });
    }

    // NEW: If changing from offline to online, explicitly remove venue
    if (updateData.mode === "online" && updateData.venue !== undefined) {
      updateData.venue = "";  // Set to empty string to clear it
    }

    // NEW VALIDATION: Validate TopN for Level 1 and Level 2
    if ((updateData.level === "Level 1" || updateData.level === "Level 2") && updateData.TopN !== undefined && !updateData.TopN) {
      return res.status(400).json({ error: "TopN is required for Level 1 and Level 2 competitions" });
    }

    if ((updateData.level === "Level 1" || updateData.level === "Level 2") && updateData.TopN && (isNaN(updateData.TopN) || updateData.TopN <= 0)) {
      return res.status(400).json({ error: "TopN must be a positive number" });
    }

    // NEW: If changing to non-Level 1 and non-Level 2, remove TopN from update
    if (updateData.level && updateData.level !== "Level 1" && updateData.level !== "Level 2") {
      updateData.TopN = null;  // Set to null to remove it from database
    }

    try {
      const ref = db.collection("competitions").doc(id);
      const snap = await ref.get();

      if (!snap.exists) {
        return res.status(404).json({ error: "Competition not found" });
      }

      await ref.update(updateData);
      return res.status(200).json({ message: "Competition updated" });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to update competition", detail: err.message });
    }
  }
);

// DELETE /competitions/:id - Delete competition (superadmin only)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(["superadmin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      const ref = db.collection("competitions").doc(id);
      const snap = await ref.get();

      if (!snap.exists) {
        return res.status(404).json({ error: "Competition not found" });
      }

      const data = snap.data();
      if (data?.isLocked) {
        return res.status(403).json({ error: "Competition is locked and cannot be deleted" });
      }

      await ref.delete();
      return res.status(200).json({ message: "Competition deleted" });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to delete competition", detail: err.message });
    }
  }
);


export default router;
