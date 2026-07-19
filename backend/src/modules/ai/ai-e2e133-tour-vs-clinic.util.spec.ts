import {
  E2E133_CLINIC_WHEN_AVAILABLE_STILL_MATCH,
  E2E133_TOUR_VS_CLINIC_SCENARIOS,
} from './ai-e2e133-tour-vs-clinic.fixtures.js';
import {
  isExplainResultStatusPrompt,
  rescueConsumerClinicTestResultsIntent,
} from './ai-consumer-clinic-test-results.util.js';
import {
  decomposeCustomerTourGroupCheckoutCompoundPrompt,
  decomposePublicTourGroupCheckoutCompoundPrompt,
  isTourGroupCheckoutCompoundPrompt,
  rescueTourGroupCheckoutCompoundIntent,
} from './ai-tour-group-checkout-compound.util.js';
import { extractTourServiceNameFromBookingPrompt } from './ai-book-tour-nearest-departure.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('e2e-bug.133 tour booking vs clinic explain_result_status', () => {
  const rescue = new AiIntentRescueService();

  it.each(E2E133_TOUR_VS_CLINIC_SCENARIOS.map((s) => [s.id, s]))(
    'clinic detector must not match tour capacity prompt %s',
    (_id, row) => {
      expect(isExplainResultStatusPrompt(row.prompt)).toBe(false);
      expect(
        rescueConsumerClinicTestResultsIntent(row.prompt, 'unknown'),
      ).toBeNull();
    },
  );

  it.each(E2E133_TOUR_VS_CLINIC_SCENARIOS.map((s) => [s.id, s]))(
    'tour_group_checkout detects and extracts %s',
    (_id, row) => {
      expect(isTourGroupCheckoutCompoundPrompt(row.prompt)).toBe(true);
      expect(
        rescueTourGroupCheckoutCompoundIntent(
          row.prompt,
          row.misclassifiedAction,
        ),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'tour_group_checkout_compound',
      });
      expect(extractTourServiceNameFromBookingPrompt(row.prompt)).toBe(
        row.expectedServiceName,
      );
      const steps =
        row.surface === 'public'
          ? decomposePublicTourGroupCheckoutCompoundPrompt(row.prompt)
          : decomposeCustomerTourGroupCheckoutCompoundPrompt(row.prompt);
      expect(steps[0]?.params.serviceName).toBe(row.expectedServiceName);
      expect(steps[0]?.params.paxCount).toBe(row.expectedPaxCount);
    },
  );

  it.each(E2E133_TOUR_VS_CLINIC_SCENARIOS.map((s) => [s.id, s]))(
    'AiIntentRescueService overrides clinic misroute %s',
    (_id, row) => {
      for (const fromAction of [
        row.misclassifiedAction,
        'explain_result_status',
        'unknown',
      ] as const) {
        const result = rescue.rescue({
          prompt: row.prompt,
          action: fromAction,
          params: {},
          surface: row.surface,
        });
        expect(result?.action).toBe(row.expectedAction);
        expect(result?.rescueReason).toBe(row.expectedRescueReason);
        expect(result?.action).not.toBe('explain_result_status');
      }
    },
  );

  it.each(
    E2E133_CLINIC_WHEN_AVAILABLE_STILL_MATCH.map((s) => [s.id, s.prompt]),
  )('clinic when-available still matches %s', (_id, prompt) => {
    expect(isExplainResultStatusPrompt(prompt)).toBe(true);
  });
});
