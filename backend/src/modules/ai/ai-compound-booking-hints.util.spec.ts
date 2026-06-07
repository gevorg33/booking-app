import {
  enrichCompoundSubStepBookingHints,
  isBookingCompoundSubStepAction,
  mergeBookingHintsIntoSessionContext,
} from './ai-compound-booking-hints.util.js';

describe('ai-compound-booking-hints.util (ai-cmd-h2.4)', () => {
  const compoundPrompt =
    'check who is free tomorrow evening for permanent lashes, book the nearest slot';

  it('recognizes booking compound sub-step actions', () => {
    expect(isBookingCompoundSubStepAction('check_providers_for_service')).toBe(
      true,
    );
    expect(isBookingCompoundSubStepAction('book_nearest_slot')).toBe(true);
    expect(isBookingCompoundSubStepAction('cancel_bookings')).toBe(false);
  });

  it('enriches check_providers sub-step from full compound prompt', () => {
    const params: Record<string, unknown> = { serviceName: 'permanent lashes' };
    enrichCompoundSubStepBookingHints(
      'check_providers_for_service',
      params,
      compoundPrompt,
    );

    expect(params.timeOfDay).toBe('evening');
    expect(params.allProviders).toBe(true);
    expect(params.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(params.notBeforeTime).toBe('17:00');
    expect(params.bookingFirstAvailable).toBeUndefined();
  });

  it('enriches book_nearest_slot sub-step with flexible booking flags', () => {
    const params: Record<string, unknown> = { serviceName: 'permanent lashes' };
    enrichCompoundSubStepBookingHints(
      'book_nearest_slot',
      params,
      compoundPrompt,
    );

    expect(params.bookingFirstAvailable).toBe(true);
    expect(params.timeOfDay).toBe('evening');
    expect(params.allProviders).toBe(true);
    expect(params.timeSlot).toBeUndefined();
  });

  it('merges booking hints into session context between sub-steps', () => {
    const merged = mergeBookingHintsIntoSessionContext(
      { customerId: 'c1' },
      {
        serviceName: 'massage',
        timeOfDay: 'evening',
        date: '2026-06-07',
        allProviders: true,
      },
    );
    expect(merged).toMatchObject({
      customerId: 'c1',
      serviceName: 'massage',
      timeOfDay: 'evening',
      date: '2026-06-07',
      allProviders: true,
    });
  });

  it('no-ops for non-booking compound actions', () => {
    const params: Record<string, unknown> = {};
    expect(
      enrichCompoundSubStepBookingHints(
        'clear_schedule',
        params,
        compoundPrompt,
      ),
    ).toBe(false);
    expect(params.timeOfDay).toBeUndefined();
  });
});
