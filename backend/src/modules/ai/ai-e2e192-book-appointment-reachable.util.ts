/**
 * e2e-bug.192 — timed natural-language book prompts must reach
 * `book_appointment` (checkout navigate or create), never stay on
 * `check_providers_for_service` / `check_availability` / `unknown`.
 */
import { enrichBookAppointmentParamsFromPrompt } from './ai-book-appointment-params.util.js';
import { isConcreteTimedBookAppointmentPrompt } from './ai-intent-disambiguation.util.js';

export { enrichBookAppointmentParamsFromPrompt };

export const E2E192_TIMED_BOOK_PROMPTS = [
  {
    id: 'e2e192-swedish-gevorg-11am',
    prompt: 'Book a Swedish massage with Gevorg tomorrow at 11am',
    surface: 'customer' as const,
    expectedAction: 'book_appointment' as const,
    expectEmployeeName: 'Gevorg',
    expectTimeSlot: '11:00',
  },
  {
    id: 'e2e192-swedish-at-11am-tomorrow',
    prompt: 'I want to book Swedish massage with Gevorg at 11am tomorrow',
    surface: 'customer' as const,
    expectedAction: 'book_appointment' as const,
    expectEmployeeName: 'Gevorg',
    expectTimeSlot: '11:00',
  },
  {
    id: 'e2e192-create-a-booking',
    prompt:
      'create a booking for Swedish massage with Gevorg tomorrow at 11am',
    surface: 'customer' as const,
    expectedAction: 'book_appointment' as const,
    expectEmployeeName: 'Gevorg',
    expectTimeSlot: '11:00',
  },
  {
    id: 'e2e192-schedule-me',
    prompt:
      'please schedule me for a Swedish massage tomorrow at 11am with Gevorg',
    surface: 'customer' as const,
    expectedAction: 'book_appointment' as const,
    expectEmployeeName: 'Gevorg',
    expectTimeSlot: '11:00',
  },
  {
    id: 'e2e192-can-i-book',
    prompt: 'Can I book a Swedish massage tomorrow at 3pm with Gevorg?',
    surface: 'customer' as const,
    expectedAction: 'book_appointment' as const,
    expectEmployeeName: 'Gevorg',
    expectTimeSlot: '15:00',
  },
  {
    id: 'e2e192-reserve-neck',
    prompt: 'Reserve a Neck Massage with Gevorg on Friday at 10am',
    surface: 'customer' as const,
    expectedAction: 'book_appointment' as const,
    expectEmployeeName: 'Gevorg',
    expectTimeSlot: '10:00',
  },
  {
    id: 'e2e192-make-a-booking',
    prompt: 'make a booking for Swedish massage with Gevorg tomorrow at 2pm',
    surface: 'public' as const,
    expectedAction: 'book_appointment' as const,
    expectEmployeeName: 'Gevorg',
    expectTimeSlot: '14:00',
  },
  {
    id: 'e2e192-with-contact',
    prompt:
      'Book a Swedish massage with Gevorg tomorrow at 11am, name Test User email test192@example.com',
    surface: 'customer' as const,
    expectedAction: 'book_appointment' as const,
    expectEmployeeName: 'Gevorg',
    expectTimeSlot: '11:00',
    expectCustomerName: 'Test User',
    expectCustomerEmail: 'test192@example.com',
  },
  {
    id: 'e2e192-schedule-bare',
    prompt: 'schedule Swedish massage Gevorg tomorrow 11:00',
    surface: 'public' as const,
    expectedAction: 'book_appointment' as const,
    expectTimeSlot: '11:00',
  },
  {
    id: 'e2e192-book-me-neck',
    prompt: 'Book me a neck massage with Gevorg tomorrow at 1pm',
    surface: 'customer' as const,
    expectedAction: 'book_appointment' as const,
    expectEmployeeName: 'Gevorg',
    expectTimeSlot: '13:00',
  },
] as const;

/** Must NOT become book_appointment. */
export const E2E192_NEGATIVE_PROMPTS = [
  {
    id: 'neg-who-is-free',
    prompt: 'Who is free for Swedish massage tomorrow?',
  },
  {
    id: 'neg-check-availability',
    prompt: 'check availability for Swedish massage tomorrow',
  },
  {
    id: 'neg-book-nearest',
    prompt: 'Book nearest Swedish massage',
  },
  {
    id: 'neg-who-available',
    prompt: 'Who is available tomorrow for Swedish massage?',
  },
] as const;

/** Misclassified actions that timed-book rescue must escape. */
export const E2E192_RESCUE_FROM_ACTIONS = [
  'check_providers_for_service',
  'check_availability',
  'unknown',
  'create_booking',
] as const;

/**
 * Prefer deterministic public execution so a second chat() classify cannot
 * demote book_appointment back to discovery.
 */
export function shouldExecuteBookAppointmentDeterministically(
  action: string,
): boolean {
  return action === 'book_appointment';
}

export function isE2e192TimedBookPrompt(prompt: string): boolean {
  return isConcreteTimedBookAppointmentPrompt(prompt);
}
