/**
 * e2e-bug.201 — intake_lab_book_pay step 1 must not die on
 * complete_intake_and_book's payment-cue steal-prevention when the compound
 * already seeded completeIntakeAndBook.
 */

export type E2E201PayPromptCase = {
  id: string;
  prompt: string;
  expectCompound: true;
  /** Without seed, handler must clarify-reject payment-bearing prompts. */
  expectUnseededClarify: true;
};

export const E2E201_PAY_BEARING_PROMPTS: readonly E2E201PayPromptCase[] = [
  {
    id: 'fill-intake-pay-online',
    prompt: 'Fill intake and book blood draw, pay online',
    expectCompound: true,
    expectUnseededClarify: true,
  },
  {
    id: 'complete-health-pay-deposit',
    prompt: 'Complete health form, book earliest blood draw, pay deposit',
    expectCompound: true,
    expectUnseededClarify: true,
  },
  {
    id: 'fill-intake-pay-cash',
    prompt:
      'fill my intake, book the soonest blood test slot, and pay cash at the visit',
    expectCompound: true,
    expectUnseededClarify: true,
  },
  {
    id: 'finish-questionnaire-pay-card',
    prompt: 'Finish questionnaire and book CBC, pay with card',
    expectCompound: true,
    expectUnseededClarify: true,
  },
];

export const E2E201_CONTROL_NO_PAY = [
  {
    id: 'standalone-intake-book',
    prompt: 'Fill intake and book blood draw',
    expectCompleteIntakeCompound: true,
    expectIntakeLabBookPay: false,
  },
  {
    id: 'pay-only',
    prompt: 'Pay online for my booking',
    expectCompleteIntakeCompound: false,
    expectIntakeLabBookPay: false,
  },
] as const;

export const INTAKE_CLARIFY =
  /Ask to fill the pre-visit intake and book a lab test/i;
