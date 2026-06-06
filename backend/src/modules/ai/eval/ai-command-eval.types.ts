import type { CommandSurface } from '../ai-command-registry.types.js';
import type { ComplexityRoute } from '../command-complexity-router.service.js';
import type { DecompositionSource } from '../intent-decomposition.types.js';

export type AiEvalLocale = 'en' | 'hy' | 'ru' | 'translit';

export interface CompoundStepParamExpectation {
  stepIndex: number;
  paramsPartial?: Record<string, unknown>;
}

export interface AiCommandEvalExpectation {
  /** Expected intent action when classify output is simulated or skipped */
  action?: string;
  /** Subset match on params after heuristic finalize */
  paramsPartial?: Record<string, unknown>;
  /** Deterministic complexity route tier */
  routeTier?: ComplexityRoute['tier'];
  /** Parsed destination time (24h) for reschedule prompts */
  rescheduleTimeSlot?: string;
  /** Parsed source time for reschedule prompts */
  rescheduleFromTimeSlot?: string;
  /** Whether multilingual classifier hint should apply */
  needsMultilingual?: boolean;
  /** Intent rescue should change unknown → this action */
  rescuedAction?: string;
  /** Input action for disambiguation rescue (defaults to unknown). */
  rescueFromAction?: string;
  /** Expected rescueReason when stable. */
  rescueReason?: string;
  /** Compound decomposition surface (ai-cmd-0.4). */
  compoundSurface?: CommandSurface;
  /** Exact ordered sub-intent actions from deterministic/golden decomposition. */
  compoundSteps?: string[];
  /** Subset of required sub-intent actions (any order). */
  compoundActionsContains?: string[];
  /** Minimum sub-intent count when order is unstable. */
  compoundMinSteps?: number;
  /** Decomposition should not yield multi-step result. */
  compoundExpectEmpty?: boolean;
  /** Expected decomposition source when stable. */
  compoundSource?: DecompositionSource;
  /** Expected compound recipe id when stable. */
  compoundRecipeId?: string;
  /** Per-step param subset checks after decomposition. */
  compoundStepParams?: CompoundStepParamExpectation[];
  /** HIPAA PHI guard assessment (ai-cmd-compliance-15). */
  phiGuard?: {
    blocked: boolean;
    reason?: 'phi_in_context' | 'phi_in_prompt';
    matchedFields?: string[];
    redactedSubstring?: string;
  };
}

export interface AiCommandEvalCase {
  id: string;
  prompt: string;
  locale?: AiEvalLocale;
  expect: AiCommandEvalExpectation;
  /** When true, case is documented for live LLM eval only (skipped in CI) */
  requiresLlm?: boolean;
}

export interface AiEvalCaseResult {
  id: string;
  passed: boolean;
  errors: string[];
}
