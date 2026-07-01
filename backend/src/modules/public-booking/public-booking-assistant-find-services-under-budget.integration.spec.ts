import { FIND_SERVICES_UNDER_BUDGET_PROMPTS } from '../ai/ai-find-services-under-budget.fixtures.js';
import { CUSTOMER_PUBLIC_FIND_SERVICES_UNDER_BUDGET_CLASSIFIER_RULES } from '../ai/ai-find-services-under-budget.fixtures.js';
import {
  buildPublicUnderstandMock,
  resetPublicUnderstandingHarness,
} from './public-booking-assistant.integration.harness.js';

describe('public booking assistant find_services_under_budget (ai-cmd-customer-4.20.3)', () => {
  afterEach(async () => {
    await resetPublicUnderstandingHarness();
  });

  it.each(
    FIND_SERVICES_UNDER_BUDGET_PROMPTS.filter(
      (entry) =>
        entry.id === 'discover-chip-under-50-public' ||
        entry.id === 'anything-under-50-public',
    ),
  )(
    'rescues find_services_under_budget for $id via public pipeline',
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

      expect(result.action).toBe('find_services_under_budget');
      expect(result.params?.maxPrice).toBe(50);
      expect(
        CUSTOMER_PUBLIC_FIND_SERVICES_UNDER_BUDGET_CLASSIFIER_RULES,
      ).toContain('find_services_under_budget');
    },
  );
});
