import {
  CONSUMER_CHECKOUT_TAX_MULTILINGUAL_SCENARIOS,
  type ConsumerCheckoutTaxMultilingualScenario,
} from './ai-consumer-checkout-tax-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function consumerCheckoutTaxMultilingualEvalCaseId(
  scenario: Pick<ConsumerCheckoutTaxMultilingualScenario, 'id'>,
): string {
  return `consumer-checkout-tax-i18n-${scenario.id}`;
}

export function consumerCheckoutTaxMultilingualScenarioToEvalCase(
  scenario: ConsumerCheckoutTaxMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: consumerCheckoutTaxMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'customer',
    locale: scenario.locale,
    expect: {
      rescuedAction: 'explain_consumer_checkout_tax',
      rescueReason: 'explain_consumer_checkout_tax',
      useSurfaceConsumerCheckoutTaxRescue: true,
      paramsPartial: { aspect: scenario.aspect },
      ...(scenario.locale === 'hy' || scenario.locale === 'ru'
        ? { needsMultilingual: true }
        : {}),
    },
  };
}

export const AI_COMMAND_EVAL_CONSUMER_CHECKOUT_TAX_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  CONSUMER_CHECKOUT_TAX_MULTILINGUAL_SCENARIOS.map(
    consumerCheckoutTaxMultilingualScenarioToEvalCase,
  );

export function listConsumerCheckoutTaxEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<ConsumerCheckoutTaxMultilingualScenario, 'id'>[] = CONSUMER_CHECKOUT_TAX_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => consumerCheckoutTaxMultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
