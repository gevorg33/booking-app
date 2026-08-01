import {
  isExplainGuestCheckoutFieldsPrompt,
  isGuestCheckoutMutateCompoundPrompt,
  rescueExplainGuestCheckoutFieldsIntent,
} from './ai-explain-guest-checkout-fields.util.js';
import {
  decomposeGuestBookAndManageCompoundPrompt,
  isGuestBookAndManageCompoundPrompt,
  rescueGuestBookAndManageCompoundIntent,
} from './ai-guest-book-and-manage-compound.util.js';
import {
  decomposeGuestPayCashManageCompoundPrompt,
  isGuestPayCashManageCompoundPrompt,
  rescueGuestPayCashManageCompoundIntent,
} from './ai-guest-pay-cash-manage-compound.util.js';
import {
  E2E203_COMPOUND_MUST_WIN,
  E2E203_FAQ_MUST_STAY,
} from './ai-e2e203-guest-manage-explain-steal.fixtures.js';

describe('e2e-bug.203 guest manage compounds vs explain_guest_checkout_fields', () => {
  it.each(E2E203_COMPOUND_MUST_WIN.map((row) => [row.id, row] as const))(
    'compound wins over FAQ for $id',
    (_id, row) => {
      expect(isGuestCheckoutMutateCompoundPrompt(row.prompt)).toBe(true);
      expect(isExplainGuestCheckoutFieldsPrompt(row.prompt)).toBe(false);
      expect(
        rescueExplainGuestCheckoutFieldsIntent(row.prompt, 'unknown'),
      ).toBeNull();

      if (row.expectCompound === 'guest_book_and_manage') {
        expect(isGuestBookAndManageCompoundPrompt(row.prompt)).toBe(true);
        expect(isGuestPayCashManageCompoundPrompt(row.prompt)).toBe(false);
        expect(
          decomposeGuestBookAndManageCompoundPrompt(row.prompt).map(
            (s) => s.action,
          ),
        ).toEqual([...row.expectOrderedActions]);
        expect(
          rescueGuestBookAndManageCompoundIntent(
            row.prompt,
            'explain_guest_checkout_fields',
          ),
        ).toEqual({
          action: 'compound_intent',
          rescueReason: 'guest_book_and_manage_compound',
        });
      } else {
        expect(isGuestPayCashManageCompoundPrompt(row.prompt)).toBe(true);
        expect(isGuestBookAndManageCompoundPrompt(row.prompt)).toBe(false);
        expect(
          decomposeGuestPayCashManageCompoundPrompt(row.prompt).map(
            (s) => s.action,
          ),
        ).toEqual([...row.expectOrderedActions]);
        expect(
          rescueGuestPayCashManageCompoundIntent(
            row.prompt,
            'explain_guest_checkout_fields',
          ),
        ).toEqual({
          action: 'compound_intent',
          rescueReason: 'guest_pay_cash_manage_compound',
        });
      }
    },
  );

  it.each(E2E203_FAQ_MUST_STAY.map((row) => [row.id, row] as const))(
    'FAQ stays FAQ for %s',
    (id, row) => {
      expect(isGuestCheckoutMutateCompoundPrompt(row.prompt)).toBe(false);
      expect(isGuestBookAndManageCompoundPrompt(row.prompt)).toBe(false);
      expect(isGuestPayCashManageCompoundPrompt(row.prompt)).toBe(false);
      expect({
        id,
        explain: isExplainGuestCheckoutFieldsPrompt(row.prompt),
      }).toEqual({ id, explain: true });
      expect(
        rescueExplainGuestCheckoutFieldsIntent(row.prompt, 'unknown')?.action,
      ).toBe('explain_guest_checkout_fields');
    },
  );
});
