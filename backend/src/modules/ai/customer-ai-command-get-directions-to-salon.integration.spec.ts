import { isAiBusinessHoursLocationIntentForSurface } from './ai-business-hours-location-dispatch.util.js';
import { GET_DIRECTIONS_TO_SALON_PROMPTS } from './ai-get-directions-to-salon.fixtures.js';
import { rescueGetDirectionsToSalonIntent } from './ai-get-directions-to-salon.util.js';

describe('customer-ai-command get_directions_to_salon integration (ai-cmd-customer-4.3.3)', () => {
  it.each(
    GET_DIRECTIONS_TO_SALON_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ).map((row) => [row.id, row] as const),
  )('routes $id through business hours location handler', (_id, row) => {
    expect(
      isAiBusinessHoursLocationIntentForSurface(
        'get_directions_to_salon',
        'customer',
      ),
    ).toBe(true);
    expect(
      rescueGetDirectionsToSalonIntent(row.prompt, 'unknown')?.action,
    ).toBe('get_directions_to_salon');
  });
});
