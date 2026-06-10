import {
  CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS,
  type ConsumerClinicTestResultsDeferredMultilingualScenario,
} from './ai-consumer-clinic-test-results-deferred-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function consumerClinicTestResultsDeferredMultilingualEvalCaseId(
  scenario: Pick<ConsumerClinicTestResultsDeferredMultilingualScenario, 'id'>,
): string {
  return `consumer-clinic-deferred-i18n-${scenario.id}`;
}

export function consumerClinicTestResultsDeferredMultilingualScenarioToEvalCase(
  scenario: ConsumerClinicTestResultsDeferredMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: consumerClinicTestResultsDeferredMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'customer',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      useSurfaceConsumerClinicTestResultsRescue: true,
      ...(scenario.paramsPartial ? { paramsPartial: scenario.paramsPartial } : {}),
      needsMultilingual: true,
    },
  };
}

export const AI_COMMAND_EVAL_CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS.map(
    consumerClinicTestResultsDeferredMultilingualScenarioToEvalCase,
  );

export function listConsumerClinicTestResultsDeferredEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<
    ConsumerClinicTestResultsDeferredMultilingualScenario,
    'id'
  >[] = CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) =>
      consumerClinicTestResultsDeferredMultilingualEvalCaseId(scenario),
    )
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
