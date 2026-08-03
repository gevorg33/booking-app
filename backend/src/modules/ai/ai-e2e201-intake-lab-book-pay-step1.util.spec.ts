import { handleCompleteIntakeAndBookLogic } from './ai-complete-intake-and-book.logic.js';
import {
  isCompleteIntakeAndBookCompoundPrompt,
  isCompleteIntakeAndBookCorePrompt,
} from './ai-complete-intake-and-book.util.js';
import {
  E2E201_CONTROL_NO_PAY,
  E2E201_PAY_BEARING_PROMPTS,
  INTAKE_CLARIFY,
} from './ai-e2e201-intake-lab-book-pay-step1.fixtures.js';
import {
  decomposeCustomerIntakeLabBookPayCompoundPrompt,
  isIntakeLabBookPayCompoundPrompt,
} from './ai-intake-lab-book-pay-compound.util.js';
import { hasIntakeLabBookPayPaymentCue } from './ai-intake-lab-book-pay-payment-cue.util.js';

describe('e2e-bug.201 intake_lab_book_pay step1 payment-cue bypass', () => {
  const clinicBusiness = {
    id: 'biz-1',
    slug: 'clinic',
    settings: { businessType: 'clinic' },
  };
  const labService = {
    id: 'svc-lab-1',
    name: 'Blood Draw',
    metadata: { serviceType: 'lab_test' },
  };

  function buildDeps() {
    return {
      businessRepo: {
        findOne: jest.fn().mockResolvedValue(clinicBusiness),
      },
      serviceService: {
        findAll: jest.fn().mockResolvedValue([labService]),
      },
      publicPreVisitIntakeService: {
        ensureCustomerDraft: jest.fn().mockResolvedValue({
          id: 'intake-1',
          status: 'assigned',
          questionnaire: { title: 'Lab Intake' },
        }),
      },
    };
  }

  it.each(E2E201_PAY_BEARING_PROMPTS.map((row) => [row.id, row] as const))(
    'routes $id to intake_lab_book_pay with seeded completeIntakeAndBook',
    (_id, row) => {
      expect(hasIntakeLabBookPayPaymentCue(row.prompt)).toBe(true);
      expect(isCompleteIntakeAndBookCompoundPrompt(row.prompt)).toBe(false);
      expect(isCompleteIntakeAndBookCorePrompt(row.prompt)).toBe(true);
      expect(isIntakeLabBookPayCompoundPrompt(row.prompt)).toBe(true);

      const steps = decomposeCustomerIntakeLabBookPayCompoundPrompt(row.prompt);
      expect(steps.map((s) => s.action)).toEqual([
        'complete_intake_and_book',
        'book_nearest_slot',
        expect.stringMatching(/^pay_|choose_payment/),
      ]);
      expect(steps[0]?.params.completeIntakeAndBook).toBe(true);
    },
  );

  it.each(E2E201_PAY_BEARING_PROMPTS.map((row) => [row.id, row] as const))(
    'handler: unseeded $id clarifies; seeded succeeds',
    async (_id, row) => {
      const unseeded = await handleCompleteIntakeAndBookLogic(
        buildDeps(),
        'biz-1',
        { sessionCustomerId: 'cust-1' },
        row.prompt,
      );
      expect(unseeded.success).toBe(false);
      expect(INTAKE_CLARIFY.test(String(unseeded.summary))).toBe(true);

      const seeded = await handleCompleteIntakeAndBookLogic(
        buildDeps(),
        'biz-1',
        { sessionCustomerId: 'cust-1', completeIntakeAndBook: true },
        row.prompt,
      );
      expect(seeded.success).toBe(true);
      expect(seeded.action).toBe('complete_intake_and_book');
      expect(INTAKE_CLARIFY.test(String(seeded.summary))).toBe(false);
    },
  );

  it.each(E2E201_CONTROL_NO_PAY.map((row) => [row.id, row] as const))(
    'control $id',
    (_id, row) => {
      expect(isCompleteIntakeAndBookCompoundPrompt(row.prompt)).toBe(
        row.expectCompleteIntakeCompound,
      );
      expect(isIntakeLabBookPayCompoundPrompt(row.prompt)).toBe(
        row.expectIntakeLabBookPay,
      );
    },
  );
});
