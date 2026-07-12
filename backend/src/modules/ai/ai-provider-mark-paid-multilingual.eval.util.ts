import {
  PROVIDER_MARK_PAID_MULTILINGUAL_SCENARIOS,
  type ProviderMarkPaidMultilingualScenario,
} from './ai-provider-mark-paid-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function providerMarkPaidMultilingualEvalCaseId(
  scenario: Pick<ProviderMarkPaidMultilingualScenario, 'id'>,
): string {
  return `provider-mark-paid-i18n-${scenario.id}`;
}

export function providerMarkPaidMultilingualScenarioToEvalCase(
  scenario: ProviderMarkPaidMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: providerMarkPaidMultilingualEvalCaseId(scenario),
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

export const AI_COMMAND_EVAL_PROVIDER_MARK_PAID_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  PROVIDER_MARK_PAID_MULTILINGUAL_SCENARIOS.map(
    providerMarkPaidMultilingualScenarioToEvalCase,
  );

export function listProviderMarkPaidEvalLocaleParityGaps(
  evalCases: readonly AiCommandEvalCase[],
  scenarios: readonly Pick<
    ProviderMarkPaidMultilingualScenario,
    'id'
  >[] = PROVIDER_MARK_PAID_MULTILINGUAL_SCENARIOS,
): string[] {
  const evalIds = new Set(evalCases.map((row) => row.id));
  return scenarios
    .map((scenario) => providerMarkPaidMultilingualEvalCaseId(scenario))
    .filter((evalId) => !evalIds.has(evalId))
    .map((evalId) => `${evalId}: missing eval case`);
}
