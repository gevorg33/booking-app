import { FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS } from './ai-find-my-saved-salons-multilingual.fixtures.js';
import {
  FIND_MY_SAVED_SALONS_PROMPTS,
  type FindMySavedSalonsAspect,
  type FindMySavedSalonsPromptFixture,
} from './ai-find-my-saved-salons.fixtures.js';

export const FIND_MY_SAVED_SALONS_INTENTS = ['find_my_saved_salons'] as const;

export type FindMySavedSalonsIntent =
  (typeof FIND_MY_SAVED_SALONS_INTENTS)[number];

export {
  CUSTOMER_FIND_MY_SAVED_SALONS_CLASSIFIER_RULES,
  FIND_MY_SAVED_SALONS_PROMPTS,
  FIND_MY_SAVED_SALONS_RESCUE_SCENARIOS,
} from './ai-find-my-saved-salons.fixtures.js';
export { FIND_MY_SAVED_SALONS_MULTILINGUAL_CLASSIFIER_RULES } from './ai-find-my-saved-salons-multilingual.fixtures.js';

const SAVED_SALONS_CUE =
  /\b(saved|recent|visited|pinned|remembered).{0,24}\b(salons?|places?|businesses?|tenants?)\b|\bmy saved salons\b|\bplaces i booked\b|\bsalons i visited\b|\bwhere are my saved\b|\bhow do i switch between salons\b|сохран.{0,20}салон|мои.{0,10}салон|недавн.{0,20}салон|показать.{0,20}салон|պահված.{0,20}salon|այցելած.{0,20}salon|որտեղ.{0,20}salon/i;

const SWITCH_SALON_STEAL_CUE =
  /\b(go back to|switch to|open|return to|take me to|change salon to|jump to|back to|switch tenant to|переключ|вернуться|открыть|վերադառն|փոխել.{0,12}salon)\b/i;

function hasSwitchSalonTenantStealCue(prompt: string): boolean {
  if (SWITCH_SALON_STEAL_CUE.test(prompt)) return true;
  return /\b(other salon|salon i visited|salon i booked|another salon)\b/i.test(
    prompt,
  );
}
const LIST_PROVIDERS_STEAL =
  /\b(list|show|who are)\b.{0,20}\b(stylists?|providers?|staff|specialists?|employees?)\b/i;

function matchFindMySavedSalonsScenario(
  prompt: string,
):
  | FindMySavedSalonsPromptFixture
  | (typeof FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of FIND_MY_SAVED_SALONS_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of FIND_MY_SAVED_SALONS_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function inferFindMySavedSalonsAspect(
  prompt: string,
): FindMySavedSalonsAspect {
  const scenario = matchFindMySavedSalonsScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (/\b(where|how do i|how to find|find)\b/i.test(prompt)) return 'where';
  if (
    /\b(list|show|recent|visited|saved|pinned|remembered|every)\b/i.test(prompt)
  ) {
    return 'list';
  }
  return 'all';
}

export function isFindMySavedSalonsPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (hasSwitchSalonTenantStealCue(text)) return false;
  if (LIST_PROVIDERS_STEAL.test(text) && !/\bsalon/i.test(text)) return false;
  if (matchFindMySavedSalonsScenario(text)) return true;
  return SAVED_SALONS_CUE.test(text);
}

export function isFindMySavedSalonsIntent(
  action: string,
): action is FindMySavedSalonsIntent {
  return (FIND_MY_SAVED_SALONS_INTENTS as readonly string[]).includes(action);
}

export interface ParsedFindMySavedSalons {
  aspect: FindMySavedSalonsAspect;
}

export function parseFindMySavedSalonsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedFindMySavedSalons | null {
  if (!isFindMySavedSalonsPrompt(prompt)) return null;
  const aspectParam = params.aspect;
  const aspect =
    aspectParam === 'list' || aspectParam === 'where' || aspectParam === 'all'
      ? aspectParam
      : inferFindMySavedSalonsAspect(prompt);
  return { aspect };
}

export function rescueFindMySavedSalonsIntent(
  prompt: string,
  action: string,
): { action: FindMySavedSalonsIntent; rescueReason: string } | null {
  if (isFindMySavedSalonsIntent(action)) return null;
  if (!parseFindMySavedSalonsFromPrompt(prompt)) return null;
  return {
    action: 'find_my_saved_salons',
    rescueReason: 'find_my_saved_salons',
  };
}

export function buildFindMySavedSalonsSummary(input: {
  aspect: FindMySavedSalonsAspect;
  recentSalons: Array<{ name: string }>;
}): string {
  const hasSalons = input.recentSalons.length > 0;
  if (input.aspect === 'where') {
    return hasSalons
      ? 'Saved salons live on this device. Tap the salon switcher on Home or Account to jump back to a place you booked before.'
      : 'After you book at a salon, it is remembered on this device. Use the salon switcher on Home or Account to return later.';
  }
  if (!hasSalons) {
    return 'Recently visited salons are saved on this device. Open Home and tap the salon switcher to jump back after your first booking.';
  }
  const lines = input.recentSalons.map((salon) => `• ${salon.name}`).join('\n');
  return `Salons saved on this device:\n${lines}\n\nTap Switch salon on Home to open one.`;
}

export function buildFindMySavedSalonsNavigate(): {
  path: 'tenant_switch';
  query: Record<string, string>;
} {
  return { path: 'tenant_switch', query: {} };
}
