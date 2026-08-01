import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  isAddBookingToCalendarPrompt,
  isProviderAvailabilityOpenCheckPrompt,
  rescueAddBookingToCalendarIntent,
} from './ai-add-booking-to-calendar.util.js';
import { resolveAvailabilityIntentFromPrompt } from './ai-intent-disambiguation.util.js';
import {
  E2E307_AVAILABILITY_NOT_CALENDAR,
  E2E307_CALENDAR_CONTROLS,
  E2E307_RESCUE_CASES,
} from './ai-e2e307-anybody-open-not-calendar.fixtures.js';

describe('e2e-bug.307 anybody-open not stolen by add_booking_to_calendar', () => {
  it.each(
    E2E307_AVAILABILITY_NOT_CALENDAR.map((row) => [row.id, row] as const),
  )('%s — detectors', (_id, row) => {
    expect(isProviderAvailabilityOpenCheckPrompt(row.prompt)).toBe(true);
    expect(isAddBookingToCalendarPrompt(row.prompt)).toBe(false);
    expect(rescueAddBookingToCalendarIntent(row.prompt, 'unknown')).toBeNull();
    expect(
      rescueAddBookingToCalendarIntent(row.prompt, 'check_availability'),
    ).toBeNull();
  });

  it.each(E2E307_CALENDAR_CONTROLS.map((row) => [row.id, row] as const))(
    '%s — calendar still matches',
    (_id, row) => {
      expect(isAddBookingToCalendarPrompt(row.prompt)).toBe(true);
      expect(isProviderAvailabilityOpenCheckPrompt(row.prompt)).toBe(false);
    },
  );

  it('public resolve → check_availability for anybody-open', () => {
    expect(
      resolveAvailabilityIntentFromPrompt(
        'public',
        'is anybody open tomorrow morning for Swedish massage',
      )?.action,
    ).toBe('check_availability');
  });

  describe('rescue remaps calendar steal → availability', () => {
    const rescue = new AiIntentRescueService();

    it.each(E2E307_RESCUE_CASES.map((row) => [row.id, row] as const))(
      '%s',
      (_id, row) => {
        const result = rescue.rescue({
          prompt: row.prompt,
          action: row.fromAction,
          params: {},
          surface: row.surface,
        });
        expect(row.expectedActions).toContain(result.action);
        expect(result.action).not.toBe(row.forbidAction);
      },
    );
  });

  it('documents scenario ids', () => {
    expect(E2E307_AVAILABILITY_NOT_CALENDAR.map((c) => c.id)).toEqual([
      'ai-e2e307-anybody-open-swedish',
      'ai-e2e307-anyone-free-swedish',
      'ai-e2e307-who-is-open-swedish',
      'ai-e2e307-somebody-open-evening',
      'ai-e2e307-see-who-is-open',
      'ai-e2e307-named-gevorg-open',
      'ai-e2e307-who-is-free',
      'ai-e2e307-open-slots-browse',
    ]);
  });
});
