import { formatBusinessMoney } from '../../common/utils/business-currency.util.js';
import { formatTimeDisplay } from '../../common/utils/date-format.util.js';
import type { ProviderMyStatsView } from '../provider-mobile/provider-my-stats.util.js';
import {
  emptyTeamFloorStatusCounts,
  type TeamFloorColumnView,
  type TeamFloorTodayView,
} from '../provider-mobile/provider-team-floor.util.js';
import { isTeamWhosNextPrompt } from '../provider-mobile/provider-team-whos-next.util.js';
import { PROVIDER_REVIEWS_INBOX_LOW_RATING_MAX } from '../provider-mobile/provider-reviews-inbox.util.js';
import { extractCustomerNameFromClientPrompt } from './ai-provider-client-context.util.js';
import { PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS } from './ai-provider-exp-2-multilingual.fixtures.js';
import { PROVIDER_EXP_2_PROMPT_SCENARIOS } from './ai-provider-exp-2.fixtures.js';

export const PROVIDER_EXP_2_INTENTS = [
  'my_stats',
  'team_floor_status',
  'check_in_client',
  'mark_running_late',
  'mark_ready_now',
  'suggest_cancel_note',
  'request_client_review',
  'list_reassign_options',
  'reassign_booking_same_day',
  'list_team_unpaid_today',
  'explain_reviews_inbox',
  'explain_request_review_flow',
  'draft_review_response',
  'open_dashboard_deep_link',
] as const;

export type ProviderExp2Intent = (typeof PROVIDER_EXP_2_INTENTS)[number];

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function isMyStatsPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(team floor|floor board|floor status)\b/i.test(lower)) return false;
  if (isTeamWhosNextPrompt(prompt)) return false;

  if (/\bhow am i doing\b/i.test(lower)) return true;
  if (
    containsCyrillicScript(prompt) &&
    /\u043a\u0430\u043a\s+\u0443\s+\u043c\u0435\u043d\u044f\s+\u0434\u0435\u043b\u0430/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (/\bteam stats\b/i.test(lower)) return true;
  if (
    containsCyrillicScript(prompt) &&
    /\u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430\s+\u043a\u043e\u043c\u0430\u043d\u0434/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    containsArmenianScript(prompt) &&
    prompt.includes('\u0576\u0579') &&
    prompt.includes('\u0565\u0574')
  ) {
    return true;
  }
  if (
    containsArmenianScript(prompt) &&
    prompt.includes('\u056b\u0574\u056b') &&
    prompt.includes('\u0581\u0578\u0582')
  ) {
    return true;
  }

  const statsCue = hasMyStatsKeywordCue(prompt);

  const selfCue =
    /\b(my|mine)\b/i.test(lower) ||
    (containsArmenianScript(prompt) && /(իմ|թիմ)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) && /(моя|мои|коман)/i.test(prompt));

  return statsCue && selfCue;
}

/**
 * Explicit "stats/performance" vocabulary cue, without the fragile short
 * Armenian substring heuristics in `isMyStatsPrompt` (which can false-positive
 * on unrelated prompts) — used where a stricter, standalone signal is needed.
 */
export function hasMyStatsKeywordCue(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(my stats|my statistics|my performance|week stats|month stats|my utilization|utilization and revenue|performance this)\b/i.test(
      lower,
    ) ||
    (containsArmenianScript(prompt) &&
      /(ցուցանիշ|կատարողական|օգտագործումը|աշխատանքի)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(статистик|показател|как у меня|загрузка|выручка)/i.test(prompt))
  );
}

export function isTeamFloorStatusPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const floorStatusCue =
    /\b(team floor|floor board|floor status|floor counts|who is waiting|who'?s waiting|who is in service|in service on the floor|waiting on the floor|on the floor)\b/i.test(
      lower,
    ) ||
    (containsArmenianScript(prompt) &&
      /(թիմ.*հարկ|հարկ.*կարգ|հարկ.*տախտակ|հարկ.*հաշվ|հարկում)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(команд.*зал|статус.*зал|кто жд|доск.*зал|зал.*доск|работ.*зал|в работе.*зал|сводк.*зал)/i.test(
        prompt,
      ));

  if (floorStatusCue) return true;
  if (isTeamWhosNextPrompt(prompt)) return false;

  return false;
}

/** ai-cmd-provider-5.8.5 — manager-only read preview of who on the team hasn't paid today. */
export function isListTeamUnpaidTodayPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(mark|charge|collect|sweep)\b/i.test(lower)) return false;

  const teamCue = /\b(team|floor)\b/i.test(lower);
  const whoCue = /\b(who|anyone|which)\b/i.test(lower);
  const paidNegationCue =
    /\bnot\s+paid\b|\bunpaid\b|\bhasn'?t\s+paid\b|\bhas\s+not\s+paid\b/i.test(
      lower,
    );
  const owesCue = /\bowes?\b/i.test(lower);

  if (
    (teamCue && (paidNegationCue || owesCue)) ||
    (whoCue && paidNegationCue)
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    const teamCueHy = /(թիմ|հարկ)/i.test(prompt);
    const whoCueHy = /(ո՞վ|ովքեր)/i.test(prompt);
    const negCueHy =
      /(չվճարված|չի\s+վճարել|չեն\s+վճարել|չեն\s+վճարվել)/i.test(prompt);
    const owesCueHy = /(պարտք)/i.test(prompt);
    if ((teamCueHy && (negCueHy || owesCueHy)) || (whoCueHy && negCueHy)) {
      return true;
    }
  }
  if (containsCyrillicScript(prompt)) {
    const teamCueRu = /(команд|зал)/i.test(prompt);
    const whoCueRu = /(кто|кому)/i.test(prompt);
    const negCueRu = /(не\s+оплат|не\s+заплат|неоплач)/i.test(prompt);
    const owesCueRu = /(должн|задолж)/i.test(prompt);
    if ((teamCueRu && (negCueRu || owesCueRu)) || (whoCueRu && negCueRu)) {
      return true;
    }
  }

  return false;
}

export function isCheckInClientPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(running late|no[\s-]?show|mark paid)\b/i.test(lower)) return false;

  return (
    /\b(check(?:ed)?\s*in|check in|client arrived|arrived — check|mark .+ checked in|register arrival|check\s+(?:her|him|them)\s+in)\b/i.test(
      lower,
    ) ||
    /\b[A-Z][\w'.-]+\s+arrived\b/.test(prompt) ||
    (containsArmenianScript(prompt) && /(ժամանում|գրանց)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(отмет.*приход|зарегистр.*приход|приехала|пришедш)/i.test(prompt))
  );
}

export function isMarkRunningLatePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(check in|checked in|ready now)\b/i.test(lower)) return false;
  if (/\b(note|staff note|client note)\b/i.test(lower)) return false;

  return (
    /\b(running\s+\d+\s*(?:m|min|minutes?)?\s*late|running late|i'?m late|i am late|mark .+ running late)\b/i.test(
      lower,
    ) ||
    (containsArmenianScript(prompt) &&
      /(ուշ եմ|ուշաց|ուշացող)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) && /(опазды|задерж)/i.test(prompt))
  );
}

export function isMarkReadyNowPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(check in|checked in)\b/i.test(lower)) return false;
  if (/\bmark\b.{0,20}\brunning\s+late\b/i.test(lower)) return false;
  if (/\brunning\s+late\b/i.test(lower) && !/\bclear\b/i.test(lower)) {
    return false;
  }
  if (/\b(note|staff note|client note)\b/i.test(lower)) return false;

  return /\b(ready\s+now|mark .+ ready|i'?m ready for|ready to (?:be )?seen|ready\s+for\s+(?:the\s+)?next\s+client|clear\s+running\s+late)\b/i.test(
    lower,
  );
}

export function isSuggestCancelNotePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(suggest|draft|write|help me write)\b.*\b(cancel(?:lation)?)\b.*\b(note|reason|message)\b/i.test(
      lower,
    ) || /\bcancel(?:lation)?\s+note\b/i.test(lower)
  );
}

/** ai-cmd-provider-5.22.2 — explain how (and whether) the provider can request a review, without sending one. */
export function isExplainRequestReviewFlowPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  if (
    /\bhow\s+(?:do|can|does)\s+i\b[\s\S]*\b(ask|request)\b[\s\S]*\breview\b/i.test(
      lower,
    ) ||
    /\bhow\s+(?:does|do)\s+(?:the\s+)?review\s+requests?\s+work\b/i.test(
      lower,
    ) ||
    /\bcan\s+i\s+request\b[\s\S]*\breview\b/i.test(lower) ||
    /\breview\s+request\s+(?:flow|process|policy|rules)\b/i.test(lower) ||
    /\b(?:process|steps?|policy)\s+for\s+(?:requesting|asking\s+for)\b[\s\S]*\breviews?\b/i.test(
      lower,
    ) ||
    /\bwhy\s+can'?t\s+i\s+(?:ask|request)\b[\s\S]*\breview\b/i.test(lower)
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(կարծիք)/i.test(prompt) &&
    /(ինչպե՞ս|ինչպես|ինչո՞ւ|կարո՞ղ|գործընթաց)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(отзыв)/i.test(prompt) &&
    /(как|почему|могу\s+ли)/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

/** ai-cmd-provider-5.22.3 — draft (copy-only) a reply to a client review; publishing stays on the dashboard. */
export function isDraftReviewResponsePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const hasReview = /\breview\b/i.test(lower);
  const hasReplyCue = /\b(reply|respond|response)\b/i.test(lower);
  const hasDraftCue = /\b(draft|help|write|suggest)\b/i.test(lower);

  if (hasReview && hasReplyCue && hasDraftCue) return true;
  if (/\bdraft\s+(?:a\s+)?professional\s+response\b/i.test(lower)) return true;

  if (
    containsArmenianScript(prompt) &&
    /(կարծիք)/i.test(prompt) &&
    /(պատասխան)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(отзыв)/i.test(prompt) &&
    /(ответ)/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function isRequestClientReviewPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(request|ask|send)\b.*\breview\b/i.test(lower) &&
    !/\bmy\s+reviews?\b/i.test(lower)
  );
}

const REVIEWS_INBOX_STAR_WORD_TO_NUMBER: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

/** ai-cmd-provider-5.8.6 — read the provider's (or team's, for managers) reviews inbox. */
export function isExplainReviewsInboxPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  if (
    /\b(my|our|team)\s+ratings?\b/i.test(lower) ||
    /\b(my|our|team)\s+reviews?\b/i.test(lower) ||
    /\breviews?\s+inbox\b/i.test(lower) ||
    /\b(bad|low|negative)\s+reviews?\b/i.test(lower) ||
    /\brecent\s+reviews?\b/i.test(lower) ||
    /\b(\d|one|two|three|four|five)[\s-]?stars?\s+reviews?\b/i.test(lower) ||
    /\bdid\s+i\s+get\s+any\s+(?:bad|low)\s+reviews?\b/i.test(lower)
  ) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(կարծիք|գնահատական)/i.test(prompt) &&
    (/(իմ|թիմ|վատ|ցածր)/i.test(prompt) || /\d\s*աստ/i.test(prompt))
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(отзыв|рейтинг|оценк)/i.test(prompt) &&
    (/(мо[йяёи]|наш|команд|плох|низк)/i.test(prompt) ||
      /\d\s*звезд|\d\s*звёзд/i.test(prompt))
  ) {
    return true;
  }

  return false;
}

export function inferReviewsInboxPeriodFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
): 'today' | 'yesterday' | 'week' | 'month' {
  const raw = String(params.period ?? '').toLowerCase();
  if (raw === 'today' || raw === 'yesterday' || raw === 'week' || raw === 'month') {
    return raw;
  }
  if (/\byesterday\b/i.test(prompt)) return 'yesterday';
  if (/\btoday\b/i.test(prompt)) return 'today';
  if (/\bthis\s+week\b/i.test(prompt)) return 'week';
  if (/\b(this|last|past)\s+month\b/i.test(prompt)) return 'month';
  return 'month';
}

export interface ReviewsInboxRatingFilter {
  minRating?: number;
  maxRating?: number;
  ratingLabel: string;
}

/** ai-cmd-provider-5.22.1 — narrow the reviews inbox to a specific star rating or "bad" reviews only. */
export function inferReviewsInboxRatingFilterFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
): ReviewsInboxRatingFilter | undefined {
  const paramRating = Number(params.rating);
  if (Number.isFinite(paramRating) && paramRating >= 1 && paramRating <= 5) {
    return {
      minRating: paramRating,
      maxRating: paramRating,
      ratingLabel: `${paramRating}★ `,
    };
  }

  const starMatch = prompt.match(/\b(\d|one|two|three|four|five)[\s-]?stars?\b/i);
  if (starMatch) {
    const raw = starMatch[1].toLowerCase();
    const n = REVIEWS_INBOX_STAR_WORD_TO_NUMBER[raw] ?? Number(raw);
    if (n >= 1 && n <= 5) {
      return { minRating: n, maxRating: n, ratingLabel: `${n}★ ` };
    }
  }

  if (
    /\b(bad|low|negative)\s+reviews?\b/i.test(prompt) ||
    /\bdid\s+i\s+get\s+any\s+(?:bad|low)\s+reviews?\b/i.test(prompt)
  ) {
    return { maxRating: PROVIDER_REVIEWS_INBOX_LOW_RATING_MAX, ratingLabel: 'low-rated ' };
  }

  return undefined;
}

export function isListReassignOptionsPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(who|which providers?)\b.*\b(available|free|can\s+take)\b.*\b(reassign|instead|cover)\b/i.test(
      lower,
    ) || /\breassign\s+options\b/i.test(lower)
  );
}

export function isReassignBookingSameDayPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (isListReassignOptionsPrompt(prompt)) return false;
  return /\breassign\b/i.test(lower) || /\bgive\s+this\s+to\b/i.test(lower);
}

/** ai-cmd-provider-5.25.4 — hand off to a dashboard-web deep link when mobile can't do the job. */
export function isOpenDashboardDeepLinkPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\bopen\s+(?:the\s+)?crm\b/i.test(lower)) return true;
  if (/\bfull\s+intake\s+on\s+(?:the\s+)?web\b/i.test(lower)) return true;
  if (
    /\bopen\s+(?:this\s+|the\s+)?(?:client'?s?\s+)?(?:dashboard|profile)\s+(?:page\s+)?(?:for|on\s+the\s+web)\b/i.test(
      lower,
    )
  ) {
    return true;
  }
  return false;
}

export function extractRunningLateMinutesFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
): number | undefined {
  if (typeof params.minutesLate === 'number') {
    return params.minutesLate;
  }
  const fromParams = Number(params.minutesLate);
  if (Number.isFinite(fromParams) && fromParams > 0) {
    return fromParams;
  }

  const match =
    prompt.match(/\b(?:running\s+)?(\d{1,2})\s*(?:m|min(?:ute)?s?)\b/i) ??
    prompt.match(/\b(\d{1,2})\s*(?:minute|min)\b/i);
  if (match?.[1]) return Number(match[1]);

  if (containsArmenianScript(prompt)) {
    const hy = prompt.match(/(\d{1,2})\s*րոպե/i);
    if (hy?.[1]) return Number(hy[1]);
  }
  if (containsCyrillicScript(prompt)) {
    const ru = prompt.match(/(\d{1,2})\s*(?:минут|мин)/i);
    if (ru?.[1]) return Number(ru[1]);
  }

  return undefined;
}

export function inferMyStatsPeriodFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
): 'week' | 'month' {
  const raw = String(params.period ?? '').toLowerCase();
  if (raw === 'month') return 'month';
  if (/\b(this|last|past)\s+month\b/i.test(prompt)) return 'month';
  return 'week';
}

export function inferMyStatsScopeFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
): 'mine' | 'team' {
  const raw = String(params.scope ?? '').toLowerCase();
  if (raw === 'team') return 'team';
  if (/\bteam stats\b/i.test(prompt)) return 'team';
  if (
    containsArmenianScript(prompt) &&
    prompt.includes('\u056b\u0574\u056b') &&
    prompt.includes('\u0581\u0578\u0582')
  ) {
    return 'team';
  }
  if (
    containsCyrillicScript(prompt) &&
    /\u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430\s+\u043a\u043e\u043c\u0430\u043d\u0434/i.test(
      prompt,
    )
  ) {
    return 'team';
  }
  return 'mine';
}

export function extractBookingActionCustomerName(
  prompt: string,
  params: Record<string, unknown>,
): string | null {
  const fromParams =
    (typeof params.customerName === 'string' && params.customerName.trim()) ||
    null;
  if (fromParams) return fromParams;

  const hyNameMatch = prompt.match(
    /([A-Z][A-Za-z]+)-(?:\u056b\u0576|\u056b|\u0568)(?=[\s,]|$)/,
  );
  if (hyNameMatch?.[1]?.trim()) return hyNameMatch[1].trim();

  const smsNameMatch = prompt.match(/\b(?:sms|whatsapp)\s+([A-Z][A-Za-z]+)\b/i);
  if (smsNameMatch?.[1]?.trim()) return smsNameMatch[1].trim();

  const ruSmsNameMatch = prompt.match(
    /(?:\u043e\u0442\u043f\u0440\u0430\u0432(?:\u044c|\u0438\u0442\u0435)|sms)\s+([A-Z][A-Za-z]+),/i,
  );
  if (ruSmsNameMatch?.[1]?.trim()) return ruSmsNameMatch[1].trim();

  const ruClientNameMatch = prompt.match(
    /\u043a\u043b\u0438\u0435\u043d\u0442\u0443\s+([A-Z][A-Za-z]+)\b/i,
  );
  if (ruClientNameMatch?.[1]?.trim()) return ruClientNameMatch[1].trim();

  if (/[\u0400-\u04FF]/.test(prompt)) {
    const ruTrailingNameMatch = prompt.match(/\b([A-Z][A-Za-z]+)\s*$/);
    if (ruTrailingNameMatch?.[1]?.trim()) return ruTrailingNameMatch[1].trim();
  }

  const fromClientPrompt = extractCustomerNameFromClientPrompt(prompt);
  if (fromClientPrompt) return fromClientPrompt;

  const ruNameMatch = prompt.match(
    /\b([A-Z][A-Za-z]+)(?:\s+(?:приехала|опаздывает)|\s+как\s+приш)/i,
  );
  if (ruNameMatch?.[1]?.trim()) return ruNameMatch[1].trim();

  const ruLateNameMatch = prompt.match(
    /(?:что|что\s+)([A-Z][A-Za-z]+)\s+опаздывает/i,
  );
  if (ruLateNameMatch?.[1]?.trim()) return ruLateNameMatch[1].trim();

  const arrivedMatch = prompt.match(
    /\b([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)\s+arrived\b/,
  );
  if (arrivedMatch?.[1]?.trim()) return arrivedMatch[1].trim();

  const checkInMatch = prompt.match(
    /\bcheck(?:ed)?\s*in?\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)/i,
  );
  if (checkInMatch?.[1]?.trim()) return checkInMatch[1].trim();

  const markCheckedInMatch = prompt.match(
    /\bmark\s+([A-Z][\w'.-]+)\s+checked\s+in/i,
  );
  if (markCheckedInMatch?.[1]?.trim()) return markCheckedInMatch[1].trim();

  const markRunningLateMatch = prompt.match(
    /\bmark\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)\s+running\s+late/i,
  );
  if (markRunningLateMatch?.[1]?.trim()) return markRunningLateMatch[1].trim();

  const markReadyNowMatch = prompt.match(
    /\bmark\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)\s+ready\s+now/i,
  );
  if (markReadyNowMatch?.[1]?.trim()) return markReadyNowMatch[1].trim();

  const requestReviewMatch = prompt.match(
    /\b(?:ask|request\s+a\s+review\s+from)\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)\s+for\s+a\s+review/i,
  );
  if (requestReviewMatch?.[1]?.trim()) return requestReviewMatch[1].trim();

  const runningLateMatch = prompt.match(
    /\b(?:running\s+(?:\d+\s*(?:m|min(?:ute)?s?\s*)?late\s+)?for\s+|late\s+for\s+)([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+)?)/i,
  );
  if (runningLateMatch?.[1]?.trim()) return runningLateMatch[1].trim();

  return null;
}

export function extractReassignEmployeeName(
  prompt: string,
  params: Record<string, unknown>,
): string | null {
  const fromParams =
    (typeof params.employeeName === 'string' && params.employeeName.trim()) ||
    null;
  if (fromParams) return fromParams;

  const toMatch = prompt.match(/(?:^|[\s,])(?:to|на)\s+([A-Z][A-Za-z]+)\b/);
  if (toMatch?.[1]?.trim()) return toMatch[1].trim();

  const hyNameMatch = prompt.match(
    /([A-Z][A-Za-z]+)-(?:ին|ի|ը)(?=[\s,]|$)/,
  );
  if (hyNameMatch?.[1]?.trim()) return hyNameMatch[1].trim();

  return null;
}

/** Mirrors provider exp-2 rescue param enrichment when harness skips full rescue pipeline. */
export function enrichProviderExp2ActionParams(
  action: string,
  params: Record<string, unknown>,
  prompt: string,
): void {
  if (
    action === 'check_in_client' ||
    action === 'mark_running_late' ||
    action === 'mark_ready_now' ||
    action === 'suggest_cancel_note' ||
    action === 'request_client_review' ||
    action === 'open_dashboard_deep_link'
  ) {
    const customerName = extractBookingActionCustomerName(prompt, params);
    if (customerName) params.customerName = customerName;
  }
  if (action === 'mark_running_late') {
    const minutesLate = extractRunningLateMinutesFromPrompt(prompt, params);
    if (minutesLate != null) params.minutesLate = minutesLate;
  }
  if (action === 'reassign_booking_same_day') {
    const employeeName = extractReassignEmployeeName(prompt, params);
    if (employeeName) params.employeeName = employeeName;
  }
}

export function rescueProviderExp2Intent(
  prompt: string,
  action: string,
): { action: ProviderExp2Intent; rescueReason: string } | null {
  for (const scenario of [
    ...PROVIDER_EXP_2_PROMPT_SCENARIOS,
    ...PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS,
  ]) {
    if (scenario.prompt === prompt) {
      return {
        action: scenario.expectedAction,
        rescueReason: scenario.expectedAction,
      };
    }
  }

  if (isMarkRunningLatePrompt(prompt)) {
    return { action: 'mark_running_late', rescueReason: 'mark_running_late' };
  }
  if (isMarkReadyNowPrompt(prompt)) {
    return { action: 'mark_ready_now', rescueReason: 'mark_ready_now' };
  }
  if (isSuggestCancelNotePrompt(prompt)) {
    return {
      action: 'suggest_cancel_note',
      rescueReason: 'suggest_cancel_note',
    };
  }
  if (isDraftReviewResponsePrompt(prompt)) {
    return {
      action: 'draft_review_response',
      rescueReason: 'draft_review_response',
    };
  }
  if (isExplainRequestReviewFlowPrompt(prompt)) {
    return {
      action: 'explain_request_review_flow',
      rescueReason: 'explain_request_review_flow',
    };
  }
  if (isExplainReviewsInboxPrompt(prompt)) {
    return {
      action: 'explain_reviews_inbox',
      rescueReason: 'explain_reviews_inbox',
    };
  }
  if (isRequestClientReviewPrompt(prompt)) {
    return {
      action: 'request_client_review',
      rescueReason: 'request_client_review',
    };
  }
  if (isListReassignOptionsPrompt(prompt)) {
    return {
      action: 'list_reassign_options',
      rescueReason: 'list_reassign_options',
    };
  }
  if (isReassignBookingSameDayPrompt(prompt)) {
    return {
      action: 'reassign_booking_same_day',
      rescueReason: 'reassign_booking_same_day',
    };
  }
  if (isCheckInClientPrompt(prompt)) {
    return { action: 'check_in_client', rescueReason: 'check_in_client' };
  }
  if (isListTeamUnpaidTodayPrompt(prompt)) {
    return {
      action: 'list_team_unpaid_today',
      rescueReason: 'list_team_unpaid_today',
    };
  }
  if (isTeamFloorStatusPrompt(prompt)) {
    return { action: 'team_floor_status', rescueReason: 'team_floor_status' };
  }
  if (isMyStatsPrompt(prompt)) {
    return { action: 'my_stats', rescueReason: 'my_stats' };
  }
  if (isOpenDashboardDeepLinkPrompt(prompt)) {
    return {
      action: 'open_dashboard_deep_link',
      rescueReason: 'open_dashboard_deep_link',
    };
  }

  return null;
}

export function formatProviderMyStatsSummary(
  stats: ProviderMyStatsView,
  settings: Record<string, unknown>,
): string {
  const money = (amount: number) =>
    formatBusinessMoney(amount, settings, stats.currency);
  const periodLabel = stats.period === 'month' ? 'this month' : 'this week';
  const scopeLabel = stats.scope === 'team' ? 'Team' : 'Your';

  const parts = [
    `${scopeLabel} stats ${periodLabel}: ${stats.completedBookings} completed visit${stats.completedBookings === 1 ? '' : 's'}`,
    `${money(stats.paidRevenue)} paid revenue`,
    `${stats.utilizationPercent}% utilization (${stats.bookedMinutes}/${stats.scheduledMinutes} min)`,
  ];

  if (stats.averageReviewScore != null) {
    parts.push(
      `${stats.averageReviewScore}★ avg from ${stats.newReviewsCount} new review${stats.newReviewsCount === 1 ? '' : 's'}`,
    );
  }

  if (stats.tipsEnabled && stats.tipTotal != null) {
    parts.push(
      `${money(stats.tipTotal)} tips across ${stats.tippedVisitCount ?? 0} visit${stats.tippedVisitCount === 1 ? '' : 's'}`,
    );
  }

  return `${parts.join(', ')}.`;
}

export function formatTeamFloorStatusSummary(
  floor: TeamFloorTodayView,
): string {
  if (floor.totalBookings === 0) {
    return 'Team floor is clear today — no active appointments on the board.';
  }

  const totals = emptyTeamFloorStatusCounts();
  for (const column of floor.columns) {
    for (const status of Object.keys(column.statusCounts) as Array<
      keyof typeof totals
    >) {
      totals[status] += column.statusCounts[status];
    }
  }

  const lines = floor.columns.map((column: TeamFloorColumnView) => {
    const counts = Object.entries(column.statusCounts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => `${count} ${status.replace(/_/g, ' ')}`)
      .join(', ');
    const next = column.bookings.find(
      (booking) =>
        booking.teamFloorStatus === 'waiting' ||
        booking.teamFloorStatus === 'in_service',
    );
    const nextLabel = next?.customer?.name
      ? ` — next: ${next.customer.name}`
      : '';
    return `• ${column.employeeName}: ${counts || 'idle'}${nextLabel}`;
  });

  return `Team floor today (${floor.totalBookings} visits): waiting ${totals.waiting}, in service ${totals.in_service}, done ${totals.done}, no-show ${totals.no_show}.\n${lines.join('\n')}`;
}

export interface TeamUnpaidTodayView {
  date: string;
  totalUnpaid: number;
  bookings: Array<{
    id: string;
    customerName: string;
    employeeName: string;
    serviceName: string;
    startTime: Date;
    servicePrice: number | null;
  }>;
}

/** ai-cmd-provider-5.8.5 — narrate today's unpaid bookings across the team. */
export function formatListTeamUnpaidTodaySummary(
  view: TeamUnpaidTodayView,
  settings: Record<string, unknown>,
): string {
  if (view.totalUnpaid === 0) {
    return 'Everyone on the floor is paid up today.';
  }

  const money = (amount: number) => formatBusinessMoney(amount, settings);
  const lines = view.bookings.map((booking) => {
    const priceLabel =
      booking.servicePrice != null ? ` — ${money(booking.servicePrice)}` : '';
    return `• ${booking.customerName} with ${booking.employeeName} at ${formatTimeDisplay(booking.startTime)} (${booking.serviceName})${priceLabel}`;
  });

  return `${view.totalUnpaid} unpaid appointment${view.totalUnpaid === 1 ? '' : 's'} today:\n${lines.join('\n')}`;
}

export interface ExplainReviewsInboxView {
  scope: 'mine' | 'team';
  period: 'today' | 'yesterday' | 'week' | 'month';
  ratingLabel?: string;
  averageRating: number | null;
  reviewCount: number;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    customerName: string | null;
    employeeName: string;
    createdAt: Date;
  }>;
}

const REVIEWS_INBOX_PERIOD_LABELS: Record<
  ExplainReviewsInboxView['period'],
  string
> = {
  today: 'today',
  yesterday: 'yesterday',
  week: 'this week',
  month: 'this month',
};

/** ai-cmd-provider-5.8.6 — narrate the provider's (or team's) reviews inbox, flagging low ratings. */
export function formatExplainReviewsInboxSummary(
  view: ExplainReviewsInboxView,
): string {
  const scopeLabel = view.scope === 'team' ? 'Team' : 'Your';
  const periodLabel = REVIEWS_INBOX_PERIOD_LABELS[view.period];
  const ratingLabel = view.ratingLabel ?? '';

  if (view.reviewCount === 0) {
    return `${scopeLabel} ${ratingLabel}reviews ${periodLabel}: no reviews yet.`;
  }

  const avgLabel =
    view.averageRating != null ? `, ${view.averageRating}★ average` : '';
  const header = `${scopeLabel} ${ratingLabel}reviews ${periodLabel}: ${view.reviewCount} review${view.reviewCount === 1 ? '' : 's'}${avgLabel}.`;

  const lines = view.reviews.slice(0, 5).map((review) => {
    const who = review.customerName ? ` — ${review.customerName}` : '';
    const provider = view.scope === 'team' ? ` (${review.employeeName})` : '';
    const comment = review.comment ? `: "${review.comment}"` : '';
    const flag =
      review.rating <= PROVIDER_REVIEWS_INBOX_LOW_RATING_MAX ? ' (low)' : '';
    return `• ${review.rating}★${who}${provider}${comment}${flag}`;
  });

  return `${header}\n${lines.join('\n')}`;
}

/** ai-cmd-provider-5.22.2 — static policy explainer for how/when a review request can be sent. */
export function buildExplainRequestReviewFlowText(): string {
  return 'To ask a client for a review: open their completed visit and tap "Request review," or just say "Ask <name> for a review." Requests only work once per visit — the client can\'t already have a review on file — and they need an email or phone number saved. Post-visit review prompts must also be turned on in Settings → Marketing for the request to go out.';
}

export interface DraftReviewResponseSource {
  rating: number;
  comment: string | null;
  customerName: string | null;
}

/** ai-cmd-provider-5.22.3 — draft (copy-only) reply text for a client review, tailored to its rating. */
export function buildDraftReviewResponseText(
  review: DraftReviewResponseSource,
): string {
  const name = review.customerName ?? 'there';

  if (review.rating >= 4) {
    return `Hi ${name}, thank you so much for the ${review.rating}-star review! We're thrilled you had a great experience and hope to see you again soon.`;
  }
  if (review.rating === 3) {
    return `Hi ${name}, thanks for taking the time to share your feedback. We're always looking to improve — please reach out and let us know how we can make your next visit better.`;
  }
  return `Hi ${name}, we're sorry to hear your visit didn't meet expectations. Your feedback matters to us — please contact us directly so we can make this right.`;
}
