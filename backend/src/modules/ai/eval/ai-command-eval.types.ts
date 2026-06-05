import type { ComplexityRoute } from '../command-complexity-router.service.js';

export type AiEvalLocale = 'en' | 'hy' | 'ru' | 'translit';

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
