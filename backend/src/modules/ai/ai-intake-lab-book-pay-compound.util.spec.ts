import {
  INTAKE_LAB_BOOK_PAY_COMPOUND_PROMPTS,
  INTAKE_LAB_BOOK_PAY_NEGATIVE_PROMPTS,
  INTAKE_LAB_BOOK_PAY_RESCUE_SCENARIOS,
} from './ai-intake-lab-book-pay-compound.fixtures.js';
import { INTAKE_LAB_BOOK_PAY_MULTILINGUAL_SCENARIOS } from './ai-intake-lab-book-pay-compound-multilingual.fixtures.js';
import { isCompleteIntakeAndBookCompoundPrompt } from './ai-complete-intake-and-book.util.js';
import { isDiscoverBookAndPayCompoundPrompt } from './ai-discover-book-and-pay-compound.util.js';
import {
  decomposeCustomerIntakeLabBookPayCompoundPrompt,
  decomposePublicIntakeLabBookPayCompoundPrompt,
  hasIntakeLabBookPayPaymentCue,
  isIntakeLabBookPayCompoundPrompt,
  rescueIntakeLabBookPayCompoundIntent,
  resolveIntakeLabBookPayPaymentAction,
} from './ai-intake-lab-book-pay-compound.util.js';

describe('ai-intake-lab-book-pay-compound.util (ai-cmd-customer-4.21.1)', () => {
  it.each(INTAKE_LAB_BOOK_PAY_COMPOUND_PROMPTS)(
    'detects intake_lab_book_pay compound for $id',
    ({ prompt, orderedActions, paymentAction }) => {
      expect(isIntakeLabBookPayCompoundPrompt(prompt)).toBe(true);
      expect(hasIntakeLabBookPayPaymentCue(prompt)).toBe(true);
      const decompose =
        orderedActions[1] === 'book_appointment'
          ? decomposePublicIntakeLabBookPayCompoundPrompt(prompt)
          : decomposeCustomerIntakeLabBookPayCompoundPrompt(prompt);
      expect(decompose.map((step) => step.action)).toEqual([...orderedActions]);
      const expectedMethod =
        paymentAction === 'pay_cash_at_visit'
          ? 'cash'
          : paymentAction === 'pay_online'
            ? 'online'
            : undefined;
      expect(decompose[2]?.params.paymentMethod).toBe(expectedMethod);
    },
  );

  it.each(INTAKE_LAB_BOOK_PAY_MULTILINGUAL_SCENARIOS)(
    'detects multilingual compound $id',
    ({ prompt, orderedActions, surface }) => {
      expect(isIntakeLabBookPayCompoundPrompt(prompt)).toBe(true);
      const decompose =
        surface === 'public'
          ? decomposePublicIntakeLabBookPayCompoundPrompt(prompt)
          : decomposeCustomerIntakeLabBookPayCompoundPrompt(prompt);
      expect(decompose.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(INTAKE_LAB_BOOK_PAY_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueIntakeLabBookPayCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'intake_lab_book_pay_compound',
      });
    },
  );

  it.each(INTAKE_LAB_BOOK_PAY_NEGATIVE_PROMPTS)(
    'does not steal $id',
    ({ prompt }) => {
      expect(isIntakeLabBookPayCompoundPrompt(prompt)).toBe(false);
    },
  );

  it('two-step intake+book without payment stays on complete_intake_and_book', () => {
    const prompt = 'Fill intake and book blood draw';
    expect(isIntakeLabBookPayCompoundPrompt(prompt)).toBe(false);
    expect(isCompleteIntakeAndBookCompoundPrompt(prompt)).toBe(true);
  });

  it('does not overlap discover_book_and_pay', () => {
    const prompt = 'Book cheapest massage under $60 tomorrow and pay online';
    expect(isDiscoverBookAndPayCompoundPrompt(prompt)).toBe(true);
    expect(isIntakeLabBookPayCompoundPrompt(prompt)).toBe(false);
  });

  it('defaults payment action to pay_online for deposit phrasing', () => {
    expect(
      resolveIntakeLabBookPayPaymentAction(
        'Complete health form, book earliest blood draw, pay deposit',
      ),
    ).toBe('pay_online');
  });

  it('resolves choose_payment_method when user asks for payment options', () => {
    expect(
      resolveIntakeLabBookPayPaymentAction(
        'Fill intake and book blood draw; choose payment method at checkout',
      ),
    ).toBe('choose_payment_method');
  });

  it('uses heuristic intake+lab+pay detection outside fixtures', () => {
    const prompt =
      'Complete health questionnaire then schedule blood work and pay online';
    expect(isIntakeLabBookPayCompoundPrompt(prompt)).toBe(true);
    expect(
      decomposeCustomerIntakeLabBookPayCompoundPrompt(prompt),
    ).toHaveLength(3);
  });

  it('returns null rescue when already compound_intent', () => {
    expect(
      rescueIntakeLabBookPayCompoundIntent(
        'Fill intake and book blood draw, pay online',
        'compound_intent',
      ),
    ).toBeNull();
  });
});
