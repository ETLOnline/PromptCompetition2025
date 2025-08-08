import axios from "axios";
console.log("judgeLlms utility loaded");

const MODELS = [
  { model: "meta-llama/llama-3-8b-instruct" },
  { model: "openai/gpt-3.5-turbo" },
  { model: "anthropic/claude-3-haiku" }
];

// Helper to escape rubric names for JSON safety
function escapeJsonKey(key: string): string {
  return key
    .replace(/\\/g, "\\\\")  // backslashes
    .replace(/"/g, '\\"')    // quotes
    .replace(/\r/g, "\\r")   // carriage returns
    .replace(/\n/g, "\\n")   // newlines
    .replace(/\t/g, "\\t");  // tabs
}

export async function runJudges(prompt: string, rubric: any, problemStatement?: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log("API key loaded in runJudges:", !!apiKey);
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  // Input validation
  if (typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt must be a non-empty string");
  }
  if (typeof problemStatement !== "string" || problemStatement.trim() === "") {
    throw new Error("Problem statement must be a non-empty string");
  }

  console.log("runJudges called with prompt length:", prompt.length);
  console.log("rubric criteria:", rubric.map(r => r.name));

  // Ensure rubric array is valid
  const rubricArray = rubric;

  // Create rubric description for LLM (plain text)
  const rubricDescription = rubricArray
    .map(item => `- ${item.name} : ${item.description}`)
    .join("\n");

  // Create escaped JSON schema for the prompt example
  const escapedJsonSchema = rubricArray
    .map(r => `"${escapeJsonKey(r.name)}": <integer 0-100>`)
    .join(", ");

  // Final prompt setup
  const systemPrompt = `
You are an experienced teacher grading a student's prompt-engineering assignment.
The PROBLEM STATEMENT is the authoritative brief. Evaluate the student's PROMPT strictly
for how well it fulfills the PROBLEM STATEMENT and each criterion in the rubric.

Instructions:
- Score each criterion on a scale of 0 to 100 (integers only).
- Do NOT average or combine scores yourself; the system will calculate any overall score later.
- Use the rubric criterion names EXACTLY as they appear (case-sensitive).
- Provide a brief justification (1-3 sentences) explaining your overall assessment.
- Do NOT include any keys other than the rubric criterion names and "description".
- Your response must be valid JSON with NO markdown formatting.
- Do NOT include any explanation outside the JSON.

Your output must ONLY be this JSON format:
{
  ${escapedJsonSchema},
  "description": "<brief justification string>"
}
`.trim();

  async function evaluateWithRetry(model: string): Promise<any | null> {
    const input = `
Evaluate the following student's prompt according to the PROBLEM STATEMENT and the rubric below.
Score each criterion from 0-100 (integers only).

PROBLEM STATEMENT (authoritative brief):
${problemStatement}

Rubric:
${rubricDescription}

Prompt to Evaluate:
"""${prompt}"""

Return only the JSON object with scores for each criterion and a brief description.
    `.trim();

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        if (attempt === 2) {
          // Backoff before retry
          await new Promise(res => setTimeout(res, 500));
        }

        const res = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: input }
            ],
            max_tokens: 300,
            temperature: 0.0
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://your-site.com",
              "X-Title": "Prompt Engineering Competition"
            }
          }
        );

        const content = res?.data?.choices?.[0]?.message?.content;
        if (typeof content !== "string" || content.trim() === "") {
          throw new Error(`Model ${model} returned empty content`);
        }

        let raw = content.trim();
        raw = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
        console.log(`Model ${model} raw response (attempt ${attempt}):`, raw);

        let parsed: any;
        try {
          parsed = JSON.parse(raw);
        } catch {
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            throw new Error("No valid JSON found in model output");
          }
        }

        // Validate that all rubric criteria are present with valid scores
        const scores: Record<string, number> = {};
        let isValid = true;

        for (const item of rubricArray) {
          let score = parsed[item.name];
          if (typeof score === "string" && /^\d+$/.test(score)) {
            score = Number(score);
          }
          if (typeof score === "number" && score >= 0 && score <= 100 && Number.isInteger(score)) {
            scores[item.name] = score;
          } else {
            console.warn(`⚠️ Model ${model} returned invalid score for ${item.name}: ${score} (attempt ${attempt})`);
            isValid = false;
            break;
          }
        }

        if (!isValid || typeof parsed.description !== "string" || parsed.description.trim() === "") {
          console.warn(`⚠️ Model ${model} returned invalid format (attempt ${attempt})`);
          continue;
        }

        // Calculate weighted final score safely
        const finalScore = rubricArray.reduce((sum, item) => {
          const w = typeof item.weight === "number" && item.weight > 0 ? item.weight : 0;
          return sum + (scores[item.name] * w);
        }, 0);

        const modelScore = {
          scores,
          finalScore: Math.round(finalScore * 100) / 100,
          description: parsed.description.trim()
        };

        console.log(`✅ Model ${model} scored:`, finalScore.toFixed(2));
        return modelScore;

      } catch (err: any) {
        console.error(`🔥 Model ${model} failed (attempt ${attempt}):`, err.message || err);
      }
    }

    console.error(`❌ Model ${model} failed to produce a valid score after 2 attempts`);
    return null;
  }

  // Run models in parallel
  const results = await Promise.all(
    MODELS.map(({ model }) => evaluateWithRetry(model))
  );

  const valid = results.filter((s): s is any => s !== null);
  const scores: Record<string, any> = {};

  MODELS.forEach(({ model }, idx) => {
    const result = results[idx];
    if (result !== null) {
      scores[model] = result;
    }
  });

  const finalScores = valid.map(result => result.finalScore);
  const avg = finalScores.length ? finalScores.reduce((a, b) => a + b, 0) / finalScores.length : null;

  console.log(`Final result: ${valid.length} valid scores, average: ${avg}`);
  return { scores, average: avg };
}

export { MODELS };
