import type { AppLocale } from '../../common/i18n/messages.js';
import {
  formatClinicTestResultStatusLabel,
  isClinicTestResultStatus,
  type ClinicTestResultStatus,
} from '../../common/utils/clinic-lab-state.util.js';
import type { ClinicCustomerResultTrackingView } from '../clinic-test-results/clinic-test-results.service.js';
import {
  extractTestNameFromResultsPrompt,
  isExplainResultStatusPrompt,
} from './ai-consumer-clinic-test-results.util.js';
import { TRACK_LAB_ORDER_STATUS_MULTILINGUAL_SCENARIOS } from './ai-track-lab-order-status-multilingual.fixtures.js';
import {
  TRACK_LAB_ORDER_STATUS_PROMPTS,
  type TrackLabOrderStatusPromptFixture,
} from './ai-track-lab-order-status.fixtures.js';
import { NOTIFY_WHEN_RESULTS_READY_BLOCK } from './ai-notify-when-results-ready.fixtures.js';

export {
  CUSTOMER_TRACK_LAB_ORDER_STATUS_CLASSIFIER_RULES,
  TRACK_LAB_ORDER_STATUS_PROMPTS,
  TRACK_LAB_ORDER_STATUS_RESCUE_SCENARIOS,
} from './ai-track-lab-order-status.fixtures.js';

export const TRACK_LAB_ORDER_STATUS_INTENTS = [
  'track_lab_order_status',
] as const;

export type TrackLabOrderStatusIntent =
  (typeof TRACK_LAB_ORDER_STATUS_INTENTS)[number];

export interface ParsedTrackLabOrderStatusRequest {
  testName?: string;
}

const PUBLIC_SURFACE = new RegExp(
  String.raw`\b(page|booking|portal|visit|here|site|section|app|application)\b|էջ|կայք|այս|այստեղ|այցելություն|գրանցման|հավելված|страниц|сайт|записи|визит|здесь|этой|приложени`,
  'iu',
);

const STAFF_RESULT_NOTIFY_BLOCK = new RegExp(
  String.raw`\b(notify|alert|remind|send|push|text|email|sms|whatsapp)\b.*\b(patient|customer|client)\b|\b(notify|alert|remind|send|push|text|email|sms|whatsapp)\b.*\b(?:results?|lab|test)\b.*\b(?:ready|released)\b`,
  'iu',
);

const LAB_BOOKING_LIST_BLOCK = new RegExp(
  String.raw`\b(?:lab\s+appointments?\s+to\s+book|pending\s+lab\s+collection|lab\s+to\s+book|open\s+my\s+lab\s+booking)\b|(?:ինչ\s+լաբ|սպասող\s+լաբ\s+հայտ|բացիր\s+իմ\s+լաբ|լաբ\s+այց|լաբ\s+հավաքումներ|արյան\s+վերցումներ|պետք\s*է\s+գրանցեմ|какие\s+лаб|ожидающие\s+запросы\s+на\s+лаб|открой\s+мои\s+запросы\s+на\s+лаб|лаб.*забронир|мне\s+нужно\s+забронировать)`,
  'iu',
);

const TRACK_READY_CUE = new RegExp(
  String.raw`\b(?:are|is)\s+(?:my|the|any(?:\s+of)?\s+my)\s+(?:results?|lab\s+(?:tests?|work|orders?))(?:\s+ready|\s+(?:done|available|back|in))|track\s+(?:my\s+)?(?:lab|order|results?)|(?:lab|test)\s+order\s+status|where\s+is\s+my\s+(?:lab|blood|test|CBC|lipid)|(?:has|have)\s+my\s+(?:lab|blood|test).*(?:come\s+back|back|ready|done)|check\s+if\s+my\s+(?:test\s+)?results?\s+(?:are\s+)?ready|(?:готов|готовы)\s+ли\s+(?:мои\s+)?(?:результат|анализ)|պատրա[՞]?\s+են\s+(?:իմ\s+)?(?:արդյունք|լաբ)|հետևիր\s+իմ\s+լաբ|որտեղ\s+ե(?:մ|ս)\s+իմ\s+(?:արյան|լաբ)|отслед(?:ить|и)\s+(?:мой\s+)?(?:лаб|заказ)|где\s+(?:мой|моя)\s+(?:анализ|кров)`,
  'iu',
);

const LIST_ONLY_VERBS = new RegExp(
  String.raw`\b(?:show|list|open|view|see)\b.*\b(?:my\s+)?(?:test|lab)\s+results?\b|\b(?:show|list|open|view)\b.*\bmy\s+results\b|(?:ցույց|բացիր|покаж|открой)\s+(?:իմ|мои).*(?:արդյունք|результат)`,
  'iu',
);

function matchTrackLabOrderStatusScenario(
  prompt: string,
): TrackLabOrderStatusPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of TRACK_LAB_ORDER_STATUS_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of TRACK_LAB_ORDER_STATUS_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isTrackLabOrderStatusIntent(
  action: string,
): action is TrackLabOrderStatusIntent {
  return (TRACK_LAB_ORDER_STATUS_INTENTS as readonly string[]).includes(action);
}

export function isTrackLabOrderStatusPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchTrackLabOrderStatusScenario(text)) return true;
  if (STAFF_RESULT_NOTIFY_BLOCK.test(text)) return false;
  if (NOTIFY_WHEN_RESULTS_READY_BLOCK.test(text)) return false;
  if (LAB_BOOKING_LIST_BLOCK.test(text)) return false;
  if (PUBLIC_SURFACE.test(text)) return false;
  if (!TRACK_READY_CUE.test(text)) return false;
  if (LIST_ONLY_VERBS.test(text)) return false;
  if (isExplainResultStatusPrompt(text)) return false;
  return true;
}

export function parseTrackLabOrderStatusFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedTrackLabOrderStatusRequest | null {
  if (!isTrackLabOrderStatusPrompt(prompt)) return null;

  const scenario = matchTrackLabOrderStatusScenario(prompt);
  const testName =
    (typeof params.testName === 'string' && params.testName.trim()
      ? params.testName.trim()
      : undefined) ??
    scenario?.testName ??
    extractTestNameFromResultsPrompt(prompt) ??
    undefined;

  return { ...(testName ? { testName } : {}) };
}

export function rescueTrackLabOrderStatusIntent(
  prompt: string,
  action: string,
): { action: TrackLabOrderStatusIntent; rescueReason: string } | null {
  if (isTrackLabOrderStatusIntent(action)) return null;
  if (!parseTrackLabOrderStatusFromPrompt(prompt)) return null;
  return {
    action: 'track_lab_order_status',
    rescueReason: 'track_lab_order',
  };
}

export function enrichTrackLabOrderStatusParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  const parsed = parseTrackLabOrderStatusFromPrompt(prompt, params);
  if (parsed?.testName) next.testName = parsed.testName;
  return next;
}

function formatTrackingStatusLabel(status: string, locale: AppLocale): string {
  if (isClinicTestResultStatus(status)) {
    return formatClinicTestResultStatusLabel(status, locale);
  }
  return status;
}

export function formatLabOrderTrackingSummary(
  results: ClinicCustomerResultTrackingView[],
  testName?: string,
  locale: AppLocale = 'en',
): string {
  const filtered = testName
    ? results.filter((result) =>
        (result.testName ?? '').toLowerCase().includes(testName.toLowerCase()),
      )
    : results;

  if (filtered.length === 0) {
    return testName
      ? `No lab results found for ${testName} on your account yet.`
      : 'You have no lab orders or results on your account yet.';
  }

  const ready = filtered.filter((result) => result.status === 'Released');
  const inProgress = filtered.filter((result) => result.status !== 'Released');
  const parts: string[] = [];

  if (ready.length > 0) {
    const lines = ready.slice(0, 5).map((result, index) => {
      const name = result.testName ?? 'Lab result';
      const released = result.releasedAt
        ? result.releasedAt.slice(0, 10)
        : 'recently';
      return `${index + 1}. ${name} — ready in My Results (${released})`;
    });
    const suffix =
      ready.length > 5 ? `\n…and ${ready.length - 5} more ready.` : '';
    parts.push(
      `${ready.length} result${ready.length === 1 ? '' : 's'} ready:\n${lines.join('\n')}${suffix}`,
    );
  }

  if (inProgress.length > 0) {
    const lines = inProgress.slice(0, 5).map((result, index) => {
      const name = result.testName ?? 'Lab result';
      const label = formatTrackingStatusLabel(result.status, locale);
      return `${index + 1}. ${name} — ${label}`;
    });
    const suffix =
      inProgress.length > 5
        ? `\n…and ${inProgress.length - 5} more in progress.`
        : '';
    parts.push(
      `${inProgress.length} still in progress:\n${lines.join('\n')}${suffix}`,
    );
  }

  if (ready.length === 0 && inProgress.length > 0) {
    parts.push('None are ready in My Results yet.');
  }

  return parts.join('\n\n');
}
