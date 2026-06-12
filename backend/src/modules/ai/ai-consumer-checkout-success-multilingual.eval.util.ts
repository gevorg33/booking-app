import {
  CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_SCENARIOS,
  type ConsumerCheckoutSuccessMultilingualScenario,
} from './ai-consumer-checkout-success-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function consumerCheckoutSuccessMultilingualEvalCaseId(
  scenario: Pick<ConsumerCheckoutSuccessMultilingualScenario, 'source' | 'id'>,
): string {
  return `consumer-checkout-success-i18n-${scenario.source}-${scenario.id}`;
}

export function consumerCheckoutSuccessMultilingualScenarioToEvalCase(
  scenario: ConsumerCheckoutSuccessMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: consumerCheckoutSuccessMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'customer',
    locale: scenario.locale,
    expect: {
      rescuedAction: 'explain_consumer_checkout_success',
      rescueReason: 'explain_consumer_checkout_success',
      useSurfaceConsumerCheckoutSuccessRescue: true,
      paramsPartial: { aspect: scenario.aspect },
      ...(scenario.locale === 'hy' || scenario.locale === 'ru'
        ? { needsMultilingual: true }
        : {}),
    },
  };
}

export const AI_COMMAND_EVAL_CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_SCENARIOS.map(
    consumerCheckoutSuccessMultilingualScenarioToEvalCase,
  );

export function listConsumerCheckoutSuccessEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<
    ConsumerCheckoutSuccessMultilingualScenario,
    'id' | 'source'
  >[] = CONSUMER_CHECKOUT_SUCCESS_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => consumerCheckoutSuccessMultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
