// LLM Evaluation Types

export interface ModelEvaluationResult {
  model: string;
  scores: Record<string, number>;
  description: string;
  finalScore: number;
}

export interface EvaluationResult {
  scores: Record<string, {
    description: string;
    finalScore: number;
    scores: Record<string, number>;
  }>;
  average: number | null;
}
