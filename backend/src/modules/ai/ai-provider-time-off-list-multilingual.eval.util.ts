import {
  PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS,
  type ProviderTimeOffListMultilingualScenario,
} from './ai-provider-time-off-list-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function providerTimeOffListMultilingualEvalCaseId(
  scenario: Pick<ProviderTimeOffListMultilingualScenario, 'id'>,
): string {
  return `provider-time-off-list-i18n-${scenario.id}`;
}

export function providerTimeOffListMultilingualScenarioToEvalCase(
  scenario: ProviderTimeOffListMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: providerTimeOffListMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'provider',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      needsMultilingual: true,
    },
  };
}

export const AI_COMMAND_EVAL_PROVIDER_TIME_OFF_LIST_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS.map(
    providerTimeOffListMultilingualScenarioToEvalCase,
  );

export function listProviderTimeOffListEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<
    ProviderTimeOffListMultilingualScenario,
    'id'
  >[] = PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => providerTimeOffListMultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
