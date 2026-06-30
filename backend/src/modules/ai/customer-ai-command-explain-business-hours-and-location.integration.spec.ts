import { isAiBusinessHoursLocationIntentForSurface } from './ai-business-hours-location-dispatch.util.js';
import { EXPLAIN_BUSINESS_HOURS_AND_LOCATION_PROMPTS } from './ai-explain-business-hours-and-location.util.js';
import { rescueExplainBusinessHoursAndLocationIntent } from './ai-explain-business-hours-and-location.util.js';

describe('customer-ai-command explain_business_hours_and_location integration (ai-cmd-customer-4.1.5)', () => {
  it.each(
    EXPLAIN_BUSINESS_HOURS_AND_LOCATION_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues explain_business_hours_and_location for $id', (_id, row) => {
    expect(
      rescueExplainBusinessHoursAndLocationIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_business_hours_and_location');
  });

  it('is registered on customer and public surfaces', () => {
    expect(
      isAiBusinessHoursLocationIntentForSurface(
        'explain_business_hours_and_location',
        'customer',
      ),
    ).toBe(true);
    expect(
      isAiBusinessHoursLocationIntentForSurface(
        'explain_business_hours_and_location',
        'public',
      ),
    ).toBe(true);
  });
});
