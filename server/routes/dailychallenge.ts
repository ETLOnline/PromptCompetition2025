import express, { Request, Response } from "express";
import { db } from "../config/firebase-admin.js";

const router = express.Router();

// GET /dailychallenge - Fetch all active daily challenges (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    // Query for active challenges (startTime <= now AND endTime >= now)
    const snapshot = await db
      .collection("dailychallenge")
      .where("startTime", "<=", now)
      .where("endTime", ">=", now)
      .orderBy("startTime", "desc")
      .get();

    const challenges = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Fetched ${challenges.length} active daily challenges.`);
    console.log('Challenges:', challenges);

    return res.status(200).json(challenges);
  } catch (err: any) {
    console.error("Error fetching daily challenges:", err);
    return res.status(500).json({ 
      error: "Failed to fetch daily challenges", 
      detail: err.message 
    });
  }
});

// GET /dailychallenge/:id - Fetch a specific daily challenge by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const docRef = await db.collection("dailychallenge").doc(id).get();

    if (!docRef.exists) {
      return res.status(404).json({ error: "Daily challenge not found" });
    }

    return res.status(200).json({
      id: docRef.id,
      ...docRef.data(),
    });
  } catch (err: any) {
    console.error("Error fetching daily challenge:", err);
    return res.status(500).json({ 
      error: "Failed to fetch daily challenge", 
      detail: err.message 
    });
  }
});

export default router;
