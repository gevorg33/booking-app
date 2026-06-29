import {
  PRODUCT_GUIDE_CLASSIFIER_SCENARIOS,
  PRODUCT_GUIDE_HANDLER_SCENARIOS,
} from './ai-product-guide.fixtures.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';

export function productGuideClassifierScenarioToEvalCase(
  scenario: (typeof PRODUCT_GUIDE_CLASSIFIER_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `product-guide-classifier-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    surface: 'dashboard',
    expect: {
      action: scenario.expectedAction,
      ...(scenario.topicId ? { paramsPartial: { topicId: scenario.topicId } } : {}),
    },
  };
}

export function productGuideHandlerScenarioToEvalCase(
  scenario: (typeof PRODUCT_GUIDE_HANDLER_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `product-guide-handler-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    surface: 'dashboard',
    expect: {
      action: scenario.intent,
      ...(scenario.topicId ? { paramsPartial: { topicId: scenario.topicId } } : {}),
    },
  };
}

/** Dashboard product guide eval seeds (ai-guide-1.2.6). */
export const AI_COMMAND_EVAL_PRODUCT_GUIDE_CASES: AiCommandEvalCase[] = [
  ...PRODUCT_GUIDE_CLASSIFIER_SCENARIOS.map(productGuideClassifierScenarioToEvalCase),
  ...PRODUCT_GUIDE_HANDLER_SCENARIOS.map(productGuideHandlerScenarioToEvalCase),
];
