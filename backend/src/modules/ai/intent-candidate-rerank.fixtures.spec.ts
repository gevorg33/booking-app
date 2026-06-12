import { MERGE_RERANK_SCENARIOS } from './intent-candidate-rerank.fixtures.js';

describe('intent-candidate-rerank.fixtures (pipe-1.4.5)', () => {
  it('has unique scenario ids', () => {
    const ids = MERGE_RERANK_SCENARIOS.map((scenario) => scenario.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
