import {
  PROVIDER_EARNINGS_MULTILINGUAL_SCENARIOS,
  type ProviderEarningsMultilingualScenario,
} from './ai-provider-earnings-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function providerEarningsMultilingualEvalCaseId(
  scenario: Pick<ProviderEarningsMultilingualScenario, 'id'>,
): string {
  return `provider-earnings-i18n-${scenario.id}`;
}

export function providerEarningsMultilingualScenarioToEvalCase(
  scenario: ProviderEarningsMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: providerEarningsMultilingualEvalCaseId(scenario),
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

export const AI_COMMAND_EVAL_PROVIDER_EARNINGS_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_EARNINGS_MULTILINGUAL_SCENARIOS.map(
    providerEarningsMultilingualScenarioToEvalCase,
  );

export function listProviderEarningsEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<
    ProviderEarningsMultilingualScenario,
    'id'
  >[] = PROVIDER_EARNINGS_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => providerEarningsMultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
