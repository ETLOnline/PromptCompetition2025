import express, { Request, Response } from "express";
import { db, auth } from "../config/firebase-admin.js";
import { verifySuperAdmin } from "../utils/auth.js";

const router = express.Router();

interface RequestWithUser extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

// POST /competitions - Create a new competition (superadmin only)
router.post("/", verifySuperAdmin, async (req: RequestWithUser, res: Response) => {
  const {
    title,
    description,
    startDeadline,
    endDeadline,
    location,
    prizeMoney
  } = req.body;

  if (!title || !description || !startDeadline || !endDeadline || !location || !prizeMoney) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newDoc = await db.collection("competitions").add({
      title,
      description,
      startDeadline,
      endDeadline,
      location,
      prizeMoney,
      isActive: true,
      isLocked: false,
      createdAt: new Date().toISOString(),
      createdBy: {
        uid: req.user?.uid || "",
        email: req.user?.email || "",
        name: req.user?.email?.split("@")[0] || "",
      },
    });

    return res.status(201).json({ id: newDoc.id, message: "Competition created" });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to create competition", detail: err.message });
  }
});

// PATCH /competitions/:id - Update competition (superadmin only)
router.patch("/:id", verifySuperAdmin, async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const ref = db.collection("competitions").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Competition not found" });
    }

    const data = snap.data();
    if (data?.isLocked) {
      return res.status(403).json({ error: "Competition is locked and cannot be updated" });
    }

    await ref.update(updateData);
    return res.status(200).json({ message: "Competition updated" });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update competition", detail: err.message });
  }
});

// DELETE /competitions/:id - Delete competition (superadmin only)
router.delete("/:id", verifySuperAdmin, async (req: RequestWithUser, res: Response) => {
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
});

export default router;
