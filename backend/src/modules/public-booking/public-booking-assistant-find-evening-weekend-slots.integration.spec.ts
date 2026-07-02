import { FIND_EVENING_WEEKEND_SLOTS_PROMPTS } from '../ai/ai-find-evening-weekend-slots.fixtures.js';
import { CUSTOMER_PUBLIC_FIND_EVENING_WEEKEND_SLOTS_CLASSIFIER_RULES } from '../ai/ai-find-evening-weekend-slots.fixtures.js';
import {
  buildPublicUnderstandMock,
  resetPublicUnderstandingHarness,
} from './public-booking-assistant.integration.harness.js';

describe('public booking assistant find_evening_weekend_slots (ai-cmd-customer-4.20.4)', () => {
  afterEach(async () => {
    await resetPublicUnderstandingHarness();
  });

  it.each(
    FIND_EVENING_WEEKEND_SLOTS_PROMPTS.filter(
      (entry) =>
        entry.id === 'discover-chip-evening-weekend-public' ||
        entry.id === 'evening-weekend-only-public',
    ),
  )(
    'rescues find_evening_weekend_slots for $id via public pipeline',
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

      expect(result.action).toBe('find_evening_weekend_slots');
      expect(result.params?.availabilityWindows).toEqual([
        { timeOfDay: 'evening' },
        { weekdays: ['saturday', 'sunday'] },
      ]);
      expect(
        CUSTOMER_PUBLIC_FIND_EVENING_WEEKEND_SLOTS_CLASSIFIER_RULES,
      ).toContain('find_evening_weekend_slots');
    },
  );
});
