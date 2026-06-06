import {
  hasAvailabilityWhen,
  hasRequiredBookingDate,
  hasRequiredBookingStartTime,
  hasRescheduleNewTime,
  isBookingFirstAvailable,
} from './booking-time-completion.util.js';

describe('booking-time-completion.util (ai-cmd-h4.3)', () => {
  it('isBookingFirstAvailable detects flexible booking flag', () => {
    expect(isBookingFirstAvailable({ bookingFirstAvailable: true })).toBe(true);
    expect(isBookingFirstAvailable({ bookingFirstAvailable: false })).toBe(
      false,
    );
  });

  it('hasRequiredBookingStartTime skips timeSlot when first-available', () => {
    expect(hasRequiredBookingStartTime({ bookingFirstAvailable: true })).toBe(
      true,
    );
    expect(hasRequiredBookingStartTime({ timeSlot: '10:00' })).toBe(true);
    expect(
      hasRequiredBookingStartTime({ timeOfDay: 'evening' }),
    ).toBe(false);
  });

  it('hasRequiredBookingDate skips date when first-available', () => {
    expect(hasRequiredBookingDate({ bookingFirstAvailable: true })).toBe(true);
    expect(hasRequiredBookingDate({ date: '2026-06-06' })).toBe(true);
    expect(hasRequiredBookingDate({})).toBe(false);
  });

  it('hasRescheduleNewTime accepts first-available and day-part hints', () => {
    expect(
      hasRescheduleNewTime({
        bookingFirstAvailable: true,
        timeOfDay: 'evening',
      }),
    ).toBe(true);
    expect(hasRescheduleNewTime({ notBeforeTime: '17:00' })).toBe(true);
    expect(hasRescheduleNewTime({ date: '2026-06-07' })).toBe(true);
    expect(hasRescheduleNewTime({})).toBe(false);
  });

  it('hasAvailabilityWhen accepts timeOfDay and notBeforeTime', () => {
    expect(hasAvailabilityWhen({ timeOfDay: 'afternoon' })).toBe(true);
    expect(hasAvailabilityWhen({ notBeforeTime: '12:00' })).toBe(true);
    expect(hasAvailabilityWhen({ timeFrom: '14:00' })).toBe(true);
    expect(hasAvailabilityWhen({})).toBe(false);
  });
});
