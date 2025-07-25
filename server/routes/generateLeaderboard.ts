// routes/leaderboard.ts
import express from "express";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../config/firebase.js";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    // Step 1: Get all evaluated submissions
    const submissionsQuery = query(
      collection(db, "submissions"),
      where("llmEvaluated", "==", true)
    );
    const submissionsSnapshot = await getDocs(submissionsQuery);

    const userScores: Record<string, number> = {}; // userId -> totalScore

    submissionsSnapshot.forEach((docSnap) => {
      const { participant_ID, finalScore } = docSnap.data();
      if (participant_ID && typeof finalScore === "number") {
        userScores[participant_ID] = (userScores[participant_ID] || 0) + finalScore;
      }
    });

    // Step 2: Convert to array and sort by score descending
    const leaderboardArray = Object.entries(userScores)
      .map(([userId, totalScore]) => ({ userId, totalScore }))
      .sort((a, b) => b.totalScore - a.totalScore);

    // Step 3: Store in leaderboard collection with rank
    let rank = 1;
    for (const entry of leaderboardArray) {
      const userRef = doc(db, "users", entry.userId);
      const userSnap = await getDoc(userRef);

      const fullName = userSnap.exists() ? userSnap.data().fullName || "Unknown" : "Unknown";
      const email = userSnap.exists() ? userSnap.data().email || "" : "";

      await setDoc(doc(db, "leaderboard", entry.userId), {
        totalScore: entry.totalScore,
        rank,
        fullName,
        email,
      });
      rank++;
    }

    return res.status(200).json({ message: "Leaderboard generated successfully." });
  } catch (err: any) {
    console.error("🔥 Leaderboard Generation Error:", err);
    return res.status(500).json({ error: "Leaderboard generation failed", detail: err.message || err });
  }
});

export default router;
