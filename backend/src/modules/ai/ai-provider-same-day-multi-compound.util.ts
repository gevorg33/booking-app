import { propagateCompoundStepParamsAcrossSteps } from './ai-command-entity-params.util.js';
import { parseTimeOfDayWindow } from './ai-operations.util.js';
import { extractServiceNamesFromPrompt } from './ai-self-service-booking.util.js';
import { isPickProviderForServicePrompt } from './ai-pick-provider-for-service.util.js';
import { hasMultiServiceDayPlanningCue } from './ai-multi-service-day-cue.util.js';
import { enrichMultiServiceBookingParamsFromPrompt } from './ai-multi-service-customer-public.util.js';
import {
  PROVIDER_SAME_DAY_MULTI_COMPOUND_PROMPTS,
  type ProviderSameDayMultiCompoundFixture,
} from './ai-provider-same-day-multi-compound.fixtures.js';
import { PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_SCENARIOS } from './ai-provider-same-day-multi-compound-multilingual.fixtures.js';

export const PROVIDER_SAME_DAY_MULTI_RECIPE_ID = 'provider_same_day_multi';

export type ProviderSameDayMultiCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

const PROVIDER_LEADING_PATTERNS: ReadonlyArray<RegExp> = [
  /^(?:book\s+with|with)\s+([A-Za-z\u0530-\u058F\u0400-\u04FF][\w'-]+)\s*[—–-]\s*/iu,
  /^([A-Za-z\u0530-\u058F\u0400-\u04FF][\w'-]+)\s*[—–-]\s*/u,
  /^([A-Za-z\u0530-\u058F\u0400-\u04FF][\w'-]+)\s+for\s+/iu,
  /(?:записаться|запиши)\s+к\s+([A-Za-z\u0530-\u058F\u0400-\u04FF][\w'-]+)\s*[—–-]\s*/iu,
  /([A-Za-z\u0530-\u058F\u0400-\u04FF][\w'-]+)(?:-ի|-ին)?\s+հետ\s*[—–-]\s*/iu,
  /^([A-Za-z\u0530-\u058F\u0400-\u04FF][\w'-]+)\s+հետ\s*[—–-]\s*/iu,
];

const GENERIC_PROVIDER_WORDS =
  /^(?:any|first|available|whoever|stylist|specialist|provider|therapist|master|barber)$/iu;

function cleanProviderName(value: string): string {
  return value
    .replace(/[?.!,]+$/g, '')
    .replace(/-ի$/u, '')
    .replace(/-ին$/u, '')
    .trim();
}

function matchProviderSameDayMultiScenario(
  prompt: string,
): ProviderSameDayMultiCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of PROVIDER_SAME_DAY_MULTI_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of PROVIDER_SAME_DAY_MULTI_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function extractProviderNameFromSameDayMultiPrompt(
  prompt: string,
): string | undefined {
  const scenario = matchProviderSameDayMultiScenario(prompt);
  if (scenario?.providerName) return scenario.providerName;

  for (const pattern of PROVIDER_LEADING_PATTERNS) {
    const match = prompt.match(pattern);
    const candidate = cleanProviderName(match?.[1] ?? '');
    if (!candidate || candidate.length < 2) continue;
    if (GENERIC_PROVIDER_WORDS.test(candidate)) continue;
    return candidate;
  }

  return undefined;
}

export function hasProviderSameDayMultiProviderCue(prompt: string): boolean {
  return Boolean(extractProviderNameFromSameDayMultiPrompt(prompt));
}

function stripProviderPrefixFromPrompt(prompt: string): string {
  for (const pattern of PROVIDER_LEADING_PATTERNS) {
    if (pattern.test(prompt)) {
      return prompt.replace(pattern, '').trim();
    }
  }
  return prompt;
}

export function extractServiceNamesFromProviderSameDayMultiPrompt(
  prompt: string,
): string[] {
  const scenario = matchProviderSameDayMultiScenario(prompt);
  if (scenario?.serviceNames?.length) return [...scenario.serviceNames];

  const stripped = stripProviderPrefixFromPrompt(prompt);
  const fromGeneric = extractServiceNamesFromPrompt(stripped);
  if (fromGeneric.length >= 2) return fromGeneric;

  const andBeforeSame = stripped.match(
    /^(.+?)\s+and\s+(.+?)(?:\s+same\b|\s+(?:morning|afternoon|evening|day|visit)\b|$)/i,
  );
  if (andBeforeSame) {
    const second = andBeforeSame[2]
      .replace(/\s+(?:same|block).*$/i, '')
      .replace(/\s+please$/i, '')
      .trim();
    const first = andBeforeSame[1].trim();
    if (first.length >= 2 && second.length >= 2) {
      return [first, second];
    }
  }

  return fromGeneric;
}

export function hasProviderSameDayMultiBlockCue(prompt: string): boolean {
  return (
    extractServiceNamesFromProviderSameDayMultiPrompt(prompt).length >= 2 &&
    hasMultiServiceDayPlanningCue(prompt)
  );
}

export function isProviderSameDayMultiCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (text.length < 16) return false;
  if (matchProviderSameDayMultiScenario(text)) return true;
  if (!hasProviderSameDayMultiProviderCue(text)) return false;
  if (!hasProviderSameDayMultiBlockCue(text)) return false;
  return true;
}

export function buildProviderSameDayMultiCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const scenario = matchProviderSameDayMultiScenario(prompt);
  const params = enrichMultiServiceBookingParamsFromPrompt({}, prompt);

  const providerName =
    scenario?.providerName ?? extractProviderNameFromSameDayMultiPrompt(prompt);
  if (providerName) {
    params.providerName = providerName;
    params.employeeName = providerName;
  }

  if (scenario?.serviceNames?.length) {
    params.serviceNames = scenario.serviceNames;
  } else {
    const names = extractServiceNamesFromProviderSameDayMultiPrompt(prompt);
    if (names.length) params.serviceNames = names;
  }

  const timeOfDay = parseTimeOfDayWindow(prompt, params);
  if (timeOfDay) params.timeOfDay = timeOfDay;
  if (scenario?.timeOfDay) params.timeOfDay = scenario.timeOfDay;

  params.mode = 'named_provider';
  params.providerSameDayMulti = true;

  return params;
}

export function decomposeProviderSameDayMultiCompoundPrompt(
  prompt: string,
): ProviderSameDayMultiCompoundStep[] {
  if (!isProviderSameDayMultiCompoundPrompt(prompt)) return [];

  const base = buildProviderSameDayMultiCompoundParams(prompt);

  return propagateCompoundStepParamsAcrossSteps([
    {
      action: 'pick_provider_for_service',
      params: { ...base },
      segment: prompt,
    },
    {
      action: 'check_multi_service_availability',
      params: { ...base, continueAfterProviderPick: true },
      segment: prompt,
    },
    {
      action: 'book_multi_service',
      params: { ...base, continueAfterProviderPick: true },
      segment: prompt,
    },
  ]);
}

export function rescueProviderSameDayMultiCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isProviderSameDayMultiCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'provider_same_day_multi_compound',
  };
}
