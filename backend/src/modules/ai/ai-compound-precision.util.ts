import { isTeamWideProviderAvailabilityQuery } from './ai-intent-heuristics.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type { AiCommandEvalCase } from './eval/ai-command-eval.types.js';
import type { CompoundDecompositionResult } from './intent-decomposition.types.js';
import {
  ACC_COMPOUND_PRECISION_MIN_FALSE_GUARD_CASES,
  ACC_COMPOUND_PRECISION_MIN_TRUE_GUARD_CASES,
  FALSE_COMPOUND_GUARD_SCENARIOS,
  TRUE_COMPOUND_GUARD_SCENARIOS,
  type FalseCompoundGuardScenario,
  type TrueCompoundGuardScenario,
} from './ai-compound-precision.fixtures.js';

/** Explicit multi-step connectors — absence suggests a single-intent "and". */
export const COMPOUND_ESCALATION_MARKERS =
  /\b(then|also|after that|and then|followed by|plus)\b|;\s*(?=(?:book|list|show|cancel|mark|pay|create|configure|export|summarize|notify|tag|fill|check|apply)\b)/i;

const COMPOUND_ACTION_AFTER_AND =
  /\s+(?:and|plus|և|и|плюс)\s+(?=(?:book|list|show|cancel|mark|pay|create|configure|track|add|remove|apply|notify|promo|fill|check|discover|use|get|find|explain|buy|choose|validate|export|summarize|trigger|switch|download|tag|coordinate|send|tell|alert|message|order|place|schedule|reserve|release)\b)/i;

/** acc-3.9 — date/time ranges that use "and" but are not multi-intent. */
export function isDateTimeRangeConjunction(prompt: string): boolean {
  return (
    /\bbetween\b.+\band\b/i.test(prompt) ||
    /\bfrom\b.+\band\b.+\b(to|until)\b/i.test(prompt) ||
    /\b\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\b/.test(prompt) ||
    /\b\d{1,2}:\d{2}\s+and\s+\d{1,2}:\d{2}\b/i.test(prompt)
  );
}

/** acc-3.9 — one booking with multiple services joined by "and". */
export function isMultiServiceSingleBookingConjunction(prompt: string): boolean {
  if (COMPOUND_ESCALATION_MARKERS.test(prompt)) return false;
  if (!/\b(book|schedule|reserve)\b/i.test(prompt)) return false;
  if (COMPOUND_ACTION_AFTER_AND.test(prompt)) return false;
  return (
    /\b(haircut|massage|facial|manicure|pedicure|beard|trim|color|treatment|service|facemassage)\s+and\s+(haircut|massage|facial|manicure|pedicure|beard|trim|color|treatment|service|facemassage|beard trim)/i.test(
      prompt,
    ) ||
    /\b(book|schedule|reserve)\b.+\band\b.+\b(trim|cut|massage|facial|beard|mani|pedi|lash|service|treatment)\b/i.test(
      prompt,
    )
  );
}

/** acc-3.9 — read/list for two named entities in one query. */
export function isDualEntityReadConjunction(prompt: string): boolean {
  if (COMPOUND_ESCALATION_MARKERS.test(prompt)) return false;
  if (COMPOUND_ACTION_AFTER_AND.test(prompt)) return false;
  if (!/\b(show|list|display|view)\b/i.test(prompt)) return false;
  return (
    /\b(show|list|display|view)\b.+\b(for|of)\b.+\band\b/i.test(prompt) ||
    /\b(appointments?|bookings?)\b.+\b(for|of)\b.+\band\b/i.test(prompt)
  );
}

/** acc-3.9 — availability wording with "and" but no second mutating step. */
export function isAvailabilityConjunctionSingleIntent(prompt: string): boolean {
  if (!/\band\b/i.test(prompt)) return false;
  if (COMPOUND_ESCALATION_MARKERS.test(prompt)) return false;
  if (COMPOUND_ACTION_AFTER_AND.test(prompt)) return false;
  return (
    isTeamWideProviderAvailabilityQuery(prompt) ||
    /\bwho\b.+\band\b.+\bwho\b/i.test(prompt)
  );
}

/** acc-3.9 — conditional fallback chains are orchestration, not compound split. */
export function isOrchestrationFallbackPrompt(prompt: string): boolean {
  return (
    (/\bif\b/i.test(prompt) &&
      /\b(not available|unavailable|busy|no slot|no time|can't|cannot)\b/i.test(
        prompt,
      ) &&
      /\b(then|,|otherwise|else)\b/i.test(prompt)) ||
    (/\b(otherwise|else)\b/i.test(prompt) && /\b(book|schedule|reserve)\b/i.test(prompt))
  );
}

function inferFalseCompoundReason(prompt: string): FalseCompoundGuardScenario['reason'] | null {
  if (isAvailabilityConjunctionSingleIntent(prompt)) {
    return 'availability_conjunction';
  }
  if (isDateTimeRangeConjunction(prompt)) return 'datetime_range';
  if (isMultiServiceSingleBookingConjunction(prompt)) {
    return 'multi_service_booking';
  }
  if (isDualEntityReadConjunction(prompt)) return 'dual_entity_read';
  if (isOrchestrationFallbackPrompt(prompt)) return 'orchestration_fallback';
  return null;
}

/** acc-3.9 — guard against false compound on single-intent prompts. */
export function shouldSuppressFalseCompound(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (!/\band\b/i.test(trimmed) && !/[;,]/.test(trimmed)) {
    return false;
  }
  return inferFalseCompoundReason(trimmed) != null;
}

export function matchesCompoundActionConnector(prompt: string): boolean {
  return COMPOUND_ACTION_AFTER_AND.test(prompt);
}

export interface CompoundPrecisionReport {
  falseGuardCases: number;
  falseGuardPassed: number;
  trueGuardCases: number;
  trueGuardPassed: number;
  ambiguityCompoundExpectEmpty: number;
  ambiguityFalseCompounds: number;
  passed: boolean;
}

export function assessAmbiguityCorpusCompoundPrecision(
  cases: AiCommandEvalCase[],
  decomposeFn: (
    surface: CommandSurface,
    prompt: string,
  ) => CompoundDecompositionResult | null,
): Pick<
  CompoundPrecisionReport,
  'ambiguityCompoundExpectEmpty' | 'ambiguityFalseCompounds' | 'passed'
> {
  const flagged = cases.filter((entry) => entry.expect.compoundExpectEmpty);
  let ambiguityFalseCompounds = 0;

  for (const evalCase of flagged) {
    const surface =
      evalCase.expect.compoundSurface ?? evalCase.surface ?? 'dashboard';
    const result = decomposeFn(surface, evalCase.prompt);
    if (result && result.steps.length >= 2) {
      ambiguityFalseCompounds += 1;
    }
  }

  return {
    ambiguityCompoundExpectEmpty: flagged.length,
    ambiguityFalseCompounds,
    passed: ambiguityFalseCompounds === 0,
  };
}

export function evaluateFalseCompoundGuardScenario(
  scenario: FalseCompoundGuardScenario,
  decomposeFn: (
    surface: CommandSurface,
    prompt: string,
  ) => CompoundDecompositionResult | null,
  isCompoundFn: (prompt: string) => boolean,
): boolean {
  const surface = scenario.surface ?? 'dashboard';
  if (isCompoundFn(scenario.prompt)) return false;
  const result = decomposeFn(surface, scenario.prompt);
  return !result || result.steps.length < 2;
}

export function evaluateTrueCompoundGuardScenario(
  scenario: TrueCompoundGuardScenario,
  decomposeFn: (
    surface: CommandSurface,
    prompt: string,
  ) => CompoundDecompositionResult | null,
  isCompoundFn: (prompt: string) => boolean,
): boolean {
  if (!isCompoundFn(scenario.prompt)) return false;
  const result = decomposeFn(scenario.surface, scenario.prompt);
  if (!result || result.steps.length < (scenario.minSteps ?? 2)) return false;
  if (scenario.orderedActions) {
    return (
      result.steps.map((step) => step.action).join(',') ===
      scenario.orderedActions.join(',')
    );
  }
  return true;
}

export function buildCompoundPrecisionReport(
  decomposeFn: (
    surface: CommandSurface,
    prompt: string,
  ) => CompoundDecompositionResult | null,
  isCompoundFn: (prompt: string) => boolean,
  ambiguityCases: AiCommandEvalCase[] = [],
): CompoundPrecisionReport {
  let falseGuardPassed = 0;
  for (const scenario of FALSE_COMPOUND_GUARD_SCENARIOS) {
    if (evaluateFalseCompoundGuardScenario(scenario, decomposeFn, isCompoundFn)) {
      falseGuardPassed += 1;
    }
  }

  let trueGuardPassed = 0;
  for (const scenario of TRUE_COMPOUND_GUARD_SCENARIOS) {
    if (evaluateTrueCompoundGuardScenario(scenario, decomposeFn, isCompoundFn)) {
      trueGuardPassed += 1;
    }
  }

  const ambiguity = assessAmbiguityCorpusCompoundPrecision(
    ambiguityCases,
    decomposeFn,
  );

  const passed =
    falseGuardPassed >= ACC_COMPOUND_PRECISION_MIN_FALSE_GUARD_CASES &&
    trueGuardPassed >= ACC_COMPOUND_PRECISION_MIN_TRUE_GUARD_CASES &&
    ambiguity.passed;

  return {
    falseGuardCases: FALSE_COMPOUND_GUARD_SCENARIOS.length,
    falseGuardPassed,
    trueGuardCases: TRUE_COMPOUND_GUARD_SCENARIOS.length,
    trueGuardPassed,
    ...ambiguity,
    passed,
  };
}
