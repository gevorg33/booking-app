import { buildSharedBookingContextFromPrompt } from './ai-compound-booking-context.util.js';
import { extractTimeSlotFromPrompt } from './ai-structural-extractors.js';
import { SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_SCENARIOS } from './ai-switch-provider-same-time-multilingual.fixtures.js';
import {
  SWITCH_PROVIDER_SAME_TIME_PROMPTS,
  type SwitchProviderSameTimeMode,
  type SwitchProviderSameTimePromptFixture,
} from './ai-switch-provider-same-time.fixtures.js';

export { SWITCH_PROVIDER_SAME_TIME_CLASSIFIER_RULES } from './ai-switch-provider-same-time.fixtures.js';
export { SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_CLASSIFIER_RULES } from './ai-switch-provider-same-time-multilingual.fixtures.js';

export const SWITCH_PROVIDER_SAME_TIME_INTENTS = [
  'switch_provider_same_time',
] as const;

export type SwitchProviderSameTimeIntent =
  (typeof SWITCH_PROVIDER_SAME_TIME_INTENTS)[number];

export interface ParsedSwitchProviderSameTime {
  mode: SwitchProviderSameTimeMode;
  timeSlot?: string;
  providerName?: string;
}

const RESCHEDULE_MOVE_BLOCK = new RegExp(
  String.raw`\breschedule\b.*\b(?:to|on|for|at|move)\b|\bmove\s+my\s+(?:booking|appointment)\b`,
  'iu',
);

const CHANGE_PROVIDER_ON_RESCHEDULE_BLOCK = new RegExp(
  String.raw`\b(?:change|switch|different)\b.+\b(?:provider|stylist|specialist)\b.+\b(?:reschedule|when\s+i\s+reschedule|on\s+reschedule)\b`,
  'iu',
);

const PICK_PROVIDER_BLOCK = new RegExp(
  String.raw`\b(?:book|schedule|reserve)\s+with\b|\b(?:pick|choose|select)\s+[A-Za-z].+?\s+for\b|\b(?:same|usual)\s+(?:stylist|specialist|provider)\s+as\s+last\b`,
  'iu',
);

const KEEP_TIME_CUE = new RegExp(
  String.raw`\b(?:keep|same)\s+(?:the\s+)?(?:time|slot|appointment(?:\s+time)?|\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b|\bkeep\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b|\bkeep\s+my\s+(?:slot|appointment)\b|\b(?:նույն|պահել)\s+(?:ժամ|ժամը|ժամանակ)|\b(?:то\s+же\s+время|оставить)\b`,
  'iu',
);

const DIFFERENT_PROVIDER_CUE = new RegExp(
  String.raw`\b(?:different|another|other|switch|change)\s+(?:stylist|provider|specialist|master|therapist)\b|\b(?:stylist|provider|specialist)\s+(?:instead|but)\b|\bswitch\s+stylist\b|\bchange\s+stylist\b|\b(?:այլ|փոխել)\s+(?:ստայլիստ|մասնագիր)|\b(?:другой|другого|сменить)\s+(?:стилист|мастер|специалист)/iu`,
);

const NAMED_SWITCH_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(?:keep|switch)\s+.*?\b(?:to|with)\s+([A-Za-z][\w.'-]{1,30})\b/i,
  /\bsame\s+time\s+with\s+([A-Za-z][\w.'-]{1,30})\s+instead\b/i,
  /\b(?:different|another)\s+(?:stylist|provider|specialist)\s+(?:to|with)\s+([A-Za-z][\w.'-]{1,30})\b/i,
  /փոխել\s+(.+?)(?:-ին|-ի)?\s+բայց\s+պահել/iu,
  /сменить\s+на\s+([A-Za-zА-Яа-я][\w.'-]{1,30})/iu,
];

function cleanCapturedPhrase(value: string): string {
  return value
    .replace(/[?.!,]+$/g, '')
    .replace(/-ն$/u, '')
    .replace(/-ի$/u, '')
    .replace(/-ին$/u, '')
    .trim();
}

function matchSwitchProviderSameTimeScenario(
  prompt: string,
): SwitchProviderSameTimePromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of SWITCH_PROVIDER_SAME_TIME_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of SWITCH_PROVIDER_SAME_TIME_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function extractNamedProviderForSameTimeSwitch(
  prompt: string,
): string | null {
  for (const pattern of NAMED_SWITCH_PATTERNS) {
    const match = prompt.match(pattern);
    const raw = match?.[1]?.trim();
    if (!raw) continue;
    const providerName = cleanCapturedPhrase(raw);
    if (!providerName || providerName.length < 2) continue;
    if (
      /\b(?:any|first|available|different|another|other|stylist|provider|specialist)\b/i.test(
        providerName,
      )
    ) {
      continue;
    }
    return providerName;
  }
  return null;
}

export function inferSwitchProviderSameTimeMode(
  prompt: string,
): SwitchProviderSameTimeMode {
  return extractNamedProviderForSameTimeSwitch(prompt)
    ? 'keep_time_named_provider'
    : 'keep_time_any_provider';
}

export function hasSwitchProviderSameTimeCoreCue(prompt: string): boolean {
  return KEEP_TIME_CUE.test(prompt) && DIFFERENT_PROVIDER_CUE.test(prompt);
}

export function isSwitchProviderSameTimeIntent(
  action: string,
): action is SwitchProviderSameTimeIntent {
  return (SWITCH_PROVIDER_SAME_TIME_INTENTS as readonly string[]).includes(
    action,
  );
}

export function isSwitchProviderSameTimePrompt(prompt: string): boolean {
  if (matchSwitchProviderSameTimeScenario(prompt)) return true;
  if (CHANGE_PROVIDER_ON_RESCHEDULE_BLOCK.test(prompt)) return false;
  if (RESCHEDULE_MOVE_BLOCK.test(prompt)) return false;
  if (
    PICK_PROVIDER_BLOCK.test(prompt) &&
    !hasSwitchProviderSameTimeCoreCue(prompt)
  ) {
    return false;
  }
  if (!hasSwitchProviderSameTimeCoreCue(prompt)) return false;
  return true;
}

export function parseSwitchProviderSameTimeFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedSwitchProviderSameTime | null {
  if (!isSwitchProviderSameTimePrompt(prompt)) return null;

  const scenario = matchSwitchProviderSameTimeScenario(prompt);
  const modeFromParams =
    params.mode === 'keep_time_any_provider' ||
    params.mode === 'keep_time_named_provider'
      ? params.mode
      : undefined;
  const mode =
    modeFromParams ?? scenario?.mode ?? inferSwitchProviderSameTimeMode(prompt);

  const timeSlot =
    (params.timeSlot as string | undefined) ??
    scenario?.timeSlot ??
    extractTimeSlotFromPrompt(prompt) ??
    undefined;

  const providerName =
    (params.providerName as string | undefined) ??
    scenario?.providerName ??
    extractNamedProviderForSameTimeSwitch(prompt) ??
    undefined;

  if (mode === 'keep_time_named_provider' && !providerName) {
    return {
      mode: 'keep_time_any_provider',
      ...(timeSlot ? { timeSlot } : {}),
    };
  }

  return {
    mode,
    ...(timeSlot ? { timeSlot } : {}),
    ...(providerName ? { providerName } : {}),
  };
}

export function rescueSwitchProviderSameTimeIntent(
  prompt: string,
  action: string,
): { action: SwitchProviderSameTimeIntent; rescueReason: string } | null {
  if (isSwitchProviderSameTimeIntent(action)) return null;
  if (!parseSwitchProviderSameTimeFromPrompt(prompt)) return null;
  return {
    action: 'switch_provider_same_time',
    rescueReason: 'switch_provider_same_time',
  };
}

export function detectSwitchProviderSameTimeAction(
  prompt: string,
): SwitchProviderSameTimeIntent | null {
  return rescueSwitchProviderSameTimeIntent(prompt, 'unknown')?.action ?? null;
}

export function enrichSwitchProviderSameTimeParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  timeZone = 'UTC',
): Record<string, unknown> {
  const parsed = parseSwitchProviderSameTimeFromPrompt(prompt, params);
  if (!parsed) return params;

  const shared = buildSharedBookingContextFromPrompt(prompt, timeZone);
  return {
    ...params,
    ...shared,
    mode: parsed.mode,
    ...(parsed.timeSlot ? { timeSlot: parsed.timeSlot } : {}),
    ...(parsed.providerName ? { providerName: parsed.providerName } : {}),
  };
}
