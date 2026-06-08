import {
  NO_CLARIFY_EVAL_FLOOR,
  NO_CLARIFY_NEAR_99_PRIMARY_LOCALES,
  NO_CLARIFY_NEAR_99_TARGET,
  NO_CLARIFY_WRONG_EXEC_CEILING,
} from '../ai-n99-no-clarify-completion.fixtures.js';
import type { AiTraceAnalyticsRow } from '../ai-command-trace.util.js';

function traceRow(
  partial: Partial<AiTraceAnalyticsRow> & Pick<AiTraceAnalyticsRow, 'traceId'>,
): AiTraceAnalyticsRow {
  return {
    surface: 'dashboard',
    userId: 'u1',
    action: 'create_booking',
    outcome: 'executed',
    confidence: 0.9,
    failureSignal: null,
    feedbackRating: null,
    correctedAction: null,
    rawPrompt: 'book massage tomorrow',
    locale: 'en',
    createdAt: new Date('2026-06-08T10:00:00Z'),
    ...partial,
    traceId: partial.traceId,
  };
}

/** Synthetic trace rows for n99-2.9 wrong-execution gate measurement. */
export const NO_CLARIFY_GATE_TRACE_ROWS = {
  clean: Array.from({ length: 250 }, (_, index) =>
    traceRow({
      traceId: `clean-${index}`,
      locale: index % 3 === 0 ? 'hy' : index % 3 === 1 ? 'ru' : 'en',
      outcome: 'executed',
      failureSignal: index === 0 ? 'wrong_execution' : null,
    }),
  ),
  highWrongExec: Array.from({ length: 100 }, (_, index) =>
    traceRow({
      traceId: `bad-${index}`,
      locale: index % 3 === 0 ? 'hy' : index % 3 === 1 ? 'ru' : 'en',
      outcome: 'executed',
      failureSignal: index < 2 ? 'wrong_execution' : null,
    }),
  ),
} as const;

/** n99-2.9 — ratchet no-clarify CI floor toward 99% in small steps. */
export const NO_CLARIFY_RATCHET_STEP = 0.005;
export const NO_CLARIFY_RATCHET_MIN_BUMP_GAP = 0.002;
export const NO_CLARIFY_MIN_CASES = 10;
export const NO_CLARIFY_MIN_PER_LOCALE = 2;

export const NO_CLARIFY_GATE_DEFAULTS = {
  floor: NO_CLARIFY_EVAL_FLOOR,
  target: NO_CLARIFY_NEAR_99_TARGET,
  wrongExecutionCeiling: NO_CLARIFY_WRONG_EXEC_CEILING,
  minCases: NO_CLARIFY_MIN_CASES,
  minPerLocale: NO_CLARIFY_MIN_PER_LOCALE,
  primaryLocales: NO_CLARIFY_NEAR_99_PRIMARY_LOCALES,
} as const;

export const NO_CLARIFY_RATCHET_SCENARIOS = [
  {
    id: 'bump-when-above-floor',
    currentFloor: 0.9,
    measuredAccuracy: 0.912,
    expectBump: true,
    expectNextFloor: 0.905,
  },
  {
    id: 'skip-when-at-target',
    currentFloor: 0.99,
    measuredAccuracy: 0.995,
    expectBump: false,
    expectNextFloor: 0.99,
  },
] as const;

export const NO_CLARIFY_WRONG_EXEC_SCENARIOS = [
  {
    id: 'within-ceiling',
    wrongExecutionRate: 0.008,
    expectPass: true,
  },
  {
    id: 'above-ceiling',
    wrongExecutionRate: 0.012,
    expectPass: false,
  },
  {
    id: 'at-ceiling-boundary',
    wrongExecutionRate: 0.01,
    expectPass: true,
  },
  {
    id: 'zero-wrong-exec',
    wrongExecutionRate: 0,
    expectPass: true,
  },
] as const;

/** n99-2.9 — dual gate: no-clarify accuracy floor + wrong-execution ceiling must both hold. */
export const NO_CLARIFY_DUAL_GATE_SCENARIOS = [
  {
    id: 'both-gates-pass',
    accuracy: 0.995,
    wrongExecutionRate: 0.004,
    floor: 0.9,
    expectDualGateMet: true,
  },
  {
    id: 'no-clarify-below-floor',
    accuracy: 0.88,
    wrongExecutionRate: 0.004,
    floor: 0.9,
    expectDualGateMet: false,
    expectFailureIncludes: 'no_clarify accuracy',
  },
  {
    id: 'wrong-exec-above-ceiling',
    accuracy: 0.995,
    wrongExecutionRate: 0.015,
    floor: 0.9,
    expectDualGateMet: false,
    expectFailureIncludes: 'wrong_execution',
  },
  {
    id: 'both-gates-fail',
    accuracy: 0.85,
    wrongExecutionRate: 0.02,
    floor: 0.9,
    expectDualGateMet: false,
  },
] as const;

export const NO_CLARIFY_GATE_TRACE_SCENARIOS = [
  {
    id: 'trace-clean',
    rows: NO_CLARIFY_GATE_TRACE_ROWS.clean,
    expectWrongExecutionRate: 0.004,
    expectWrongExecutionGateMet: true,
  },
  {
    id: 'trace-high-wrong-exec',
    rows: NO_CLARIFY_GATE_TRACE_ROWS.highWrongExec,
    expectWrongExecutionRate: 0.02,
    expectWrongExecutionGateMet: false,
  },
] as const;
