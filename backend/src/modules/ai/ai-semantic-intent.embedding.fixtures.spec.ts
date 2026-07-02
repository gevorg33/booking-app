import { SEMANTIC_EMBEDDING_MATCH_SCENARIOS } from './ai-semantic-intent.embedding.fixtures.js';

describe('ai-semantic-intent.embedding.fixtures (pipe-1.4.3)', () => {
  it('has unique scenario ids', () => {
    const ids = SEMANTIC_EMBEDDING_MATCH_SCENARIOS.map(
      (scenario) => scenario.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });
});
