import {
  EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS,
  EXPLAIN_DEPOSIT_FORFEITURE_RESCUE_SCENARIOS,
} from './ai-explain-deposit-forfeiture.fixtures.js';
import { EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_SCENARIOS } from './ai-explain-deposit-forfeiture-multilingual.fixtures.js';
import {
  isExplainDepositForfeitureIntent,
  isExplainDepositForfeiturePrompt,
  parseExplainDepositForfeitureFromPrompt,
  rescueExplainDepositForfeitureIntent,
} from './ai-explain-deposit-forfeiture.util.js';
import { isExplainCancelPolicyPrompt } from './ai-explain-cancel-policy.util.js';
import {
  isExplainWhyPrepaymentPrompt,
  rescueExplainPrepaymentIntent,
} from './ai-explain-prepayment.util.js';
import { isExplainCheckoutCurrencyPrompt } from './ai-checkout-currency.util.js';
import { isExplainWhyStripeRequiredPrompt } from './ai-payments.util.js';

describe('ai-explain-deposit-forfeiture.util (ai-cmd-customer-4.20.2)', () => {
  it.each(EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS)(
    'detects prompt $id',
    ({ prompt }) => {
      expect(isExplainDepositForfeiturePrompt(prompt)).toBe(true);
      expect(parseExplainDepositForfeitureFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(EXPLAIN_DEPOSIT_FORFEITURE_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt }) => {
      expect(isExplainDepositForfeiturePrompt(prompt)).toBe(true);
    },
  );

  it.each(EXPLAIN_DEPOSIT_FORFEITURE_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainDepositForfeitureIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'deposit_forfeiture',
      });
    },
  );

  it('does not steal general cancel policy prompts', () => {
    expect(
      isExplainDepositForfeiturePrompt('Explain the cancellation policy'),
    ).toBe(false);
    expect(isExplainCancelPolicyPrompt('Explain the cancellation policy')).toBe(
      true,
    );
    expect(
      isExplainDepositForfeiturePrompt('How much notice do I need to cancel?'),
    ).toBe(false);
  });

  it('does not steal amount-due prompts', () => {
    expect(isExplainDepositForfeiturePrompt('How much do I pay today?')).toBe(
      false,
    );
    expect(
      isExplainDepositForfeiturePrompt('Is the 50% deposit $40 for facial?'),
    ).toBe(false);
  });

  it('parses bookingId from params', () => {
    expect(
      parseExplainDepositForfeitureFromPrompt(
        'Do I lose my deposit if I cancel?',
        {
          bookingId: 'book-1',
        },
      ),
    ).toEqual({ bookingId: 'book-1' });
  });

  it('recognizes explain_deposit_forfeiture intent', () => {
    expect(isExplainDepositForfeitureIntent('explain_deposit_forfeiture')).toBe(
      true,
    );
    expect(isExplainDepositForfeitureIntent('explain_cancel_policy')).toBe(
      false,
    );
  });

  it('returns null rescue when already classified correctly', () => {
    expect(
      rescueExplainDepositForfeitureIntent(
        'Do I lose my deposit if I cancel?',
        'explain_deposit_forfeiture',
      ),
    ).toBeNull();
  });

  it('detects heuristic multilingual deposit forfeiture cues', () => {
    expect(
      isExplainDepositForfeiturePrompt('вернут депозит если отменю сейчас'),
    ).toBe(true);
  });

  it.each([
    {
      id: 'e2e113-why-pay-deposit-to-book',
      prompt: 'why do I have to pay a deposit to book?',
      misclassified: 'explain_checkout_currency',
    },
    {
      id: 'e2e113-deposit-forfeiture-policy-late',
      prompt: 'explain the deposit forfeiture policy if I cancel late',
      misclassified: 'explain_why_stripe_required',
    },
  ] as const)(
    'e2e-bug.113 routes $id away from currency/stripe steals',
    ({ prompt, misclassified }) => {
      expect(isExplainDepositForfeiturePrompt(prompt)).toBe(true);
      expect(isExplainCheckoutCurrencyPrompt(prompt)).toBe(false);
      expect(isExplainWhyPrepaymentPrompt(prompt)).toBe(false);
      expect(isExplainWhyStripeRequiredPrompt(prompt)).toBe(false);
      expect(rescueExplainPrepaymentIntent(prompt, misclassified)).toBeNull();
      expect(
        rescueExplainDepositForfeitureIntent(prompt, misclassified),
      ).toEqual({
        action: 'explain_deposit_forfeiture',
        rescueReason: 'deposit_forfeiture',
      });
    },
  );

  it('does not steal named-service why-deposit prompts from why-stripe', () => {
    expect(
      isExplainDepositForfeiturePrompt('Why is there a deposit for facial?'),
    ).toBe(false);
    expect(
      isExplainWhyPrepaymentPrompt('Why is there a deposit for facial?'),
    ).toBe(true);
  });
});
