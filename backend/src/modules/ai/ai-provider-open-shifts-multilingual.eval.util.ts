import {
  PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS,
  type ProviderOpenShiftsMultilingualScenario,
} from './ai-provider-open-shifts-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function providerOpenShiftsMultilingualEvalCaseId(
  scenario: Pick<ProviderOpenShiftsMultilingualScenario, 'id'>,
): string {
  return `provider-open-shifts-i18n-${scenario.id}`;
}

export function providerOpenShiftsMultilingualScenarioToEvalCase(
  scenario: ProviderOpenShiftsMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: providerOpenShiftsMultilingualEvalCaseId(scenario),
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

export const AI_COMMAND_EVAL_PROVIDER_OPEN_SHIFTS_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS.map(
    providerOpenShiftsMultilingualScenarioToEvalCase,
  );

export function listProviderOpenShiftsEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<
    ProviderOpenShiftsMultilingualScenario,
    'id'
  >[] = PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => providerOpenShiftsMultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
