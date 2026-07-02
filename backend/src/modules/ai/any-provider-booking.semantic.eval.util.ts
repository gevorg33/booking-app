import {
  ANY_PROVIDER_BOOKING_SEMANTIC_SCENARIOS,
  type AnyProviderBookingSemanticScenario,
} from './any-provider-booking.semantic.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function anyProviderBookingSemanticEvalCaseId(
  scenario: Pick<AnyProviderBookingSemanticScenario, 'id'>,
): string {
  return `any-provider-booking-semantic-${scenario.id}`;
}

export function anyProviderBookingScenarioToEvalCase(
  scenario: AnyProviderBookingSemanticScenario,
): AiCommandEvalCase {
  return {
    id: anyProviderBookingSemanticEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: scenario.surface ?? 'dashboard',
    expect: {
      useAnyProviderBookingSemanticDetect: true,
      anyProviderBookingSemantic: scenario.mustDetect,
    },
  };
}

export const AI_COMMAND_EVAL_ANY_PROVIDER_BOOKING_SEMANTIC_CASES: AiCommandEvalCase[] =
  ANY_PROVIDER_BOOKING_SEMANTIC_SCENARIOS.map(
    anyProviderBookingScenarioToEvalCase,
  );
