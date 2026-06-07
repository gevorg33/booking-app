/** Shared booking-time validation for dashboard, provider, entity, and public surfaces. */

export function isBookingFirstAvailable(
  params: Record<string, unknown>,
): boolean {
  return params.bookingFirstAvailable === true;
}

export function hasFlexibleTimeWindow(
  params: Record<string, unknown>,
): boolean {
  return !!(params.timeOfDay || params.notBeforeTime || params.timeFrom);
}

/** Fixed start time or nearest/first-available booking — skips timeSlot when flexible. */
export function hasRequiredBookingStartTime(
  params: Record<string, unknown>,
): boolean {
  return !!params.timeSlot || isBookingFirstAvailable(params);
}

/** Appointment day — optional when booking the nearest open slot. */
export function hasRequiredBookingDate(
  params: Record<string, unknown>,
): boolean {
  return !!params.date || isBookingFirstAvailable(params);
}

/** Reschedule target time: new date/slot, first-available move, or day-part constraint. */
export function hasRescheduleNewTime(params: Record<string, unknown>): boolean {
  return (
    !!params.date ||
    !!params.timeSlot ||
    isBookingFirstAvailable(params) ||
    hasFlexibleTimeWindow(params)
  );
}

/** Availability / gap checks: any when hint (date, slot, or day-part window). */
export function hasAvailabilityWhen(params: Record<string, unknown>): boolean {
  return !!params.date || !!params.timeSlot || hasFlexibleTimeWindow(params);
}
