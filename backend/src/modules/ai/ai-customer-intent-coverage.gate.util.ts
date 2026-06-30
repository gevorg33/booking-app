import { CUSTOMER_INTENT_PROMOTION_INTENT_LIST } from './ai-customer-intent-promotion.intents.js';
import {
  CUSTOMER_INTENT_COVERAGE_REQUIRED,
  listCustomerIntentCoverageGaps,
} from './ai-customer-intent-coverage.util.js';
import { listCustomerIntentPromotionFixtureGaps } from './ai-customer-intent-promotion-coverage.util.js';
import {
  auditCustomerIntentPromotionQueue,
  listCustomerIntentPromotionRegistryGaps,
} from './ai-customer-intent-promotion.util.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

/**
 * Jest spec path patterns for `npm run test:ai-customer-intent-coverage` (ai-cmd-customer-4.0.3).
 * Append a pattern when a new suite gates graduated intents.
 */
export const AI_CUSTOMER_INTENT_COVERAGE_GATE_SPEC_PATTERNS = [
  'ai-customer-intent-coverage',
  'ai-customer-intent-promotion',
  'customer-ai-command-promotion\\.integration',
  'ai-customer-deferred-locale-parity',
] as const;

export function buildAiCustomerIntentCoverageGateTestPathPattern(): string {
  return `(${AI_CUSTOMER_INTENT_COVERAGE_GATE_SPEC_PATTERNS.join('|')})`;
}

/** Baseline required count before 4.0 P0–P3 promotion (ai-cmd-customer-2.6). */
export const CUSTOMER_INTENT_COVERAGE_REQUIRED_BASELINE_COUNT = 19;

export function listGraduatedCustomerIntentCoverageRequired(): string[] {
  const promoted = new Set<string>(CUSTOMER_INTENT_PROMOTION_INTENT_LIST);
  return CUSTOMER_INTENT_COVERAGE_REQUIRED.filter((intent) =>
    promoted.has(intent),
  );
}

export function assertCustomerIntentCoverageGateManifest(): string[] {
  const errors: string[] = [];
  const graduated = listGraduatedCustomerIntentCoverageRequired();

  if (
    CUSTOMER_INTENT_COVERAGE_REQUIRED.length !==
    CUSTOMER_INTENT_COVERAGE_REQUIRED_BASELINE_COUNT + graduated.length
  ) {
    errors.push(
      `CUSTOMER_INTENT_COVERAGE_REQUIRED length ${CUSTOMER_INTENT_COVERAGE_REQUIRED.length} != baseline ${CUSTOMER_INTENT_COVERAGE_REQUIRED_BASELINE_COUNT} + graduated ${graduated.length}`,
    );
  }

  for (const intent of CUSTOMER_INTENT_PROMOTION_INTENT_LIST) {
    if (!CUSTOMER_INTENT_COVERAGE_REQUIRED.includes(intent)) {
      errors.push(`${intent}: promoted intent missing from REQUIRED gate`);
    }
  }

  if (AI_CUSTOMER_INTENT_COVERAGE_GATE_SPEC_PATTERNS.length < 4) {
    errors.push('AI_CUSTOMER_INTENT_COVERAGE_GATE_SPEC_PATTERNS too small');
  }

  return errors;
}

export function listCustomerIntentCoverageGateGaps(
  evalCases: readonly AiCommandEvalCase[],
): string[] {
  return [
    ...assertCustomerIntentCoverageGateManifest(),
    ...listCustomerIntentPromotionRegistryGaps(),
    ...listCustomerIntentCoverageGaps(evalCases),
    ...listCustomerIntentPromotionFixtureGaps(),
    ...auditCustomerIntentPromotionQueue(evalCases)
      .filter((row) => row.coverageBucket !== 'required')
      .map((row) => `${row.intent}: promotion row not in REQUIRED gate`),
    ...auditCustomerIntentPromotionQueue(evalCases)
      .filter((row) => !row.hasEval || !row.hasFixture)
      .map((row) => `${row.intent}: missing eval or fixture in promotion audit`),
  ];
}
