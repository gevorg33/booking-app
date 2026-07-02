import {
  SERVICE_ONLINE_PAYMENT_MULTILINGUAL_SCENARIOS,
  type ServiceOnlinePaymentMultilingualScenario,
} from './ai-service-online-payment-multilingual.fixtures.js';
import { serviceOnlinePaymentMultilingualEvalCaseId } from './ai-service-online-payment-locale-parity.util.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function serviceOnlinePaymentMultilingualScenarioToEvalCase(
  scenario: ServiceOnlinePaymentMultilingualScenario,
): AiCommandEvalCase {
  return {
    id: serviceOnlinePaymentMultilingualEvalCaseId(scenario.id),
    prompt: scenario.prompt,
    surface: 'dashboard',
    locale: scenario.locale,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      needsMultilingual: true,
      ...(scenario.paramsPartial
        ? { paramsPartial: scenario.paramsPartial }
        : {}),
    },
  };
}

export const AI_COMMAND_EVAL_SERVICE_ONLINE_PAYMENT_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  SERVICE_ONLINE_PAYMENT_MULTILINGUAL_SCENARIOS.map(
    serviceOnlinePaymentMultilingualScenarioToEvalCase,
  );
