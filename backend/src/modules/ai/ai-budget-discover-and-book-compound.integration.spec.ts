import { BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS } from './ai-budget-discover-and-book-compound.fixtures.js';
import { BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS } from './ai-budget-discover-and-book-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
} from './intent-decomposition.util.js';
import { BUDGET_DISCOVER_AND_BOOK_RECIPE_ID } from './ai-budget-discover-and-book-compound.util.js';

describe('AiBudgetDiscoverAndBookCompound integration (ai-cmd-ext-4.3)', () => {
  it('registers dashboard_budget_discover_and_book golden pattern', () => {
    const pattern = GOLDEN_COMPOUND_PATTERNS.find(
      (row) => row.id === 'dashboard_budget_discover_and_book',
    );
    expect(pattern?.recipeId).toBe(BUDGET_DISCOVER_AND_BOOK_RECIPE_ID);
  });

  it.each(BUDGET_DISCOVER_AND_BOOK_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface EN $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(BUDGET_DISCOVER_AND_BOOK_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.maxPrice) {
        expect(result?.steps[0].params.maxPrice).toBe(expectedParams.maxPrice);
      }
    },
  );

  it.each(BUDGET_DISCOVER_AND_BOOK_MULTILINGUAL_SCENARIOS.slice(0, 6))(
    'decomposeDeterministicForSurface i18n $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('dashboard', prompt);
      expect(result?.recipeId).toBe(BUDGET_DISCOVER_AND_BOOK_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );
});
