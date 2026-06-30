import {
  buildNearestSlotBookedMessage,
  buildSoonestAppointmentFoundMessage,
  buildNoNearestSlotMessage,
  buildNoProvidersAvailableMessage,
  buildNoSlotSuggestions,
} from './ai-booking-slot-messages.util.js';

describe('ai-booking-slot-messages.util (ai-cmd-h2.1)', () => {
  it('formats nearest slot booked message with human-readable time', () => {
    expect(
      buildNearestSlotBookedMessage({
        startTime: '2026-06-13T09:00:00.000Z',
        employeeName: 'Mary Torgomyan',
      }),
    ).toBe('Nearest slot: June 13 at 09:00 with Mary Torgomyan.');
  });

  it('formats soonest opening read-only message', () => {
    expect(
      buildSoonestAppointmentFoundMessage({
        startTime: '2026-06-13T09:00:00.000Z',
        employeeName: 'Anna',
        serviceName: 'trim',
      }),
    ).toBe('Soonest opening for trim: June 13 at 09:00 with Anna.');
  });

  it('suggests morning or afternoon when evening has no availability', () => {
    const message = buildNoProvidersAvailableMessage({
      serviceName: 'massage',
      dateKey: '2026-06-07',
      timeOfDay: 'evening',
      notBeforeTime: '17:00',
    });

    expect(message).toContain('No providers are free for massage');
    expect(message).toContain('evening');
    expect(message).toContain('morning');
    expect(message).toContain('afternoon');
    expect(message).toMatch(/another date/i);
  });

  it('suggests afternoon and evening when morning has no slots', () => {
    const message = buildNoNearestSlotMessage({
      serviceName: 'Permanent lashes',
      dateKey: '2026-06-07',
      timeOfDay: 'morning',
    });

    expect(message).toContain('No bookable slot for Permanent lashes');
    expect(message).toContain('morning');
    expect(message).toContain('afternoon');
    expect(message).toContain('evening');
  });

  it('falls back to generic time-of-day suggestions without a window', () => {
    expect(buildNoSlotSuggestions(null)).toEqual([
      'Try another time of day (morning, afternoon, or evening).',
      'Try a different date.',
    ]);
    const message = buildNoNearestSlotMessage({
      serviceName: 'Haircut',
      dateKey: '2026-06-08',
    });
    expect(message).toContain('No bookable slot for Haircut');
    expect(message).toContain('morning, afternoon, or evening');
  });

  it('mentions after-time constraint when only notBeforeTime is set', () => {
    const message = buildNoProvidersAvailableMessage({
      serviceName: 'massage',
      dateKey: '2026-06-07',
      notBeforeTime: '17:00',
    });

    expect(message).toContain('after 17:00');
    expect(message).toMatch(/different date/i);
  });
});
