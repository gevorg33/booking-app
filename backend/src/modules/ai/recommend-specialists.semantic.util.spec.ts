import {
  RECOMMEND_SPECIALISTS_NEGATIVE_PROMPTS,
  RECOMMEND_SPECIALISTS_POSITIVE_PROMPTS,
  RECOMMEND_SPECIALISTS_SEMANTIC_PIPE_MARKER,
} from './recommend-specialists.semantic.fixtures.js';
import {
  impliesRecommendSpecialistsFromSemantic,
  isRecommendSpecialistsPrompt,
  resolveRecommendSpecialistsSemanticHints,
} from './recommend-specialists.semantic.util.js';

describe('recommend-specialists semantic util (acc-3.14)', () => {
  it('exports pipe marker', () => {
    expect(RECOMMEND_SPECIALISTS_SEMANTIC_PIPE_MARKER).toBe('acc-3.14');
  });

  it.each(RECOMMEND_SPECIALISTS_POSITIVE_PROMPTS)(
    '$id detects recommend specialists phrasing',
    ({ prompt, surface }) => {
      const resolvedSurface = surface ?? 'dashboard';
      expect(
        resolveRecommendSpecialistsSemanticHints(prompt, resolvedSurface),
      ).toEqual({ recommendSpecialists: true });
      expect(impliesRecommendSpecialistsFromSemantic(prompt)).toBe(true);
      expect(isRecommendSpecialistsPrompt(prompt)).toBe(true);
    },
  );

  it.each(RECOMMEND_SPECIALISTS_NEGATIVE_PROMPTS)(
    '$id does not detect recommend specialists phrasing',
    ({ prompt, surface }) => {
      const resolvedSurface = surface ?? 'dashboard';
      expect(
        resolveRecommendSpecialistsSemanticHints(prompt, resolvedSurface),
      ).toBeNull();
      expect(impliesRecommendSpecialistsFromSemantic(prompt)).toBe(false);
      expect(isRecommendSpecialistsPrompt(prompt)).toBe(false);
    },
  );
});
