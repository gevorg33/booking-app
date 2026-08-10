/**
 * e2e-bug.414 — does the customer surface actually apply the rescues it proposes?
 *
 * The corpus said no: `action_changed_by = 'rescue'` is zero across 3,703
 * customer traces. §136 reported that, and §138 found it was an artefact — the
 * only customer rows carrying a pipeline trace were the `blocked` branch, so
 * every one of them has action `unknown` and *cannot* show an action change.
 *
 * This settles it by running the real pipeline instead of reading the column:
 * the prompts below are verbatim from production traces that recorded
 * `confirm_my_booking_details`, an action whose own siblings' classifier rules
 * say "NOT confirm_my_booking_details" in as many words. Driven with the
 * classifier output production recorded, the pipeline rescues every one of them.
 */
import {
  buildCustomerUnderstandMock,
  resetCustomerUnderstandingHarness,
} from './customer-ai-command.integration.harness.js';

jest.setTimeout(120_000);

afterAll(async () => {
  await resetCustomerUnderstandingHarness();
});

/** Verbatim production prompts, with the action the detectors route them to. */
const STOLEN_BY_CONFIRM_MY_BOOKING_DETAILS: ReadonlyArray<
  readonly [prompt: string, expected: string]
> = [
  ['I want to leave a review for my last visit', 'leave_visit_review'],
  ['leave a 5 star review for my facemassage visit', 'leave_visit_review'],
  [
    'Explain why Stripe is required for this booking',
    'explain_why_stripe_required',
  ],
  ['I want to pay online for my facemassage booking', 'pay_online'],
];

describe('customer pipeline applies rescue (e2e-bug.414)', () => {
  it.each(STOLEN_BY_CONFIRM_MY_BOOKING_DETAILS)(
    'rescues %s away from confirm_my_booking_details',
    async (prompt, expected) => {
      const understanding = buildCustomerUnderstandMock();
      const result = await understanding.understand({
        businessId: 'biz-1',
        effectivePrompt: prompt,
        confidence: { low: 0.65, high: 0.82 },
        sessionContext: {},
        // What production's classifier actually produced for these traces.
        classify: () =>
          Promise.resolve({
            action: 'confirm_my_booking_details',
            params: {},
            reasoning: 'replay of the recorded classification',
            confidence: 0.9,
          }),
      });

      expect((result as { action: string }).action).toBe(expected);
    },
  );
});
