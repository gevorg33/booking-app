import {
  CUSTOMER_INTENT_PROMOTION_MULTILINGUAL_SCENARIOS,
  type CustomerIntentPromotionMultilingualScenario,
} from './ai-customer-intent-promotion-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function customerIntentPromotionMultilingualEvalCaseId(
  scenarioId: string,
): string {
  return `promotion-i18n-${scenarioId}`;
}

function rescueFlagForPromotionIntent(
  action: CustomerIntentPromotionMultilingualScenario['expectedAction'],
): Pick<
  AiCommandEvalCase['expect'],
  | 'useSurfacePaymentsRescue'
  | 'useSurfaceMembershipCustomerRescue'
  | 'useSurfacePrivacyGdprCustomerRescue'
  | 'useSurfaceGiftCardCancelCustomerRescue'
  | 'useSurfaceListMyPackageVisitsCustomerRescue'
> {
  switch (action) {
    case 'pay_online':
    case 'explain_why_stripe_required':
      return { useSurfacePaymentsRescue: true };
    case 'my_subscriptions':
      return { useSurfaceMembershipCustomerRescue: true };
    case 'privacy_export':
    case 'privacy_delete':
      return { useSurfacePrivacyGdprCustomerRescue: true };
    case 'request_gift_card_cancel':
      return { useSurfaceGiftCardCancelCustomerRescue: true };
    case 'list_my_package_visits':
      return { useSurfaceListMyPackageVisitsCustomerRescue: true };
  }
}

export function customerIntentPromotionMultilingualScenarioToEvalCase(
  scenario: CustomerIntentPromotionMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: customerIntentPromotionMultilingualEvalCaseId(scenario.id),
    prompt: scenario.prompt,
    surface: scenario.surface ?? 'customer',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      ...rescueFlagForPromotionIntent(scenario.expectedAction),
      needsMultilingual: true,
    },
  };
}

export const AI_COMMAND_EVAL_CUSTOMER_INTENT_PROMOTION_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  CUSTOMER_INTENT_PROMOTION_MULTILINGUAL_SCENARIOS.map(
    customerIntentPromotionMultilingualScenarioToEvalCase,
  );
