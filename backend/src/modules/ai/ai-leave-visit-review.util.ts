import {
  LEAVE_VISIT_REVIEW_PROMPTS,
  type LeaveVisitReviewPromptFixture,
} from './ai-leave-visit-review.fixtures.js';
import { LEAVE_VISIT_REVIEW_MULTILINGUAL_SCENARIOS } from './ai-leave-visit-review-multilingual.fixtures.js';
import { enrichCancelMyBookingParamsFromPrompt } from './ai-cancel-my-booking.util.js';
import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import {
  extractSingleIsoDayFromPrompt,
  resolveDateRange,
} from './ai-orchestration.helpers.js';

export const LEAVE_VISIT_REVIEW_INTENTS = ['leave_visit_review'] as const;

export type LeaveVisitReviewIntent =
  (typeof LEAVE_VISIT_REVIEW_INTENTS)[number];

export { CUSTOMER_LEAVE_VISIT_REVIEW_CLASSIFIER_RULES } from './ai-leave-visit-review.fixtures.js';

const EXPLAIN_REVIEW_PROMPT_CUE =
  /\b(why am i seeing|why is the app asking|why did i get a review|review popup|post-visit review|skip the rating|can i skip|dismiss the review|will you ask me again|do i have to (?:rate|review|leave)|what is this satisfaction|explain the post-visit review|how does the visit rating)\b/i;

const REPORT_PROBLEM_CUE =
  /\b(something went wrong|charged twice|wrong charge|complaint|refund|dispute|problem with my visit|issue with my visit)\b/i;

const REBOOK_CUE =
  /\b(rebook|book same again|repeat(?:\s+my)?\s+last|same as last|schedule the same)\b/i;

const REVIEW_CUE =
  /\b(rate|review|feedback|star(?:s)?|rating|գնահատ|կարծիք|отзыв|оцени|звезд|звёзд)\b/i;

const LAST_VISIT_CUE =
  /\b(last visit|my last appointment|previous visit|recent visit|վերջին այց|последн\w*\s+визит)\b/i;

const CUSTOMER_OWNERSHIP_CUE =
  /\b(my|today'?s|for my|completed booking|salon visit|appointment)\b/i;

const WORD_RATING: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

function matchLeaveVisitReviewScenario(
  prompt: string,
): LeaveVisitReviewPromptFixture | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of LEAVE_VISIT_REVIEW_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of LEAVE_VISIT_REVIEW_MULTILINGUAL_SCENARIOS) {
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

export function isLastVisitReviewCue(prompt: string): boolean {
  return LAST_VISIT_CUE.test(prompt);
}

export function extractVisitReviewRatingFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): number | undefined {
  if (typeof params.rating === 'number') {
    const normalized = Math.round(params.rating);
    if (normalized >= 1 && normalized <= 5) return normalized;
  }
  const fromParams = Number(params.rating);
  if (Number.isFinite(fromParams) && fromParams >= 1 && fromParams <= 5) {
    return Math.round(fromParams);
  }

  const scenario = matchLeaveVisitReviewScenario(prompt);
  if (scenario?.rating) return scenario.rating;

  const emojiStars = (prompt.match(/⭐/g) ?? []).length;
  if (emojiStars >= 1 && emojiStars <= 5) return emojiStars;

  const digitMatch =
    prompt.match(
      /\b(?:rate|give|left?|post)\s*(?:it\s*)?(\d)\s*(?:\/\s*5|out of 5|stars?)?\b/i,
    ) ??
    prompt.match(/\b(\d)\s*(?:\/\s*5|out of 5|stars?)\b/i) ??
    prompt.match(/\brate\s+my\s+visit\s+(\d)\b/i);
  if (digitMatch?.[1]) {
    const rating = Number(digitMatch[1]);
    if (rating >= 1 && rating <= 5) return rating;
  }

  const wordMatch = prompt.match(
    /\b(one|two|three|four|five)\s+stars?\b/i,
  )?.[1];
  if (wordMatch) return WORD_RATING[wordMatch.toLowerCase()];

  if (containsArmenianScript(prompt)) {
    const hy = prompt.match(/(\d)\s*աստղ/i);
    if (hy?.[1]) {
      const rating = Number(hy[1]);
      if (rating >= 1 && rating <= 5) return rating;
    }
  }
  if (containsCyrillicScript(prompt)) {
    const ru = prompt.match(/(\d)\s*(?:звезд|звёзд)/i);
    if (ru?.[1]) {
      const rating = Number(ru[1]);
      if (rating >= 1 && rating <= 5) return rating;
    }
  }

  return undefined;
}

export function isLeaveVisitReviewPrompt(prompt: string): boolean {
  if (EXPLAIN_REVIEW_PROMPT_CUE.test(prompt)) return false;
  if (REPORT_PROBLEM_CUE.test(prompt)) return false;
  if (REBOOK_CUE.test(prompt) && !REVIEW_CUE.test(prompt)) return false;

  if (matchLeaveVisitReviewScenario(prompt)) return true;

  if (
    (containsArmenianScript(prompt) && /(գնահատ|կարծիք|աստղ)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) && /(отзыв|оцен|звезд|звёзд)/i.test(prompt))
  ) {
    return (
      CUSTOMER_OWNERSHIP_CUE.test(prompt) ||
      isLastVisitReviewCue(prompt) ||
      /\bfor\s+(?:today|my)\b/i.test(prompt)
    );
  }

  if (REVIEW_CUE.test(prompt)) {
    return (
      CUSTOMER_OWNERSHIP_CUE.test(prompt) ||
      isLastVisitReviewCue(prompt) ||
      /\bfor\s+(?:today|my)\b/i.test(prompt)
    );
  }

  return false;
}

export function isLeaveVisitReviewIntent(
  action: string,
): action is LeaveVisitReviewIntent {
  return (LEAVE_VISIT_REVIEW_INTENTS as readonly string[]).includes(action);
}

export interface ParsedLeaveVisitReview {
  rating?: number;
  comment?: string;
  bookingId?: string;
  serviceName?: string;
  date?: string;
}

export type CustomerReviewableBookingMatchInput = {
  id: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  canReview: boolean;
  employeeName?: string;
};

const GENERIC_REVIEW_SERVICE_NAMES = new Set([
  'appointment',
  'booking',
  'visit',
  'reservation',
  'salon',
  'salon visit',
  'last',
  'completed',
  'completed booking',
]);

function extractLeaveVisitReviewServiceName(
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
    GENERIC_REVIEW_SERVICE_NAMES.has(normalized) ||
    /^last\s+(appointment|visit|booking|time)$/i.test(normalized)
  ) {
    return undefined;
  }
  return raw;
}

function extractVisitReviewCommentFromPrompt(
  prompt: string,
): string | undefined {
  const quoted = prompt.match(/"([^"]{3,200})"/)?.[1]?.trim();
  if (quoted) return quoted;
  const sayMatch = prompt.match(/\bsay(?:ing)?\s+(.{3,200})$/i)?.[1]?.trim();
  if (sayMatch && !/\b(star|rating|review)\b/i.test(sayMatch)) return sayMatch;
  return undefined;
}

export function matchCustomerReviewableBooking<
  T extends CustomerReviewableBookingMatchInput,
>(
  bookings: T[],
  params: Record<string, unknown>,
  prompt: string,
  timeZone = 'UTC',
): { booking: T | null; ambiguous: T[] } {
  let candidates = bookings.filter((row) => row.canReview);

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

  const employeeName = (params.employeeName as string | undefined)?.trim();
  if (employeeName) {
    const needle = employeeName.toLowerCase();
    candidates = candidates.filter((row) =>
      (row.employeeName ?? '').toLowerCase().includes(needle),
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
    params.bookingId ||
    params.serviceName ||
    params.date ||
    params.employeeName,
  );

  if (
    candidates.length > 1 &&
    (!hasSpecificFilters || isLastVisitReviewCue(prompt))
  ) {
    const sorted = [...candidates].sort(
      (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
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

export function parseLeaveVisitReviewFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedLeaveVisitReview | null {
  if (!isLeaveVisitReviewPrompt(prompt)) return null;

  const enriched = enrichCancelMyBookingParamsFromPrompt(params, prompt);
  const serviceName = extractLeaveVisitReviewServiceName(prompt, enriched);
  const rating = extractVisitReviewRatingFromPrompt(prompt, params);
  const comment = extractVisitReviewCommentFromPrompt(prompt);

  return {
    ...(rating ? { rating } : {}),
    ...(comment ? { comment } : {}),
    ...(enriched.bookingId ? { bookingId: enriched.bookingId as string } : {}),
    ...(serviceName ? { serviceName } : {}),
    ...(enriched.date ? { date: enriched.date as string } : {}),
  };
}

export function enrichLeaveVisitReviewParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseLeaveVisitReviewFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    ...(parsed.rating ? { rating: parsed.rating } : {}),
    ...(parsed.comment ? { comment: parsed.comment } : {}),
    ...(parsed.bookingId ? { bookingId: parsed.bookingId } : {}),
    ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
    ...(parsed.date ? { date: parsed.date } : {}),
  };
}

export function rescueLeaveVisitReviewIntent(
  prompt: string,
  action: string,
): { action: LeaveVisitReviewIntent; rescueReason: string } | null {
  if (isLeaveVisitReviewIntent(action)) return null;
  if (!parseLeaveVisitReviewFromPrompt(prompt)) return null;
  return {
    action: 'leave_visit_review',
    rescueReason: 'leave_visit_review',
  };
}

export function buildLeaveVisitReviewAmbiguousSummary(
  bookings: Array<{ serviceName: string; startTime: string }>,
): string {
  const lines = bookings.slice(0, 5).map((booking) => {
    const when = booking.startTime.slice(0, 16).replace('T', ' ');
    return `• ${booking.serviceName} — ${when}`;
  });
  return `Multiple completed visits match — which one should I review?\n${lines.join('\n')}`;
}

export function buildLeaveVisitReviewNavigate(bookingId: string) {
  return {
    path: 'account',
    query: { reviewBookingId: bookingId },
  };
}
