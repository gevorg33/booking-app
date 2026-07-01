import { EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS } from '../ai/ai-explain-deposit-forfeiture.fixtures.js';
import { CUSTOMER_PUBLIC_EXPLAIN_DEPOSIT_FORFEITURE_CLASSIFIER_RULES } from '../ai/ai-explain-deposit-forfeiture.fixtures.js';
import {
  buildPublicUnderstandMock,
  resetPublicUnderstandingHarness,
} from './public-booking-assistant.integration.harness.js';

describe('public booking assistant explain_deposit_forfeiture (ai-cmd-customer-4.20.2)', () => {
  afterEach(async () => {
    await resetPublicUnderstandingHarness();
  });

  it.each(
    EXPLAIN_DEPOSIT_FORFEITURE_PROMPTS.filter(
      (entry) =>
        entry.id === 'lose-deposit-public' ||
        entry.id === 'deposit-refundable-public',
    ),
  )(
    'rescues explain_deposit_forfeiture for $id via public pipeline',
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

      expect(result.action).toBe('explain_deposit_forfeiture');
      expect(
        CUSTOMER_PUBLIC_EXPLAIN_DEPOSIT_FORFEITURE_CLASSIFIER_RULES,
      ).toContain('explain_deposit_forfeiture');
    },
  );
});
