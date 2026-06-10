import {
  PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS,
  type ProviderExp3MultilingualScenario,
} from './ai-provider-exp-3-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function providerExp3MultilingualEvalCaseId(
  scenario: Pick<ProviderExp3MultilingualScenario, 'id'>,
): string {
  return `provider-exp-3-i18n-${scenario.id}`;
}

export function providerExp3MultilingualScenarioToEvalCase(
  scenario: ProviderExp3MultilingualScenario,
): AiCommandEvalCase {
  return {
    id: providerExp3MultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'provider',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      needsMultilingual: true,
      ...(scenario.paramsPartial ? { paramsPartial: scenario.paramsPartial } : {}),
    },
  };
}

export const AI_COMMAND_EVAL_PROVIDER_EXP_3_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS.map(
    providerExp3MultilingualScenarioToEvalCase,
  );

export function listProviderExp3EvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<ProviderExp3MultilingualScenario, 'id'>[] = PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => providerExp3MultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
