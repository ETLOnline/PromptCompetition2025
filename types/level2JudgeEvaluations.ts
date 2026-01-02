// types/level2JudgeEvaluations.ts

// --- Core Level 2 Evaluation Types ---
export interface Level2Evaluation {
  judgeId: string;
  judgeName: string;
  batchId: string;
  participantId: string;
  participantName: string;
  evaluatedChallenges: string[];
  evaluations: {
    [challengeId: string]: {
      rubricScores: Record<string, number>;
      score: number;
      comment: string;
      evaluatedAt: any;
      hasSubmission: boolean;
    };
  };
  lastUpdated: any;
}

export interface BatchInfo {
  batchId: string;
  batchName: string;
  judgeCount: number;
  participantCount: number;
  evaluationCount: number;
  challengeCount: number;
}

export interface Level2EvaluationResponse {
  evaluations: Level2Evaluation[];
  batches: BatchInfo[];
  judges: Record<string, string>;
  participants: Record<string, string>;
}

// --- Grouped Evaluations (for display) ---
export interface GroupedLevel2Evaluations {
  [batchId: string]: {
    [judgeId: string]: {
      [participantId: string]: Level2Evaluation;
    };
  };
}

// --- Filter State ---
export interface FilterState {
  searchQuery: string;
  selectedBatch: string;
  selectedJudge: string;
  selectedParticipant: string;
}
