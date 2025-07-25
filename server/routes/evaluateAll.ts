import express from "express";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "../config/firebase.js";
import { runJudges, MODELS } from "../utils/judgeLlms.js";

const router = express.Router();

router.post("/start-evaluation", async (req, res) => {
  try {
    // Step 1: Fetch all unevaluated submissions
    const submissionsQuery = query(
      collection(db, "submissions"),
      where("llmEvaluated", "==", false)
    );
    const snapshot = await getDocs(submissionsQuery);

    if (snapshot.empty) {
      return res.status(200).json({ message: "No unevaluated submissions found." });
    }

    const submissions = snapshot.docs;

    // Step 2: Load all rubrics once
    const rubricMap: Record<string, string> = {};
    const rubricSnapshot = await getDocs(collection(db, "challenges"));
    rubricSnapshot.forEach(doc => {
      const rubric = doc.data()?.rubric;
      if (typeof rubric === "string") {
        rubricMap[doc.id] = rubric;
      }
    });

    // Step 3: Evaluate each submission
    for (const docSnap of submissions) {
      const submission = docSnap.data();
      const { promptText, challenge_ID } = submission;

      if (!promptText || !challenge_ID) {
        console.warn(`⏭️ Skipping submission ${docSnap.id}: Missing promptText or challenge_ID.`);
        continue;
      }

      const rubricText = rubricMap[challenge_ID];
      if (!rubricText) {
        console.warn(`⏭️ Skipping submission ${docSnap.id}: No rubric found for challenge ${challenge_ID}`);
        continue;
      }

      try {
        const result = await runJudges(promptText, { rubric: rubricText });
        const { scores, average } = result;

        if (!Array.isArray(scores) || scores.length === 0) {
          console.warn(`⚠️ No valid scores returned for submission ${docSnap.id}`);
          continue;
        }

        const modelScores: Record<string, number> = {};
        MODELS.forEach(({ model }, idx) => {
          const score = scores[idx];
          if (typeof score === "number" && score >= 1 && score <= 10) {
            modelScores[model] = score;
          }
        });

        if (typeof average === "number") {
          modelScores["average"] = average;
        } else {
          console.warn(`⚠️ No average computed for submission ${docSnap.id}`);
        }

        // Step 4: Write scores to Firestore
        await setDoc(doc(db, "submissions", docSnap.id, "evaluation", "llmScore"), modelScores);
        await updateDoc(doc(db, "submissions", docSnap.id), {
          llmEvaluated: true,
          finalScore: average ?? null,
          status: "evaluated"
        });

        console.log(`✅ Evaluated submission ${docSnap.id}`);
      } catch (innerErr: unknown) {
        const msg = innerErr instanceof Error ? innerErr.message : String(innerErr);
        console.error(`❌ Error evaluating submission ${docSnap.id}:`, msg);
        // Optional: mark as failed or skipped if needed
      }
    }

    return res.status(200).json({ message: "✅ Evaluation completed for all applicable submissions." });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("🔥 Bulk Evaluation Error:", errorMessage);
    return res.status(500).json({
      error: "❌ Bulk Evaluation Failed",
      detail: errorMessage
    });
  }
});

export default router;
