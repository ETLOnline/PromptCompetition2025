// LLM Evaluation Types

export interface ModelEvaluationResult {
  model: string;
  scores: Record<string, number>;
  errors: string[];
  warnings: string[];
  successRate: number;
  description: string;
  finalScore: number;
}

// This matches the database structure shown in the images
export interface LLMScores {
  [modelName: string]: {
    description: string;
    finalScore: number;
    scores: Record<string, number>;
  }
}

export interface EvaluationSummary {
  scores: LLMScores;  // Changed to match expected database structure
  average: number | null;
  totalValid: number;
}
