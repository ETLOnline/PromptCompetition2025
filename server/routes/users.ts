import express, { Request, Response } from "express";
import { db } from "../config/firebase-admin.js";
import { authenticateToken, AuthenticatedRequest } from "../utils/auth.js";

const router = express.Router();

/**
 * GET /users/:userId
 * Fetch a single user profile by ID
 */
router.get("/:userId", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch user from Firestore "users" collection
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: "User not found",
        id: userId,
        fullName: "Unknown User",
        email: "Not available"
      });
    }

    const userData = userDoc.data();

    // Return user profile with expected fields
    res.json({
      id: userId,
      fullName: userData?.fullName || "Unknown User",
      email: userData?.email || "Not available",
      photoURL: userData?.photoURL || null,
      // Include any additional fields that might be useful
      createdAt: userData?.createdAt || null,
      updatedAt: userData?.updatedAt || null,
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ 
      error: "Failed to fetch user",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /users/batch
 * Fetch multiple users by their IDs in a single request
 * Body: { userIds: string[] }
 * Response: { [userId]: UserProfile }
 */
router.post("/batch", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "userIds array is required" });
    }

    // Firestore has a limit of 10 items per 'in' query, so we need to batch
    const batchSize = 10;
    const result: Record<string, any> = {};

    // Process in batches
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      // Fetch users in this batch
      const userDocs = await Promise.all(
        batch.map(userId => db.collection("users").doc(userId).get())
      );

      // Map results
      userDocs.forEach((doc, index) => {
        const userId = batch[index];
        
        if (doc.exists) {
          const userData = doc.data();
          result[userId] = {
            id: userId,
            fullName: userData?.fullName || "Unknown User",
            email: userData?.email || "Not available",
            photoURL: userData?.photoURL || null,
            createdAt: userData?.createdAt || null,
            updatedAt: userData?.updatedAt || null,
          };
        } else {
          // Return placeholder for missing users
          result[userId] = {
            id: userId,
            fullName: "Unknown User",
            email: "Not available",
            photoURL: null,
          };
        }
      });
    }

    res.json(result);

  } catch (error) {
    console.error("Error fetching users batch:", error);
    res.status(500).json({ 
      error: "Failed to fetch users",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
