import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import type { ClinicBookingEvalScenario } from './ai-clinic-booking-multilingual.fixtures.js';
import { parseExplainClinicBookingFromPrompt } from './ai-clinic-booking.util.js';

export function clinicBookingMultilingualScenarioToEvalCase(
  scenario: ClinicBookingEvalScenario,
): AiCommandEvalCase {
  const parsed = parseExplainClinicBookingFromPrompt(scenario.prompt);
  const paramsPartial = {
    ...(scenario.paramsPartial ?? {}),
    ...(parsed?.aspect ? { aspect: parsed.aspect } : {}),
    ...(parsed?.serviceName ? { serviceName: parsed.serviceName } : {}),
  };

  return {
    id: `clinic-booking-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    surface: scenario.surface,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason ?? scenario.expectedAction,
      ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    },
    ...(scenario.needsMultilingual ? { requiresMultilingual: true } : {}),
  };
}
