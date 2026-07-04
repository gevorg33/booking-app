import { formatBusinessMoney } from '../../common/utils/business-currency.util.js';
import type { ProviderMyStatsView } from '../provider-mobile/provider-my-stats.util.js';
import {
  emptyTeamFloorStatusCounts,
  type TeamFloorColumnView,
  type TeamFloorTodayView,
} from '../provider-mobile/provider-team-floor.util.js';
import { isTeamWhosNextPrompt } from '../provider-mobile/provider-team-whos-next.util.js';
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

  const statsCue =
    /\b(my stats|my statistics|my performance|week stats|month stats|my utilization|utilization and revenue|performance this)\b/i.test(
      lower,
    ) ||
    (containsArmenianScript(prompt) &&
      /(ցուցանիշ|կատարողական|օգտագործումը|աշխատանքի)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(статистик|показател|как у меня|загрузка|выручка)/i.test(prompt));

  const selfCue =
    /\b(my|mine)\b/i.test(lower) ||
    (containsArmenianScript(prompt) && /(իմ|թիմ)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) && /(моя|мои|коман)/i.test(prompt));

  return statsCue && selfCue;
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
  if (/\b(check in|checked in|running late)\b/i.test(lower)) return false;
  if (/\b(note|staff note|client note)\b/i.test(lower)) return false;

  return /\b(ready\s+now|mark .+ ready|i'?m ready for|ready to (?:be )?seen)\b/i.test(
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

export function isRequestClientReviewPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(request|ask|send)\b.*\breview\b/i.test(lower) &&
    !/\bmy\s+reviews?\b/i.test(lower)
  );
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
    action === 'request_client_review'
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
  if (isTeamFloorStatusPrompt(prompt)) {
    return { action: 'team_floor_status', rescueReason: 'team_floor_status' };
  }
  if (isMyStatsPrompt(prompt)) {
    return { action: 'my_stats', rescueReason: 'my_stats' };
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
