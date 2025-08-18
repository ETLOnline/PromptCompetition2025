import express from "express"
import { db } from "../config/firebase-admin.js"
import { runJudges, MODELS } from "../utils/judgeLlms.js"
import { cleanRubricData } from "../utils/sanitise.js";

const router = express.Router()

type RubricItem = { name: string; description: string; weight: number }
type ChallengeConfig = { rubric: RubricItem[]; problemStatement?: string | null }

router.post("/start-evaluation", async (req, res) => {
  try {
    const { competitionId } = req.body
    if (!competitionId) {
      return res.status(400).json({ error: "Missing competitionId in request body." })
    }

    // 1) Fetch submissions that still need a final score
    const submissionsSnapshot = await db
      .collection(`competitions/${competitionId}/submissions`)
      .where("finalScore", "==", null)
      .get()

    if (submissionsSnapshot.empty) {
      return res.status(200).json({ message: "No unevaluated submissions found." })
    }
    const submissions = submissionsSnapshot.docs

    // 2) Load rubric **and** problemStatement for each challenge
    const challengesSnapshot = await db
      .collection(`competitions/${competitionId}/challenges`)
      .get()

    const challengeConfigMap: Record<string, ChallengeConfig> = {}

    challengesSnapshot.forEach((doc) => {
      const data = doc.data()
      const rubric = data?.rubric
      const problemStatement = typeof data?.problemStatement === "string" ? data.problemStatement : null

      if (Array.isArray(rubric)) {
        console.log(`Processing rubric for challenge ${doc.id}:`, JSON.stringify(rubric, null, 2));
        
        const cleanedRubric = cleanRubricData(rubric);
        
        if (cleanedRubric) {
          console.log(`Cleaned rubric for challenge ${doc.id}:`, JSON.stringify(cleanedRubric, null, 2));
          
          challengeConfigMap[doc.id] = {
            rubric: cleanedRubric,
            problemStatement
          };
          console.log(
            `Valid rubric loaded for challenge ${doc.id} with ${cleanedRubric.length} criteria` +
              (problemStatement ? " and problemStatement" : " (no problemStatement)")
          );
        } else {
          console.warn(`⚠️ Challenge ${doc.id} has invalid rubric after cleaning`);
        }
      } else {
        console.warn(`⚠️ Challenge ${doc.id} has invalid rubric format - only array-based weighted rubrics are supported`);
      }
    })

    console.log(`Loaded configs for ${Object.keys(challengeConfigMap).length} challenges`)

    // 3) Evaluate each submission
    let evaluatedCount = 0
    let skippedCount = 0

    for (const docSnap of submissions) {
      const submission = docSnap.data()
      const { promptText, challengeId } = submission

      if (!promptText || !challengeId) {
        console.warn(`⚠️ Skipping submission ${docSnap.id}: missing promptText or challengeId`)
        skippedCount++
        continue
      }

      const cfg = challengeConfigMap[challengeId]
      if (!cfg || !Array.isArray(cfg.rubric) || cfg.rubric.length === 0) {
        console.warn(`⚠️ Skipping submission ${docSnap.id}: no valid weighted rubric for challenge ${challengeId}`)
        skippedCount++
        continue
      }

      const rubricData = cfg.rubric
      const problemStatement = cfg.problemStatement ?? undefined
      if (!problemStatement) {
        console.warn(`ℹ️ Submission ${docSnap.id}: challenge ${challengeId} has no problemStatement; proceeding without it`)
      }

      try {
        console.log(`🔄 Evaluating submission ${docSnap.id} for challenge ${challengeId}`)

        // ➜ Pass problemStatement to the judge LLM
        const result = await runJudges(promptText, rubricData, problemStatement)
        const { scores, average } = result || {}

        if (!scores || Object.keys(scores).length === 0) {
          console.warn(`⚠️ No valid scores returned for submission ${docSnap.id}`)
          skippedCount++
          continue
        }

        const updateData: any = {
          llmScores: scores,
          status: "evaluated"
        }
        if (typeof average === "number") {
          updateData.finalScore = average
        }

        await db
          .collection(`competitions/${competitionId}/submissions`)
          .doc(docSnap.id)
          .update(updateData)

        evaluatedCount++
        console.log(`✅ Successfully evaluated submission ${docSnap.id} with average score: ${average}`)

        // small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`❌ Failed to evaluate submission ${docSnap.id}:`, error)
        skippedCount++

        try {
          await db
            .collection(`competitions/${competitionId}/submissions`)
            .doc(docSnap.id)
            .update({
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown evaluation error"
            })
        } catch (updateError) {
          console.error(`Failed to update error status for submission ${docSnap.id}:`, updateError)
        }
      }
    }

    return res.status(200).json({
      message: `✅ Evaluation completed`,
      summary: {
        total: submissions.length,
        evaluated: evaluatedCount,
        skipped: skippedCount,
        rubricChallenges: Object.keys(challengeConfigMap).length
      }
    })
  } catch (err: unknown) {
    console.error("❌ Bulk evaluation error:", err)
    return res.status(500).json({
      error: "❌ Bulk Evaluation Failed",
      detail: err instanceof Error ? err.message : String(err)
    })
  }
})

export default router