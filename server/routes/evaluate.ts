import express from "express"
import { db } from "../config/firebase-admin.js" // Admin SDK
import { runJudges, MODELS } from "../utils/judgeLlms.js"

console.log("✅ evaluate.ts loaded")

const router = express.Router()

router.post("/", async (req, res) => {
  const { submissionId } = req.body

  if (!submissionId) {
    return res.status(400).json({ error: "submissionId is required" })
  }

  try {
    // Fetch submission
    const submissionRef = db.collection("submissions").doc(submissionId)
    const submissionSnap = await submissionRef.get()

    if (!submissionSnap.exists) {
      return res.status(404).json({ error: "Submission not found" })
    }

    const submission = submissionSnap.data() as {
      promptText?: string
      challenge_ID?: string
    }

    const promptText = submission?.promptText
    const challenge_ID = submission?.challenge_ID

    if (!promptText || !challenge_ID) {
      return res.status(400).json({ error: "Missing promptText or challenge_ID" })
    }

    // Fetch challenge rubric
    const challengeRef = db.collection("challenges").doc(challenge_ID)
    const challengeSnap = await challengeRef.get()

    if (!challengeSnap.exists) {
      return res.status(404).json({ error: "Challenge not found" })
    }

    const challenge = challengeSnap.data() as { rubric?: string }
    const rubricText = challenge?.rubric

    if (!rubricText || typeof rubricText !== "string") {
      return res.status(400).json({ error: "Invalid rubric format" })
    }

    // Run judges
    const result = await runJudges(promptText, { rubric: rubricText })
    const { scores, average } = result

    // Build model scores object
    const modelScores: Record<string, number> = {}
    MODELS.forEach(({ model }, idx) => {
      const score = scores[idx]
      if (typeof score === "number") {
        modelScores[model] = score
      }
    })

    if (typeof average === "number") {
      modelScores["average"] = average
    }

    // Write evaluation scores to submission doc as a map
    await submissionRef.update({
      llmScores: modelScores,
      finalScore: average ?? null,
      status: "evaluated",
    })

    return res.status(200).json({
      message: "Evaluation complete",
      scores: modelScores,
    })
  } catch (err: any) {
    console.error("🔥 Evaluation error:", err.message || err)
    return res.status(500).json({
      error: "Evaluation failed",
      detail: err.message || err,
    })
  }
})

export default router
