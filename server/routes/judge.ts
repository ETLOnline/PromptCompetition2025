import express from "express";
import { runJudges } from "../utils/judgeLlms.js";

console.log("Judge route file loaded");

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("Judge endpoint hit with:", { prompt: req.body.prompt?.substring(0, 50) + "...", rubric: Object.keys(req.body.rubric || {}) });
  
  const { prompt, rubric } = req.body;

  if (!prompt || !rubric) {
    return res.status(400).json({ error: "Prompt and rubric are required." });
  }

  try {
    console.log("Calling runJudges...");
    const result = await runJudges(prompt, rubric);
    console.log("runJudges result:", result);
    res.json(result);
  } catch (err) {
    console.error("Judging error:", err);
    res.status(500).json({ error: "Failed to score prompt." });
  }
});

export default router;