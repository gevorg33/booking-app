import { GUEST_PAY_CASH_MANAGE_COMPOUND_PROMPTS } from './ai-guest-pay-cash-manage-compound.fixtures.js';
import { GUEST_PAY_CASH_MANAGE_MULTILINGUAL_SCENARIOS } from './ai-guest-pay-cash-manage-compound-multilingual.fixtures.js';
import {
  decomposeDeterministicForSurface,
  GOLDEN_COMPOUND_PATTERNS,
  isCompoundPrompt,
} from './intent-decomposition.util.js';
import {
  GUEST_PAY_CASH_MANAGE_RECIPE_ID,
  isGuestPayCashManageCompoundPrompt,
} from './ai-guest-pay-cash-manage-compound.util.js';
import { isGuestBookAndManageCompoundPrompt } from './ai-guest-book-and-manage-compound.util.js';

describe('ai-guest-pay-cash-manage-compound integration (ai-cmd-customer-4.21.6)', () => {
  it('registers customer_guest_pay_cash_manage golden pattern', () => {
    expect(
      GOLDEN_COMPOUND_PATTERNS.find(
        (row) => row.id === 'customer_guest_pay_cash_manage',
      )?.recipeId,
    ).toBe(GUEST_PAY_CASH_MANAGE_RECIPE_ID);
  });

  it.each(GUEST_PAY_CASH_MANAGE_COMPOUND_PROMPTS)(
    'decomposeDeterministicForSurface customer EN $id',
    ({ prompt, orderedActions, expectedParams }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(GUEST_PAY_CASH_MANAGE_RECIPE_ID);
      expect(result?.source).toBe('golden');
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
      expect(result?.steps[0]?.params.guestCheckout).toBe(true);
      expect(result?.steps[1]?.params.paymentMethod).toBe('cash');
      expect(result?.steps[2]?.params.guestLookup).toBe(true);
      if (expectedParams?.email) {
        expect(result?.steps[2]?.params.email).toBe(expectedParams.email);
      }
    },
  );

  it.each(GUEST_PAY_CASH_MANAGE_MULTILINGUAL_SCENARIOS)(
    'decomposeDeterministicForSurface multilingual $id',
    ({ prompt, orderedActions }) => {
      const result = decomposeDeterministicForSurface('customer', prompt);
      expect(result?.recipeId).toBe(GUEST_PAY_CASH_MANAGE_RECIPE_ID);
      expect(result?.steps.map((step) => step.action)).toEqual([
        ...orderedActions,
      ]);
    },
  );

  it('already-booked prompt does not route to guest_pay_cash_manage', () => {
    const prompt =
      'I booked as a guest — pay at visit and email me the manage link at mia@salon.com';
    expect(isGuestPayCashManageCompoundPrompt(prompt)).toBe(false);
    expect(
      decomposeDeterministicForSurface('customer', prompt)?.recipeId,
    ).not.toBe(GUEST_PAY_CASH_MANAGE_RECIPE_ID);
  });

  it('guest book + manage without cash stays on guest_book_and_manage', () => {
    const prompt = 'Book as guest and email me the manage link';
    expect(isGuestPayCashManageCompoundPrompt(prompt)).toBe(false);
    expect(isGuestBookAndManageCompoundPrompt(prompt)).toBe(true);
  });

  it.each(GUEST_PAY_CASH_MANAGE_COMPOUND_PROMPTS.slice(0, 2))(
    'isCompoundPrompt $id',
    ({ prompt }) => {
      expect(isCompoundPrompt(prompt)).toBe(true);
    },
  );
});
