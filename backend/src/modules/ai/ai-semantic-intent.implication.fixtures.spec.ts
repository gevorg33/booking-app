import { SEMANTIC_IMPLICATION_SCENARIOS } from './ai-semantic-intent.implication.fixtures.js';

describe('ai-semantic-intent.implication.fixtures (pipe-1.4.8)', () => {
  it('has unique scenario ids', () => {
    const ids = SEMANTIC_IMPLICATION_SCENARIOS.map((scenario) => scenario.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes canonical hair-long and work-time implication cases', () => {
    const ids = new Set(
      SEMANTIC_IMPLICATION_SCENARIOS.map((scenario) => scenario.id),
    );
    expect(ids.has('en-hair-long-implied-booking')).toBe(true);
    expect(ids.has('en-work-time-implied-schedule')).toBe(true);
  });
});
