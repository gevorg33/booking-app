import {
  CUSTOMER_PUBLIC_LEAVE_VISIT_REVIEW_CLASSIFIER_RULES,
  LEAVE_VISIT_REVIEW_PROMPTS,
  LEAVE_VISIT_REVIEW_RESCUE_SCENARIOS,
} from '../ai/ai-leave-visit-review.fixtures.js';
import { PUBLIC_INTENTS } from '../ai/ai-command-registry.build.js';
import { buildPublicClassifierSchema } from './public-booking-classifier.schema.js';
import {
  buildPublicUnderstandMock,
  resetPublicUnderstandingHarness,
} from './public-booking-assistant.integration.harness.js';

describe('public booking assistant leave_visit_review (e2e-bug.111)', () => {
  afterEach(async () => {
    await resetPublicUnderstandingHarness();
  });

  it('registers leave_visit_review on public surface + classifier schema', () => {
    expect(PUBLIC_INTENTS).toContain('leave_visit_review');
    const schema = buildPublicClassifierSchema();
    expect(schema).toContain('leave_visit_review');
    expect(CUSTOMER_PUBLIC_LEAVE_VISIT_REVIEW_CLASSIFIER_RULES).toContain(
      'leave_visit_review',
    );
    expect(CUSTOMER_PUBLIC_LEAVE_VISIT_REVIEW_CLASSIFIER_RULES).toContain(
      'NOT confirm_my_booking_details',
    );
  });

  it.each(
    LEAVE_VISIT_REVIEW_PROMPTS.filter((entry) => entry.surface === 'public'),
  )(
    'rescues leave_visit_review for $id via public pipeline',
    async ({ prompt, expectedAction, rating, serviceName }) => {
      const understand = buildPublicUnderstandMock();
      const classify = jest.fn().mockResolvedValue({
        action: 'confirm_my_booking_details',
        params: {},
        reasoning: 'misclassified as confirm details',
      });

      const result = await understand.understand({
        businessId: 'biz-public',
        effectivePrompt: prompt,
        confidence: { low: 0.65, high: 0.82 },
        locale: 'en',
        businessContextBlock: 'Business: Salon',
        classify,
      });

      expect(result.action).toBe(expectedAction);
      if (rating) {
        expect(result.params?.rating).toBe(rating);
      }
      if (serviceName) {
        expect(String(result.params?.serviceName ?? '')).toMatch(
          new RegExp(serviceName, 'i'),
        );
      }
    },
  );

  it.each(
    LEAVE_VISIT_REVIEW_RESCUE_SCENARIOS.filter((row) =>
      row.id.startsWith('e2e-bug-111'),
    ),
  )(
    'rescues $id when LLM returns $misclassifiedAction',
    async ({ prompt, misclassifiedAction, expectedAction }) => {
      const understand = buildPublicUnderstandMock();
      const classify = jest.fn().mockResolvedValue({
        action: misclassifiedAction,
        params: {},
        reasoning: 'wrong domain',
      });

      const result = await understand.understand({
        businessId: 'biz-public',
        effectivePrompt: prompt,
        confidence: { low: 0.65, high: 0.82 },
        locale: 'en',
        businessContextBlock: 'Business: Salon',
        classify,
      });

      expect(result.action).toBe(expectedAction);
    },
  );
});
