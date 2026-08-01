/**
 * e2e-bug.285 — AI plan/summary date labels must never use ambiguous DD/MM
 * slash forms (01/08/2026) that LLMs misread as US MM/DD (January 8).
 */
import { formatLocalizedDate } from '../../common/utils/locale-format.util.js';

/**
 * Date-grounded AI actions whose summaries must keep deterministic copy —
 * skip LLM enrich (e2e-bug.285 booking dates; e2e-bug.289 tour week locale;
 * e2e-bug.311 clinic catalog locale).
 */
export const AI_DATE_GROUNDED_BOOKING_ACTIONS = [
  'create_booking',
  'reschedule_booking',
  'book_nearest_slot',
  'update_bookings',
  'list_tour_calendar_week',
  'explain_clinic_services',
] as const;

export type AiDateGroundedBookingAction =
  (typeof AI_DATE_GROUNDED_BOOKING_ACTIONS)[number];

export function isAiDateGroundedBookingAction(
  action: string,
): action is AiDateGroundedBookingAction {
  return (AI_DATE_GROUNDED_BOOKING_ACTIONS as readonly string[]).includes(
    action,
  );
}

/**
 * Unambiguous calendar day for AI plan reasoning / success summaries.
 * Always day-month-year words (en-GB): "1 August 2026" — never DD/MM slash.
 */
export function formatDateForAiLabel(
  input: Date | string,
  locale: string | null = 'en',
  timeZone = 'UTC',
): string {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return formatLocalizedDate(`${input}T12:00:00.000Z`, locale, timeZone);
  }
  return formatLocalizedDate(input, locale, timeZone);
}

/** True when summary month name disagrees with an ISO startTime month. */
export function summaryMisreadsStartTimeMonth(
  summary: string,
  startTime: Date | string,
): boolean {
  const d =
    typeof startTime === 'string' ? new Date(startTime) : startTime;
  if (Number.isNaN(d.getTime())) return false;
  const monthIndex = d.getUTCMonth(); // 0-based
  const usMonths = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];
  const lower = summary.toLowerCase();
  const mentioned = usMonths
    .map((name, i) => ({ name, i }))
    .filter(({ name }) => lower.includes(name));
  if (mentioned.length === 0) return false;
  return mentioned.some(({ i }) => i !== monthIndex);
}
