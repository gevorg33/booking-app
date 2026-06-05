import { CommandComplexityRouterService } from '../command-complexity-router.service.js';
import { IntentDecompositionService } from '../intent-decomposition.service.js';
import { AiIntentRescueService } from '../ai-intent-rescue.service.js';
import { needsMultilingualNormalization } from '../ai-prompt-i18n.js';
import {
  resolveRescheduleParams,
  extractRescheduleTargetTime,
  extractRescheduleSourceTime,
} from '../ai-intent-heuristics.js';
import type {
  AiCommandEvalCase,
  AiEvalCaseResult,
} from './ai-command-eval.types.js';

const COMPOUND_MARKERS =
  /\band then\b|\bthen\b|\balso\b|\bafter that\b|\bfollowed by\b|;\s*|(?:,\s*(?:and\s+)?(?:cleanup|clear|hide|cancel|wipe|remove|book|apply|block|fill|reschedule))|(?:\.\s+(?:clear|cancel|hide|apply|block|fill|book|reschedule|unhide|notify))\b/i;

const decomposition = {
  isCompoundPrompt: (p: string) => {
    const trimmed = p.trim();
    return trimmed.length >= 12 && COMPOUND_MARKERS.test(trimmed);
  },
} as IntentDecompositionService;

const router = new CommandComplexityRouterService(decomposition);
const rescue = new AiIntentRescueService();

const SAMPLE_EMPLOYEES = [
  { id: 'emp-1', name: 'Gevorg Gasparyan' },
  { id: 'emp-2', name: 'Mary Torgomyan' },
  { id: 'emp-3', name: 'Maria Lopez' },
];

function paramsMatchPartial(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) {
      errors.push(`params.${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(actual[key])}`);
    }
  }
  return errors;
}

/** Evaluate one golden case using deterministic routing/parsing only. */
export function evaluateDeterministicEvalCase(
  evalCase: AiCommandEvalCase,
  timeZone = 'UTC',
): AiEvalCaseResult {
  const errors: string[] = [];
  const { expect } = evalCase;
  const prompt = evalCase.prompt;

  if (expect.needsMultilingual !== undefined) {
    const actual = needsMultilingualNormalization(prompt);
    if (actual !== expect.needsMultilingual) {
      errors.push(`needsMultilingual: expected ${expect.needsMultilingual}, got ${actual}`);
    }
  }

  if (expect.routeTier) {
    const route = router.routeDeterministic(prompt, SAMPLE_EMPLOYEES);
    if (route.tier !== expect.routeTier) {
      errors.push(`routeTier: expected ${expect.routeTier}, got ${route.tier}`);
    }
  }

  if (expect.rescheduleTimeSlot || expect.rescheduleFromTimeSlot || expect.paramsPartial) {
    const params: Record<string, unknown> = {};
    resolveRescheduleParams(params, prompt, timeZone);
    if (expect.rescheduleTimeSlot) {
      const parsed =
        (params.timeSlot as string | undefined) ?? extractRescheduleTargetTime(prompt);
      if (parsed !== expect.rescheduleTimeSlot) {
        errors.push(
          `rescheduleTimeSlot: expected ${expect.rescheduleTimeSlot}, got ${parsed ?? 'null'}`,
        );
      }
    }
    if (expect.rescheduleFromTimeSlot) {
      const parsed =
        (params.fromTimeSlot as string | undefined) ?? extractRescheduleSourceTime(prompt);
      if (parsed !== expect.rescheduleFromTimeSlot) {
        errors.push(
          `rescheduleFromTimeSlot: expected ${expect.rescheduleFromTimeSlot}, got ${parsed ?? 'null'}`,
        );
      }
    }
    if (expect.paramsPartial) {
      errors.push(...paramsMatchPartial(params, expect.paramsPartial));
    }
  }

  if (expect.rescuedAction) {
    const rescued = rescue.rescue({
      prompt,
      action: 'unknown',
      params: {},
      employees: SAMPLE_EMPLOYEES,
    });
    if (!rescued?.rescued || rescued.action !== expect.rescuedAction) {
      errors.push(
        `rescuedAction: expected ${expect.rescuedAction}, got ${rescued?.action ?? 'none'}`,
      );
    }
  }

  if (expect.action && !expect.rescuedAction) {
    errors.push('action expectation requires requiresLlm or rescuedAction in deterministic eval');
  }

  return {
    id: evalCase.id,
    passed: errors.length === 0,
    errors,
  };
}

export function runDeterministicEvalSuite(
  cases: AiCommandEvalCase[],
  timeZone = 'UTC',
): { passed: number; failed: number; results: AiEvalCaseResult[] } {
  const ciCases = cases.filter((c) => !c.requiresLlm);
  const results = ciCases.map((c) => evaluateDeterministicEvalCase(c, timeZone));
  const failed = results.filter((r) => !r.passed).length;
  return {
    passed: results.length - failed,
    failed,
    results,
  };
}
