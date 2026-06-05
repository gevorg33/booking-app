import {
  buildCoordinationDeniedSummary,
  buildCoordinationPreviewSummary,
  canRunCoordinationOnProvider,
  isCoordinationPrompt,
  normalizeCoordinationParams,
  rescueCoordinationIntent,
} from './ai-coordination.util.js';

describe('ai-coordination.util', () => {
  it('detects coordination prompts', () => {
    expect(isCoordinationPrompt('If Maria cancels, offer slot to waitlist customer John')).toBe(true);
    expect(isCoordinationPrompt('Show my appointments')).toBe(false);
  });

  it('rescues unknown/cancel intents to coordination', () => {
    expect(
      rescueCoordinationIntent('If Maria cancels offer waitlist customer John', 'unknown'),
    ).toBe('coordinate_waitlist_offer');
    expect(rescueCoordinationIntent('Cancel Maria at 14:00', 'cancel_bookings')).toBe(
      'cancel_bookings',
    );
    expect(
      rescueCoordinationIntent('If Maria cancels offer waitlist customer John', 'cancel_bookings'),
    ).toBe('coordinate_waitlist_offer');
    expect(rescueCoordinationIntent('list bookings', 'list_bookings')).toBe('list_bookings');
  });

  it('normalizes coordination params', () => {
    expect(
      normalizeCoordinationParams({
        employeeName: 'Maria',
        customerName: 'John',
        timeSlot: '14:00',
      }),
    ).toEqual({
      employeeName: 'Maria',
      waitlistCustomerName: 'John',
      customerName: 'John',
      date: null,
      timeSlot: '14:00',
      trigger: 'cancel',
      reason: null,
    });
    expect(normalizeCoordinationParams({})).toEqual({
      employeeName: null,
      waitlistCustomerName: null,
      customerName: null,
      date: null,
      timeSlot: null,
      trigger: 'cancel',
      reason: null,
    });
    expect(
      normalizeCoordinationParams({
        waitlistCustomerName: 'Sam',
        trigger: 'reschedule',
        reason: 'Sick',
      }),
    ).toEqual({
      employeeName: null,
      waitlistCustomerName: 'Sam',
      customerName: null,
      date: null,
      timeSlot: null,
      trigger: 'reschedule',
      reason: 'Sick',
    });
  });

  it('builds preview and denied summaries', () => {
    expect(
      buildCoordinationPreviewSummary({
        employeeName: 'Maria',
        waitlistCustomerName: 'John',
        bookingLabel: 'Maria — 14:00',
        bookingCount: 1,
      }),
    ).toContain('John');
    expect(
      buildCoordinationPreviewSummary({
        employeeName: 'Maria',
        waitlistCustomerName: 'John',
        bookingLabel: 'Maria — 14:00',
        bookingCount: 3,
      }),
    ).toContain('3 appointments');
    expect(canRunCoordinationOnProvider('team')).toBe(true);
    expect(buildCoordinationDeniedSummary('provider')).toContain('team view');
    expect(buildCoordinationDeniedSummary('team')).toContain('not available');
  });
});
