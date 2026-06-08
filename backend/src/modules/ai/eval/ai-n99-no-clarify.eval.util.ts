import {
  N99_NO_CLARIFY_AUTOFILL_SCENARIOS,
  N99_NO_CLARIFY_GUARDRAIL_SCENARIOS,
  N99_NO_CLARIFY_OVER_ASK_SCENARIOS,
} from '../ai-n99-no-clarify-completion.fixtures.js';
import {
  N99_AUTOFILL_SCENARIOS,
} from '../ai-n99-autofill.fixtures.js';
import {
  N99_SCREEN_GROUNDING_SCENARIOS,
  N99_SCREEN_GROUNDING_TRIM_SCENARIOS,
} from '../ai-n99-screen-grounding.fixtures.js';
import {
  N99_PHRASING_MEMORY_SCENARIOS,
  N99_PHRASING_MEMORY_TRIM_SCENARIOS,
} from '../ai-n99-phrasing-memory.fixtures.js';
import { n99OverAskScenarioToEvalCase } from './ai-n99-over-ask.eval.util.js';
import type { AiCommandEvalCase } from './ai-command-eval.types.js';

function localeFromScenarioId(id: string): 'en' | 'hy' | 'ru' {
  if (id.includes('-hy-') || id.startsWith('hy-')) return 'hy';
  if (id.includes('-ru-') || id.startsWith('ru-')) return 'ru';
  return 'en';
}

function autofillBlockReason(
  scenario: (typeof N99_AUTOFILL_SCENARIOS)[number],
): string | undefined {
  if (!('expectBlocked' in scenario) || !scenario.expectBlocked) return undefined;
  if (scenario.id === 'en-reject-high-risk-autofill') return 'destructive_scope_unconfirmed';
  if (scenario.id === 'en-reject-low-action-confidence') return 'low_action_confidence';
  return undefined;
}

export function n99AutofillScenarioToEvalCase(
  scenario: (typeof N99_AUTOFILL_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `n99-autofill-${scenario.id}`,
    prompt: scenario.prompt,
    locale: localeFromScenarioId(scenario.id),
    surface: scenario.surface,
    domain: 'schedule',
    corpus: 'no_clarify',
    difficulty: 'medium',
    expect: {
      noClarifyCompletion: {
        action: scenario.action,
        paramsPartial: scenario.params,
        sessionContext: 'sessionContext' in scenario ? scenario.sessionContext : undefined,
        screenContext:
          'screenContext' in scenario
            ? (scenario.screenContext as Record<string, unknown>)
            : undefined,
        entityMemory: 'entityMemory' in scenario ? scenario.entityMemory : undefined,
        businessDefaults:
          'businessDefaults' in scenario ? scenario.businessDefaults : undefined,
        catalogServices:
          'catalogServices' in scenario && scenario.catalogServices
            ? [...scenario.catalogServices]
            : undefined,
        actionConfidence: scenario.actionConfidence,
        expectFilled: 'expectFilled' in scenario ? scenario.expectFilled : {},
        expectBlocked: 'expectBlocked' in scenario ? scenario.expectBlocked : false,
        expectBlockReason: autofillBlockReason(scenario),
      },
    },
  };
}

export function n99NoClarifyAutofillScenarioToEvalCase(
  scenario: (typeof N99_NO_CLARIFY_AUTOFILL_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `n99-no-clarify-${scenario.id}`,
    prompt: scenario.prompt,
    locale: localeFromScenarioId(scenario.id),
    surface: 'dashboard',
    domain: 'schedule',
    corpus: 'no_clarify',
    difficulty: 'medium',
    expect: {
      noClarifyCompletion: {
        action: scenario.action,
        paramsPartial: scenario.params,
        sessionContext: 'sessionContext' in scenario ? scenario.sessionContext : undefined,
        screenContext:
          'screenContext' in scenario
            ? (scenario.screenContext as Record<string, unknown>)
            : undefined,
        entityMemory: 'entityMemory' in scenario ? scenario.entityMemory : undefined,
        expectFilled: scenario.expectFilled,
        expectBlocked: false,
      },
    },
  };
}

export function n99NoClarifyGuardrailScenarioToEvalCase(
  scenario: (typeof N99_NO_CLARIFY_GUARDRAIL_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `n99-no-clarify-guard-${scenario.id}`,
    prompt: scenario.prompt,
    locale: localeFromScenarioId(scenario.id),
    surface: 'dashboard',
    domain: 'schedule',
    corpus: 'no_clarify',
    difficulty: 'ambiguity',
    expect: {
      noClarifyCompletion: {
        action: scenario.action,
        paramsPartial: scenario.params,
        actionConfidence: scenario.actionConfidence,
        sessionContext: scenario.sessionContext,
        expectBlocked: scenario.expectBlocked,
        expectBlockReason: scenario.expectBlockReason,
      },
    },
  };
}

export function n99NoClarifyOverAskScenarioToEvalCase(
  scenario: (typeof N99_NO_CLARIFY_OVER_ASK_SCENARIOS)[number],
): AiCommandEvalCase {
  return n99OverAskScenarioToEvalCase(scenario);
}

export function n99ScreenGroundingScenarioToEvalCase(
  scenario: (typeof N99_SCREEN_GROUNDING_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `n99-screen-${scenario.id}`,
    prompt: scenario.prompt,
    locale: localeFromScenarioId(scenario.id),
    surface: scenario.surface,
    domain: 'schedule',
    corpus: 'no_clarify',
    difficulty: 'medium',
    expect: {
      noClarifyCompletion: {
        action: scenario.action,
        paramsPartial: scenario.params,
        screenContext: scenario.screenContext,
        expectFilled: scenario.expectFilled,
        expectBlocked: false,
      },
    },
  };
}

export function n99ScreenGroundingTrimScenarioToEvalCase(
  scenario: (typeof N99_SCREEN_GROUNDING_TRIM_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `n99-screen-trim-${scenario.id}`,
    prompt: 'fill from screen',
    locale: 'en',
    surface: 'dashboard',
    domain: 'schedule',
    corpus: 'no_clarify',
    difficulty: 'easy',
    expect: {
      noClarifyCompletion: {
        action: scenario.action,
        paramsPartial: scenario.params,
        screenContext: scenario.screenContext,
        validationIssues: [...scenario.issues],
        expectTrimmedFields: [...scenario.expectTrimmedFields],
      },
    },
  };
}

export function n99PhrasingMemoryScenarioToEvalCase(
  scenario: (typeof N99_PHRASING_MEMORY_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `n99-phrasing-${scenario.id}`,
    prompt: scenario.prompt,
    locale: localeFromScenarioId(scenario.id),
    surface: scenario.surface,
    domain: 'schedule',
    corpus: 'no_clarify',
    difficulty: 'medium',
    expect: {
      noClarifyCompletion: {
        action: scenario.action,
        paramsPartial: scenario.params,
        entityMemory: scenario.entityMemory,
        actionConfidence:
          'actionConfidence' in scenario ? scenario.actionConfidence : undefined,
        expectFilled: 'expectFilled' in scenario ? scenario.expectFilled : undefined,
        expectAction: 'expectAction' in scenario ? scenario.expectAction : undefined,
        expectBlocked: false,
      },
    },
  };
}

export function n99PhrasingMemoryTrimScenarioToEvalCase(
  scenario: (typeof N99_PHRASING_MEMORY_TRIM_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `n99-phrasing-trim-${scenario.id}`,
    prompt: scenario.prompt,
    locale: 'en',
    surface: 'dashboard',
    domain: 'schedule',
    corpus: 'no_clarify',
    difficulty: 'easy',
    expect: {
      noClarifyCompletion: {
        action: scenario.action,
        paramsPartial: scenario.params,
        entityMemory: scenario.entityMemory,
        validationIssues: [...scenario.issues],
        expectTrimmedFields: [...scenario.expectTrimmedFields],
      },
    },
  };
}

export const AI_COMMAND_EVAL_N99_NO_CLARIFY_CASES: AiCommandEvalCase[] = [
  ...N99_AUTOFILL_SCENARIOS.map(n99AutofillScenarioToEvalCase),
  ...N99_NO_CLARIFY_AUTOFILL_SCENARIOS.map(n99NoClarifyAutofillScenarioToEvalCase),
  ...N99_SCREEN_GROUNDING_SCENARIOS.map(n99ScreenGroundingScenarioToEvalCase),
  ...N99_SCREEN_GROUNDING_TRIM_SCENARIOS.map(n99ScreenGroundingTrimScenarioToEvalCase),
  ...N99_PHRASING_MEMORY_SCENARIOS.map(n99PhrasingMemoryScenarioToEvalCase),
  ...N99_PHRASING_MEMORY_TRIM_SCENARIOS.map(n99PhrasingMemoryTrimScenarioToEvalCase),
  ...N99_NO_CLARIFY_GUARDRAIL_SCENARIOS.map(n99NoClarifyGuardrailScenarioToEvalCase),
  ...N99_NO_CLARIFY_OVER_ASK_SCENARIOS.map(n99NoClarifyOverAskScenarioToEvalCase),
];

export const AI_COMMAND_EVAL_NO_CLARIFY_CASES = AI_COMMAND_EVAL_N99_NO_CLARIFY_CASES;
