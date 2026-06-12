import { FAST_HEURISTIC_ROUTING_SCENARIO_IDS } from './fast-intent-heuristics.fixtures.js';

/**
 * Scenario ids exercised by `it.each` in fast-intent-heuristics.service.spec.ts (pipe-1.2.4).
 * Must stay in sync with FAST_HEURISTIC_ROUTING_SCENARIOS — one test per id.
 */
export const FAST_HEURISTIC_ROUTING_IT_EACH_SCENARIO_IDS: readonly string[] =
  FAST_HEURISTIC_ROUTING_SCENARIO_IDS;

export function findOrphanFastHeuristicRoutingIds(
  fixtureIds: readonly string[],
  coveredIds: readonly string[],
): string[] {
  const covered = new Set(coveredIds);
  return fixtureIds.filter((id) => !covered.has(id));
}
