import {
  CHECKOUT_TAX_MULTILINGUAL_SCENARIOS,
  type CheckoutTaxMultilingualScenario,
} from './ai-checkout-tax-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function checkoutTaxMultilingualEvalCaseId(
  scenario: Pick<CheckoutTaxMultilingualScenario, 'id'>,
): string {
  return `checkout-tax-i18n-${scenario.id}`;
}

export function checkoutTaxMultilingualScenarioToEvalCase(
  scenario: CheckoutTaxMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: checkoutTaxMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'public',
    locale: scenario.locale,
    expect: {
      rescuedAction: 'explain_checkout_tax',
      rescueReason: 'explain_checkout_tax',
      useSurfaceExplainCheckoutTaxRescue: true,
      paramsPartial: { aspect: scenario.aspect },
      ...(scenario.locale === 'hy' || scenario.locale === 'ru'
        ? { needsMultilingual: true }
        : {}),
    },
  };
}

export const AI_COMMAND_EVAL_CHECKOUT_TAX_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  CHECKOUT_TAX_MULTILINGUAL_SCENARIOS.map(
    checkoutTaxMultilingualScenarioToEvalCase,
  );
