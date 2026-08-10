import {
  RECOMMEND_SPECIALISTS_NEGATIVE_PROMPTS,
  RECOMMEND_SPECIALISTS_POSITIVE_PROMPTS,
  RECOMMEND_SPECIALISTS_SEMANTIC_PIPE_MARKER,
} from './recommend-specialists.semantic.fixtures.js';
import {
  impliesRecommendSpecialistsFromSemantic,
  resolveRecommendSpecialistsSemanticHints,
} from './recommend-specialists.semantic.util.js';

describe('recommend-specialists semantic util (acc-3.14)', () => {
  it('exports pipe marker', () => {
    expect(RECOMMEND_SPECIALISTS_SEMANTIC_PIPE_MARKER).toBe('acc-3.14');
  });
});
