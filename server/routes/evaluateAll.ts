import express from "express"
import { db } from "../config/firebase-admin.js"
import { runJudges, MODELS } from "../utils/judgeLlms.js"

const router = express.Router()

router.post("/start-evaluation", async (req, res) => {
  try {
    const { competitionId } = req.body

    if (!competitionId) {
      return res.status(400).json({ error: "Missing competitionId in request body." })
    }

    // Step 1: Fetch all submissions whose finalScore is still null
    const submissionsSnapshot = await db
      .collection(`competitions/${competitionId}/submissions`)
      .where("finalScore", "==", null)
      .get()

    if (submissionsSnapshot.empty) {
      return res.status(200).json({ message: "No unevaluated submissions found." })
    }

    const submissions = submissionsSnapshot.docs

    // Step 2: Load rubrics for each challenge
    const rubricSnapshot = await db
      .collection(`competitions/${competitionId}/challenges`)
      .get()
    const rubricMap: Record<string, string> = {}
    rubricSnapshot.forEach((doc) => {
      const rubric = doc.data()?.rubric
      if (typeof rubric === "string") {
        rubricMap[doc.id] = rubric
      }
    })

    // Step 3: Evaluate each submission
    for (const docSnap of submissions) {
      const submission = docSnap.data()
      const { promptText, challengeId } = submission

      if (!promptText || !challengeId) continue

      const rubricText = rubricMap[challengeId]
      if (!rubricText) continue

      try {
        const result = await runJudges(promptText, { rubric: rubricText })
        const { scores, average } = result

        if (!Array.isArray(scores) || scores.length === 0) continue

        const modelScores: Record<string, number> = {}
        MODELS.forEach(({ model }, idx) => {
          const score = scores[idx]
          if (typeof score === "number" && score >= 0 && score <= 10) {
            modelScores[model] = score
          }
        })
        if (typeof average === "number") {
          modelScores.average = average
        }

        // Step 4: Update submission doc with llmScores map
        await db
          .collection(`competitions/${competitionId}/submissions`)
          .doc(docSnap.id)
          .update({
            llmScores: modelScores,
            finalScore: average ?? null,
            status: "evaluated",
          })
      } catch {
        // handle errors if needed
      }
    }

    return res.status(200).json({ message: "✅ Evaluation completed for all applicable submissions." })
  } catch (err: unknown) {
    return res.status(500).json({
      error: "❌ Bulk Evaluation Failed",
      detail: err instanceof Error ? err.message : String(err)
    })
  }
})

export default router
