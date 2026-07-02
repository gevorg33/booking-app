/** prov-exp-7.3 — AI intent helpers for provider open shifts / gap waitlist. */

import {
  PROVIDER_OPEN_SHIFTS_FILL_PROMPT_SCENARIOS,
  SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS,
} from '../provider-mobile/provider-open-shifts.fixtures.js';
import { PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS } from './ai-provider-open-shifts-multilingual.fixtures.js';

export const PROVIDER_OPEN_SHIFTS_INTENTS = [
  'suggest_waitlist_for_gap',
] as const;

export type ProviderOpenShiftsIntent =
  (typeof PROVIDER_OPEN_SHIFTS_INTENTS)[number];

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function isProviderOpenShiftsIntent(
  action: string,
): action is ProviderOpenShiftsIntent {
  return (PROVIDER_OPEN_SHIFTS_INTENTS as readonly string[]).includes(action);
}

export function matchProviderOpenShiftsScenario(
  prompt: string,
): { action: ProviderOpenShiftsIntent; rescueReason: string } | null {
  for (const scenario of [
    ...SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS,
    ...PROVIDER_OPEN_SHIFTS_FILL_PROMPT_SCENARIOS.filter(
      (row) => row.expectedMatch,
    ),
    ...PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS,
  ]) {
    if ('prompt' in scenario && scenario.prompt === prompt) {
      return {
        action: 'suggest_waitlist_for_gap',
        rescueReason: 'fill_gap_waitlist',
      };
    }
  }
  return null;
}

export function isSuggestWaitlistForGapPrompt(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  if (
    /fill\s+(?:this\s+)?gap|suggest\s+waitlist.*(?:gap|slot)|waitlist.*(?:for|fill).*(?:gap|slot)|who\s+(?:on|from)\s+waitlist.*gap/.test(
      normalized,
    )
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return /(\u056c\u0580\u0561\u0563\u0580\u0565\u0576|gap).*waitlist|waitlist.*gap|\u056c\u0580\u0561\u0563\u0580\u0565\u0576.*gap/i.test(
      prompt,
    );
  }
  if (containsCyrillicScript(prompt)) {
    return /(\u0437\u0430\u043f\u043e\u043b\u043d|\u043f\u0440\u043e\u0431\u0435\u043b).*waitlist|waitlist.*(gap|\u0441\u043b\u043e\u0442|\u043f\u0440\u043e\u0431\u0435\u043b)|\u043f\u0440\u0435\u0434\u043b\u043e\u0436.*waitlist.*gap/i.test(
      prompt,
    );
  }
  return false;
}

export function rescueProviderOpenShiftsIntent(
  prompt: string,
  action: string,
): { action: ProviderOpenShiftsIntent; rescueReason: string } | null {
  if (isProviderOpenShiftsIntent(action)) return null;

  const exact = matchProviderOpenShiftsScenario(prompt);
  if (exact) return exact;

  if (isSuggestWaitlistForGapPrompt(prompt)) {
    return {
      action: 'suggest_waitlist_for_gap',
      rescueReason: 'fill_gap_waitlist',
    };
  }
  return null;
}
