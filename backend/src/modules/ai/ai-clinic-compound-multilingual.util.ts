import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import type { ClinicCompoundMultilingualEvalScenario } from './ai-clinic-compound-multilingual.fixtures.js';

export function clinicCompoundMultilingualScenarioToEvalCase(
  scenario: ClinicCompoundMultilingualEvalScenario,
): AiCommandEvalCase {
  return {
    id: `clinic-compound-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    surface: scenario.surface,
    expect: {
      compoundSurface: scenario.surface,
      compoundSteps: scenario.orderedActions,
      needsMultilingual: true,
    },
  };
}

export function clinicCompoundMultilingualRescueScenarioToEvalCase(
  scenario: ClinicCompoundMultilingualEvalScenario,
): AiCommandEvalCase {
  return {
    id: `clinic-compound-rescue-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    surface: scenario.surface,
    expect: {
      rescuedAction: 'compound_intent',
      rescueReason: 'clinic_compound',
      rescueFromAction: scenario.misclassifiedAction,
      needsMultilingual: true,
    },
  };
}
