// 1. Imports
import axios from "axios";
import type { ModelEvaluationResult, EvaluationResult } from "../types/llm-evaluation.js";
import { LLM_CONFIG } from "../config/llm.js";

// 2. Constants
const MODELS = LLM_CONFIG.models;

// 4. Main exported function
export async function runJudges(prompt: string, rubric: any, problemStatement?: string): Promise<EvaluationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  console.log(`🔄 Starting evaluation for prompt (${prompt.length} chars)`);

  const rubricArray = rubric;
  const systemPrompt = createSystemPrompt(rubricArray);

  // Run all models in parallel with individual configurations
  const results = await Promise.all(
    MODELS.map(({ model, maxTokens, temperature }) => 
      evaluateWithRetry(model, prompt, systemPrompt, rubricArray, problemStatement, apiKey, maxTokens, temperature)
    )
  );

  return processAllResults(results);
}

// 5. Private helper functions (organized by purpose)

// - Evaluation orchestration
async function evaluateWithRetry(
  model: string, 
  prompt: string, 
  systemPrompt: string, 
  rubricArray: any[], 
  problemStatement: string,
  apiKey: string,
  maxTokens: number,
  temperature: number
): Promise<ModelEvaluationResult | null> {
  
  for (let attempt = 1; attempt <= LLM_CONFIG.retryAttempts; attempt++) {
    try {
      if (attempt > 1) {
        await new Promise(res => setTimeout(res, LLM_CONFIG.retryDelay));
      }

      const response = await callLLM(model, systemPrompt, prompt, problemStatement, apiKey, rubricArray, maxTokens, temperature);
      
      const parsedResponse = parseLLMResponse(response);
      
      const evaluation = processEvaluationResults(parsedResponse, rubricArray);
      
      if (evaluation.isValid) {
        const finalScore = calculateFinalScore(evaluation.scores, rubricArray);
        return {
          model,
          scores: evaluation.scores,
          description: parsedResponse.description || "No description provided",
          finalScore
        };
      }
      
      if (attempt === LLM_CONFIG.retryAttempts) {
        logEvaluationFailure(model, parsedResponse, rubricArray);
      }
      
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 400) {
          throw new Error(`Bad request for ${model}: ${error.response.data?.error?.message || 'Invalid request format'}`);
        } else if (error.response.status === 401) {
          throw new Error(`Authentication failed for ${model}: Check your API key`);
        } else if (error.response.status === 429) {
          throw new Error(`Rate limit exceeded for ${model}: Try again later`);
        } else if (error.response.status === 500) {
          throw new Error(`Server error for ${model}: ${error.response.data?.error || 'Internal server error'}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error(`Request timeout for ${model}: ${LLM_CONFIG.requestTimeout}ms exceeded`);
      }
    }
  }
  
  return null;
}

// - Response processing
async function callLLM(
  model: string, 
  systemPrompt: string, 
  prompt: string, 
  problemStatement: string,
  apiKey: string,
  rubricArray: any[],
  maxTokens: number,
  temperature: number
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

  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input }
        ],
        max_tokens: maxTokens,
        temperature: temperature
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...LLM_CONFIG.headers
        },
        timeout: LLM_CONFIG.requestTimeout
      }
    );

    const content = res?.data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      throw new Error(`Model ${model} returned empty content`);
    }

    return content;
    
  } catch (error: any) {
    throw error;
  }
}

function parseLLMResponse(content: string): any {
  let raw = content.trim();
  raw = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

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
function validateScore(score: any): { isValid: boolean; value: number } {
  if (typeof score === "string" && /^\d+$/.test(score)) {
    score = Number(score);
  }
  
  if (typeof score === "number" && score >= 0 && score <= 100 && Number.isInteger(score)) {
    return { isValid: true, value: score };
  }
  
  return { isValid: false, value: 0 };
}

function processEvaluationResults(parsedResponse: any, rubricArray: any[]): {
  scores: Record<string, number>;
  isValid: boolean;
} {
  const scores: Record<string, number> = {};
  let validScores = 0;
  
  for (const item of rubricArray) {
    const score = findScoreForCriterion(parsedResponse, item.name);
    
    if (score !== null) {
      const validation = validateScore(score);
      if (validation.isValid) {
        scores[item.name] = validation.value;
        validScores++;
      } else {
        scores[item.name] = 0;  // Mark as 0 for invalid scores
      }
    } else {
      scores[item.name] = 0;  // Mark as 0 for missing scores
    }
  }
  
  // Simple validation: need at least 50% valid scores
  const isValid = validScores >= rubricArray.length * 0.5;
  
  return { scores, isValid };
}

function calculateFinalScore(scores: Record<string, number>, rubricArray: any[]): number {
  return rubricArray.reduce((sum, item) => {
    const w = typeof item.weight === "number" && item.weight > 0 ? item.weight : 0;
    return sum + (scores[item.name] * w);
  }, 0);
}

// - Error handling & reporting
function logEvaluationFailure(
  model: string, 
  parsedResponse: any, 
  rubricArray: any[]
): void {
  const expectedCriteria = rubricArray.map(r => r.name);
  const missingCriteria = expectedCriteria.filter(criterion => 
    !Object.keys(parsedResponse).some(key => 
      key.toLowerCase().includes(criterion.toLowerCase()) ||
      criterion.toLowerCase().includes(key.toLowerCase())
    )
  );
  
  console.warn(`⚠️ ${model} evaluation failed: ${missingCriteria.length} missing criteria`);
}

function processAllResults(results: (ModelEvaluationResult | null)[]): EvaluationResult {
  
  const valid = results.filter((s): s is ModelEvaluationResult => s !== null);
  
  const scores: Record<string, { description: string; finalScore: number; scores: Record<string, number> }> = {};

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

  return { scores, average: avg };
}

function createSystemPrompt(rubricArray: any[]): string {
  const escapedJsonSchema = rubricArray
    .map(r => `"${r.name.replace(/"/g, '\\"')}": <integer 0-100>`)
    .join(", ");

  return `
<role>
You are a meticulous and impartial AI judge for a prompt engineering competition.
Your task is to provide a quantitative analysis of a student's submission based on a given problem statement and rubric.
Your evaluation must be objective, consistent, and strictly adhere to the provided guidelines.
</role>

<evaluation_process>
1.  **Analyze the Problem Statement**: This is the ground truth. Understand its core requirements, constraints, and objectives.
2.  **Deconstruct the Rubric**: For each criterion, understand its definition and what constitutes a high-quality submission for that specific dimension.
3.  **Evaluate the Submission**: Critically assess the student's prompt (the "answer"). For each rubric criterion, systematically compare the submission against the problem statement.
4.  **Assign a Score**: For each criterion, assign an integer score from 0-100 based *only* on how well the submission meets the requirements. Use the scoring guide below.
</evaluation_process>

<scoring_guide>
- **81-100 (Excellent)**: The submission flawlessly and creatively meets or exceeds all aspects of the criterion.
- **61-80 (Good)**: The submission effectively meets the criterion with only minor room for improvement.
- **41-60 (Average)**: The submission addresses the criterion but has notable flaws or omissions.
- **21-40 (Poor)**: The submission attempts to address the criterion but fails in significant ways.
- **0-20 (Failing)**: The submission completely fails to address the criterion or is irrelevant.
</scoring_guide>

<critical_instructions>
- **Be Objective**: Do not let personal biases or the submission's writing style influence your scores. A short, effective prompt is better than a long, verbose one.
- **Adhere to the Rubric**: Your scores must directly reflect the rubric. Do not invent new criteria or ignore existing ones.
- **No Partiality**: Score each submission independently. Do not compare it to other submissions you might have seen.
- **Integer Scores Only**: You must provide a whole number between 0 and 100.
</critical_instructions>

<output_format>
Your final output MUST be a single, valid JSON object and nothing else.
Do not include any text, explanations, or markdown formatting before or after the JSON.

The JSON structure is:
{
  ${escapedJsonSchema},
  "description": "<A 1-2 sentence, neutral justification for your scores, summarizing the submission's strengths and weaknesses.>"
}
</output_format>
`.trim();
}
