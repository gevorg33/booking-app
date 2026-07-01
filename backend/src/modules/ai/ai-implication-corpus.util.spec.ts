import {
  AI_IMPLICATION_CORPUS_SCENARIOS,
  BOOKING_IMPLICATION_SCENARIOS,
} from './ai-implication-corpus.fixtures.js';
import {
  assertImplicationCorpusCoverage,
  countImplicationScenariosByIntent,
  filterImplicationCorpusByIntent,
  MIN_IMPLICATION_PROMPTS_PER_INTENT,
} from './ai-implication-corpus.util.js';

describe('ai-implication-corpus.util', () => {
  it('counts scenarios per top intent', () => {
    const counts = countImplicationScenariosByIntent(
      AI_IMPLICATION_CORPUS_SCENARIOS,
    );
    expect(counts.booking).toBeGreaterThanOrEqual(
      BOOKING_IMPLICATION_SCENARIOS.length,
    );
    expect(counts.booking).toBeGreaterThanOrEqual(
      MIN_IMPLICATION_PROMPTS_PER_INTENT,
    );
  });

  it('filters corpus by intent', () => {
    const booking = filterImplicationCorpusByIntent(
      AI_IMPLICATION_CORPUS_SCENARIOS,
      'booking',
    );
    expect(booking.every((scenario) => scenario.topIntent === 'booking')).toBe(
      true,
    );
    expect(booking.length).toBeGreaterThanOrEqual(
      MIN_IMPLICATION_PROMPTS_PER_INTENT,
    );
  });

  it('throws when corpus under minimum', () => {
    expect(() =>
      assertImplicationCorpusCoverage([BOOKING_IMPLICATION_SCENARIOS[0]], 10),
    ).toThrow(/requires ≥10 prompts/);
  });
});
