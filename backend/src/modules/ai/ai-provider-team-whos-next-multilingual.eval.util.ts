import {
  PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS,
  type ProviderTeamWhosNextMultilingualScenario,
} from './ai-provider-team-whos-next-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function providerTeamWhosNextMultilingualEvalCaseId(
  scenario: Pick<ProviderTeamWhosNextMultilingualScenario, 'id'>,
): string {
  return `provider-team-whos-next-i18n-${scenario.id}`;
}

export function providerTeamWhosNextMultilingualScenarioToEvalCase(
  scenario: ProviderTeamWhosNextMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: providerTeamWhosNextMultilingualEvalCaseId(scenario),
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

export const AI_COMMAND_EVAL_PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS.map(
    providerTeamWhosNextMultilingualScenarioToEvalCase,
  );

export function listProviderTeamWhosNextEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<
    ProviderTeamWhosNextMultilingualScenario,
    'id'
  >[] = PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => providerTeamWhosNextMultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
