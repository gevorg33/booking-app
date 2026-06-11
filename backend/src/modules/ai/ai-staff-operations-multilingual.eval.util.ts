import {
  STAFF_OPERATIONS_MULTILINGUAL_SCENARIOS,
  type StaffOperationsMultilingualScenario,
} from './ai-staff-operations-multilingual.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function staffOperationsMultilingualEvalCaseId(
  scenario: Pick<StaffOperationsMultilingualScenario, 'id'>,
): string {
  return `staff-operations-i18n-${scenario.id}`;
}

export function staffOperationsMultilingualScenarioToEvalCase(
  scenario: StaffOperationsMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: staffOperationsMultilingualEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: 'dashboard',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      needsMultilingual: true,
    },
  };
}

export const AI_COMMAND_EVAL_STAFF_OPERATIONS_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  STAFF_OPERATIONS_MULTILINGUAL_SCENARIOS.map(
    staffOperationsMultilingualScenarioToEvalCase,
  );
