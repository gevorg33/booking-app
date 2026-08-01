import { resolveRescheduleParams } from './ai-structural-extractors.js';
import {
  enrichCancelMyBookingParamsFromPrompt,
  type CustomerOwnedBookingMatchInput,
} from './ai-cancel-my-booking.util.js';

export const CUSTOMER_RESCHEDULE_MY_BOOKING_CLASSIFIER_RULES = `- reschedule_my_booking: MUTATE — logged-in customer/consumer app (and signed-in public booking web) self-serve move of their own upcoming appointment to a new date/time without calling the salon. Triggers: reschedule my booking/appointment, move my visit to Friday 3pm, change my appointment to tomorrow, cancel my facemassage booking and rebook it for next Friday instead (dated cancel+rebook = reschedule). Set bookingId when known; otherwise serviceName and/or fromDate/fromTimeSlot to pick the visit; set date/timeSlot (or startTime) for the new slot. Uses POST /me/bookings/:id/reschedule with salon policy. NOT reschedule_bookings (staff dashboard), NOT reschedule_package_visit_self (package multi-visit), NOT change_provider_on_reschedule (switch stylist only), NOT book_nearest_slot / cancel_and_rebook (cancel then book nearest — no target date), NOT pay_at_venue_fallback (payment method — never match bare "instead"), NOT explain_cancel_policy (read policy), NOT cancel_my_booking alone (cancel without rebook date).`;

export type RescheduleMyBookingPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'reschedule_my_booking';
  serviceName?: string;
  date?: string;
  timeSlot?: string;
};

export const RESCHEDULE_MY_BOOKING_PROMPTS: readonly RescheduleMyBookingPromptFixture[] =
  [
    {
      id: 'reschedule-my-booking-customer',
      prompt: 'Reschedule my booking',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
    },
    {
      id: 'reschedule-my-appointment-customer',
      prompt: 'Reschedule my appointment',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
    },
    {
      id: 'move-visit-friday-3pm-customer',
      prompt: 'Move my visit to Friday 3pm',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
      date: 'friday',
      timeSlot: '15:00',
    },
    {
      id: 'change-appointment-tomorrow-customer',
      prompt: 'Change my appointment to tomorrow',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
    },
    {
      id: 'move-massage-friday-customer',
      prompt: 'Move my massage to Friday',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
      serviceName: 'massage',
    },
    {
      id: 'reschedule-haircut-next-week-customer',
      prompt: 'Reschedule my haircut to next week',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
      serviceName: 'haircut',
    },
    {
      id: 'move-upcoming-visit-customer',
      prompt: 'Move my upcoming visit',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
    },
    {
      id: 'reschedule-next-appointment-customer',
      prompt: 'Reschedule my next appointment',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
    },
    {
      id: 'change-booking-to-2pm-customer',
      prompt: 'Change my booking to 2pm tomorrow',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
    },
    {
      id: 'self-serve-reschedule-customer',
      prompt: 'I want to reschedule without calling the salon',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
    },
    {
      id: 'move-facial-tomorrow-customer',
      prompt: 'Move the facial I booked to tomorrow',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
      serviceName: 'facial',
    },
    {
      id: 'reschedule-reservation-customer',
      prompt: 'Reschedule my reservation',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
    },
    {
      id: 'shift-appointment-friday-at-11-customer',
      prompt: 'Shift my appointment to Friday at 11am',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
    },
    {
      id: 'move-massage-to-3pm-customer',
      prompt: 'Move my massage to 3pm',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
      serviceName: 'massage',
      timeSlot: '15:00',
    },
    {
      id: 'need-to-move-visit-customer',
      prompt: 'I need to move my appointment to a different day',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
    },
    {
      id: 'e2e114-cancel-rebook-friday-customer',
      prompt:
        'cancel my facemassage booking and rebook it for next Friday instead',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
      serviceName: 'facemassage',
      date: 'friday',
    },
    {
      id: 'e2e114-cancel-rebook-friday-public',
      prompt:
        'cancel my facemassage booking and rebook it for next Friday instead',
      surface: 'public',
      expectedAction: 'reschedule_my_booking',
      serviceName: 'facemassage',
      date: 'friday',
    },
    {
      id: 'cancel-rebook-massage-saturday-customer',
      prompt: 'Cancel my massage booking and rebook it for Saturday',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
      serviceName: 'massage',
      date: 'saturday',
    },
    {
      id: 'e2e237-cancel-rebook-swedish-title-case',
      prompt:
        'cancel my Swedish massage booking and rebook it for next Friday instead',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
      serviceName: 'Swedish massage',
      date: 'friday',
    },
    {
      id: 'e2e237-cancel-rebook-swedish-lowercase',
      prompt:
        'cancel my swedish massage booking and rebook it for next Friday instead',
      surface: 'customer',
      expectedAction: 'reschedule_my_booking',
      serviceName: 'swedish massage',
      date: 'friday',
    },
  ];

/** e2e-bug.237 — Title Case + lowercase dated cancel+rebook must not stay on cancel. */
export const E2E237_DATED_CANCEL_REBOOK_SCENARIOS = [
  {
    id: 'e2e237-swedish-title-case',
    prompt:
      'cancel my Swedish massage booking and rebook it for next Friday instead',
    misclassifiedAction: 'cancel_my_booking',
    expectedAction: 'reschedule_my_booking' as const,
    serviceName: 'Swedish massage',
  },
  {
    id: 'e2e237-swedish-lowercase',
    prompt:
      'cancel my swedish massage booking and rebook it for next Friday instead',
    misclassifiedAction: 'cancel_my_booking',
    expectedAction: 'reschedule_my_booking' as const,
    serviceName: 'swedish massage',
  },
  {
    id: 'e2e237-swedish-from-pay-at-venue',
    prompt:
      'cancel my Swedish massage booking and rebook it for next Friday instead',
    misclassifiedAction: 'pay_at_venue_fallback',
    expectedAction: 'reschedule_my_booking' as const,
    serviceName: 'Swedish massage',
  },
  {
    id: 'e2e237-reschedule-control',
    prompt: 'reschedule my swedish massage to next Friday',
    misclassifiedAction: 'unknown',
    expectedAction: 'reschedule_my_booking' as const,
    serviceName: 'massage',
  },
  {
    id: 'e2e237-voice-short',
    prompt: 'cancel swedish massage rebook next Friday',
    misclassifiedAction: 'cancel_and_rebook',
    expectedAction: 'reschedule_my_booking' as const,
    serviceName: 'swedish massage',
  },
] as const;

export function enrichRescheduleMyBookingParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  timeZone = 'UTC',
): Record<string, unknown> {
  const next = enrichCancelMyBookingParamsFromPrompt(params, prompt);
  resolveRescheduleParams(next, prompt, timeZone);
  return next;
}

export function buildRescheduleOwnedBookingMatchParams(
  enrichedParams: Record<string, unknown>,
): Record<string, unknown> {
  const matchParams = { ...enrichedParams };
  const sourceDate = matchParams.fromDate;
  const sourceTime = matchParams.fromTimeSlot;
  delete matchParams.date;
  delete matchParams.timeSlot;
  delete matchParams.startTime;
  delete matchParams.dateFrom;
  delete matchParams.dateTo;
  delete matchParams.fromDate;
  delete matchParams.fromTimeSlot;
  if (sourceDate && !matchParams.date) {
    matchParams.date = sourceDate;
  }
  if (sourceTime && !matchParams.timeSlot) {
    matchParams.timeSlot = sourceTime;
  }
  return matchParams;
}

export function buildRescheduleMyBookingAmbiguousSummary(
  bookings: CustomerOwnedBookingMatchInput[],
): string {
  const lines = bookings.slice(0, 3).map((row) => {
    const when = row.startTime.toISOString().slice(0, 16).replace('T', ' ');
    return `${row.service?.name ?? 'Appointment'} — ${when}`;
  });
  return `You have several upcoming appointments — specify which one to reschedule: ${lines.join('; ')}.`;
}
