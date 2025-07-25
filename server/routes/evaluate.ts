import express from "express";
import { getDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase.js";
import { runJudges, MODELS } from "../utils/judgeLlms.js";

console.log("✅ evaluate.ts loaded");

const router = express.Router();

router.post("/", async (req, res) => {
  const { submissionId } = req.body;

  if (!submissionId) {
    return res.status(400).json({ error: "submissionId is required" });
  }

  try {
    // Fetch submission
    const submissionRef = doc(db, "submissions", submissionId);
    const submissionSnap = await getDoc(submissionRef);

    if (!submissionSnap.exists()) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const submission = submissionSnap.data();
    const { promptText, challenge_ID } = submission;

    if (!promptText || !challenge_ID) {
      return res.status(400).json({ error: "Missing promptText or challenge_ID" });
    }

    // Fetch challenge & rubric
    const challengeRef = doc(db, "challenges", challenge_ID);
    const challengeSnap = await getDoc(challengeRef);

    if (!challengeSnap.exists()) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    const challenge = challengeSnap.data();
    const rubricText = challenge.rubric;

    if (!rubricText || typeof rubricText !== "string") {
      return res.status(400).json({ error: "Invalid rubric format" });
    }

    // Run judges using rubric under 'rubric' key
    const result = await runJudges(promptText, { rubric: rubricText });
    const { scores, average } = result;

    // Build model scores object
    const modelScores: Record<string, number> = {};
    MODELS.forEach(({ model }, idx) => {
      if (typeof scores[idx] === "number") {
        modelScores[model] = scores[idx];
      }
    });

    if (typeof average === "number") {
      modelScores["average"] = average;
    }

    // Write to Firestore
    const llmScoreRef = doc(db, "submissions", submissionId, "evaluation", "llmScore");
    await setDoc(llmScoreRef, modelScores);

    await updateDoc(submissionRef, {
      finalScore: average,
      llmEvaluated: true,
      status: "evaluated"
    });

    return res.status(200).json({ message: "Evaluation complete", scores: modelScores });

  } catch (err: any) {
    console.error("🔥 Evaluation error:", err.message || err);
    return res.status(500).json({ error: "Evaluation failed", detail: err.message || err });
  }
});

export default router;