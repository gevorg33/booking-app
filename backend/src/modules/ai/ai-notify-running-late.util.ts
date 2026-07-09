import {
  NOTIFY_RUNNING_LATE_PROMPTS,
  type NotifyRunningLatePromptFixture,
} from './ai-notify-running-late.fixtures.js';
import { NOTIFY_RUNNING_LATE_MULTILINGUAL_SCENARIOS } from './ai-notify-running-late-multilingual.fixtures.js';
import { enrichCancelMyBookingParamsFromPrompt } from './ai-cancel-my-booking.util.js';
import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import {
  defaultCustomerRunningLateMinutes,
  normalizeCustomerRunningLateMinutes,
} from '../../common/utils/customer-running-late.util.js';
import { isExplainStripeCurrencyWarningPrompt } from './ai-stripe-currency-warning.util.js';
import { isCatalogNotifyCustomersPrompt } from './ai-catalog-notify.util.js';

export const NOTIFY_RUNNING_LATE_INTENTS = ['notify_running_late'] as const;

export type NotifyRunningLateIntent =
  (typeof NOTIFY_RUNNING_LATE_INTENTS)[number];

export { CUSTOMER_NOTIFY_RUNNING_LATE_CLASSIFIER_RULES } from './ai-notify-running-late.fixtures.js';

const PROVIDER_RUNNING_LATE_CUE =
  /\b(mark .+ running late|tell the client|text .+ running late|sms .+ running late|whatsapp .+ running late|client .+ running late|customer .+ running late|mark .+ late|for\s+my\b.*\bclient\b)\b|հաճախորդ|клиент/i;

const RESCHEDULE_CUE =
  /\b(reschedule|move my|change my appointment to|shift my|перенес|перенести|վերամրագր)\b/i;

const CANCEL_CUE =
  /\b(cancel my|cancel tomorrow|need to cancel|don't need my visit|отмен|չեղարկ)\b/i;

const RUNNING_LATE_CUE =
  /\b(running\s+\d+\s*(?:m|min|minutes?)?\s*late|running late|i'?m late|i am late|i'?ll be \d+|running behind|minutes late|min late|stuck in traffic|on my way but)\b/i;

const CUSTOMER_OWNERSHIP_CUE =
  /\b(my appointment|my booking|my visit|the salon|notify|tell them|let the salon|ping the salon|for my|today'?s booking|salon know)\b/i;

function matchNotifyRunningLateScenario(
  prompt: string,
): NotifyRunningLatePromptFixture | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of NOTIFY_RUNNING_LATE_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of NOTIFY_RUNNING_LATE_MULTILINGUAL_SCENARIOS) {
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

export function extractRunningLateMinutesFromCustomerPrompt(
  prompt: string,
  params: Record<string, unknown>,
): number {
  if (typeof params.minutesLate === 'number') {
    return normalizeCustomerRunningLateMinutes(params.minutesLate);
  }
  const fromParams = Number(params.minutesLate);
  if (Number.isFinite(fromParams) && fromParams > 0) {
    return normalizeCustomerRunningLateMinutes(fromParams);
  }

  const scenario = matchNotifyRunningLateScenario(prompt);
  if (scenario?.minutesLate) return scenario.minutesLate;

  const match =
    prompt.match(/\b(?:running\s+)?(\d{1,2})\s*(?:m|min(?:ute)?s?)\b/i) ??
    prompt.match(/\b(\d{1,2})\s*(?:minute|min)\b/i);
  if (match?.[1]) return normalizeCustomerRunningLateMinutes(Number(match[1]));

  if (containsArmenianScript(prompt)) {
    const hy = prompt.match(/(\d{1,2})\s*րոպե/i);
    if (hy?.[1]) return normalizeCustomerRunningLateMinutes(Number(hy[1]));
  }
  if (containsCyrillicScript(prompt)) {
    const ru = prompt.match(/(\d{1,2})\s*(?:минут|мин)/i);
    if (ru?.[1]) return normalizeCustomerRunningLateMinutes(Number(ru[1]));
  }

  return defaultCustomerRunningLateMinutes();
}

export function isNotifyRunningLatePrompt(prompt: string): boolean {
  if (isExplainStripeCurrencyWarningPrompt(prompt)) return false;
  if (isCatalogNotifyCustomersPrompt(prompt)) return false;
  if (PROVIDER_RUNNING_LATE_CUE.test(prompt)) return false;
  if (RESCHEDULE_CUE.test(prompt) && !RUNNING_LATE_CUE.test(prompt))
    return false;
  if (CANCEL_CUE.test(prompt)) return false;

  if (matchNotifyRunningLateScenario(prompt)) return true;

  // A capitalized Latin name alongside Armenian/Cyrillic text signals a provider
  // naming a specific client (e.g. "Jane-ի համար" / "к Jane"), not a customer
  // reporting their own lateness — mirrors the English `for [Name]` exclusion below.
  if (
    /\b[A-Z][a-z]+\b/.test(prompt) &&
    (containsArmenianScript(prompt) || containsCyrillicScript(prompt))
  ) {
    return false;
  }

  if (
    (containsArmenianScript(prompt) &&
      /(?:^|[^\u0530-\u058F])ուշ\s*եմ|(?<![\u0530-\u058F])ուշաց(?![\u0530-\u058F])|տեղեկաց/i.test(
        prompt,
      )) ||
    (containsCyrillicScript(prompt) &&
      /(опазды|задерж|сообщ.*салон)/i.test(prompt))
  ) {
    return true;
  }

  if (RUNNING_LATE_CUE.test(prompt)) {
    return (
      CUSTOMER_OWNERSHIP_CUE.test(prompt) ||
      !/\bfor\s+[A-Z][a-z]+\b/.test(prompt)
    );
  }

  return false;
}

export function isNotifyRunningLateIntent(
  action: string,
): action is NotifyRunningLateIntent {
  return (NOTIFY_RUNNING_LATE_INTENTS as readonly string[]).includes(action);
}

export interface ParsedNotifyRunningLate {
  minutesLate: number;
  bookingId?: string;
  serviceName?: string;
  date?: string;
  timeSlot?: string;
}

function extractNotifyRunningLateServiceName(
  prompt: string,
  enriched: Record<string, unknown>,
): string | undefined {
  const fromEnriched =
    typeof enriched.serviceName === 'string' ? enriched.serviceName.trim() : '';
  if (fromEnriched) return fromEnriched;

  const raw = extractServiceNameFromPrompt(prompt)?.trim();
  if (!raw) return undefined;
  const normalized = raw
    .replace(/^my\s+/i, '')
    .trim()
    .toLowerCase();
  if (['appointment', 'booking', 'visit', 'reservation'].includes(normalized)) {
    return undefined;
  }
  return raw;
}

export function parseNotifyRunningLateFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedNotifyRunningLate | null {
  if (!isNotifyRunningLatePrompt(prompt)) return null;

  const enriched = enrichCancelMyBookingParamsFromPrompt(params, prompt);
  const serviceName = extractNotifyRunningLateServiceName(prompt, enriched);

  return {
    minutesLate: extractRunningLateMinutesFromCustomerPrompt(prompt, {
      ...params,
      minutesLate: params.minutesLate ?? enriched.minutesLate,
    }),
    ...(enriched.bookingId ? { bookingId: enriched.bookingId as string } : {}),
    ...(serviceName ? { serviceName } : {}),
    ...(enriched.date ? { date: enriched.date as string } : {}),
    ...(enriched.timeSlot ? { timeSlot: enriched.timeSlot as string } : {}),
  };
}

export function enrichNotifyRunningLateParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseNotifyRunningLateFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    minutesLate: parsed.minutesLate,
    ...(parsed.bookingId ? { bookingId: parsed.bookingId } : {}),
    ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
    ...(parsed.date ? { date: parsed.date } : {}),
    ...(parsed.timeSlot ? { timeSlot: parsed.timeSlot } : {}),
  };
}

export function rescueNotifyRunningLateIntent(
  prompt: string,
  action: string,
): { action: NotifyRunningLateIntent; rescueReason: string } | null {
  if (isNotifyRunningLateIntent(action)) return null;
  if (!parseNotifyRunningLateFromPrompt(prompt)) return null;
  return {
    action: 'notify_running_late',
    rescueReason: 'notify_running_late',
  };
}

export function buildNotifyRunningLateAmbiguousSummary(
  bookings: Array<{ service?: { name?: string | null }; startTime: Date }>,
): string {
  const lines = bookings.slice(0, 5).map((booking) => {
    const service = booking.service?.name ?? 'Appointment';
    const when = booking.startTime.toISOString().slice(0, 16);
    return `• ${service} — ${when}`;
  });
  return `Multiple upcoming bookings match — which visit are you running late for?\n${lines.join('\n')}`;
}
