// 1. Imports
import axios from "axios";
import type { ModelEvaluationResult, EvaluationSummary, LLMScores } from "../types/llm-evaluation.js";
import { LLM_CONFIG } from "../config/llm.js";

// 2. Constants
const MODELS = LLM_CONFIG.models;

// 4. Main exported function
export async function runJudges(prompt: string, rubric: any, problemStatement?: string): Promise<EvaluationSummary> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  if (typeof prompt !== "string" || prompt.trim() === "") {
    throw new Error("Prompt must be a non-empty string");
  }
  if (typeof problemStatement !== "string" || problemStatement.trim() === "") {
    throw new Error("Problem statement must be a non-empty string");
  }

  console.log("runJudges called with prompt length:", prompt.length);
  console.log("Rubric data received (already cleaned):", JSON.stringify(rubric, null, 2));

  const rubricArray = rubric;
  const systemPrompt = createSystemPrompt(rubricArray);

  // Run models in parallel
  const results = await Promise.all(
    MODELS.map(({ model }) => evaluateWithRetry(model, prompt, systemPrompt, rubricArray, problemStatement, apiKey))
  );

  return processAllResults(results, rubricArray);
}

// 5. Private helper functions (organized by purpose)

// - Evaluation orchestration
async function evaluateWithRetry(
  model: string, 
  prompt: string, 
  systemPrompt: string, 
  rubricArray: any[], 
  problemStatement: string,
  apiKey: string
): Promise<ModelEvaluationResult | null> {
  for (let attempt = 1; attempt <= LLM_CONFIG.retryAttempts; attempt++) {
    try {
      if (attempt > 1) {
        await new Promise(res => setTimeout(res, LLM_CONFIG.retryDelay));
      }

      const response = await callLLM(model, systemPrompt, prompt, problemStatement, apiKey, rubricArray);
      const parsedResponse = parseLLMResponse(response, model, attempt);
      const evaluation = processEvaluationResults(parsedResponse, rubricArray);
      
      if (evaluation.successRate >= 0.5) {
        const finalScore = calculateFinalScore(evaluation.scores, rubricArray);
        return {
          model,
          scores: evaluation.scores,
          errors: evaluation.errors,
          warnings: evaluation.warnings,
          successRate: evaluation.successRate,
          description: parsedResponse.description || "No description provided",
          finalScore
        };
      }
      
      logEvaluationFailure(model, attempt, evaluation, parsedResponse, rubricArray);
      
    } catch (error: any) {
      console.error(`🔥 Model ${model} failed (attempt ${attempt}):`, error.message || error);
    }
  }
  
  console.error(`❌ Model ${model} failed to produce a valid score after ${LLM_CONFIG.retryAttempts} attempts`);
  return null;
}

// - Response processing
async function callLLM(
  model: string, 
  systemPrompt: string, 
  prompt: string, 
  problemStatement: string,
  apiKey: string,
  rubricArray: any[]
): Promise<any> {
  const input = `
Evaluate the following student's prompt according to the PROBLEM STATEMENT and the rubric below.
Score each criterion from 0-100 (integers only).

PROBLEM STATEMENT (authoritative brief):
${problemStatement}

Rubric:
${rubricArray.map(item => `- ${item.name} : ${item.description}`).join("\n")}

Prompt to Evaluate:
"""${prompt}"""

Return only the JSON object with scores for each criterion and a brief description.
  `.trim();

  const res = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input }
      ],
      max_tokens: LLM_CONFIG.maxTokens,
      temperature: LLM_CONFIG.temperature
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...LLM_CONFIG.headers
      }
    }
  );

  const content = res?.data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error(`Model ${model} returned empty content`);
  }

  return content;
}

function parseLLMResponse(content: string, model: string, attempt: number): any {
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

  return parsed;
}

function findScoreForCriterion(parsedResponse: any, criterionName: string): number | null {
  // Strategy 1: Exact match
  if (parsedResponse[criterionName] !== undefined) {
    return parsedResponse[criterionName];
  }
  
  // Strategy 2: Cleaned name match
  const cleanedName = criterionName.replace(/^["']+/, "").replace(/["']+$/, "").trim();
  if (parsedResponse[cleanedName] !== undefined) {
    return parsedResponse[cleanedName];
  }
  
  // Strategy 3: Case-insensitive match
  const lowerName = criterionName.toLowerCase();
  const matchingKey = Object.keys(parsedResponse).find(key => 
    key.toLowerCase() === lowerName
  );
  if (matchingKey) {
    return parsedResponse[matchingKey];
  }
  
  // Strategy 4: Partial match
  const partialMatch = Object.keys(parsedResponse).find(key => 
    key.toLowerCase().includes(lowerName) || 
    lowerName.includes(key.toLowerCase())
  );
  if (partialMatch) {
    return parsedResponse[partialMatch];
  }
  
  return null;
}

// - Validation
function validateScore(score: any, criterionName: string): { isValid: boolean; value: number; error?: string } {
  if (typeof score === "string" && /^\d+$/.test(score)) {
    score = Number(score);
  }
  
  if (typeof score === "number" && score >= 0 && score <= 100 && Number.isInteger(score)) {
    return { isValid: true, value: score };
  }
  
  const error = `Invalid score for "${criterionName}": ${score} (type: ${typeof score}, expected: integer 0-100)`;
  return { isValid: false, value: 0, error };
}

function processEvaluationResults(parsedResponse: any, rubricArray: any[]): {
  scores: Record<string, number>;
  errors: string[];
  warnings: string[];
  successRate: number;
} {
  const scores: Record<string, number> = {};
  const errors: string[] = [];
  const warnings: string[] = [];
  let validScores = 0;
  
  for (const item of rubricArray) {
    const score = findScoreForCriterion(parsedResponse, item.name);
    
    if (score !== null) {
      const validation = validateScore(score, item.name);
      if (validation.isValid) {
        scores[item.name] = validation.value;
        validScores++;
      } else {
        scores[item.name] = 0;
        errors.push(validation.error!);
      }
    } else {
      scores[item.name] = 0;
      errors.push(`Missing score for criterion: "${item.name}"`);
    }
  }
  
  const successRate = validScores / rubricArray.length;
  
  if (successRate < 0.5) {
    warnings.push(`Low evaluation success rate: ${(successRate * 100).toFixed(1)}%`);
  }
  
  return { scores, errors, warnings, successRate };
}

function calculateFinalScore(scores: Record<string, number>, rubricArray: any[]): number {
  return rubricArray.reduce((sum, item) => {
    const w = typeof item.weight === "number" && item.weight > 0 ? item.weight : 0;
    return sum + (scores[item.name] * w);
  }, 0);
}

// - Error handling & reporting
function createDetailedErrorReport(
  model: string, 
  attempt: number, 
  parsedResponse: any, 
  expectedCriteria: string[],
  errors: string[]
): string {
  const availableKeys = Object.keys(parsedResponse);
  const missingKeys = expectedCriteria.filter(criterion => 
    !availableKeys.some(key => 
      key.toLowerCase().includes(criterion.toLowerCase()) ||
      criterion.toLowerCase().includes(key.toLowerCase())
    )
  );
  
  return `
Model: ${model} (attempt ${attempt})
Available keys: ${availableKeys.join(', ')}
Expected criteria: ${expectedCriteria.join(', ')}
Missing criteria: ${missingKeys.join(', ')}
Errors: ${errors.join('; ')}
Response structure: ${JSON.stringify(parsedResponse, null, 2)}
  `.trim();
}

function logEvaluationFailure(
  model: string, 
  attempt: number, 
  evaluation: any, 
  parsedResponse: any, 
  rubricArray: any[]
): void {
  const expectedCriteria = rubricArray.map(r => r.name);
  const errorReport = createDetailedErrorReport(model, attempt, parsedResponse, expectedCriteria, evaluation.errors);
  console.warn(`⚠️ Model ${model} evaluation failed (attempt ${attempt}):\n${errorReport}`);
}

function processAllResults(results: (ModelEvaluationResult | null)[], rubricArray: any[]): EvaluationSummary {
  const valid = results.filter((s): s is ModelEvaluationResult => s !== null);
  const scores: LLMScores = {};

  MODELS.forEach(({ model }, idx) => {
    const result = results[idx];
    if (result !== null) {
      // Convert to the expected database structure
      scores[model] = {
        description: result.description,
        finalScore: result.finalScore,
        scores: result.scores
      };
    }
  });

  const finalScores = valid.map(result => result.finalScore);
  const avg = finalScores.length ? finalScores.reduce((a, b) => a + b, 0) / finalScores.length : null;

  console.log(`Final result: ${valid.length} valid scores, average: ${avg}`);
  return { scores, average: avg, totalValid: valid.length };
}

function createSystemPrompt(rubricArray: any[]): string {
  const escapedJsonSchema = rubricArray
    .map(r => `"${r.name.replace(/"/g, '\\"')}": <integer 0-100>`)
    .join(", ");

  return `
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
}

// 6. Exports
export { MODELS };