import { extractTestNameFromResultsPrompt } from './ai-consumer-clinic-test-results.util.js';
import { isExplainResultStatusPrompt } from './ai-consumer-clinic-test-results.util.js';
import { isTrackLabOrderStatusPrompt } from './ai-track-lab-order-status.util.js';
import { isNotifyPatientResultReadyPrompt } from './ai-notification-date-format.util.js';
import { isManageNotificationPreferencesPrompt } from './ai-manage-notification-preferences.util.js';
import { isExplainMyNotificationsPrompt } from './ai-explain-my-notifications.util.js';
import {
  NOTIFY_WHEN_RESULTS_READY_PROMPTS,
  type NotifyWhenResultsReadyAspect,
  type NotifyWhenResultsReadyChannel,
  type NotifyWhenResultsReadyFixture,
} from './ai-notify-when-results-ready.fixtures.js';
import { NOTIFY_WHEN_RESULTS_READY_MULTILINGUAL_SCENARIOS } from './ai-notify-when-results-ready-multilingual.fixtures.js';

export const NOTIFY_WHEN_RESULTS_READY_INTENTS = [
  'notify_when_results_ready',
] as const;

export type NotifyWhenResultsReadyIntent =
  (typeof NOTIFY_WHEN_RESULTS_READY_INTENTS)[number];

export {
  CUSTOMER_NOTIFY_WHEN_RESULTS_READY_CLASSIFIER_RULES,
  NOTIFY_WHEN_RESULTS_READY_PROMPTS,
  NOTIFY_WHEN_RESULTS_READY_RESCUE_SCENARIOS,
} from './ai-notify-when-results-ready.fixtures.js';

export interface ParsedNotifyWhenResultsReadyRequest {
  aspect: NotifyWhenResultsReadyAspect;
  channel?: NotifyWhenResultsReadyChannel;
  testName?: string;
}

const STAFF_NOTIFY_BLOCK = new RegExp(
  String.raw`\b(?:notify|tell|alert|remind|send|message)\b.{0,20}\b(?:the\s+)?patient\b|\bpatient\b.{0,20}\b(?:notify|results?\s+ready)\b|(?:հիվանդին\s+տեղեկացր|уведом(?:ить|и)\s+пациент)`,
  'iu',
);

const NOTIFY_ME_CUE = new RegExp(
  String.raw`\b(?:notify|text|alert|remind|message|send|ping|tell)\s+me\b|\b(?:sms|text|email|push|whatsapp)\s+me\b|(?:տեղեկացրիր|գրիր|հաղորդիր|ծանուցիր|ասա)\s+ինձ|(?:уведом(?:ь|и)|напиши|сообщи|пришлите|отправьте|скажи)\s+мне`,
  'iu',
);

const RESULT_READY_CONTEXT = new RegExp(
  String.raw`\b(?:results?|lab|test).{0,20}(?:ready|released|available)\b|\b(?:ready|released|available).{0,20}(?:results?|lab|test)\b|\bresult[- ]?ready\b|(?:արդյունք|լաբ).{0,15}(?:պատրաստ|թողարկ)|(?:результат|анализ).{0,15}(?:готов|выпущен|доступн)`,
  'iu',
);

const HOW_NOTIFIED_CUE = new RegExp(
  String.raw`\bhow\s+do\s+i\s+get\s+notified\b|\bresult[- ]?ready\s+alerts?\b|\bhow\s+do\s+(?:result|lab)\b.{0,20}notifications?\s+work\b|ինչպես.{0,20}(?:տեղեկաց|ծանուց)|как.{0,20}(?:уведом|узнаю)`,
  'iu',
);

const BOOK_COMPOUND_BLOCK = new RegExp(
  String.raw`\b(?:book|schedule|reserve|order|place)\b.{0,30}\b(?:and|then|&)\b`,
  'i',
);

function matchNotifyWhenResultsReadyScenario(
  prompt: string,
): NotifyWhenResultsReadyFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of NOTIFY_WHEN_RESULTS_READY_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of NOTIFY_WHEN_RESULTS_READY_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function extractNotifyChannelFromPrompt(
  prompt: string,
): NotifyWhenResultsReadyChannel | undefined {
  const scenario = matchNotifyWhenResultsReadyScenario(prompt);
  if (scenario?.channel) return scenario.channel;

  if (/\b(?:push|notification)\b/i.test(prompt)) return 'push';
  if (
    /\b(?:sms|text\s+message)\b/i.test(prompt) ||
    /\btext\s+me\b/i.test(prompt)
  ) {
    return 'text';
  }
  if (/\bemail\b/i.test(prompt)) return 'email';
  if (/\bwhatsapp\b/i.test(prompt)) return 'whatsapp';
  return undefined;
}

export function resolveNotifyWhenResultsReadyAspect(
  prompt: string,
): NotifyWhenResultsReadyAspect {
  const scenario = matchNotifyWhenResultsReadyScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;

  if (HOW_NOTIFIED_CUE.test(prompt)) return 'how_it_works';
  if (/\bpush\b/i.test(prompt)) return 'push_channel';
  if (/\b(?:sms|text|email|whatsapp)\b/i.test(prompt)) {
    return 'sms_email_channel';
  }
  if (NOTIFY_ME_CUE.test(prompt)) return 'subscribe_explain';
  return 'general';
}

export function isNotifyWhenResultsReadyIntent(
  action: string,
): action is NotifyWhenResultsReadyIntent {
  return (NOTIFY_WHEN_RESULTS_READY_INTENTS as readonly string[]).includes(
    action,
  );
}

export function isNotifyWhenResultsReadyPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;

  if (matchNotifyWhenResultsReadyScenario(text)) return true;

  if (STAFF_NOTIFY_BLOCK.test(text)) return false;
  if (isNotifyPatientResultReadyPrompt(text)) return false;
  if (isManageNotificationPreferencesPrompt(text)) return false;
  if (isExplainMyNotificationsPrompt(text)) return false;
  if (BOOK_COMPOUND_BLOCK.test(text)) return false;

  if (HOW_NOTIFIED_CUE.test(text)) return true;

  if (isTrackLabOrderStatusPrompt(text) && !NOTIFY_ME_CUE.test(text)) {
    return false;
  }
  if (isExplainResultStatusPrompt(text) && !NOTIFY_ME_CUE.test(text)) {
    return false;
  }

  if (!NOTIFY_ME_CUE.test(text)) return false;
  if (!RESULT_READY_CONTEXT.test(text) && !/\bwhen\b|երբ|когда/i.test(text)) {
    return false;
  }

  return true;
}

export function parseNotifyWhenResultsReadyFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedNotifyWhenResultsReadyRequest | null {
  if (!isNotifyWhenResultsReadyPrompt(prompt)) return null;

  const scenario = matchNotifyWhenResultsReadyScenario(prompt);
  const testNameFromParams =
    typeof params.testName === 'string' && params.testName.trim()
      ? params.testName.trim()
      : undefined;

  return {
    aspect:
      (typeof params.aspect === 'string'
        ? (params.aspect as NotifyWhenResultsReadyAspect)
        : undefined) ??
      scenario?.aspect ??
      resolveNotifyWhenResultsReadyAspect(prompt),
    channel:
      (typeof params.channel === 'string'
        ? (params.channel as NotifyWhenResultsReadyChannel)
        : undefined) ??
      scenario?.channel ??
      extractNotifyChannelFromPrompt(prompt),
    testName:
      testNameFromParams ??
      scenario?.testName ??
      extractTestNameFromResultsPrompt(prompt) ??
      undefined,
  };
}

export function rescueNotifyWhenResultsReadyIntent(
  prompt: string,
  action: string,
): { action: NotifyWhenResultsReadyIntent; rescueReason: string } | null {
  if (isNotifyWhenResultsReadyIntent(action)) return null;
  if (!parseNotifyWhenResultsReadyFromPrompt(prompt)) return null;
  return {
    action: 'notify_when_results_ready',
    rescueReason: 'notify_when_results_ready',
  };
}

export function enrichNotifyWhenResultsReadyParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseNotifyWhenResultsReadyFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    aspect: parsed.aspect,
    ...(parsed.channel ? { channel: parsed.channel } : {}),
    ...(parsed.testName ? { testName: parsed.testName } : {}),
  };
}

export function assembleNotifyWhenResultsReadySummary(
  parsed: ParsedNotifyWhenResultsReadyRequest,
): string {
  const parts: string[] = [];
  const testScope = parsed.testName ? ` for your ${parsed.testName}` : '';

  if (
    parsed.aspect === 'how_it_works' ||
    parsed.aspect === 'general' ||
    parsed.aspect === 'subscribe_explain'
  ) {
    parts.push(
      `When the clinic releases lab results${testScope} to your account, you may get an in-app alert, a push notification (if enabled), and the clinic may send email or SMS when they release results.`,
      'You can also open My Results anytime — a patient alert banner appears when new results are released.',
    );
  }

  if (parsed.aspect === 'push_channel' || parsed.channel === 'push') {
    parts.push(
      'Turn on app push notifications in your device and account settings to receive a result-ready push that opens My Results.',
    );
  }

  if (
    parsed.aspect === 'sms_email_channel' ||
    parsed.channel === 'sms' ||
    parsed.channel === 'text' ||
    parsed.channel === 'email' ||
    parsed.channel === 'whatsapp'
  ) {
    const channelLabel =
      parsed.channel === 'whatsapp'
        ? 'WhatsApp'
        : parsed.channel === 'email'
          ? 'email'
          : 'SMS/text';
    parts.push(
      `${channelLabel} alerts for lab results are sent by your clinic when they release results to you. This assistant cannot subscribe you to result-ready ${channelLabel} messages yet.`,
    );
  }

  if (parsed.aspect === 'subscribe_explain' && !parsed.channel) {
    parts.push(
      'I cannot turn on result-ready alerts from chat yet — use push notification settings in the app, or check My Results and track status with "Are my results ready?"',
    );
  }

  if (parts.length === 0) {
    parts.push(
      'Result-ready notifications depend on clinic release timing and your notification settings in the app.',
    );
  }

  parts.push(
    'This is a read-only explanation — subscribing to result-ready alerts from chat is not available yet.',
  );
  return parts.join(' ');
}

export function buildNotifyWhenResultsReadyNavigate(
  channel?: NotifyWhenResultsReadyChannel,
): { path: string; query: Record<string, string> } {
  if (channel === 'push') {
    return { path: '/account', query: { section: 'notifications' } };
  }
  return { path: '/results', query: { section: 'my-results' } };
}
