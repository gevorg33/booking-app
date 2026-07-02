import type { CommandSurface } from './ai-command-registry.types.js';
import {
  META_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS,
  META_PRODUCT_GUIDE_RESCUE_SCENARIOS,
} from './ai-meta-product-guide.fixtures.js';
import {
  EMPTY_STATE_GUIDE_CLASSIFIER_SCENARIOS,
  EMPTY_STATE_GUIDE_RESCUE_SCENARIOS,
} from './ai-product-guide-empty-state.fixtures.js';
import { AI_UNAVAILABLE_GUIDE_SCENARIOS } from './ai-product-guide-ai-unavailable.fixtures.js';
import {
  PRODUCT_GUIDE_CLASSIFIER_SCENARIOS,
  PRODUCT_GUIDE_HANDLER_SCENARIOS,
  PRODUCT_GUIDE_MISROUTE_SCENARIOS,
} from './ai-product-guide.fixtures.js';
import {
  ENRICH_GUIDE_TOPIC_SCENARIOS,
  PRODUCT_GUIDE_RESCUE_SCENARIOS,
} from './ai-product-guide-rescue.fixtures.js';
import {
  enrichGuideTopicFromPrompt,
  rescueProductGuideIntent,
} from './ai-product-guide-rescue.util.js';
import {
  MULTILINGUAL_PRODUCT_GUIDE_EVAL_SCENARIOS,
  type ProductGuideMultilingualEvalScenario,
} from './ai-product-guide-multilingual.eval.fixtures.js';
import {
  SIMILAR_APP_GUIDE_PROMPTS,
  TOP_APP_GUIDE_FLOWS,
} from './similar-app-guide-prompts.generated.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import { needsMultilingualNormalization } from './ai-prompt-i18n.js';

export function metaGuideRescueScenarioToEvalCase(
  scenario: (typeof META_PRODUCT_GUIDE_RESCUE_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `meta-guide-rescue-${scenario.id}`,
    prompt: scenario.samplePrompt,
    locale: 'en',
    surface: scenario.surface,
    expect: {
      useProductGuideRescue: true,
      rescueFromAction: scenario.fromActions?.[0] ?? 'unknown',
      rescuedAction: scenario.intent,
      rescueReason: 'meta_product_guide',
    },
  };
}

export function metaGuideClassifierScenarioToEvalCase(
  scenario: (typeof META_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `meta-guide-classifier-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    surface: scenario.surface,
    requiresLlm: true,
    expect: {
      action: scenario.intent,
    },
  };
}

export function emptyStateGuideRescueScenarioToEvalCase(
  scenario: (typeof EMPTY_STATE_GUIDE_RESCUE_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `empty-state-rescue-${scenario.id}`,
    prompt: scenario.samplePrompt,
    locale: 'en',
    surface: scenario.surface,
    expect: {
      useProductGuideRescue: true,
      rescueFromAction: scenario.fromActions?.[0] ?? 'unknown',
      rescuedAction: scenario.intent,
      rescueReason: 'empty_state_guide',
    },
  };
}

export function emptyStateGuideClassifierScenarioToEvalCase(
  scenario: (typeof EMPTY_STATE_GUIDE_CLASSIFIER_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `empty-state-classifier-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    surface: scenario.surface,
    requiresLlm: true,
    expect: {
      action: scenario.intent,
    },
  };
}

export function aiUnavailableGuideScenarioToEvalCase(
  scenario: (typeof AI_UNAVAILABLE_GUIDE_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `ai-unavailable-guide-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    surface: scenario.surface,
    expect: {
      guideEvalRoute: scenario.route,
      aiUnavailableReason: scenario.reason,
      aiUnavailableExpectGuide: scenario.expectGuide,
      aiUnavailableExpectNativeNavigate: scenario.expectNativeNavigate,
    },
  };
}

export function productGuideClassifierScenarioToEvalCase(
  scenario: (typeof PRODUCT_GUIDE_CLASSIFIER_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `product-guide-classifier-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    surface: 'dashboard',
    requiresLlm: true,
    expect: {
      action: scenario.expectedAction,
      ...(scenario.topicId
        ? { paramsPartial: { topicId: scenario.topicId } }
        : {}),
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
    requiresLlm: true,
    expect: {
      action: scenario.intent,
      ...(scenario.topicId
        ? { paramsPartial: { topicId: scenario.topicId } }
        : {}),
    },
  };
}

export function productGuideRescueScenarioToEvalCase(
  scenario: (typeof PRODUCT_GUIDE_RESCUE_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `product-guide-rescue-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    surface: scenario.surface,
    expect: {
      useProductGuideRescue: true,
      rescueFromAction: scenario.fromAction,
      rescuedAction: scenario.expectedAction,
      ...(scenario.expectedReason
        ? { rescueReason: scenario.expectedReason }
        : {}),
    },
  };
}

export function productGuideMisrouteScenarioToEvalCase(
  scenario: (typeof PRODUCT_GUIDE_MISROUTE_SCENARIOS)[number],
): AiCommandEvalCase {
  if (scenario.expectedAction == null) {
    return {
      id: `product-guide-misroute-keep-${scenario.id}`,
      prompt: scenario.prompt,
      locale: 'en',
      surface: scenario.surface ?? 'dashboard',
      expect: {
        useProductGuideRescue: true,
        rescueFromAction: scenario.classifiedAction,
        rescuedAction: scenario.classifiedAction,
      },
    };
  }
  return {
    id: `product-guide-misroute-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    surface: scenario.surface ?? 'dashboard',
    expect: {
      useProductGuideRescue: true,
      rescueFromAction: scenario.classifiedAction,
      rescuedAction: scenario.expectedAction,
      ...(scenario.expectedReason
        ? { rescueReason: scenario.expectedReason }
        : {}),
    },
  };
}

export function enrichGuideTopicScenarioToEvalCase(
  scenario: (typeof ENRICH_GUIDE_TOPIC_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `product-guide-enrich-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    surface: scenario.surface,
    expect: {
      useProductGuideTopicEnrich: true,
      ...(scenario.route ? { guideEvalRoute: scenario.route } : {}),
      ...(scenario.activationStep
        ? { guideEvalActivationStep: scenario.activationStep }
        : {}),
      paramsPartial: { topicId: scenario.expectedTopicId },
    },
  };
}

export function similarAppGuidePromptToEvalCase(
  row: (typeof SIMILAR_APP_GUIDE_PROMPTS)[number],
): AiCommandEvalCase {
  const rescued = rescueProductGuideIntent(row.prompt, 'unknown', {
    surface: row.surface,
  });
  const topicId = enrichGuideTopicFromPrompt(row.prompt, {
    surface: row.surface,
    topicId: row.topicId,
  });
  const base = {
    id: `product-guide-similar-${row.id}`,
    prompt: row.prompt,
    locale: 'en' as const,
    surface: row.surface,
  };
  if (rescued.action === 'unknown') {
    return {
      ...base,
      requiresLlm: true,
      expect: {
        action: 'guide_user_flow',
        paramsPartial: { topicId: topicId ?? row.topicId },
      },
    };
  }
  return {
    ...base,
    expect: {
      useProductGuideRescue: true,
      rescueFromAction: 'unknown',
      rescuedAction: rescued.action,
      useProductGuideTopicEnrich: true,
      paramsPartial: { topicId: topicId ?? row.topicId },
    },
  };
}

export function productGuideMultilingualScenarioToEvalCase(
  scenario: ProductGuideMultilingualEvalScenario,
): AiCommandEvalCase {
  return {
    id: `product-guide-i18n-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    surface: scenario.surface,
    expect: {
      useProductGuideRescue: true,
      rescueFromAction: scenario.rescueFromAction,
      rescuedAction: scenario.expectedAction,
      ...(scenario.expectedReason
        ? { rescueReason: scenario.expectedReason }
        : {}),
      ...(scenario.topicId
        ? {
            useProductGuideTopicEnrich: true,
            paramsPartial: { topicId: scenario.topicId },
            ...(scenario.route ? { guideEvalRoute: scenario.route } : {}),
            ...(scenario.activationStep
              ? { guideEvalActivationStep: scenario.activationStep }
              : {}),
          }
        : {}),
      needsMultilingual: needsMultilingualNormalization(scenario.prompt),
    },
  };
}

/** Dashboard classifier/handler LLM golden seeds (ai-guide-1.2.6). */
export const AI_COMMAND_EVAL_PRODUCT_GUIDE_DASHBOARD_LLM_CASES: AiCommandEvalCase[] =
  [
    ...PRODUCT_GUIDE_CLASSIFIER_SCENARIOS.map(
      productGuideClassifierScenarioToEvalCase,
    ),
    ...PRODUCT_GUIDE_HANDLER_SCENARIOS.map(
      productGuideHandlerScenarioToEvalCase,
    ),
  ];

/** Deterministic four-surface rescue/misroute/enrich eval (ai-guide-1.6.3 / 1.6.4). */
export const AI_COMMAND_EVAL_PRODUCT_GUIDE_RESCUE_CASES: AiCommandEvalCase[] = [
  ...PRODUCT_GUIDE_RESCUE_SCENARIOS.map(productGuideRescueScenarioToEvalCase),
  ...PRODUCT_GUIDE_MISROUTE_SCENARIOS.map(
    productGuideMisrouteScenarioToEvalCase,
  ),
  ...ENRICH_GUIDE_TOPIC_SCENARIOS.map(enrichGuideTopicScenarioToEvalCase),
];

/** EN v01 prompt per top flow — surface-tagged similar corpus eval (ai-guide-1.6.2 / 1.6.4). */
export const AI_COMMAND_EVAL_PRODUCT_GUIDE_SIMILAR_CASES: AiCommandEvalCase[] =
  TOP_APP_GUIDE_FLOWS.map((flow) => {
    const row = SIMILAR_APP_GUIDE_PROMPTS.find(
      (prompt) =>
        prompt.surface === flow.surface &&
        prompt.id === `${flow.surface}-${flow.id}-v01`,
    );
    if (!row) {
      throw new Error(
        `Missing v01 similar prompt for flow ${flow.id} on ${flow.surface}`,
      );
    }
    return similarAppGuidePromptToEvalCase(row);
  });

/** HY/RU product guide eval across dashboard, provider, customer, public (ai-guide-1.6.4). */
export const AI_COMMAND_EVAL_PRODUCT_GUIDE_MULTILINGUAL_CASES: AiCommandEvalCase[] =
  MULTILINGUAL_PRODUCT_GUIDE_EVAL_SCENARIOS.map(
    productGuideMultilingualScenarioToEvalCase,
  );

/** Full product guide eval catalog (ai-guide-1.6.4 + 1.8.7 meta guide + 1.8.9 empty state + 1.8.10 ai unavailable). */
export const AI_COMMAND_EVAL_PRODUCT_GUIDE_CASES: AiCommandEvalCase[] = [
  ...AI_COMMAND_EVAL_PRODUCT_GUIDE_DASHBOARD_LLM_CASES,
  ...AI_COMMAND_EVAL_PRODUCT_GUIDE_RESCUE_CASES,
  ...AI_COMMAND_EVAL_PRODUCT_GUIDE_SIMILAR_CASES,
  ...AI_COMMAND_EVAL_PRODUCT_GUIDE_MULTILINGUAL_CASES,
  ...META_PRODUCT_GUIDE_RESCUE_SCENARIOS.map(metaGuideRescueScenarioToEvalCase),
  ...META_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS.map(
    metaGuideClassifierScenarioToEvalCase,
  ),
  ...EMPTY_STATE_GUIDE_RESCUE_SCENARIOS.map(
    emptyStateGuideRescueScenarioToEvalCase,
  ),
  ...EMPTY_STATE_GUIDE_CLASSIFIER_SCENARIOS.map(
    emptyStateGuideClassifierScenarioToEvalCase,
  ),
  ...AI_UNAVAILABLE_GUIDE_SCENARIOS.map(aiUnavailableGuideScenarioToEvalCase),
];

export function listProductGuideEvalSurfaces(): CommandSurface[] {
  return ['dashboard', 'provider', 'customer', 'public'];
}
