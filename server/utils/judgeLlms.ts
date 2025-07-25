import axios from "axios";

console.log("judgeLlms utility loaded");

const MODELS = [
  { model: "meta-llama/llama-3-8b-instruct" },
  { model: "openai/gpt-3.5-turbo" },
  { model: "anthropic/claude-3-haiku" }
];

export async function runJudges(prompt: string, rubric: Record<string, string> | { rubric: string }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log("API key loaded in runJudges:", !!apiKey);

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  console.log("runJudges called with prompt length:", prompt.length);
  console.log("rubric keys:", Object.keys(rubric));

  // Convert to readable string
  const rubricStr =
    typeof rubric === "string"
      ? rubric
      : Object.entries(rubric).map(([k, v]) => `- ${k}: ${v}`).join("\n");

  // Final prompt setup
  const systemPrompt = `
You are a strict and impartial evaluator in a prompt engineering competition.

You will assess a prompt based on the rubric provided.

Instructions:
- Score the prompt on a scale of 0 to 10.
- Normalize your score, even if the rubric uses a higher scale (e.g. /100).
- Round to the nearest integer.
- Do NOT return any explanation, comments, or markdown.

Your output must ONLY be this:
{"score": <integer from 0 to 10>}
  `.trim();

  async function evaluateWithRetry(model: string): Promise<number | null> {
    const input = `
Evaluate the following prompt using the criteria below.
Normalize your final score to a 0-10 scale.

Rubric:
${rubricStr}

Prompt:
"""${prompt}"""

Return a JSON object:
{"score": <integer from 0 to 10>}
    `.trim();

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: input }
            ],
            max_tokens: 100,
            temperature: 0.1
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

        let raw = res.data.choices[0].message.content.trim();
        raw = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim();

        console.log(`Model ${model} raw response (attempt ${attempt}):`, raw);

        const parsed = JSON.parse(raw);
        const score = parsed.score;

        if (typeof score === "number" && score >= 0 && score <= 10) {
          console.log(`✅ Model ${model} scored:`, score);
          return score;
        } else {
          console.warn(`⚠️ Model ${model} returned invalid score: ${score} (attempt ${attempt})`);
        }

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

  const valid = results.filter((s): s is number => s !== null);
  const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;

  console.log(`Final result: ${valid.length} valid scores, average: ${avg}`);
  return { scores: valid, average: avg };
}

export { MODELS };
