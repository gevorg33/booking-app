import type { HipaaAnswer, HipaaEvalDecision } from './hipaa-baa.constants.js';
import type { MarketplacePositioningDecision } from './marketplace-positioning.constants.js';

export interface HipaaEvalAnswers {
  [questionId: string]: HipaaAnswer;
}

export interface HipaaEvalResult {
  answers: HipaaEvalAnswers;
  handlesPhi: boolean;
  readinessPercent: number;
  blockers: string[];
  recommendation: HipaaEvalDecision;
  recommendationKey: string;
  notes: string | null;
  decidedAt: string | null;
  updatedAt: string;
}

export interface MarketplaceCriterionWeights {
  [criterionId: string]: number;
}

export interface MarketplaceEvalResult {
  criterionWeights: MarketplaceCriterionWeights;
  optionScores: Record<Exclude<MarketplacePositioningDecision, 'undecided'>, number>;
  recommendation: MarketplacePositioningDecision;
  recommendationKey: string;
  directoryOptIn: boolean | null;
  notes: string | null;
  decidedAt: string | null;
  updatedAt: string;
}

export interface StrategyEvalSummary {
  hipaa: HipaaEvalResult | null;
  marketplace: MarketplaceEvalResult | null;
  medicalVerticalBlocked: boolean;
  marketplaceDecisionLocked: boolean;
}

export interface StoredStrategyEval {
  hipaa?: Partial<HipaaEvalResult> & { answers?: HipaaEvalAnswers };
  marketplace?: Partial<MarketplaceEvalResult> & { criterionWeights?: MarketplaceCriterionWeights };
}

export function readStoredStrategyEval(raw?: Record<string, unknown>): StoredStrategyEval {
  const root = raw?.strategyEval;
  if (!root || typeof root !== 'object') return {};
  return root as StoredStrategyEval;
}
