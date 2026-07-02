import {
  DISCOVER_BOOK_AND_PAY_COMPOUND_PROMPTS,
  DISCOVER_BOOK_AND_PAY_CUSTOMER_PROMPTS,
} from './ai-discover-book-and-pay-compound.fixtures.js';
import { DISCOVER_BOOK_AND_PAY_MULTILINGUAL_SCENARIOS } from './ai-discover-book-and-pay-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
  isCompoundPrompt,
} from './intent-decomposition.util.js';
import {
  DISCOVER_BOOK_AND_PAY_RECIPE_ID,
  PUBLIC_DISCOVER_BOOK_AND_PAY_RECIPE_ID,
} from './ai-discover-book-and-pay-compound.util.js';
import { isBudgetServiceDiscoveryCompoundPrompt } from './ai-budget-service-discovery-compound.util.js';

describe('AiDiscoverBookAndPayCompound integration (ai-cmd-customer-4.8.1)', () => {
  it('registers customer and public golden patterns', () => {
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'customer_discover_book_and_pay',
      )?.recipeId,
    ).toBe(DISCOVER_BOOK_AND_PAY_RECIPE_ID);
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'public_discover_book_and_pay',
      )?.recipeId,
    ).toBe(PUBLIC_DISCOVER_BOOK_AND_PAY_RECIPE_ID);
  });

  it.each(
    DISCOVER_BOOK_AND_PAY_COMPOUND_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ),
  )(
    'decomposeDeterministicForSurface customer EN $id',
    ({ prompt, orderedActions, expectedParams }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(DISCOVER_BOOK_AND_PAY_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.maxPrice) {
        expect(result?.steps[0].params.maxPrice).toBe(expectedParams.maxPrice);
      }
    },
  );

  it.each(
    DISCOVER_BOOK_AND_PAY_COMPOUND_PROMPTS.filter(
      (row) => row.surface === 'public',
    ),
  )(
    'decomposeDeterministicForSurface public EN $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('public', prompt);
      expect(result?.recipeId).toBe(PUBLIC_DISCOVER_BOOK_AND_PAY_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it.each(DISCOVER_BOOK_AND_PAY_MULTILINGUAL_SCENARIOS.slice(0, 4))(
    'decomposeDeterministicForSurface i18n $id',
    ({ prompt, surface, orderedActions }) => {
      const result = decomposeDeterministicForSurface(surface, prompt);
      const recipeId =
        surface === 'public'
          ? PUBLIC_DISCOVER_BOOK_AND_PAY_RECIPE_ID
          : DISCOVER_BOOK_AND_PAY_RECIPE_ID;
      expect(result?.recipeId).toBe(recipeId);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it('budget-only compound does not route to discover_book_and_pay', () => {
    const prompt = 'Book a haircut under $50 tomorrow, nearest slot';
    expect(isBudgetServiceDiscoveryCompoundPrompt(prompt)).toBe(true);
    const result = decomposeDeterministicForSurface('customer', prompt);
    expect(result?.recipeId).toBe('customer_budget_service_discovery_compound');
  });

  it.each(DISCOVER_BOOK_AND_PAY_CUSTOMER_PROMPTS.slice(0, 2))(
    'wins over budget service discovery when payment present $id',
    ({ prompt }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(DISCOVER_BOOK_AND_PAY_RECIPE_ID);
      expect(result?.steps).toHaveLength(4);
    },
  );
});
