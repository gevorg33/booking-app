import { EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS } from '../ai/ai-explain-manage-booking-page.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_MANAGE_BOOKING_PAGE_CLASSIFIER_RULES } from '../ai/ai-explain-manage-booking-page.fixtures.js';
import {
  buildPublicUnderstandMock,
  resetPublicUnderstandingHarness,
} from './public-booking-assistant.integration.harness.js';

describe('public booking assistant explain_manage_booking_page (ai-cmd-customer-4.20.7)', () => {
  afterEach(async () => {
    await resetPublicUnderstandingHarness();
  });

  it.each(
    EXPLAIN_MANAGE_BOOKING_PAGE_PROMPTS.filter(
      (entry) =>
        entry.id === 'what-can-i-do-manage-page-public' ||
        entry.id === 'invalid-manage-link-public',
    ),
  )(
    'rescues explain_manage_booking_page for $id via public pipeline',
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

      expect(result.action).toBe('explain_manage_booking_page');
      expect(
        CUSTOMER_PUBLIC_EXPLAIN_MANAGE_BOOKING_PAGE_CLASSIFIER_RULES,
      ).toContain('explain_manage_booking_page');
    },
  );
});
