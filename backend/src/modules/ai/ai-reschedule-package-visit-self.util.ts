import { hasDashboardCustomerReference } from './ai-customer-crm.util.js';
import { enrichRescheduleMyBookingParamsFromPrompt } from './ai-reschedule-my-booking.util.js';
import {
  extractPackageVisitIndexFromPrompt,
  matchCustomerOwnedPackageVisit,
  type CustomerOwnedPackageVisitMatchInput,
} from './ai-cancel-package-visit-self.util.js';
import {
  RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS,
  type ReschedulePackageVisitSelfPromptFixture,
} from './ai-reschedule-package-visit-self.fixtures.js';
import { RESCHEDULE_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS } from './ai-reschedule-package-visit-self-multilingual.fixtures.js';

export const RESCHEDULE_PACKAGE_VISIT_SELF_INTENTS = [
  'reschedule_package_visit_self',
] as const;

export type ReschedulePackageVisitSelfIntent =
  (typeof RESCHEDULE_PACKAGE_VISIT_SELF_INTENTS)[number];

export {
  CUSTOMER_RESCHEDULE_PACKAGE_VISIT_SELF_CLASSIFIER_RULES,
  RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS,
  RESCHEDULE_PACKAGE_VISIT_SELF_RESCUE_SCENARIOS,
} from './ai-reschedule-package-visit-self.fixtures.js';

export interface ParsedReschedulePackageVisitSelfRequest {
  packageName?: string;
  visitIndex?: number;
  bookingId?: string;
  date?: string;
  timeSlot?: string;
  startTime?: string;
  lines?: Array<{ bookingId: string; startTime: string; employeeId?: string }>;
}

function matchReschedulePackageVisitSelfScenario(
  prompt: string,
): ReschedulePackageVisitSelfPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of RESCHEDULE_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function extractBookingIdFromPrompt(prompt: string): string | undefined {
  const match =
    prompt.match(/\bbooking\s*#?\s*([a-z0-9-]{6,})\b/i) ??
    prompt.match(/\bappointment\s*#?\s*([a-z0-9-]{6,})\b/i);
  return match?.[1];
}

function extractPackageNameFromPrompt(prompt: string): string | undefined {
  if (/\bspa\s+day\b/i.test(prompt)) return 'Spa Day';
  const quoted = prompt.match(/["']([^"']+?)["']\s+package/i)?.[1];
  if (quoted) return quoted.trim();
  const named = prompt.match(
    /\b(?:book|reserve|schedule|check)\s+(?:the\s+)?([a-z][\w\s-]{2,30}?)\s+package\b/i,
  );
  if (named?.[1]) return named[1].trim();
  return undefined;
}

export function isReschedulePackageVisitSelfIntent(
  action: string,
): action is ReschedulePackageVisitSelfIntent {
  return (RESCHEDULE_PACKAGE_VISIT_SELF_INTENTS as readonly string[]).includes(
    action,
  );
}

export function isReschedulePackageVisitSelfPrompt(prompt: string): boolean {
  if (matchReschedulePackageVisitSelfScenario(prompt)) return true;

  const packageContext =
    /\b(package\s+visit|spa\s+day|package\s+appointment|package\s+bundle)\b/i.test(
      prompt,
    ) ||
    (/\bpackage\b/i.test(prompt) && /\b(visit|appointment)\b/i.test(prompt)) ||
    /\bmy\s+package\b/i.test(prompt) ||
    /(spa day|package visit|package appointment)/i.test(prompt);

  const selfScope =
    /\bmy\b/i.test(prompt) ||
    /\bthis\b/i.test(prompt) ||
    /\b(next|upcoming)\s+package\b/i.test(prompt) ||
    /\bvisit\s+\d+\s+of\s+my\b/i.test(prompt) ||
    /\bvisit\s+\d+\s+on\s+my\b/i.test(prompt) ||
    /\bpackage\s+visit\s+\d+\b/i.test(prompt) ||
    /(?:իմ|այս)/i.test(prompt) ||
    /(?:мою|моя|мой|эту|это)/i.test(prompt);

  const rescheduleIntent =
    (/\b(reschedule|move|change|shift)\b/i.test(prompt) &&
      !/\b(can\s+i|am\s+i|will\s+i|do\s+i|what\s+(?:are|is|happens)|explain|rules?|policy|terms?|just\s+one)\b/i.test(
        prompt,
      )) ||
    (/վերամրագր/i.test(prompt) && /(իմ|այս|package|visit)/i.test(prompt)) ||
    (/(փոխել|տեղափոխ)/i.test(prompt) &&
      /(իմ|այս|package|visit)/i.test(prompt)) ||
    (/(перенес|перенести|измен|изменить|перенос)/i.test(prompt) &&
      /(мою|моя|мой|эту|это|пакетн|spa\s+day|визит)/i.test(prompt));

  return (
    packageContext &&
    selfScope &&
    rescheduleIntent &&
    (!hasDashboardCustomerReference(prompt) ||
      /\b(my|I\s+booked)\b/i.test(prompt))
  );
}

export function enrichReschedulePackageVisitSelfParamsFromPrompt(
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
  if (next.visitIndex == null) {
    const visitIndex = extractPackageVisitIndexFromPrompt(prompt);
    if (visitIndex != null) next.visitIndex = visitIndex;
  }
  return next;
}

export function parseReschedulePackageVisitSelfFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
  timeZone = 'UTC',
): ParsedReschedulePackageVisitSelfRequest | null {
  if (!isReschedulePackageVisitSelfPrompt(prompt)) return null;

  const scenario = matchReschedulePackageVisitSelfScenario(prompt);
  const enriched = enrichReschedulePackageVisitSelfParamsFromPrompt(
    params,
    prompt,
    timeZone,
  );

  return {
    packageName:
      (typeof enriched.packageName === 'string'
        ? enriched.packageName
        : undefined) ?? scenario?.packageName,
    visitIndex:
      typeof enriched.visitIndex === 'number'
        ? enriched.visitIndex
        : scenario?.visitIndex,
    bookingId:
      typeof enriched.bookingId === 'string' ? enriched.bookingId : undefined,
    date:
      (typeof enriched.date === 'string' ? enriched.date : undefined) ??
      scenario?.date,
    timeSlot:
      (typeof enriched.timeSlot === 'string' ? enriched.timeSlot : undefined) ??
      scenario?.timeSlot,
    startTime:
      typeof enriched.startTime === 'string' ? enriched.startTime : undefined,
    lines: Array.isArray(enriched.lines)
      ? (enriched.lines as ParsedReschedulePackageVisitSelfRequest['lines'])
      : undefined,
  };
}

export function buildReschedulePackageVisitSelfAmbiguousSummary(
  bookings: CustomerOwnedPackageVisitMatchInput[],
): string {
  const lines = bookings.slice(0, 3).map((row) => {
    const when = row.startTime.slice(0, 16).replace('T', ' ');
    const label = row.packageName ?? row.serviceName ?? 'Package visit';
    return `${label} — ${when}`;
  });
  return `You have several upcoming package visits — specify which one to reschedule: ${lines.join('; ')}.`;
}

export function buildReschedulePackageVisitSelfNavigate(bookingId?: string): {
  path: string;
  query: Record<string, string>;
} {
  return {
    path: '/account',
    query: bookingId
      ? { tab: 'bookings', reschedulePackage: bookingId }
      : { tab: 'bookings' },
  };
}

export function rescueReschedulePackageVisitSelfIntent(
  prompt: string,
  action: string,
): { action: ReschedulePackageVisitSelfIntent; rescueReason: string } | null {
  if (isReschedulePackageVisitSelfIntent(action)) return null;
  if (!parseReschedulePackageVisitSelfFromPrompt(prompt)) return null;
  return {
    action: 'reschedule_package_visit_self',
    rescueReason: 'reschedule_package_self',
  };
}

export { matchCustomerOwnedPackageVisit };
