import { EXPLAIN_SALON_PROFILE_PROMPTS } from '../ai/ai-explain-salon-profile.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_SALON_PROFILE_CLASSIFIER_RULES } from '../ai/ai-explain-salon-profile.fixtures.js';
import {
  buildPublicUnderstandMock,
  resetPublicUnderstandingHarness,
} from './public-booking-assistant.integration.harness.js';

describe('public booking assistant explain_salon_profile (ai-cmd-customer-4.20.5)', () => {
  afterEach(async () => {
    await resetPublicUnderstandingHarness();
  });

  it.each(
    EXPLAIN_SALON_PROFILE_PROMPTS.filter(
      (entry) =>
        entry.id === 'tell-me-about-salon-public' ||
        entry.id === 'photos-and-reviews-public',
    ),
  )(
    'rescues explain_salon_profile for $id via public pipeline',
    async ({ prompt }) => {
      const understand = buildPublicUnderstandMock();
      const classify = jest.fn().mockResolvedValue({
        action: 'unknown',
        params: {},
        reasoning: 'unclear',
      });

      const result = await understand.understand({
        businessId: 'biz-public',
        effectivePrompt: prompt,
        confidence: { low: 0.65, high: 0.82 },
        locale: 'en',
        businessContextBlock: 'Business: Salon',
        classify,
      });

      expect(result.action).toBe('explain_salon_profile');
      expect(CUSTOMER_PUBLIC_EXPLAIN_SALON_PROFILE_CLASSIFIER_RULES).toContain(
        'explain_salon_profile',
      );
    },
  );
});
