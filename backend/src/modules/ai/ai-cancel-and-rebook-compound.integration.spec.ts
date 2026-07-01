import { CANCEL_AND_REBOOK_CUSTOMER_PROMPTS } from './ai-cancel-and-rebook-compound.fixtures.js';
import { CANCEL_AND_REBOOK_MULTILINGUAL_SCENARIOS } from './ai-cancel-and-rebook-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
  isCompoundPrompt,
} from './intent-decomposition.util.js';
import { CANCEL_AND_REBOOK_RECIPE_ID } from './ai-cancel-and-rebook-compound.util.js';
import { isCancelMyBookingPrompt } from './ai-self-service-booking.util.js';

describe('AiCancelAndRebookCompound integration (ai-cmd-customer-4.8.3)', () => {
  it('registers customer_cancel_and_rebook golden pattern', () => {
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'customer_cancel_and_rebook',
      )?.recipeId,
    ).toBe(CANCEL_AND_REBOOK_RECIPE_ID);
  });

  it.each(CANCEL_AND_REBOOK_CUSTOMER_PROMPTS)(
    'decomposeDeterministicForSurface customer EN $id',
    ({ prompt, orderedActions, expectedParams }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(CANCEL_AND_REBOOK_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      if (expectedParams?.serviceName) {
        expect(result?.steps[0].params.serviceName).toBe(
          expectedParams.serviceName,
        );
      }
    },
  );

  it.each(CANCEL_AND_REBOOK_MULTILINGUAL_SCENARIOS)(
    'decomposeDeterministicForSurface i18n $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(CANCEL_AND_REBOOK_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it('cancel-only does not route to cancel_and_rebook', () => {
    const prompt = 'Cancel my booking';
    expect(isCancelMyBookingPrompt(prompt)).toBe(true);
    const result = decomposeDeterministicForSurface('customer', prompt);
    expect(result?.recipeId).not.toBe(CANCEL_AND_REBOOK_RECIPE_ID);
  });

  it.each(CANCEL_AND_REBOOK_CUSTOMER_PROMPTS.slice(0, 2))(
    'wins over single cancel when book present $id',
    ({ prompt }) => {
      expect(isCancelMyBookingPrompt(prompt)).toBe(false);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(CANCEL_AND_REBOOK_RECIPE_ID);
      expect(result?.steps).toHaveLength(2);
    },
  );
});
