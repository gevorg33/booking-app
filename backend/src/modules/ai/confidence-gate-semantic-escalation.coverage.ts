import { CONFIDENCE_GATE_SEMANTIC_ESCALATION_SCENARIO_IDS } from './confidence-gate.fixtures.js';

/**
 * Scenario ids exercised by `it.each` in confidence-gate-semantic-escalation.spec.ts (pipe-1.3.4).
 * Must stay in sync with CONFIDENCE_GATE_SEMANTIC_ESCALATION_SCENARIOS — one test per id.
 */
export const CONFIDENCE_GATE_SEMANTIC_ESCALATION_IT_EACH_SCENARIO_IDS: readonly string[] =
  CONFIDENCE_GATE_SEMANTIC_ESCALATION_SCENARIO_IDS;

export function findOrphanConfidenceGateSemanticEscalationIds(
  fixtureIds: readonly string[],
  coveredIds: readonly string[],
): string[] {
  const covered = new Set(coveredIds);
  return fixtureIds.filter((id) => !covered.has(id));
}
