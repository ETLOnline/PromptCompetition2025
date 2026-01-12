// 1. Imports
import axios from "axios";
import type { ModelEvaluationResult, EvaluationResult } from "../types/llm-evaluation.js";
import { LLM_CONFIG } from "../config/llm.js";

// 2. Constants
const MODELS = LLM_CONFIG.models;

// 4. Main exported function
export async function runJudges(prompt: string, 
  rubric: any, problemStatement?: string,
  competitionSystemPrompt?: string, challengeSystemPrompt?: string, guidelines?: string): Promise<EvaluationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  console.log(`🔄 Starting evaluation for prompt (${prompt.length} chars)`);

  const rubricArray = rubric;
  const DEFAULT_SYSTEM_PROMPT = createSystemPrompt(rubricArray)
  let systemPrompt = competitionSystemPrompt ?? DEFAULT_SYSTEM_PROMPT;

  
  // Log system prompt for verification
  console.log(`📝 System Prompt (${systemPrompt.length} chars): ${systemPrompt.substring(0, 100)}${systemPrompt.length > 100 ? '...' : ''}`);

  // Run all models in parallel with individual configurations
  const results = await Promise.all(
    MODELS.map(({ model, maxTokens, temperature }) => 
      evaluateWithRetry(model, prompt, systemPrompt, rubricArray, problemStatement, guidelines, challengeSystemPrompt, apiKey, maxTokens, temperature)
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
  guidelines: string,
  challengeSystemPrompt: string,
  apiKey: string,
  maxTokens: number,
  temperature: number
): Promise<ModelEvaluationResult | null> {

  let lastRawResponse: string | null = null;
  let lastParsed: any | null = null;

  for (let attempt = 1; attempt <= LLM_CONFIG.retryAttempts; attempt++) {
    try {
      if (attempt > 1) {
        await new Promise(res => setTimeout(res, LLM_CONFIG.retryDelay));
      }

      const rawResponse = await callLLM(
        model,
        systemPrompt,
        prompt,
        problemStatement,
        guidelines,
        challengeSystemPrompt,
        apiKey,
        rubricArray,
        maxTokens,
        temperature
      );
      lastRawResponse = rawResponse;

      try {
        lastParsed = parseLLMResponse(rawResponse);
      } catch (parseErr) {
        console.warn(`⚠️ ${model} parse error (attempt ${attempt}): ${String(parseErr)}`);
        continue; // let retries handle it
      }

      if (lastParsed) {
        const evaluation = processEvaluationResults(lastParsed, rubricArray);
        if (evaluation.isValid) {
          const finalScore = calculateFinalScore(evaluation.scores, rubricArray);
          return {
            model,
            scores: evaluation.scores,
            description: lastParsed.description || "No description provided",
            finalScore
          };
        } else {
          console.warn(`⚠️ ${model} returned invalid evaluation (attempt ${attempt})`);
        }
      }

    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        if (status === 400) {
          throw new Error(`Bad request for ${model}: ${error.response.data?.error?.message || 'Invalid request format'}`);
        } else if (status === 401) {
          throw new Error(`Authentication failed for ${model}: Check your API key`);
        } else if (status === 429 || status === 500) {
          console.warn(`⚠️ ${model} retriable error ${status} (attempt ${attempt}): retrying...`);
          continue;
        }
      } else if (error.code === 'ECONNABORTED') {
        console.warn(`⚠️ ${model} request timeout (attempt ${attempt}): retrying...`);
        continue;
      } else {
        console.error(`❌ Unexpected error for ${model}:`, error?.message ?? error);
      }
    }
  }

  // --- If we got here, retries are exhausted ---
  console.warn(`⚠️ ${model} failed after ${LLM_CONFIG.retryAttempts} attempts.`);

  if (lastRawResponse && lastRawResponse.trim()) {
    try {
      console.warn(`🔧 Attempting repair for ${model}.......`);
      const repaired = await attemptRepair(lastRawResponse, rubricArray, /*attempts=*/2);

      if (repaired) {
        const repairedEval = processEvaluationResults(repaired, rubricArray);
        if (repairedEval.isValid) {
          const finalScore = calculateFinalScore(repairedEval.scores, rubricArray);
          return {
            model,
            scores: repairedEval.scores,
            description: repaired.description || "No description provided",
            finalScore
          };
        }
      }
      console.warn(`⚠️ Repair for ${model} failed or returned invalid output`);
    } catch (repairErr: any) {
      console.error(`❌ Repair step crashed for ${model}:`, repairErr?.message ?? repairErr);
    }
  } else {
    console.warn(`⚠️ Skipping repair for ${model}: no usable raw response`);
  }

  try {
    logEvaluationFailure(model, lastParsed ?? {}, rubricArray);
  } catch (logErr) {
    console.warn(`⚠️ logEvaluationFailure error:`, logErr);
  }

  return null;
}


// - Response processing
async function callLLM(
  model: string, 
  systemPrompt: string, 
  prompt: string, 
  problemStatement: string,
  guidelines: string,
  challengeSystemPrompt: string,
  apiKey: string,
  rubricArray: any[],
  maxTokens: number,
  temperature: number
): Promise<any> {

  const escapedJsonSchema = rubricArray
    .map(r => `"${r.name.replace(/"/g, '\\"')}": <integer 0-100>`)
    .join(", ");

    const input = `
    Evaluate the following student submission using the framework and rules defined above.

    Score each criterion from 0-100 (integers only). 

    IMPORTANT:
    - Each rubric item's description may contain sub-sections with explicit guidance or weights.
    - You MUST internally evaluate all sub-sections when assigning the final integer score for that criterion.
    - Your reasoning over sub-sections must be reflected in the "description" field of the output JSON.
    - Do not reveal internal step-by-step reasoning outside the description.
    - Guidelines are binding specifications. Literal similarity is insufficient; assess depth, alignment, and faithful abstraction.
    - The PROBLEM STATEMENT string contains TWO LOGICAL SECTIONS:
      1. Problem Statement: A textual summary of the task the participant must solve.
      2. Challenge Goal: The specific task the AI was meant to perform.
      
      You must interpret both sections correctly when evaluating the submission.

    ${problemStatement ? `PROBLEM STATEMENT (authoritative brief):\n${problemStatement}` : ''}

    ${guidelines ? `GUIDELINES:\n${guidelines}` : ''}

    Rubric:
    ${rubricArray.map(item => `- ${item.name} : ${item.description}`).join("\n")}

    STUDENT SUBMISSION:
    """${prompt}"""

    <output_format>
    Your final output MUST be a single, valid JSON object and nothing else.
    Do NOT include any text, explanations, or markdown formatting before or after the JSON.

    The JSON structure is:
    {
      ${escapedJsonSchema},
      "description": "<A neutral, structured justification explaining the scores. 
      
      CRITICAL REQUIREMENT - SUB-CRITERIA SCORE BREAKDOWN:
      If any rubric criterion contains sub-sections (indicated by weights like 33%, 34%, etc. or explicit sub-points), 
      you MUST provide EXPLICIT NUMERICAL SCORES for each sub-section in the description.
      
      Format for each main criterion:
      [Criterion Name] ([Score]/100): [Brief overview]. [Sub-criterion 1 Name] ([sub-score]/[max-points]): [justification]. [Sub-criterion 2 Name] ([sub-score]/[max-points]): [justification]. [Continue for all sub-criteria].
      
      Example format:
      VIN Interpretation (92/100): The submission demonstrates exceptional Original Insight (32/33) by [justification]. The Emotional and Cultural Depth (31/33) is strong because [justification]. The Meaning over Description (29/34) excels by [justification].
      
      The description MUST:
      1. For EACH main criterion, provide the overall score (e.g., 92/100)
      2. For EACH sub-criterion within that main criterion, provide its individual score (e.g., 32/33, 31/33, 29/34)
      3. Explain how the submission performed on each sub-criterion
      4. Reference how the submission addressed both Problem Statement and Guidelines
      5. Maintain a neutral, objective tone without revealing internal chain-of-thought reasoning
      
      DO NOT provide only narrative explanation without numerical breakdowns for sub-criteria.
      DO NOT skip sub-criteria score breakdowns even if the explanation is detailed.>"
    }
    </output_format>
    `.trim();


  // console.log("system prompt",systemPrompt, "user prompt",input);
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

    console.log(`✅ ${model} response (${content.length} chars): ${content.slice(0, 200)}${content.length > 200 ? '...' : ''}`);
    return content;
    
  } catch (error: any) {
    console.error(`❌ ${model} error:`, error.message);
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

  // Strategy 5: Nested score property
  if (parsedResponse["scores"][criterionName] !== undefined) {
      return parsedResponse["scores"][criterionName];
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
  
  console.warn(`⚠️ ${model} evaluation failed: ${missingCriteria.length} missing criteria ${missingCriteria}`);
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
2.  **Deconstruct the Rubric**: For each criterion, understand its definition and what constitutes a high-quality submission for that specific dimension. If a criterion has sub-sections with weights, you MUST evaluate and score each sub-section individually.
3.  **Evaluate the Submission**: Critically assess the student's prompt (the "answer"). For each rubric criterion, systematically compare the submission against the problem statement. If the criterion has sub-sections, evaluate each one separately.
4.  **Assign Scores**: 
    a. For each main criterion, assign an integer score from 0-100 based on how well the submission meets the requirements.
    b. For each sub-criterion (if present), calculate its individual score proportional to its weight and include it in the description.
    c. Use the scoring guide below for both main and sub-criteria.
5.  **Document Sub-Criteria Scores**: In your description, you MUST explicitly state the score for each sub-criterion using the format: [Sub-criterion Name] ([score]/[max-points])
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
  "description": "<A comprehensive, structured justification for your scores.
  
  MANDATORY FORMAT - If rubric criteria contain sub-sections:
  For each main criterion, state: [Criterion Name] ([Score]/100): [Overview]. Then for EACH sub-criterion: [Sub-criterion Name] ([sub-score]/[max-points]): [specific justification].
  
  Example:
  VIN Interpretation (92/100): Strong performance overall. Original Insight (32/33): Exceptional metaphorical transformation. Emotional and Cultural Depth (31/33): Strong cultural contextualization. Meaning over Description (29/34): Excellent depth of meaning.
  
  You MUST include numerical scores for all sub-criteria. Narrative-only explanations without score breakdowns are NOT acceptable.>"
}
</output_format>
`.trim();
}



// - Repair to the correct struc
async function attemptRepair(rawOutput: string, rubricArray: any[], attempts = 2): Promise<any | null> {
  const { model, maxTokens, temperature } = LLM_CONFIG.repairModel;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required for repair LLM");
  }

  const repairPrompt = `
    You will be given some text that was intended to be a valid JSON evaluation result but may include extra text, Markdown fences, comments, trailing commas, or small formatting errors.

    Your task: OUTPUT ONLY a single valid JSON object that matches the schema below. Fix **only structural/formatting issues** needed to make the JSON valid. Do NOT change the meaning of any values or reword descriptions. If you cannot confidently repair without inventing or altering content, return a minimal error object: {"_repair_error": "<short reason>"}.

    Schema:
    {
      ${rubricArray.map(r => `"${r.name}": <number>`).join(", ")},
      "description": "<string justification for the scores>"
    }

    Rules (must follow):
    1. Preserve all keys and values exactly as provided. Do not alter text semantics.
    2. Allowed minimal conversions:
      - Convert numeric strings like "85" → 85 when needed so that numbers are numbers.
      - Remove comments (e.g., // ...) and trailing commas.
      - Replace single quotes with double quotes where required for valid JSON.
    3. Do NOT add, remove, or rephrase the description text. Do NOT change score values except for harmless type conversion.
    4. If multiple JSON objects appear, attempt to parse the first valid JSON object. If the first is unrecoverable and a later one is clearly valid, use the later one.
    5. If keys are duplicated/conflicting, prefer the first occurrence.
    6. If the input is too ambiguous to repair safely, return exactly: {"_repair_error": "<brief reason>"} (no other text).
    7. Output only the final JSON object — no explanations, no markdown fences, no commentary.

    Examples (input → output):

    INPUT:
    Here is the result:
    {
      {
        "Clarity": "95",
        "Creativity": 105, 
      },
      "description": "A clear submission."
    }
    OUTPUT:
    {
      {
      "Clarity": 95,
      "Creativity": 105
      },
      "description": "A clear submission."
    }

    INPUT:
    Result: { 'scores': { 'Accuracy': '80', 'Depth': '90' }, 'description': 'Good.' } Extra notes.
    OUTPUT:
    {
      {
      "Accuracy": 80,
      "Depth": 90
      },
      "description": "Good."
    }

    Text to repair:
    """${rawOutput}"""
  `.trim();

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          messages: [
            { role: "system", content: "You are a strict JSON repair assistant." },
            { role: "user", content: repairPrompt }
          ],
          max_tokens: maxTokens,
          temperature
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

      const content = res?.data?.choices?.[0]?.message?.content?.trim();
      if (!content) continue;

      try {
        const parsed = parseLLMResponse(content);
        return parsed; // return repaired JSON
      } catch {
        console.warn(`⚠️ Repair attempt ${i + 1} failed to parse JSON`);
      }
    } catch (err: any) {
      console.error(`❌ Repair model error (attempt ${i + 1}):`, err.message);
    }
  }

  console.warn("⚠️ Repair failed after all attempts");
  return null;
}
