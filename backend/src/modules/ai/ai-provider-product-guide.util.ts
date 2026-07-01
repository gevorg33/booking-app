import type { AppGuideIntent } from './ai-product-guide.util.js';
import type {
  CommandResult,
  GuideResponse,
} from './command-completion.types.js';
import {
  PROVIDER_PRODUCT_GUIDE_RESCUE_SCENARIOS,
  type ProviderProductGuideRescueScenario,
} from './ai-provider-product-guide.fixtures.js';

/** ai-guide-1.4.1 / ai-cmd-provider-5.21.* + 5.24.2 + 5.24.4 — provider FAQ guide intents. */
export const PROVIDER_PRODUCT_GUIDE_INTENTS = [
  'explain_staff_invite',
  'explain_provider_app_tabs',
  'explain_team_view_scope',
  'explain_profile_settings',
  'explain_assistant_confirm_swipe',
  'explain_provider_compound_steps',
] as const;

export type ProviderProductGuideIntent =
  (typeof PROVIDER_PRODUCT_GUIDE_INTENTS)[number];

export const PROVIDER_PRODUCT_GUIDE_TOPIC_BY_INTENT: Readonly<
  Record<ProviderProductGuideIntent, string>
> = {
  explain_staff_invite: 'provider-staff-invite',
  explain_provider_app_tabs: 'provider-today-calendar',
  explain_team_view_scope: 'provider-view-scope',
  explain_profile_settings: 'provider-profile-settings',
  explain_assistant_confirm_swipe: 'provider-assistant-confirm',
  explain_provider_compound_steps: 'provider-compound-steps',
};

const PROVIDER_PRODUCT_GUIDE_APP_INTENT_BY_INTENT: Readonly<
  Record<ProviderProductGuideIntent, AppGuideIntent>
> = {
  explain_staff_invite: 'guide_user_flow',
  explain_provider_app_tabs: 'explain_app_feature',
  explain_team_view_scope: 'explain_app_feature',
  explain_profile_settings: 'guide_user_flow',
  explain_assistant_confirm_swipe: 'explain_app_feature',
  explain_provider_compound_steps: 'guide_user_flow',
};

export function isProviderProductGuideIntent(
  action: string,
): action is ProviderProductGuideIntent {
  return (PROVIDER_PRODUCT_GUIDE_INTENTS as readonly string[]).includes(action);
}

export function resolveProviderProductGuideTopicId(
  intent: ProviderProductGuideIntent,
): string {
  return PROVIDER_PRODUCT_GUIDE_TOPIC_BY_INTENT[intent];
}

export function resolveProviderProductGuideAppIntent(
  intent: ProviderProductGuideIntent,
): AppGuideIntent {
  return PROVIDER_PRODUCT_GUIDE_APP_INTENT_BY_INTENT[intent];
}

function matchesProviderGuideRescueScenario(
  prompt: string,
  action: string,
  scenario: ProviderProductGuideRescueScenario,
): boolean {
  if (scenario.fromActions?.length && !scenario.fromActions.includes(action)) {
    return false;
  }
  return scenario.prompt.test(prompt);
}

/** Deterministic rescue for provider mobile guide FAQ intents (pipe-1 rescue). */
export function rescueProviderProductGuideIntent(
  prompt: string,
  action: string,
): string {
  if (isProviderProductGuideIntent(action)) return action;

  for (const scenario of PROVIDER_PRODUCT_GUIDE_RESCUE_SCENARIOS) {
    if (matchesProviderGuideRescueScenario(prompt, action, scenario)) {
      return scenario.intent;
    }
  }

  return action;
}

export function buildProviderGuideCommandResult(
  providerIntent: ProviderProductGuideIntent,
  guide: GuideResponse,
): CommandResult {
  return {
    success: true,
    action: providerIntent,
    summary: guide.summary,
    details: {
      topicId:
        guide.topicId ?? resolveProviderProductGuideTopicId(providerIntent),
      stepCount: guide.steps.length,
      guideIntent: resolveProviderProductGuideAppIntent(providerIntent),
    },
    guide,
  };
}

export function rewriteProviderGuideCommandResult(
  providerIntent: ProviderProductGuideIntent,
  result: CommandResult,
): CommandResult {
  if (!result.guide) return { ...result, action: providerIntent };
  return buildProviderGuideCommandResult(providerIntent, result.guide);
}
