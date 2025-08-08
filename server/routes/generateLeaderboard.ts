import express from "express"
import { db } from "../config/firebase-admin.js" // Admin SDK

const router = express.Router()

router.post("/generate", async (req, res) => {
  try {
    const { competitionId } = req.body
    if (!competitionId) {
      return res.status(400).json({ error: "Missing competitionId in request body." })
    }

    // Get competitionName once
    const compSnap = await db.doc(`competitions/${competitionId}`).get()
    const competitionName =
      (compSnap.exists && ((compSnap.data().name as string) || (compSnap.data().title as string))) || "(Untitled)"

    // 1) Get all evaluated submissions for the competition
    const submissionsSnapshot = await db
      .collection(`competitions/${competitionId}/submissions`)
      .where("finalScore", "!=", null)
      .get()

    const userScores: Record<string, number> = {}
    submissionsSnapshot.forEach((docSnap) => {
      const { participantId, finalScore } = docSnap.data()
      if (participantId && typeof finalScore === "number") {
        userScores[participantId] = (userScores[participantId] || 0) + finalScore
      }
    })

    // 2) Sort by score (desc)
    const leaderboardArray = Object.entries(userScores)
      .map(([userId, totalScore]) => ({ userId, totalScore }))
      .sort((a, b) => b.totalScore - a.totalScore)

    // 3) Write leaderboard + user participations (same pass)
    const writer = db.bulkWriter()

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

      // Leaderboard doc
      writer.set(
        db.collection(`competitions/${competitionId}/leaderboard`).doc(entry.userId),
        {
          totalScore: entry.totalScore,
          rank,
          fullName,
          email,
          // keep if you want to reference the user's submission doc id pattern
          submissionRef: db.doc(`competitions/${competitionId}/submissions/${entry.userId}`),
        }
      )


      // Mirror into users/{uid}.participations[competitionId]
      writer.set(
        userRef,
        {
          participations: {
            [competitionId]: {
              competitionName,
              totalScore: entry.totalScore,
              rank,
            },
          },
        },
        { merge: true }
      )

      rank++
    }

    await writer.close()

    return res.status(200).json({
      message: "Leaderboard generated and user participations updated.",
      count: leaderboardArray.length,
    })
  } catch (err: any) {
    console.error("🔥 Leaderboard Generation Error:", err)
    return res.status(500).json({
      error: "Leaderboard generation failed",
      detail: err.message || err,
    })
  }
})

export default router
