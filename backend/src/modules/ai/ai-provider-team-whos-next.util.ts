/** prov-exp-4.3 — AI intent helpers for manager team who's next queue. */

import {
  SIMILAR_PROVIDER_TEAM_WHOS_NEXT_PROMPTS,
  TEAM_WHOS_NEXT_PROMPT_SCENARIOS,
} from '../provider-mobile/provider-team-whos-next.fixtures.js';
import { isTeamWhosNextPrompt } from '../provider-mobile/provider-team-whos-next.util.js';
import { PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS } from './ai-provider-team-whos-next-multilingual.fixtures.js';

export const PROVIDER_TEAM_WHOS_NEXT_INTENTS = ['team_whos_next'] as const;

export type ProviderTeamWhosNextIntent =
  (typeof PROVIDER_TEAM_WHOS_NEXT_INTENTS)[number];

export function isProviderTeamWhosNextIntent(
  action: string,
): action is ProviderTeamWhosNextIntent {
  return (PROVIDER_TEAM_WHOS_NEXT_INTENTS as readonly string[]).includes(action);
}

export function matchProviderTeamWhosNextScenario(
  prompt: string,
): { action: ProviderTeamWhosNextIntent; rescueReason: string } | null {
  for (const scenario of [
    ...SIMILAR_PROVIDER_TEAM_WHOS_NEXT_PROMPTS,
    ...TEAM_WHOS_NEXT_PROMPT_SCENARIOS.filter((row) => row.expected),
    ...PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS,
  ]) {
    if ('prompt' in scenario && scenario.prompt === prompt) {
      return {
        action: 'team_whos_next',
        rescueReason: 'team_whos_next',
      };
    }
  }
  return null;
}

export function rescueProviderTeamWhosNextIntent(
  prompt: string,
  action: string,
): { action: ProviderTeamWhosNextIntent; rescueReason: string } | null {
  if (isProviderTeamWhosNextIntent(action)) return null;

  const exact = matchProviderTeamWhosNextScenario(prompt);
  if (exact) return exact;

  if (isTeamWhosNextPrompt(prompt)) {
    return {
      action: 'team_whos_next',
      rescueReason: 'team_whos_next',
    };
  }
  return null;
}
