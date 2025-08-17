// types/judgeEvaluations.ts

// --- Core Evaluation Types ---
export interface Evaluation {
  judgeId?: string;          // optional if used inside JudgeDetailSection
  challengeId?: string;      // optional if used inside JudgeDetailSection
  scores: Record<string, number>;
  totalScore: number;
  comment: string;
  updatedAt: any;
}

export interface GroupedEvaluations {
  [judgeId: string]: {
    [challengeId: string]: Evaluation[];
  };
}

// --- Judge List / Detail Section Props ---
export interface JudgeDetailSectionProps {
  judgeIds: string[];
  groupedEvaluations: GroupedEvaluations;
  judgeMapping: Record<string, string>;
  defaultSelectedJudge: string;
}

// --- Challenge Accordion Item Props ---
export interface ChallengeAccordionItemProps {
  challengeId: string;
  evaluations: Evaluation[];
}
