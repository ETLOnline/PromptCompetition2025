import express from "express"
import { db } from "../config/firebase-admin.js" // Admin SDK

const router = express.Router()

router.post("/generate", async (req, res) => {
  try {
    const { competitionId } = req.body

    if (!competitionId) {
      return res.status(400).json({ error: "Missing competitionId in request body." })
    }

    // Step 1: Get all evaluated submissions for the competition
    const submissionsSnapshot = await db
      .collection(`competitions/${competitionId}/submissions`)
      .where("llmEvaluated", "==", true)
      .get()

    const userScores: Record<string, number> = {}

    submissionsSnapshot.forEach((docSnap) => {
      const { participant_ID, finalScore } = docSnap.data()
      if (participant_ID && typeof finalScore === "number") {
        userScores[participant_ID] = (userScores[participant_ID] || 0) + finalScore
      }
    })

    // Step 2: Sort by score
    const leaderboardArray = Object.entries(userScores)
      .map(([userId, totalScore]) => ({ userId, totalScore }))
      .sort((a, b) => b.totalScore - a.totalScore)

    // Step 3: Save to /competitions/{competitionId}/leaderboard
    let rank = 1
    for (const entry of leaderboardArray) {
      const userRef = db.collection("users").doc(entry.userId)
      const userSnap = await userRef.get()

      let fullName = "Unknown"
      let email = ""

      if (userSnap.exists) {
        const userData = userSnap.data() as { fullName?: string; email?: string }
        fullName = userData?.fullName || "Unknown"
        email = userData?.email || ""
      }

      await db.collection(`competitions/${competitionId}/leaderboard`).doc(entry.userId).set({
        totalScore: entry.totalScore,
        rank,
        fullName,
        email,
        submissionRef: db.doc(`competitions/${competitionId}/submissions/${entry.userId}`) // optional
      })

      rank++
    }

    return res.status(200).json({ message: "Leaderboard generated successfully." })
  } catch (err: any) {
    console.error("🔥 Leaderboard Generation Error:", err)
    return res.status(500).json({
      error: "Leaderboard generation failed",
      detail: err.message || err
    })
  }
})


export default router
