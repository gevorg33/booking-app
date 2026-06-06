import { DIAGNOSE_TOUR_CAPACITY_PROMPTS } from './ai-tour-capacity.fixtures.js';
import { EXPLAIN_TOUR_BOOKING_PROMPTS } from './ai-tour-booking.fixtures.js';
import { EXPLAIN_TOUR_DAY_SLOTS_PROMPTS } from './ai-tour-day-slots.fixtures.js';
import {
  isDiagnoseTourCapacityPrompt,
  parseDiagnoseTourCapacityFromPrompt,
  rescueDiagnoseTourCapacityIntent,
} from './ai-tour-capacity.util.js';
import { isExplainTourBookingPrompt } from './ai-tour-booking.util.js';
import { isExplainTourDaySlotsPrompt } from './ai-tour-day-slots.util.js';

describe('ai-tour-capacity.util (ai-cmd-tour-9)', () => {
  it.each(DIAGNOSE_TOUR_CAPACITY_PROMPTS)(
    'detects diagnose tour capacity prompt $id',
    ({ prompt }) => {
      expect(isDiagnoseTourCapacityPrompt(prompt)).toBe(true);
      expect(parseDiagnoseTourCapacityFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(DIAGNOSE_TOUR_CAPACITY_PROMPTS)(
    'rescues unknown action to diagnose_tour_capacity for $id',
    ({ prompt }) => {
      expect(rescueDiagnoseTourCapacityIntent(prompt, 'unknown')).toEqual({
        action: 'diagnose_tour_capacity',
        rescueReason: 'diagnose_tour_capacity',
      });
    },
  );

  it('does not steal catalog tour booking explain prompts', () => {
    for (const { prompt } of EXPLAIN_TOUR_BOOKING_PROMPTS) {
      expect(isDiagnoseTourCapacityPrompt(prompt)).toBe(false);
      expect(isExplainTourBookingPrompt(prompt)).toBe(true);
    }
  });

  it('does not steal educational day slots prompts', () => {
    for (const { prompt } of EXPLAIN_TOUR_DAY_SLOTS_PROMPTS) {
      expect(isDiagnoseTourCapacityPrompt(prompt)).toBe(false);
      expect(isExplainTourDaySlotsPrompt(prompt)).toBe(true);
    }
  });

  it('parses requestedPax and date from params', () => {
    const parsed = parseDiagnoseTourCapacityFromPrompt(
      'Why did checkout reject my booking?',
      {
        serviceName: 'City Tour',
        date: '15/08/2026',
        requestedPax: 4,
        aspect: 'insufficientSpots',
      },
    );
    expect(parsed).toMatchObject({
      serviceName: 'City Tour',
      dateKey: '2026-08-15',
      requestedPax: 4,
      aspect: 'insufficientSpots',
    });
  });
});
