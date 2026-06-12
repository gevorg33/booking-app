import {
  FAST_HEURISTIC_COMPOUND_SCENARIOS,
  FAST_HEURISTIC_NEGATIVE_SCENARIOS,
  FAST_HEURISTIC_READ_ONLY_SCENARIOS,
  FAST_HEURISTIC_ROUTING_SCENARIO_IDS,
  FAST_HEURISTIC_ROUTING_SCENARIOS,
} from './fast-intent-heuristics.fixtures.js';

describe('fast-intent-heuristics.fixtures (pipe-1.2.4)', () => {
  it('ships read_only, compound, and negative routing scenarios', () => {
    expect(FAST_HEURISTIC_READ_ONLY_SCENARIOS.length).toBeGreaterThanOrEqual(6);
    expect(FAST_HEURISTIC_COMPOUND_SCENARIOS.length).toBeGreaterThanOrEqual(3);
    expect(FAST_HEURISTIC_NEGATIVE_SCENARIOS.length).toBeGreaterThanOrEqual(3);
  });

  it('has unique routing scenario ids', () => {
    expect(new Set(FAST_HEURISTIC_ROUTING_SCENARIO_IDS).size).toBe(
      FAST_HEURISTIC_ROUTING_SCENARIO_IDS.length,
    );
  });

  it.each(FAST_HEURISTIC_ROUTING_SCENARIOS)(
    'scenario $id declares category $category',
    (scenario) => {
      expect(scenario.category).toMatch(/^(read_only|compound|negative)$/);
      if (scenario.category === 'negative') {
        expect(scenario.expectedCandidateCount).toBe(0);
      } else {
        expect(scenario.expectedCandidateCount).toBeGreaterThan(0);
      }
    },
  );
});
