import {
  DETERMINISTIC_SEMANTIC_FALLBACK_SCENARIOS,
  DETERMINISTIC_TOKEN_COSINE_SCENARIOS,
} from './ai-semantic-intent.deterministic.fixtures.js';

describe('ai-semantic-intent.deterministic.fixtures (pipe-1.4.4)', () => {
  it('has unique scenario ids', () => {
    const ids = [
      ...DETERMINISTIC_SEMANTIC_FALLBACK_SCENARIOS.map(
        (scenario) => scenario.id,
      ),
      ...DETERMINISTIC_TOKEN_COSINE_SCENARIOS.map((scenario) => scenario.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
