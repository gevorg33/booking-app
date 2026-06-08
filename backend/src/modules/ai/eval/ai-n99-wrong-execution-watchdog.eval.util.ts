import {
  N99_AUTOFILL_PREVIEW_SCENARIOS,
  N99_AUTOFILL_WATCHDOG_SCENARIOS,
} from '../ai-n99-wrong-execution-watchdog.fixtures.js';
import type { AiCommandEvalCase } from './ai-command-eval.types.js';

function localeFromScenarioId(id: string): 'en' | 'hy' | 'ru' {
  if (id.includes('-hy-') || id.startsWith('hy-')) return 'hy';
  if (id.includes('-ru-') || id.startsWith('ru-')) return 'ru';
  return 'en';
}

export function n99AutofillWatchdogScenarioToEvalCase(
  scenario: (typeof N99_AUTOFILL_WATCHDOG_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `n99-watchdog-${scenario.id}`,
    prompt: 'auto-fill watchdog threshold',
    locale: localeFromScenarioId(scenario.id),
    surface: 'dashboard',
    domain: 'schedule',
    corpus: 'no_clarify',
    difficulty: 'medium',
    expect: {
      autofillWatchdog: {
        autoFillTraceCount: scenario.autoFillTraceCount,
        autoFillUndoCount: scenario.autoFillUndoCount,
        autoFillDownvoteCount: scenario.autoFillDownvoteCount,
        baseThreshold: scenario.baseThreshold,
        expectAdjustedThreshold: scenario.expectAdjustedThreshold,
        expectReason: scenario.expectReason,
      },
    },
  };
}

export function n99AutofillPreviewScenarioToEvalCase(
  scenario: (typeof N99_AUTOFILL_PREVIEW_SCENARIOS)[number],
): AiCommandEvalCase {
  return {
    id: `n99-watchdog-preview-${scenario.id}`,
    prompt: 'auto-fill execution preview',
    locale: localeFromScenarioId(scenario.id),
    surface: scenario.surface ?? 'dashboard',
    domain: 'schedule',
    corpus: 'no_clarify',
    difficulty: 'easy',
    expect: {
      autofillWatchdog: {
        previewParams: scenario.params,
        previewAction: scenario.action,
        taskId: scenario.taskId,
        expectPreviewFields: [...scenario.expectPreviewFields],
        expectOneTapUndo: scenario.expectOneTapUndo,
        expectPostExecAssertion: scenario.expectPostExecAssertion,
      },
    },
  };
}

export const AI_COMMAND_EVAL_N99_WRONG_EXECUTION_WATCHDOG_CASES: AiCommandEvalCase[] = [
  ...N99_AUTOFILL_WATCHDOG_SCENARIOS.map(n99AutofillWatchdogScenarioToEvalCase),
  ...N99_AUTOFILL_PREVIEW_SCENARIOS.map(n99AutofillPreviewScenarioToEvalCase),
];
