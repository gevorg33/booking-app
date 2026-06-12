import {
  SEMANTIC_STEAL_GUARD_SCENARIOS,
  SEMANTIC_STEAL_GUARD_SCENARIOS_BY_DOMAIN,
  SEMANTIC_STEAL_GUARD_PIPE_MARKER,
} from './semantic-steal-guard.fixtures.js';

describe('semantic-steal-guard.fixtures (pipe-1.5.3)', () => {
  it('exports pipe marker', () => {
    expect(SEMANTIC_STEAL_GUARD_PIPE_MARKER).toBe('pipe-1.5.3');
  });

  it('ships regression corpus for tour, provider stats, and recommendation', () => {
    expect(SEMANTIC_STEAL_GUARD_SCENARIOS_BY_DOMAIN.tour_calendar.length).toBeGreaterThanOrEqual(
      10,
    );
    expect(SEMANTIC_STEAL_GUARD_SCENARIOS_BY_DOMAIN.provider_stats.length).toBeGreaterThanOrEqual(
      10,
    );
    expect(SEMANTIC_STEAL_GUARD_SCENARIOS_BY_DOMAIN.recommendation.length).toBeGreaterThanOrEqual(
      10,
    );
    expect(SEMANTIC_STEAL_GUARD_SCENARIOS.length).toBeGreaterThanOrEqual(30);
  });

  it('uses unique scenario ids', () => {
    const ids = SEMANTIC_STEAL_GUARD_SCENARIOS.map((scenario) => scenario.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
