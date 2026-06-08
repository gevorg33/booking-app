import {
  CUSTOMER_ADOPT_6_PROMPT_SCENARIOS,
  PROVIDER_ADOPT_6_PROMPT_SCENARIOS,
} from '../ai-adopt-6-growth-loops.fixtures.js';
import type { AiCommandEvalCase, AiEvalLocale } from './ai-command-eval.types.js';

const ADOPT_6_CUSTOMER_RESCUE_REASON_BY_ACTION: Record<string, string> = {
  explain_my_notifications: 'explain_notifications',
  manage_notification_preferences: 'manage_notification_prefs',
  refer_a_friend: 'refer_friend',
  rebook_last_appointment: 'rebook_last',
  find_my_saved_salons: 'saved_salons',
};

const ADOPT_6_PROVIDER_RESCUE_REASON_BY_ACTION: Record<string, string> = {
  explain_push_setup: 'explain_push_setup',
  enable_push_notifications: 'enable_push',
};

function inferAdopt6ScenarioLocale(id: string): AiEvalLocale {
  if (id.startsWith('hy-')) return 'hy';
  if (id.startsWith('ru-')) return 'ru';
  return 'en';
}

export function adopt6CustomerScenarioToEvalCase(
  scenario: (typeof CUSTOMER_ADOPT_6_PROMPT_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `adopt-6-${scenario.id}`,
    prompt: scenario.prompt,
    locale: inferAdopt6ScenarioLocale(scenario.id),
    surface: 'customer',
    expect: {
      rescuedAction: scenario.action,
      rescueReason:
        ADOPT_6_CUSTOMER_RESCUE_REASON_BY_ACTION[scenario.action] ??
        'already_adopt6',
    },
  };
}

export function adopt6ProviderScenarioToEvalCase(
  scenario: (typeof PROVIDER_ADOPT_6_PROMPT_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `adopt-6-${scenario.id}`,
    prompt: scenario.prompt,
    locale: inferAdopt6ScenarioLocale(scenario.id),
    surface: 'provider',
    expect: {
      rescuedAction: scenario.action,
      rescueReason:
        ADOPT_6_PROVIDER_RESCUE_REASON_BY_ACTION[scenario.action] ??
        'already_adopt6',
    },
  };
}

/** adopt-6.6 — customer growth loop intents (EN/HY/RU rescue golden cases). */
export const AI_COMMAND_EVAL_ADOPT_6_CUSTOMER_GROWTH_CASES: AiCommandEvalCase[] =
  CUSTOMER_ADOPT_6_PROMPT_SCENARIOS.map(adopt6CustomerScenarioToEvalCase);

/** adopt-6.7 — provider push setup intents (EN/HY/RU rescue golden cases). */
export const AI_COMMAND_EVAL_ADOPT_6_PROVIDER_GROWTH_CASES: AiCommandEvalCase[] =
  PROVIDER_ADOPT_6_PROMPT_SCENARIOS.map(adopt6ProviderScenarioToEvalCase);

/** adopt-6.6 + adopt-6.7 combined eval corpus. */
export const AI_COMMAND_EVAL_ADOPT_6_GROWTH_CASES: AiCommandEvalCase[] = [
  ...AI_COMMAND_EVAL_ADOPT_6_CUSTOMER_GROWTH_CASES,
  ...AI_COMMAND_EVAL_ADOPT_6_PROVIDER_GROWTH_CASES,
];
