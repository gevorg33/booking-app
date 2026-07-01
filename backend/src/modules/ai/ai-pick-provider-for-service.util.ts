import { isExplainAnyProviderOptionPrompt } from './ai-explain-any-provider-option.util.js';
import { isExplainProviderSpecialtyPrompt } from './ai-explain-provider-specialty.util.js';
import { hasRebookLastAppointmentCoreCue } from './ai-rebook-last-appointment.util.js';
import { isProviderSameDayMultiCompoundPrompt } from './ai-provider-same-day-multi-compound.util.js';
import { PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_SCENARIOS } from './ai-pick-provider-for-service-multilingual.fixtures.js';
import {
  PICK_PROVIDER_FOR_SERVICE_PROMPTS,
  type PickProviderForServicePromptFixture,
  type PickProviderMode,
} from './ai-pick-provider-for-service.fixtures.js';

export { PICK_PROVIDER_FOR_SERVICE_CLASSIFIER_RULES } from './ai-pick-provider-for-service.fixtures.js';
export { PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_CLASSIFIER_RULES } from './ai-pick-provider-for-service-multilingual.fixtures.js';

export const PICK_PROVIDER_FOR_SERVICE_INTENTS = [
  'pick_provider_for_service',
] as const;

export type PickProviderForServiceIntent =
  (typeof PICK_PROVIDER_FOR_SERVICE_INTENTS)[number];

export interface ParsedPickProviderForService {
  mode: PickProviderMode;
  providerName?: string;
  serviceName?: string;
}

const SLOT_TIME_BLOCK = new RegExp(
  String.raw`\b(?:tomorrow|tonight|today|next\s+week|this\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}[:/]\d{2})\b`,
  'iu',
);

const FULL_REBOOK_BLOCK = new RegExp(
  String.raw`\b(?:rebook(?:\s+my)?\s+last|book(?:\s+the)?\s+same\s+as\s+last|repeat(?:\s+my)?\s+last|book\s+same\s+again|same\s+service\s+as\s+last|schedule\s+the\s+same\s+service)\b`,
  'iu',
);

const SWITCH_SAME_TIME_BLOCK = new RegExp(
  String.raw`\b(?:keep|same)\s+(?:the\s+)?(?:time|slot|appointment(?:\s+time)?|\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b.+\b(?:different|another|switch|change)\s+(?:stylist|provider|specialist)\b|\b(?:different|another|switch|change)\s+(?:stylist|provider|specialist)\b.+\b(?:keep|same)\s+(?:the\s+)?(?:time|slot|\d{1,2})`,
  'iu',
);

const NAMED_PROVIDER_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(?:book|schedule|reserve)\s+with\s+(.+?)\s+for\s+(?:a\s+)?(.+?)(?:\?|$)/i,
  /\b(?:book|schedule|reserve)\s+(?:with\s+)?(.+?)\s+for\s+(?:a\s+)?(.+?)(?:\?|$)/i,
  /\b(?:pick|choose|select)\s+(.+?)\s+for\s+(?:a\s+)?(.+?)(?:\?|$)/i,
  /\b(?:want|prefer|need)\s+(.+?)\s+as\s+my\s+(?:stylist|specialist|provider|therapist)/i,
  /\b(?:pick|choose|select)\s+(.+?)\s+as\s+my\s+(?:stylist|specialist|provider)/i,
  /\b(?:pick|choose|select)\s+(.+?)\s+for\s+(?:a\s+)?(.+?)(?:\?|$)/i,
  /գրանցվել\s+(.+?)\s+հետ\s+(.+?)\s+համար/iu,
  /ընտրել\s+(.+?)(?:-ին|-ի)?\s+(.+?)\s+համար/iu,
  /(?:записаться|запиши)\s+к\s+(.+?)\s+на\s+(.+?)(?:\?|$)/iu,
  /выбрать\s+(.+?)\s+для\s+(.+?)(?:\?|$)/iu,
];

const SAME_AS_LAST_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(?:same|usual)\s+(?:stylist|specialist|provider|therapist|master|barber)\b/i,
  /\bstylist\s+from\s+my\s+last\s+visit\b/i,
  /\bspecialist\s+i\s+had\s+before\b/i,
  /\bprovider\s+from\s+my\s+last\s+appointment\b/i,
  /\bmy\s+usual\s+(?:stylist|specialist|provider)\b/i,
  /նույն\s+ստայլիստ/iu,
  /հաճախ\s+օգտագործվող\s+ստայլիստ/iu,
  /того\s+же\s+мастера/iu,
  /обычн(?:ого|ый)\s+мастер/iu,
];

function cleanCapturedPhrase(value: string): string {
  return value
    .replace(/[?.!,]+$/g, '')
    .replace(/-ի$/u, '')
    .replace(/-ին$/u, '')
    .trim();
}

function matchPickProviderScenario(
  prompt: string,
): PickProviderForServicePromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of PICK_PROVIDER_FOR_SERVICE_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of PICK_PROVIDER_FOR_SERVICE_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function isSameAsLastStylistCue(prompt: string): boolean {
  if (FULL_REBOOK_BLOCK.test(prompt)) return false;
  return SAME_AS_LAST_PATTERNS.some((pattern) => pattern.test(prompt));
}

export function extractNamedProviderFromPrompt(prompt: string): {
  providerName: string;
  serviceName?: string;
} | null {
  for (const pattern of NAMED_PROVIDER_PATTERNS) {
    const match = prompt.match(pattern);
    const providerRaw = match?.[1]?.trim();
    if (!providerRaw) continue;
    const providerName = cleanCapturedPhrase(providerRaw);
    if (!providerName || providerName.length < 2) continue;
    if (
      /\b(?:any|first|available|whoever)\b/i.test(providerName) ||
      /\b(?:stylist|specialist|provider|therapist)\b/i.test(providerName)
    ) {
      continue;
    }
    const serviceRaw = match?.[2]?.trim();
    const serviceName = serviceRaw
      ? cleanCapturedPhrase(serviceRaw)
      : undefined;
    return { providerName, ...(serviceName ? { serviceName } : {}) };
  }
  return null;
}

export function inferPickProviderMode(prompt: string): PickProviderMode {
  if (isSameAsLastStylistCue(prompt)) return 'same_as_last';
  return 'named_provider';
}

export function isPickProviderForServiceIntent(
  action: string,
): action is PickProviderForServiceIntent {
  return (PICK_PROVIDER_FOR_SERVICE_INTENTS as readonly string[]).includes(
    action,
  );
}

export function isPickProviderForServicePrompt(prompt: string): boolean {
  if (matchPickProviderScenario(prompt)) return true;
  if (isProviderSameDayMultiCompoundPrompt(prompt)) return false;
  if (SWITCH_SAME_TIME_BLOCK.test(prompt)) return false;
  if (isExplainAnyProviderOptionPrompt(prompt)) return false;
  if (isExplainProviderSpecialtyPrompt(prompt)) return false;
  if (FULL_REBOOK_BLOCK.test(prompt)) return false;
  if (
    hasRebookLastAppointmentCoreCue(prompt) &&
    !isSameAsLastStylistCue(prompt)
  ) {
    return false;
  }
  if (SLOT_TIME_BLOCK.test(prompt)) return false;
  if (
    /\b(?:available|availability|free\s+slot|when\s+can|openings?)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (isSameAsLastStylistCue(prompt)) return true;

  const named = extractNamedProviderFromPrompt(prompt);
  if (!named) return false;

  if (
    /\b(?:tell\s+me\s+about|who\s+is|specialty|specializes?)\b/i.test(prompt)
  ) {
    return false;
  }

  return (
    /\b(?:book|schedule|reserve|pick|choose|select|want|prefer|need|like\s+to\s+book)\b/i.test(
      prompt,
    ) || /(?:գրանցվել|ընտրել|записаться|выбрать)/iu.test(prompt)
  );
}

export function parsePickProviderForServiceFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedPickProviderForService | null {
  const fromCompound =
    params.providerSameDayMulti === true &&
    typeof params.providerName === 'string' &&
    params.providerName.trim().length > 0;
  if (!isPickProviderForServicePrompt(prompt) && !fromCompound) return null;

  const scenario = matchPickProviderScenario(prompt);
  const modeFromParams =
    params.mode === 'named_provider' || params.mode === 'same_as_last'
      ? params.mode
      : undefined;
  const mode =
    modeFromParams ?? scenario?.mode ?? inferPickProviderMode(prompt);

  if (mode === 'same_as_last') {
    return { mode: 'same_as_last' };
  }

  const providerName =
    (params.providerName as string | undefined) ??
    scenario?.providerName ??
    extractNamedProviderFromPrompt(prompt)?.providerName;
  const serviceName =
    (params.serviceName as string | undefined) ??
    scenario?.serviceName ??
    extractNamedProviderFromPrompt(prompt)?.serviceName;

  return {
    mode: 'named_provider',
    ...(providerName ? { providerName } : {}),
    ...(serviceName ? { serviceName } : {}),
  };
}

export function rescuePickProviderForServiceIntent(
  prompt: string,
  action: string,
): { action: PickProviderForServiceIntent; rescueReason: string } | null {
  if (isPickProviderForServiceIntent(action)) return null;
  if (!parsePickProviderForServiceFromPrompt(prompt)) return null;
  return {
    action: 'pick_provider_for_service',
    rescueReason: 'pick_provider_for_service',
  };
}

export function detectPickProviderForServiceAction(
  prompt: string,
): PickProviderForServiceIntent | null {
  return rescuePickProviderForServiceIntent(prompt, 'unknown')?.action ?? null;
}

export function enrichPickProviderForServiceParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parsePickProviderForServiceFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    mode: parsed.mode,
    ...(parsed.providerName ? { providerName: parsed.providerName } : {}),
    ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
  };
}
