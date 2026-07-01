import { TOUR_GROUP_CHECKOUT_COMPOUND_PROMPTS } from './ai-tour-group-checkout-compound.fixtures.js';
import { TOUR_GROUP_CHECKOUT_MULTILINGUAL_SCENARIOS } from './ai-tour-group-checkout-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
  isCompoundPrompt,
} from './intent-decomposition.util.js';
import {
  TOUR_GROUP_CHECKOUT_RECIPE_ID,
  PUBLIC_TOUR_GROUP_CHECKOUT_RECIPE_ID,
} from './ai-tour-group-checkout-compound.util.js';
import { isBookTourNearestDepartureCompoundPrompt } from './ai-book-tour-nearest-departure.util.js';

describe('ai-tour-group-checkout-compound integration (ai-cmd-customer-4.21.2)', () => {
  it('registers customer and public golden patterns', () => {
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'customer_tour_group_checkout',
      )?.recipeId,
    ).toBe(TOUR_GROUP_CHECKOUT_RECIPE_ID);
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'public_tour_group_checkout',
      )?.recipeId,
    ).toBe(PUBLIC_TOUR_GROUP_CHECKOUT_RECIPE_ID);
  });

  it.each(
    TOUR_GROUP_CHECKOUT_COMPOUND_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ),
  )(
    'decomposeDeterministicForSurface customer EN $id',
    ({ prompt, orderedActions, paxCount }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(TOUR_GROUP_CHECKOUT_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      expect(result?.steps[0]?.params.tourGroupCheckout).toBe(true);
      expect(result?.steps[0]?.params.paxCount).toBe(paxCount);
      expect(result?.steps[2]?.params.continueAfterCapacityCheck).toBe(true);
    },
  );

  it.each(
    TOUR_GROUP_CHECKOUT_COMPOUND_PROMPTS.filter(
      (row) => row.surface === 'public',
    ),
  )(
    'decomposeDeterministicForSurface public EN $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('public', prompt);
      expect(result?.recipeId).toBe(PUBLIC_TOUR_GROUP_CHECKOUT_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it.each(TOUR_GROUP_CHECKOUT_MULTILINGUAL_SCENARIOS)(
    'decomposeDeterministicForSurface i18n $id',
    ({ prompt, surface, orderedActions }) => {
      const result = decomposeDeterministicForSurface(surface, prompt);
      const recipeId =
        surface === 'public'
          ? PUBLIC_TOUR_GROUP_CHECKOUT_RECIPE_ID
          : TOUR_GROUP_CHECKOUT_RECIPE_ID;
      expect(result?.recipeId).toBe(recipeId);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it('wins over book_tour_nearest_departure when capacity gate is present', () => {
    const prompt = 'Wine tour for 6 next Saturday — book if enough seats';
    expect(isBookTourNearestDepartureCompoundPrompt(prompt)).toBe(false);
    const result = decomposeDeterministicForSurface('customer', prompt);
    expect(result?.recipeId).toBe(TOUR_GROUP_CHECKOUT_RECIPE_ID);
    expect(result?.steps).toHaveLength(3);
  });
});
