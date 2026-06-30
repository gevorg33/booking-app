import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  extractSingleIsoDayFromPrompt,
  resolveDateRange,
} from './ai-orchestration.helpers.js';
import { extractServiceNameFromPrompt } from './ai-payments.util.js';

export const CUSTOMER_CANCEL_MY_BOOKING_CLASSIFIER_RULES = `- cancel_my_booking: MUTATE — logged-in customer/consumer app self-serve cancel of their own upcoming appointment without calling the salon. Triggers: cancel my booking/appointment, cancel tomorrow's massage, cancel my upcoming visit, I need to cancel. Set bookingId when known; otherwise serviceName and/or date/timeSlot to pick the right visit. Uses POST /me/bookings/:id/cancel with salon cancel policy. NOT cancel_bookings (staff dashboard), NOT cancel_package_visit_self (package multi-visit), NOT explain_cancel_policy (read policy), NOT contact_support (unless cancel blocked and user asks for help), NOT reschedule_my_booking (move time).`;

export type CancelMyBookingPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'cancel_my_booking';
  serviceName?: string;
  date?: string;
};

export const CANCEL_MY_BOOKING_PROMPTS: readonly CancelMyBookingPromptFixture[] =
  [
    {
      id: 'cancel-my-booking-customer',
      prompt: 'Cancel my booking',
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
    },
    {
      id: 'cancel-my-appointment-customer',
      prompt: 'Cancel my appointment',
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
    },
    {
      id: 'cancel-tomorrow-massage-customer',
      prompt: "Cancel tomorrow's massage",
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
      serviceName: 'massage',
    },
    {
      id: 'cancel-upcoming-visit-customer',
      prompt: 'Cancel my upcoming visit',
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
    },
    {
      id: 'need-to-cancel-customer',
      prompt: 'I need to cancel my appointment',
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
    },
    {
      id: 'cancel-massage-friday-customer',
      prompt: 'Cancel my massage on Friday',
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
      serviceName: 'massage',
    },
    {
      id: 'please-cancel-booking-customer',
      prompt: 'Please cancel my booking',
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
    },
    {
      id: 'cancel-this-appointment-customer',
      prompt: 'Cancel this appointment',
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
    },
    {
      id: 'cancel-haircut-customer',
      prompt: 'Cancel my haircut appointment',
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
      serviceName: 'haircut',
    },
    {
      id: 'self-serve-cancel-customer',
      prompt: 'I want to cancel without calling the salon',
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
    },
    {
      id: 'cancel-next-appointment-customer',
      prompt: 'Cancel my next appointment',
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
    },
    {
      id: 'cancel-facial-tomorrow-customer',
      prompt: 'Cancel the facial I booked for tomorrow',
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
      serviceName: 'facial',
    },
    {
      id: 'cancel-reservation-customer',
      prompt: 'Cancel my reservation',
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
    },
    {
      id: 'cancel-visit-no-call-customer',
      prompt: "Don't need my visit anymore — cancel it",
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
    },
    {
      id: 'cancel-massage-at-3pm-customer',
      prompt: 'Cancel my massage at 3pm',
      surface: 'customer',
      expectedAction: 'cancel_my_booking',
      serviceName: 'massage',
    },
  ];

export type CustomerOwnedBookingMatchInput = {
  id: string;
  status: BookingStatus;
  startTime: Date;
  service?: { name?: string | null } | null;
  employee?: { name?: string | null } | null;
};

export function enrichCancelMyBookingParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  const serviceName =
    (params.serviceName as string | undefined)?.trim() ||
    extractServiceNameFromPrompt(prompt) ||
    prompt.match(/\b(massage|haircut|facial|color|manicure|blowdry)\b/i)?.[1];
  if (serviceName && !next.serviceName) {
    next.serviceName = serviceName.replace(/^tomorrow's\s+/i, '').trim();
  }
  return next;
}

export function matchCustomerOwnedBooking<T extends CustomerOwnedBookingMatchInput>(
  bookings: T[],
  params: Record<string, unknown>,
  prompt: string,
  timeZone = 'UTC',
  options?: { allowFirstWhenUnspecified?: boolean },
): { booking: T | null; ambiguous: T[] } {
  const now = new Date();
  let candidates = bookings.filter(
    (row) =>
      row.status === BookingStatus.CONFIRMED &&
      new Date(row.startTime) >= now,
  );

  if (params.bookingId) {
    const bookingId = String(params.bookingId);
    const found =
      candidates.find((row) => row.id === bookingId) ??
      candidates.find((row) => row.id.startsWith(bookingId));
    return { booking: found ?? null, ambiguous: [] };
  }

  const serviceName = (params.serviceName as string | undefined)?.trim();
  if (serviceName) {
    const needle = serviceName.toLowerCase();
    candidates = candidates.filter((row) =>
      (row.service?.name ?? '').toLowerCase().includes(needle),
    );
  }

  const employeeName = (params.employeeName as string | undefined)?.trim();
  if (employeeName) {
    const needle = employeeName.toLowerCase();
    candidates = candidates.filter((row) =>
      (row.employee?.name ?? '').toLowerCase().includes(needle),
    );
  }

  const range =
    serviceName && !params.date && !params.dateFrom && !params.dateTo
      ? null
      : resolveDateRange(params, prompt, timeZone);
  if (range) {
    candidates = candidates.filter((row) => {
      const day = row.startTime.toISOString().slice(0, 10);
      return day >= range.start && day <= range.end;
    });
  } else if (!serviceName) {
    const singleDay = extractSingleIsoDayFromPrompt(
      String(params.date ?? prompt),
      timeZone,
    );
    if (singleDay) {
      candidates = candidates.filter(
        (row) => row.startTime.toISOString().slice(0, 10) === singleDay,
      );
    }
  }

  if (params.timeSlot) {
    const slot = String(params.timeSlot).slice(0, 5);
    candidates = candidates.filter((row) =>
      row.startTime.toISOString().slice(11, 16).startsWith(slot),
    );
  }

  const hasSpecificFilters = Boolean(
    params.bookingId ||
      params.serviceName ||
      params.date ||
      params.timeSlot ||
      params.employeeName,
  );

  if (candidates.length > 1 && !hasSpecificFilters) {
    if (options?.allowFirstWhenUnspecified) {
      return { booking: candidates[0], ambiguous: [] };
    }
    return { booking: null, ambiguous: candidates };
  }

  if (candidates.length === 1) {
    return { booking: candidates[0], ambiguous: [] };
  }
  if (candidates.length === 0) {
    return { booking: null, ambiguous: [] };
  }
  return { booking: null, ambiguous: candidates };
}

export function buildCancelMyBookingAmbiguousSummary(
  bookings: CustomerOwnedBookingMatchInput[],
): string {
  const lines = bookings.slice(0, 3).map((row) => {
    const when = row.startTime.toISOString().slice(0, 16).replace('T', ' ');
    return `${row.service?.name ?? 'Appointment'} — ${when}`;
  });
  return `You have several upcoming appointments — specify which one to cancel: ${lines.join('; ')}.`;
}
