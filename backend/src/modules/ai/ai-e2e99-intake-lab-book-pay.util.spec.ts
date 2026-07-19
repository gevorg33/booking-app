import {
  decomposeCustomerIntakeLabBookPayCompoundPrompt,
  isIntakeLabBookPayCompoundPrompt,
  rescueIntakeLabBookPayCompoundIntent,
  resolveIntakeLabBookPayPaymentAction,
} from './ai-intake-lab-book-pay-compound.util.js';
import { isCompleteIntakeAndBookCorePrompt } from './ai-complete-intake-and-book.util.js';
import { hasIntakeLabBookPayPaymentCue } from './ai-intake-lab-book-pay-payment-cue.util.js';
import { decomposeDeterministicForSurface } from './intent-decomposition.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

/** Live audit phrasings that failed before e2e-bug.99 fix. */
const E2E99_INTAKE_LAB_CASH_SCENARIOS = [
  {
    id: 'e2e99-soonest-blood-test-pay-cash',
    prompt:
      'fill my intake, book the soonest blood test slot, and pay cash at the visit',
    misclassifiedAction: 'book_nearest_slot',
  },
  {
    id: 'e2e99-previsit-blood-test-pay-cash',
    prompt:
      'complete my pre-visit intake, book my blood test, and I will pay cash at the visit',
    misclassifiedAction: 'confirm_my_booking_details',
  },
] as const;

describe('e2e-bug.99 intake_lab_book_pay cash + blood test', () => {
  const rescue = new AiIntentRescueService();

  it.each(E2E99_INTAKE_LAB_CASH_SCENARIOS.map((row) => [row.id, row] as const))(
    'decomposes %s to intake → book → pay_cash_at_visit',
    (_id, row) => {
      expect(hasIntakeLabBookPayPaymentCue(row.prompt)).toBe(true);
      expect(isCompleteIntakeAndBookCorePrompt(row.prompt)).toBe(true);
      expect(isIntakeLabBookPayCompoundPrompt(row.prompt)).toBe(true);
      expect(resolveIntakeLabBookPayPaymentAction(row.prompt)).toBe(
        'pay_cash_at_visit',
      );

      const steps = decomposeCustomerIntakeLabBookPayCompoundPrompt(row.prompt);
      expect(steps.map((s) => s.action)).toEqual([
        'complete_intake_and_book',
        'book_nearest_slot',
        'pay_cash_at_visit',
      ]);
      expect(steps[2]?.params.paymentMethod).toBe('cash');

      const decomp = decomposeDeterministicForSurface('customer', row.prompt);
      expect(decomp?.recipeId).toBe('intake_lab_book_pay');
      expect(decomp?.steps.map((s) => s.action)).toEqual([
        'complete_intake_and_book',
        'book_nearest_slot',
        'pay_cash_at_visit',
      ]);
    },
  );

  it.each(E2E99_INTAKE_LAB_CASH_SCENARIOS.map((row) => [row.id, row] as const))(
    'rescues %s away from the live misroute',
    (_id, row) => {
      expect(
        rescueIntakeLabBookPayCompoundIntent(
          row.prompt,
          row.misclassifiedAction,
        ),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'intake_lab_book_pay_compound',
      });

      const rescued = rescue.rescue({
        prompt: row.prompt,
        action: row.misclassifiedAction,
        surface: 'customer',
        params: {},
      });
      expect(rescued?.rescued).toBe(true);
      expect(rescued?.action).toBe('compound_intent');
      expect(rescued?.rescueReason).toBe('intake_lab_book_pay_compound');
    },
  );
});
