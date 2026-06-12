import {
  BOOKING_FIRST_AVAILABLE_SEMANTIC_SCENARIOS,
  type BookingFirstAvailableSemanticScenario,
} from './booking-first-available.semantic.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function bookingFirstAvailableSemanticEvalCaseId(
  scenario: Pick<BookingFirstAvailableSemanticScenario, 'id'>,
): string {
  return `booking-first-available-semantic-${scenario.id}`;
}

export function bookingFirstAvailableScenarioToEvalCase(
  scenario: BookingFirstAvailableSemanticScenario,
): AiCommandEvalCase {
  return {
    id: bookingFirstAvailableSemanticEvalCaseId(scenario),
    prompt: scenario.prompt,
    surface: scenario.surface ?? 'dashboard',
    expect: {
      useBookingFirstAvailableSemanticDetect: true,
      bookingFirstAvailableSemantic: scenario.mustDetect,
    },
  };
}

export const AI_COMMAND_EVAL_BOOKING_FIRST_AVAILABLE_SEMANTIC_CASES: AiCommandEvalCase[] =
  BOOKING_FIRST_AVAILABLE_SEMANTIC_SCENARIOS.map(
    bookingFirstAvailableScenarioToEvalCase,
  );
