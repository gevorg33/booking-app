import { GUEST_BOOK_AND_MANAGE_CUSTOMER_PROMPTS } from './ai-guest-book-and-manage-compound.fixtures.js';
import { GUEST_BOOK_AND_MANAGE_MULTILINGUAL_SCENARIOS } from './ai-guest-book-and-manage-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
  isCompoundPrompt,
} from './intent-decomposition.util.js';
import {
  GUEST_BOOK_AND_MANAGE_RECIPE_ID,
  isGuestBookAndManageCompoundPrompt,
} from './ai-guest-book-and-manage-compound.util.js';

describe('ai-guest-book-and-manage-compound integration (ai-cmd-customer-4.8.6)', () => {
  it('registers customer_guest_book_and_manage golden pattern', () => {
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'customer_guest_book_and_manage',
      )?.recipeId,
    ).toBe(GUEST_BOOK_AND_MANAGE_RECIPE_ID);
  });

  it.each(GUEST_BOOK_AND_MANAGE_CUSTOMER_PROMPTS)(
    'decomposeDeterministicForSurface customer EN $id',
    ({ prompt, orderedActions, expectedParams }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(GUEST_BOOK_AND_MANAGE_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      expect(result?.steps[0]?.params.guestCheckout).toBe(true);
      if (expectedParams?.email) {
        expect(result?.steps[1]?.params.email).toBe(expectedParams.email);
      }
    },
  );

  it.each(GUEST_BOOK_AND_MANAGE_MULTILINGUAL_SCENARIOS)(
    'decomposeDeterministicForSurface multilingual $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(GUEST_BOOK_AND_MANAGE_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it('already-booked prompt does not route to guest_book_and_manage', () => {
    const prompt =
      'I booked as a guest — email me the manage link at mia@salon.com';
    expect(isGuestBookAndManageCompoundPrompt(prompt)).toBe(false);
    expect(
      decomposeDeterministicForSurface('customer', prompt)?.recipeId,
    ).not.toBe(GUEST_BOOK_AND_MANAGE_RECIPE_ID);
  });

  it.each(GUEST_BOOK_AND_MANAGE_CUSTOMER_PROMPTS.slice(0, 2))(
    'isCompoundPrompt $id',
    ({ prompt }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
    },
  );
});
