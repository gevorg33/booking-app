import {
  GUEST_PAY_CASH_MANAGE_COMPOUND_PROMPTS,
  GUEST_PAY_CASH_MANAGE_NEGATIVE_PROMPTS,
  GUEST_PAY_CASH_MANAGE_RESCUE_SCENARIOS,
} from './ai-guest-pay-cash-manage-compound.fixtures.js';
import { GUEST_PAY_CASH_MANAGE_MULTILINGUAL_SCENARIOS } from './ai-guest-pay-cash-manage-compound-multilingual.fixtures.js';
import {
  buildGuestPayCashManageCompoundParams,
  decomposeGuestPayCashManageCompoundPrompt,
  isGuestPayCashManageCompoundPrompt,
  rescueGuestPayCashManageCompoundIntent,
} from './ai-guest-pay-cash-manage-compound.util.js';
import { isGuestBookAndManageCompoundPrompt } from './ai-guest-book-and-manage-compound.util.js';

describe('ai-guest-pay-cash-manage-compound.util (ai-cmd-customer-4.21.6)', () => {
  it.each(GUEST_PAY_CASH_MANAGE_COMPOUND_PROMPTS)(
    'isGuestPayCashManageCompoundPrompt $id',
    ({ prompt }) => {
      expect(isGuestPayCashManageCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(GUEST_PAY_CASH_MANAGE_COMPOUND_PROMPTS)(
    'decomposeGuestPayCashManageCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeGuestPayCashManageCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps[0]?.params.guestCheckout).toBe(true);
      expect(steps[1]?.params.paymentMethod).toBe('cash');
      expect(steps[1]?.params.continueAfterGuestBook).toBe(true);
      expect(steps[2]?.params.guestLookup).toBe(true);
      expect(steps[2]?.params.continueAfterCashPayment).toBe(true);
      if (expectedParams?.email) {
        expect(steps[2]?.params.email).toBe(expectedParams.email);
      }
      if (expectedParams?.delivery) {
        expect(steps[2]?.params.delivery).toBe(expectedParams.delivery);
      }
    },
  );

  it.each(GUEST_PAY_CASH_MANAGE_MULTILINGUAL_SCENARIOS)(
    'decomposeGuestPayCashManageCompoundPrompt multilingual $id',
    ({ prompt, orderedActions }) => {
      const steps = decomposeGuestPayCashManageCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(GUEST_PAY_CASH_MANAGE_RESCUE_SCENARIOS)(
    'rescueGuestPayCashManageCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueGuestPayCashManageCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'guest_pay_cash_manage_compound',
      });
    },
  );

  it.each(GUEST_PAY_CASH_MANAGE_NEGATIVE_PROMPTS)(
    'negative prompt $id is not compound',
    ({ prompt }) => {
      expect(isGuestPayCashManageCompoundPrompt(prompt)).toBe(false);
      expect(decomposeGuestPayCashManageCompoundPrompt(prompt)).toEqual([]);
    },
  );

  it('guest book + manage without cash stays on guest_book_and_manage', () => {
    const prompt = 'Book as guest and email me the manage link';
    expect(isGuestPayCashManageCompoundPrompt(prompt)).toBe(false);
    expect(isGuestBookAndManageCompoundPrompt(prompt)).toBe(true);
  });

  it('buildGuestPayCashManageCompoundParams extracts email and delivery', () => {
    const params = buildGuestPayCashManageCompoundParams(
      'Book haircut as guest, pay cash at visit, email manage link to john@example.com',
    );
    expect(params.guestCheckout).toBe(true);
    expect(params.paymentMethod).toBe('cash');
    expect(params.email).toBe('john@example.com');
    expect(params.delivery).toBe('email');
    expect(params.serviceName).toBe('haircut');
  });

  it('rescueGuestPayCashManageCompoundIntent returns null for non-compound', () => {
    expect(
      rescueGuestPayCashManageCompoundIntent(
        'Get manage link for my booking',
        'get_manage_link',
      ),
    ).toBeNull();
  });
});
