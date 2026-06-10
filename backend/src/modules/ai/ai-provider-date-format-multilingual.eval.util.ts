import {
  PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS,
  type ProviderDateFormatMultilingualScenario,
} from './ai-provider-date-format-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function providerDateFormatMultilingualEvalCaseId(
  scenario: Pick<ProviderDateFormatMultilingualScenario, 'id'>,
): string {
  return `provider-date-format-i18n-${scenario.id}`;
}

export function providerDateFormatMultilingualScenarioToEvalCase(
  scenario: ProviderDateFormatMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: providerDateFormatMultilingualEvalCaseId(scenario),
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

export const AI_COMMAND_EVAL_PROVIDER_DATE_FORMAT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS.map(
    providerDateFormatMultilingualScenarioToEvalCase,
  );

export function listProviderDateFormatEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<
    ProviderDateFormatMultilingualScenario,
    'id'
  >[] = PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => providerDateFormatMultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
