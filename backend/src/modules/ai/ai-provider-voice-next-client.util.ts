import type { ProviderListBooking } from '../provider-mobile/provider-ai-sprint19.util.js';
import {
  buildVoiceFriendlyFallback,
  interpolateVoiceTemplate,
} from './ai-product-guide-voice.util.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import { resolveGuideCorpusI18nKey } from './guide/ai-guide-corpus-i18n.util.js';
import type { AppLocale } from '../../common/i18n/messages.js';
import { resolveLocale } from '../../common/i18n/messages.js';

export const PROVIDER_VOICE_NEXT_CLIENT_INTENT = 'voice_summarize_next_client' as const;

export type ProviderVoiceNextClientIntent = typeof PROVIDER_VOICE_NEXT_CLIENT_INTENT;

const VOICE_NEXT_CLIENT_KEYS = {
  found: 'guide.flows.provider.voiceNextClient.found',
  empty: 'guide.flows.provider.voiceNextClient.empty',
  multiple: 'guide.flows.provider.voiceNextClient.multiple',
} as const;

export interface ProviderVoiceNextClientRescueScenario {
  id: string;
  prompt: RegExp;
  samplePrompt: string;
  fromActions?: readonly string[];
}

export const PROVIDER_VOICE_NEXT_CLIENT_RESCUE_SCENARIOS: readonly ProviderVoiceNextClientRescueScenario[] =
  [
    {
      id: 'read-next-appointment',
      samplePrompt: 'Read me my next appointment',
      prompt:
        /\b(?:read\s+(?:me\s+)?(?:my\s+)?next\s+(?:appointment|client|booking)|speak\s+(?:my\s+)?next\s+(?:appointment|client|booking)|tell\s+me\s+(?:about\s+)?my\s+next\s+(?:appointment|client))\b/i,
    },
    {
      id: 'read-next-from-show',
      samplePrompt: 'Read my next client aloud',
      prompt:
        /\b(?:read|speak|say)\b.*\b(?:next|upcoming)\b.*\b(?:appointment|client|booking)\b/i,
      fromActions: ['show_appointments', 'unknown'],
    },
  ] as const;

export interface ProviderVoiceNextClientClassifierScenario {
  id: string;
  prompt: string;
}

export const PROVIDER_VOICE_NEXT_CLIENT_CLASSIFIER_SCENARIOS: readonly ProviderVoiceNextClientClassifierScenario[] =
  [
    { id: '5.24.5-read-next', prompt: 'Read me my next appointment' },
    { id: '5.24.5-speak-client', prompt: 'Speak my next client aloud' },
    { id: '5.24.5-tell-next', prompt: 'Tell me about my next appointment' },
  ] as const;

function resolveVoiceNextClientText(
  key: string,
  locale?: string,
): string | undefined {
  const messages = getFrontendGuideCorpusMessages(resolveLocale(locale));
  return resolveGuideCorpusI18nKey(messages, key) ?? undefined;
}

export function isVoiceSummarizeNextClientPrompt(prompt: string): boolean {
  return PROVIDER_VOICE_NEXT_CLIENT_RESCUE_SCENARIOS.some((scenario) =>
    scenario.prompt.test(prompt),
  );
}

export function isProviderVoiceNextClientIntent(
  action: string,
): action is ProviderVoiceNextClientIntent {
  return action === PROVIDER_VOICE_NEXT_CLIENT_INTENT;
}

export function rescueVoiceSummarizeNextClientIntent(
  prompt: string,
  action: string,
): string {
  if (isProviderVoiceNextClientIntent(action)) return action;

  for (const scenario of PROVIDER_VOICE_NEXT_CLIENT_RESCUE_SCENARIOS) {
    if (scenario.fromActions?.length && !scenario.fromActions.includes(action)) {
      continue;
    }
    if (scenario.prompt.test(prompt)) {
      return PROVIDER_VOICE_NEXT_CLIENT_INTENT;
    }
  }

  return action;
}

export interface ProviderVoiceNextClientBooking extends ProviderListBooking {
  customer?: { name?: string | null } | null;
}

export function buildVoiceSummarizeNextClientResult(options: {
  bookings: ProviderVoiceNextClientBooking[];
  formatLabel: (booking: ProviderVoiceNextClientBooking) => string;
  formatTime: (booking: ProviderVoiceNextClientBooking) => string;
  locale?: string;
  emptySummary: string;
}): {
  success: boolean;
  action: ProviderVoiceNextClientIntent;
  summary: string;
  details: Record<string, unknown>;
} {
  const { bookings, formatLabel, formatTime, locale, emptySummary } = options;

  if (bookings.length === 0) {
    const emptyVoice =
      resolveVoiceNextClientText(VOICE_NEXT_CLIENT_KEYS.empty, locale) ??
      buildVoiceFriendlyFallback(emptySummary);
    return {
      success: true,
      action: PROVIDER_VOICE_NEXT_CLIENT_INTENT,
      summary: emptySummary,
      details: {
        matchedCount: 0,
        voiceSummary: emptyVoice,
        autoSpeak: true,
        topicId: 'provider-appointments',
      },
    };
  }

  const next = bookings[0];
  const customerName = next.customer?.name?.trim() || 'Walk-in';
  const serviceName = next.service?.name?.trim() || 'Appointment';
  const time = formatTime(next);
  const templateKey =
    bookings.length === 1
      ? VOICE_NEXT_CLIENT_KEYS.found
      : VOICE_NEXT_CLIENT_KEYS.multiple;
  const template =
    resolveVoiceNextClientText(templateKey, locale) ??
    (bookings.length === 1
      ? 'Your next client is {customerName} at {time} for {serviceName}.'
      : 'Your next client is {customerName} at {time} for {serviceName}. You have {count} upcoming today.');
  const voiceSummary = interpolateVoiceTemplate(template, {
    customerName,
    serviceName,
    time,
    count: String(bookings.length),
  });
  const summary =
    bookings.length === 1
      ? `Next up: ${formatLabel(next)}${serviceName ? ` (${serviceName})` : ''}`
      : `Next up: ${formatLabel(next)}${serviceName ? ` (${serviceName})` : ''} — ${bookings.length} upcoming`;

  return {
    success: true,
    action: PROVIDER_VOICE_NEXT_CLIENT_INTENT,
    summary,
    details: {
      matchedCount: bookings.length,
      voiceSummary,
      autoSpeak: true,
      topicId: 'provider-appointments',
      nextBooking: {
        customerName,
        serviceName,
        time,
        label: formatLabel(next),
      },
      bookings: bookings.slice(0, 5).map((b) => formatLabel(b)),
    },
  };
}

export const PROVIDER_VOICE_NEXT_CLIENT_CLASSIFIER_RULES = `- voice_summarize_next_client: READ — hands-free TTS summary of the signed-in provider's next upcoming appointment (playbook voice templates + show_appointments data). Triggers: read me my next appointment, speak my next client aloud, tell me about my next client. Sets details.autoSpeak and details.voiceSummary for TTS. NOT explain_app_feature guide, NOT full appointment list unless user asks to show/list.`;
