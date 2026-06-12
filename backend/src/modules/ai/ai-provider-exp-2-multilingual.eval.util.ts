import {
  PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS,
  type ProviderExp2MultilingualScenario,
} from './ai-provider-exp-2-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function providerExp2MultilingualEvalCaseId(
  scenario: Pick<ProviderExp2MultilingualScenario, 'id'>,
): string {
  return `provider-exp-2-i18n-${scenario.id}`;
}

export function providerExp2MultilingualScenarioToEvalCase(
  scenario: ProviderExp2MultilingualScenario,
): AiCommandEvalCase {
  return {
    id: providerExp2MultilingualEvalCaseId(scenario),
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

export const AI_COMMAND_EVAL_PROVIDER_EXP_2_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS.map(
    providerExp2MultilingualScenarioToEvalCase,
  );

export function listProviderExp2EvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<ProviderExp2MultilingualScenario, 'id'>[] = PROVIDER_EXP_2_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => providerExp2MultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
