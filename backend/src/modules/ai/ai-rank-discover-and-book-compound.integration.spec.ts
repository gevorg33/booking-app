import { RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS } from './ai-rank-discover-and-book-compound.fixtures.js';
import { RANK_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS } from './ai-rank-discover-and-book-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import { RANK_DISCOVER_AND_BOOK_RECIPE_ID } from './ai-rank-discover-and-book-compound.util.js';

describe('AiRankDiscoverAndBookCompound integration (ai-cmd-ext-4.4)', () => {
  it('registers dashboard_rank_discover_and_book golden pattern', () => {
    const pattern = GOLDEN_COMPOUND_PATTERNS.find(
      (row) => row.id === 'dashboard_rank_discover_and_book',
    );
    expect(pattern?.recipeId).toBe(RANK_DISCOVER_AND_BOOK_RECIPE_ID);
  });

  it.each(RANK_DISCOVER_AND_BOOK_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface EN $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(RANK_DISCOVER_AND_BOOK_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.serviceRank) {
        expect(result?.steps[0].params.serviceRank).toBe(
          expectedParams.serviceRank,
        );
      }
    },
  );

  it.each(RANK_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS.slice(0, 6))(
    'decomposeDeterministicForSurface i18n $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(RANK_DISCOVER_AND_BOOK_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );
});
