import {
  buildSharedBookingContextFromPrompt,
  pickSharedBookingContextSlice,
} from './ai-compound-booking-context.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';

/** Booking sub-steps that receive shared context + time hints in compound graphs (ai-cmd-h2.4). */
export const BOOKING_COMPOUND_SUB_STEP_ACTIONS = [
  'create_booking',
  'reschedule_booking',
  'check_providers_for_service',
  'book_nearest_slot',
] as const;

export type BookingCompoundSubStepAction =
  (typeof BOOKING_COMPOUND_SUB_STEP_ACTIONS)[number];

export function isBookingCompoundSubStepAction(
  action: string,
): action is BookingCompoundSubStepAction {
  return (BOOKING_COMPOUND_SUB_STEP_ACTIONS as readonly string[]).includes(
    action,
  );
}

/**
 * Merge shared booking context and NL time hints on every compound sub-step.
 * Used by LangGraph compound-command-graph and legacy compound loops.
 */
export function enrichCompoundSubStepBookingHints(
  action: string,
  params: Record<string, any>,
  prompt: string,
  timeZone = 'UTC',
): boolean {
  if (!isBookingCompoundSubStepAction(action)) return false;

  const sharedBooking = buildSharedBookingContextFromPrompt(prompt, timeZone);
  for (const [key, value] of Object.entries(sharedBooking)) {
    if (
      action === 'check_providers_for_service' &&
      key === 'bookingFirstAvailable'
    ) {
      continue;
    }
    if (
      (params[key] == null || params[key] === '') &&
      value != null &&
      value !== ''
    ) {
      params[key] = value;
    }
  }

  const hintAction =
    action === 'book_nearest_slot' ? 'create_booking' : action;
  enrichBookingTimeHintsFromPrompt(hintAction, params, prompt);

  if (action === 'book_nearest_slot') {
    params.bookingFirstAvailable = true;
    delete params.timeSlot;
  }

  return true;
}

/** Forward booking slice into LangGraph sessionContext between compound sub-steps. */
export function mergeBookingHintsIntoSessionContext(
  sessionContext: Record<string, any>,
  params: Record<string, unknown>,
): Record<string, any> {
  return {
    ...sessionContext,
    ...pickSharedBookingContextSlice(params),
  };
}
