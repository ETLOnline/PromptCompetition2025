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
      systemPrompt,
      prizeMoney
    } = req.body;

    // Update validation
    if (!title || !description || !startDeadline || !endDeadline || !mode || !prizeMoney || !systemPrompt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // NEW VALIDATION: Validate venue for offline mode
    if (mode === "offline" && !venue) {
      return res.status(400).json({ error: "Venue is required for offline competitions" });
    }

    try {
      const competitionData: any = {
        title,
        description,
        systemPrompt,
        startDeadline,
        endDeadline,
        mode,          // CHANGED from 'location'
        prizeMoney,
        isActive: true,
        isLocked: false,
        ChallengeCount: 0,
        AllJudgeEvaluated: false,
        hasFinalLeaderboard: false,
        generateleaderboard: false,
        createdAt: req.body.createdAt || new Date().toISOString(),
        createdBy: {
          uid: req.user?.uid || "",
          email: req.user?.email || "",
          name: req.user?.email?.split("@")[0] || "",
        },
      };

      // NEW: Only add venue if it exists (offline mode)
      if (venue) {
        competitionData.venue = venue;
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
