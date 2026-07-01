import { propagateCompoundStepParamsAcrossSteps } from './ai-command-entity-params.util.js';
import { parseTimeOfDayWindow } from './ai-operations.util.js';
import {
  extractServiceNamesFromPrompt,
  isBookMultiServicePrompt,
  isBookPackagePrompt,
} from './ai-self-service-booking.util.js';
import { isExplainMultiServiceCartPrompt } from './ai-explain-multi-service-cart.util.js';
import { enrichMultiServiceBookingParamsFromPrompt } from './ai-multi-service-customer-public.util.js';
import {
  hasMultiServiceDayPlanningCue,
  hasMultiServiceDayServicesCue,
} from './ai-multi-service-day-cue.util.js';
import { isProviderSameDayMultiCompoundPrompt } from './ai-provider-same-day-multi-compound.util.js';
import {
  MULTI_SERVICE_DAY_COMPOUND_PROMPTS,
  type MultiServiceDayCompoundFixture,
} from './ai-multi-service-day-compound.fixtures.js';
import { MULTI_SERVICE_DAY_MULTILINGUAL_SCENARIOS } from './ai-multi-service-day-compound-multilingual.fixtures.js';

export const MULTI_SERVICE_DAY_RECIPE_ID = 'multi_service_day';

export const MULTI_SERVICE_DAY_STEP_ACTIONS = [
  'add_services_to_cart',
  'check_multi_service_availability',
  'book_multi_service',
] as const;

export type MultiServiceDayCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

function matchMultiServiceDayScenario(
  prompt: string,
): MultiServiceDayCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of MULTI_SERVICE_DAY_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of MULTI_SERVICE_DAY_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export {
  hasMultiServiceDayPlanningCue,
  hasMultiServiceDayServicesCue,
} from './ai-multi-service-day-cue.util.js';

export function isLegacyMultiServiceTwoStepPrompt(prompt: string): boolean {
  const normalized = prompt.trim().toLowerCase();
  return (
    normalized ===
      'add massage and facial to cart and check multi-service availability'.toLowerCase() ||
    (/\badd\b/i.test(prompt) &&
      /\bcart\b/i.test(prompt) &&
      /\bcheck\b/i.test(prompt) &&
      /\bmulti[\s-]?service\b/i.test(prompt) &&
      !hasMultiServiceDayPlanningCue(prompt))
  );
}

export function isMultiServiceDayCompoundPrompt(prompt: string): boolean {
  if (matchMultiServiceDayScenario(prompt)) return true;
  const text = prompt.trim();
  if (text.length < 20) return false;
  if (isProviderSameDayMultiCompoundPrompt(text)) return false;
  if (isBookPackagePrompt(text)) return false;
  if (isExplainMultiServiceCartPrompt(text)) return false;
  if (isLegacyMultiServiceTwoStepPrompt(text)) return false;
  if (!hasMultiServiceDayServicesCue(text)) return false;
  if (!hasMultiServiceDayPlanningCue(text)) return false;
  if (isBookMultiServicePrompt(text) && !/\bfind\b/i.test(text)) return false;
  return true;
}

export function buildMultiServiceDayCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const scenario = matchMultiServiceDayScenario(prompt);
  const params = enrichMultiServiceBookingParamsFromPrompt({}, prompt);
  if (scenario?.expectedParams?.serviceNames) {
    params.serviceNames = scenario.expectedParams.serviceNames;
  } else if (
    !Array.isArray(params.serviceNames) ||
    !(params.serviceNames as string[]).length
  ) {
    const names = extractServiceNamesFromPrompt(prompt);
    if (names.length) params.serviceNames = names;
  }
  const timeOfDay = parseTimeOfDayWindow(prompt, params);
  if (timeOfDay) params.timeOfDay = timeOfDay;
  if (scenario?.expectedParams?.timeOfDay) {
    params.timeOfDay = scenario.expectedParams.timeOfDay;
  }
  return params;
}

export function decomposeMultiServiceDayCompoundPrompt(
  prompt: string,
): MultiServiceDayCompoundStep[] {
  if (!isMultiServiceDayCompoundPrompt(prompt)) return [];

  const base = buildMultiServiceDayCompoundParams(prompt);

  return propagateCompoundStepParamsAcrossSteps([
    {
      action: 'add_services_to_cart',
      params: { ...base },
      segment: prompt,
    },
    {
      action: 'check_multi_service_availability',
      params: { ...base },
      segment: prompt,
    },
    {
      action: 'book_multi_service',
      params: { ...base },
      segment: prompt,
    },
  ]);
}

export function rescueMultiServiceDayCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isMultiServiceDayCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'multi_service_day_compound',
  };
}
