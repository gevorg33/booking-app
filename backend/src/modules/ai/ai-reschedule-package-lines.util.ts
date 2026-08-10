import { enrichRescheduleMyBookingParamsFromPrompt } from './ai-reschedule-my-booking.util.js';

export const RESCHEDULE_PACKAGE_LINES_INTENTS = [
  'reschedule_package_lines',
] as const;

export type ReschedulePackageLinesIntent =
  (typeof RESCHEDULE_PACKAGE_LINES_INTENTS)[number];

export const CUSTOMER_RESCHEDULE_PACKAGE_LINES_CLASSIFIER_RULES = `- reschedule_package_lines: MUTATE — logged-in customer moves two or more specific numbered visits of a package purchase in one command. Triggers: move visits 2 and 3 to next week; reschedule visits 1, 2 and 4 of my package to Friday; shift package visits 2 and 3 to next Monday. Requires visitIndexes (array, ≥2 numbers parsed from "visit(s) N and M"); optional packageName/bookingId to disambiguate when the customer has more than one active package, date/timeSlot for the shared target. Uses POST /me/bookings/:id/package/reschedule with lines[]. NOT reschedule_package_visit_self (moves exactly one visit or an auto-detected single one), NOT cancel_package_visit_self, NOT book_package.`;

function extractPackageNameFromPrompt(prompt: string): string | undefined {
  if (/\bspa\s+day\b/i.test(prompt)) return 'Spa Day';
  const quoted = prompt.match(/["']([^"']+?)["']\s+package/i)?.[1];
  if (quoted) return quoted.trim();
  return undefined;
}

function extractBookingIdFromPrompt(prompt: string): string | undefined {
  const match =
    prompt.match(/\bbooking\s*#?\s*([a-z0-9-]{6,})\b/i) ??
    prompt.match(/\bappointment\s*#?\s*([a-z0-9-]{6,})\b/i);
  return match?.[1];
}

/** Extracts 2+ numbered "visit(s)" references from one command, e.g. "visits 2 and 3". */
export function extractPackageVisitIndexesFromPrompt(prompt: string): number[] {
  const clause = prompt.match(
    /\bvisits?\s+(.+?)(?:\s+(?:to|for|on)\b|[.!?]|$)/i,
  );
  if (!clause) return [];
  const nums = clause[1].match(/\d+/g);
  if (!nums) return [];
  return [...new Set(nums.map((n) => parseInt(n, 10)))].sort((a, b) => a - b);
}

export interface ParsedReschedulePackageLinesRequest {
  packageName?: string;
  bookingId?: string;
  visitIndexes: number[];
  date?: string;
  timeSlot?: string;
}

export function enrichReschedulePackageLinesParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  timeZone = 'UTC',
): Record<string, unknown> {
  const next = enrichRescheduleMyBookingParamsFromPrompt(
    params,
    prompt,
    timeZone,
  );
  if (!next.packageName) {
    const packageName = extractPackageNameFromPrompt(prompt);
    if (packageName) next.packageName = packageName;
  }
  if (!next.bookingId) {
    const bookingId = extractBookingIdFromPrompt(prompt);
    if (bookingId) next.bookingId = bookingId;
  }
  if (!Array.isArray(next.visitIndexes)) {
    const visitIndexes = extractPackageVisitIndexesFromPrompt(prompt);
    if (visitIndexes.length) next.visitIndexes = visitIndexes;
  }
  return next;
}

export function parseReschedulePackageLinesFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
  timeZone = 'UTC',
): ParsedReschedulePackageLinesRequest | null {
  const enriched = enrichReschedulePackageLinesParamsFromPrompt(
    params,
    prompt,
    timeZone,
  );
  const visitIndexes = Array.isArray(enriched.visitIndexes)
    ? (enriched.visitIndexes as number[])
    : [];
  if (visitIndexes.length < 2) return null;

  return {
    packageName:
      typeof enriched.packageName === 'string'
        ? enriched.packageName
        : undefined,
    bookingId:
      typeof enriched.bookingId === 'string' ? enriched.bookingId : undefined,
    visitIndexes,
    date: typeof enriched.date === 'string' ? enriched.date : undefined,
    timeSlot:
      typeof enriched.timeSlot === 'string' ? enriched.timeSlot : undefined,
  };
}

export function buildReschedulePackageLinesAmbiguousSummary(
  packageNames: string[],
): string {
  return `You have several active packages — say which one: ${packageNames.join(', ')}.`;
}

export function buildReschedulePackageLinesNavigate(bookingId?: string) {
  return {
    path: 'account',
    query: {
      section: 'appointments',
      ...(bookingId ? { bookingId } : {}),
    },
  };
}
