import { resolveRescheduleParams } from './ai-structural-extractors.js';
import {
  enrichCancelMyBookingParamsFromPrompt,
  type CustomerOwnedBookingMatchInput,
} from './ai-cancel-my-booking.util.js';

export const CUSTOMER_RESCHEDULE_MY_BOOKING_CLASSIFIER_RULES = `- reschedule_my_booking: MUTATE — logged-in customer/consumer app self-serve move of their own upcoming appointment to a new date/time without calling the salon. Triggers: reschedule my booking/appointment, move my visit to Friday 3pm, change my appointment to tomorrow. Set bookingId when known; otherwise serviceName and/or fromDate/fromTimeSlot to pick the visit; set date/timeSlot (or startTime) for the new slot. Uses POST /me/bookings/:id/reschedule with salon policy. NOT reschedule_bookings (staff dashboard), NOT reschedule_package_visit_self (package multi-visit), NOT change_provider_on_reschedule (switch stylist only), NOT book_nearest_slot (new booking), NOT explain_cancel_policy (read policy), NOT cancel_my_booking (cancel).`;

export type RescheduleMyBookingPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
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
  ];

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
