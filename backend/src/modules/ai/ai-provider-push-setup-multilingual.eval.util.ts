import {
  PROVIDER_PUSH_SETUP_MULTILINGUAL_SCENARIOS,
  type ProviderPushSetupMultilingualScenario,
} from './ai-provider-push-setup-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function providerPushSetupMultilingualEvalCaseId(
  scenario: Pick<ProviderPushSetupMultilingualScenario, 'id'>,
): string {
  return `provider-push-setup-i18n-${scenario.id}`;
}

export function providerPushSetupMultilingualScenarioToEvalCase(
  scenario: ProviderPushSetupMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: providerPushSetupMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'provider',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      useSurfaceProviderPushSetupRescue: true,
      needsMultilingual: true,
    },
  };
}

export const AI_COMMAND_EVAL_PROVIDER_PUSH_SETUP_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_PUSH_SETUP_MULTILINGUAL_SCENARIOS.map(
    providerPushSetupMultilingualScenarioToEvalCase,
  );

export function listProviderPushSetupEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<
    ProviderPushSetupMultilingualScenario,
    'id'
  >[] = PROVIDER_PUSH_SETUP_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => providerPushSetupMultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
