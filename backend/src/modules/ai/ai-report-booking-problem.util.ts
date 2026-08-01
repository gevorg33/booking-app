import {
  REPORT_BOOKING_PROBLEM_PROMPTS,
  type ReportBookingProblemAspect,
  type ReportBookingProblemPromptFixture,
} from './ai-report-booking-problem.fixtures.js';
import { REPORT_BOOKING_PROBLEM_MULTILINGUAL_SCENARIOS } from './ai-report-booking-problem-multilingual.fixtures.js';
import { enrichCancelMyBookingParamsFromPrompt } from './ai-cancel-my-booking.util.js';
import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import {
  extractSingleIsoDayFromPrompt,
  resolveDateRange,
} from './ai-orchestration.helpers.js';
import { isExplainPostVisitReviewPrompt } from './ai-explain-post-visit-review-prompt.util.js';
import { isLeaveVisitReviewPrompt } from './ai-leave-visit-review.util.js';

export const REPORT_BOOKING_PROBLEM_INTENTS = [
  'report_booking_problem',
] as const;

export type ReportBookingProblemIntent =
  (typeof REPORT_BOOKING_PROBLEM_INTENTS)[number];

export { CUSTOMER_REPORT_BOOKING_PROBLEM_CLASSIFIER_RULES } from './ai-report-booking-problem.fixtures.js';

const BILLING_ISSUE_CUE =
  /\b(charged twice|double bill(?:ed)?|wrong charge|billing issue|refund|overcharg|duplicate charge|paid twice|списали дважды|двойн|երկու անգամ|գանձ)/i;

const VISIT_ISSUE_CUE =
  /\b(something went wrong|bad experience|problem with my (?:visit|appointment|booking)|issue with my (?:visit|appointment|booking)|complain(?:t)? about|file a complaint|could be better|went wrong with my (?:visit|booking|appointment)|wrong time on my (?:appointment|booking|visit)|appointment time was wrong|пошло не так|սխալ էր|խնդիր)/i;

const REPORT_PROBLEM_CUE =
  /\b(report a (?:booking )?problem|report booking problem|open a support ticket for my booking|support ticket for my booking|tell the salon|problem after my appointment|there was a problem|please report it to support|report it to support)\b/i;

/** e2e-bug.236 — complaint / report-to-support cues that confirm_details must not steal. */
const COMPLAINT_OR_SUPPORT_REPORT_CUE =
  /\b(file a complaint|complaint about|complain about|report (?:a |this |my )?(?:booking )?problem|report it to support|please report)\b/i;

const GENERIC_SUPPORT_ONLY_CUE = /^\s*contact\s+support\s*$/i;

function matchReportBookingProblemScenario(
  prompt: string,
): ReportBookingProblemPromptFixture | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of REPORT_BOOKING_PROBLEM_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of REPORT_BOOKING_PROBLEM_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function containsArmenianScript(prompt: string): boolean {
  return /[\u0530-\u058F]/.test(prompt);
}

function containsCyrillicScript(prompt: string): boolean {
  return /[\u0400-\u04FF]/.test(prompt);
}

const GENERIC_PROBLEM_SERVICE_NAMES = new Set([
  'appointment',
  'booking',
  'visit',
  'reservation',
  'salon',
  'salon visit',
  'last',
  'completed booking',
]);

function extractProblemServiceName(
  prompt: string,
  enriched: Record<string, unknown>,
): string | undefined {
  const fromEnriched =
    typeof enriched.serviceName === 'string' ? enriched.serviceName.trim() : '';
  const raw =
    fromEnriched || extractServiceNameFromPrompt(prompt)?.trim() || '';
  if (!raw) return undefined;
  const normalized = raw
    .replace(/^my\s+/i, '')
    .trim()
    .toLowerCase();
  if (
    GENERIC_PROBLEM_SERVICE_NAMES.has(normalized) ||
    /^last\s+(appointment|visit|booking|time)$/i.test(normalized)
  ) {
    return undefined;
  }
  return raw;
}

export function resolveReportBookingProblemAspect(
  prompt: string,
): ReportBookingProblemAspect {
  const scenario = matchReportBookingProblemScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (BILLING_ISSUE_CUE.test(prompt)) return 'billing_issue';
  if (VISIT_ISSUE_CUE.test(prompt)) return 'visit_issue';
  return 'general';
}

export function isReportBookingProblemPrompt(prompt: string): boolean {
  if (isLeaveVisitReviewPrompt(prompt)) return false;
  if (isExplainPostVisitReviewPrompt(prompt)) return false;
  if (GENERIC_SUPPORT_ONLY_CUE.test(prompt.trim())) return false;

  if (matchReportBookingProblemScenario(prompt)) return true;

  if (
    (containsArmenianScript(prompt) &&
      /(սխալ|խնդիր|զեկուց)/i.test(prompt) &&
      /(այց|ամրագր|գանձ)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(пошло не так|проблем|списали|дважды|жалоб)/i.test(prompt) &&
      /(визит|запис|оплат|спис)/i.test(prompt))
  ) {
    return true;
  }

  if (BILLING_ISSUE_CUE.test(prompt)) return true;
  if (VISIT_ISSUE_CUE.test(prompt)) return true;
  if (REPORT_PROBLEM_CUE.test(prompt)) return true;

  // e2e-bug.236 — "file a complaint about my appointment" (complaint ≠ complain).
  if (
    COMPLAINT_OR_SUPPORT_REPORT_CUE.test(prompt) &&
    /\b(booking|appointment|visit|charge|bill(?:ed|ing)?)\b/i.test(prompt)
  ) {
    return true;
  }

  return (
    /\b(report|complain|complaint|problem|issue)\b/i.test(prompt) &&
    /\b(booking|appointment|visit|charge|bill(?:ed|ing)?)\b/i.test(prompt)
  );
}

export function isReportBookingProblemIntent(
  action: string,
): action is ReportBookingProblemIntent {
  return (REPORT_BOOKING_PROBLEM_INTENTS as readonly string[]).includes(action);
}

export interface ParsedReportBookingProblem {
  aspect: ReportBookingProblemAspect;
  message?: string;
  bookingId?: string;
  serviceName?: string;
  date?: string;
}

export type CustomerProblemBookingMatchInput = {
  id: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
};

function extractProblemMessageFromPrompt(prompt: string): string | undefined {
  const quoted = prompt.match(/"([^"]{3,500})"/)?.[1]?.trim();
  if (quoted) return quoted;
  const sayMatch = prompt
    .match(/\b(?:say|because)\s+(.{3,500})$/i)?.[1]
    ?.trim();
  if (sayMatch) return sayMatch;
  return undefined;
}

export function matchCustomerOwnedProblemBooking<
  T extends CustomerProblemBookingMatchInput,
>(
  bookings: T[],
  params: Record<string, unknown>,
  prompt: string,
  aspect: ReportBookingProblemAspect,
  timeZone = 'UTC',
): { booking: T | null; ambiguous: T[] } {
  let candidates = [...bookings];
  if (aspect === 'visit_issue') {
    const completed = candidates.filter((row) => row.status === 'completed');
    if (completed.length) candidates = completed;
  } else if (aspect === 'billing_issue') {
    const paid = candidates.filter((row) =>
      ['paid', 'partially_paid'].includes(row.paymentStatus),
    );
    if (paid.length) candidates = paid;
  }

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
      row.serviceName.toLowerCase().includes(needle),
    );
  }

  const range =
    serviceName && !params.date && !params.dateFrom && !params.dateTo
      ? null
      : resolveDateRange(params, prompt, timeZone);
  if (range) {
    candidates = candidates.filter((row) => {
      const day = row.startTime.slice(0, 10);
      return day >= range.start && day <= range.end;
    });
  } else if (!serviceName) {
    const singleDay = extractSingleIsoDayFromPrompt(
      String(params.date ?? prompt),
      timeZone,
    );
    if (singleDay) {
      candidates = candidates.filter(
        (row) => row.startTime.slice(0, 10) === singleDay,
      );
    }
  }

  const hasSpecificFilters = Boolean(
    params.bookingId || params.serviceName || params.date,
  );

  if (candidates.length > 1 && !hasSpecificFilters) {
    const sorted = [...candidates].sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
    return { booking: sorted[0] ?? null, ambiguous: [] };
  }

  if (candidates.length > 1) {
    return { booking: null, ambiguous: candidates };
  }

  if (candidates.length === 1) {
    return { booking: candidates[0], ambiguous: [] };
  }

  return { booking: null, ambiguous: [] };
}

export function parseReportBookingProblemFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedReportBookingProblem | null {
  if (!isReportBookingProblemPrompt(prompt)) return null;

  const enriched = enrichCancelMyBookingParamsFromPrompt(params, prompt);
  const serviceName = extractProblemServiceName(prompt, enriched);
  const message = extractProblemMessageFromPrompt(prompt);

  return {
    aspect: resolveReportBookingProblemAspect(prompt),
    ...(message ? { message } : {}),
    ...(enriched.bookingId ? { bookingId: enriched.bookingId as string } : {}),
    ...(serviceName ? { serviceName } : {}),
    ...(enriched.date ? { date: enriched.date as string } : {}),
  };
}

export function enrichReportBookingProblemParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseReportBookingProblemFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    aspect: parsed.aspect,
    ...(parsed.message ? { message: parsed.message } : {}),
    ...(parsed.bookingId ? { bookingId: parsed.bookingId } : {}),
    ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
    ...(parsed.date ? { date: parsed.date } : {}),
  };
}

export function rescueReportBookingProblemIntent(
  prompt: string,
  action: string,
): { action: ReportBookingProblemIntent; rescueReason: string } | null {
  if (isReportBookingProblemIntent(action)) return null;
  if (!parseReportBookingProblemFromPrompt(prompt)) return null;
  return {
    action: 'report_booking_problem',
    rescueReason: 'report_booking_problem',
  };
}

export function buildReportBookingProblemAmbiguousSummary(
  bookings: Array<{ serviceName: string; startTime: string }>,
): string {
  const lines = bookings.slice(0, 5).map((booking) => {
    const when = booking.startTime.slice(0, 16).replace('T', ' ');
    return `• ${booking.serviceName} — ${when}`;
  });
  return `Multiple bookings match — which visit should I report a problem for?\n${lines.join('\n')}`;
}

export function buildDefaultBookingProblemMessage(
  serviceName: string,
  aspect: ReportBookingProblemAspect,
  customMessage?: string,
): string {
  if (customMessage?.trim()) return customMessage.trim();
  if (aspect === 'billing_issue') {
    return `Customer reported a billing issue for "${serviceName}" in the mobile app.`;
  }
  return `Customer reported an issue after "${serviceName}" in the mobile app.`;
}

export function buildPublicBookingSupportUrl(
  slug: string,
  bookingId: string,
  origin?: string,
): string | null {
  if (!origin?.trim()) return null;
  const url = new URL(`${origin.replace(/\/$/, '')}/book/${slug}`);
  url.searchParams.set('support', '1');
  url.searchParams.set('bookingId', bookingId);
  return url.toString();
}

export function buildReportBookingProblemNavigate(bookingId: string) {
  return {
    path: 'account',
    query: { section: 'bookings', supportBookingId: bookingId },
  };
}
