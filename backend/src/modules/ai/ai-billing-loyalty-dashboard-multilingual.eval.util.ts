import {
  BILLING_LOYALTY_MULTILINGUAL_SCENARIOS,
  type BillingLoyaltyMultilingualScenario,
} from './ai-billing-loyalty-dashboard-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function billingLoyaltyMultilingualEvalCaseId(
  scenario: Pick<BillingLoyaltyMultilingualScenario, 'id'>,
): string {
  return `billing-loyalty-i18n-${scenario.id}`;
}

export function billingLoyaltyMultilingualScenarioToEvalCase(
  scenario: BillingLoyaltyMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: billingLoyaltyMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'dashboard',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      needsMultilingual: true,
    },
  };
}

export const AI_COMMAND_EVAL_BILLING_LOYALTY_DASHBOARD_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  BILLING_LOYALTY_MULTILINGUAL_SCENARIOS.map(
    billingLoyaltyMultilingualScenarioToEvalCase,
  );
