import {
  readClarifyMemory,
  recordClarifyAnswerInSession,
} from './ai-clarify-answer-reuse.util.js';
import { getClarifyRound } from './ai-smart-clarify.util.js';
import {
  isClarifyFollowUpTurn,
  mergeLosslessClarifyFollowUp,
} from './ai-lossless-clarify-merge.util.js';
import { mergeCrossTurnClarifyParams } from './ai-clarify-cross-turn-merge.util.js';
import type { CommandResult } from './command-completion.types.js';
import type { DecomposedIntentStep } from './intent-decomposition.types.js';
import {
  MID_PLAN_CLARIFY_PROBE_SCENARIOS,
  MID_PLAN_CLARIFY_SESSION_KEY,
  type MidPlanClarifyProbeScenario,
} from './ai-mid-plan-clarify.fixtures.js';

export {
  MID_PLAN_CLARIFY_PROBE_SCENARIOS,
  MID_PLAN_CLARIFY_SESSION_KEY,
  type MidPlanClarifyProbeScenario,
} from './ai-mid-plan-clarify.fixtures.js';

export type MidPlanParentAction = 'goal_execution' | 'compound_intent';

export interface MidPlanClarifyStep {
  action: string;
  params: Record<string, unknown>;
  reasoning: string;
  segment?: string;
}

export interface MidPlanClarifyState {
  parentAction: MidPlanParentAction;
  originalPrompt: string;
  steps: MidPlanClarifyStep[];
  currentStepIndex: number;
  validatedThroughIndex: number;
  goalDetails?: Record<string, unknown>;
  clarifyRound: number;
}

export interface MidPlanClarifyResumeResult {
  steps: MidPlanClarifyStep[];
  originalPrompt: string;
  parentAction: MidPlanParentAction;
  goalDetails?: Record<string, unknown>;
  readyToResume: boolean;
  mergedStepIndex: number;
}

export interface MidPlanClarifyStatus {
  complete: boolean;
  errors: string[];
  probesChecked: number;
}

export function toMidPlanClarifySteps(
  steps: readonly DecomposedIntentStep[],
): MidPlanClarifyStep[] {
  return steps.map((step) => ({
    action: step.action,
    params: { ...step.params },
    reasoning: step.reasoning,
    segment: step.segment,
  }));
}

export function buildMidPlanClarifyState(input: {
  parentAction: MidPlanParentAction;
  originalPrompt: string;
  steps: readonly DecomposedIntentStep[] | readonly MidPlanClarifyStep[];
  currentStepIndex: number;
  pausedParams?: Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
  goalDetails?: Record<string, unknown>;
}): MidPlanClarifyState {
  const steps = input.steps.map((step) => ({
    action: step.action,
    params: { ...step.params },
    reasoning: step.reasoning,
    segment: step.segment,
  }));
  if (input.pausedParams && steps[input.currentStepIndex]) {
    steps[input.currentStepIndex] = {
      ...steps[input.currentStepIndex],
      params: {
        ...steps[input.currentStepIndex].params,
        ...input.pausedParams,
      },
    };
  }
  return {
    parentAction: input.parentAction,
    originalPrompt: input.originalPrompt,
    steps,
    currentStepIndex: input.currentStepIndex,
    validatedThroughIndex: Math.max(-1, input.currentStepIndex - 1),
    goalDetails: input.goalDetails,
    clarifyRound: getClarifyRound(input.sessionContext) + 1,
  };
}

export function readMidPlanClarifyState(
  sessionContext?: Record<string, unknown>,
): MidPlanClarifyState | undefined {
  const raw = sessionContext?.[MID_PLAN_CLARIFY_SESSION_KEY];
  if (!raw || typeof raw !== 'object') return undefined;
  return raw as MidPlanClarifyState;
}

/** parity-3.3 — resume a paused multi-step plan after acc-4 clarify. */
export function isMidPlanClarifyResumeTurn(
  sessionContext?: Record<string, unknown>,
): boolean {
  return (
    readMidPlanClarifyState(sessionContext) != null &&
    isClarifyFollowUpTurn(sessionContext)
  );
}

export function buildMidPlanClarifyContext(
  state: MidPlanClarifyState,
): Record<string, unknown> {
  const paused = state.steps[state.currentStepIndex];
  return {
    originalPrompt: state.originalPrompt,
    originalAction: paused?.action ?? 'unknown',
    partialParams: { ...(paused?.params ?? {}) },
    clarifyRound: state.clarifyRound,
    clarifyKind: 'mid_plan_targeted_slots',
  };
}

/** parity-3.3 — attach acc-4 clarify payload + preserved plan steps to session. */
export function wrapCompoundStepClarifyForMidPlan(
  clarify: CommandResult,
  input: {
    parentAction: MidPlanParentAction;
    originalPrompt: string;
    steps: readonly DecomposedIntentStep[] | readonly MidPlanClarifyStep[];
    currentStepIndex: number;
    pausedParams?: Record<string, unknown>;
    sessionContext?: Record<string, unknown>;
    goalDetails?: Record<string, unknown>;
  },
): CommandResult {
  const state = buildMidPlanClarifyState(input);
  const clarifyContext = buildMidPlanClarifyContext(state);
  const paused = state.steps[state.currentStepIndex];
  const sessionContext = {
    ...(input.sessionContext ?? {}),
    [MID_PLAN_CLARIFY_SESSION_KEY]: state,
    _clarifyContext: clarifyContext,
  };

  return {
    ...clarify,
    action: input.parentAction,
    summary: `Step ${state.currentStepIndex + 1} of ${state.steps.length} (${paused?.action.replace(/_/g, ' ') ?? 'step'}) needs one detail before continuing: ${clarify.summary}`,
    details: {
      ...clarify.details,
      midPlanClarify: true,
      midPlanStepIndex: state.currentStepIndex,
      midPlanStepAction: paused?.action,
      midPlanTotalSteps: state.steps.length,
      preservedStepActions: state.steps.map((step) => step.action),
      validatedThroughIndex: state.validatedThroughIndex,
      clarifyKind: 'mid_plan_targeted_slots',
      clarifySource: clarify.details.clarifySource ?? 'targeted_slots',
      clarifyRound: state.clarifyRound,
      clarifyContext,
      partialParams: paused?.params ?? {},
      compoundStep: paused?.action,
      goalExecution: input.goalDetails?.goalExecution === true,
      unifiedPreview: input.goalDetails?.unifiedPreview === true,
      sessionContext,
      ...(input.goalDetails ?? {}),
    },
  };
}

export function mergeMidPlanClarifyResume(input: {
  state: MidPlanClarifyState;
  followUpPrompt: string;
  sessionContext?: Record<string, unknown>;
}): MidPlanClarifyResumeResult {
  const paused = input.state.steps[input.state.currentStepIndex];
  const seededSession = {
    ...(input.sessionContext ?? {}),
    [MID_PLAN_CLARIFY_SESSION_KEY]: input.state,
    _clarifyContext: buildMidPlanClarifyContext(input.state),
  };

  const lossless = mergeLosslessClarifyFollowUp({
    followUpPrompt: input.followUpPrompt,
    followUpAnswers: readClarifyMemory(seededSession),
    sessionContext: seededSession,
    surface: 'dashboard',
    classifierAction: paused?.action ?? 'unknown',
    classifierParams: { ...(paused?.params ?? {}) },
  });

  const steps = input.state.steps.map((step) => ({
    ...step,
    params: { ...step.params },
  }));
  const mergedParams = mergeCrossTurnClarifyParams(
    {
      ...(paused?.params ?? {}),
      ...lossless.mergedParams,
    },
    lossless.sessionContext,
    { surface: 'dashboard' },
  );

  steps[input.state.currentStepIndex] = {
    ...steps[input.state.currentStepIndex],
    params: mergedParams,
  };

  return {
    steps,
    originalPrompt: input.state.originalPrompt,
    parentAction: input.state.parentAction,
    goalDetails: input.state.goalDetails,
    readyToResume: true,
    mergedStepIndex: input.state.currentStepIndex,
  };
}

export function clearMidPlanClarifySession(
  sessionContext?: Record<string, unknown>,
): Record<string, unknown> {
  if (!sessionContext) return {};
  const next = { ...sessionContext };
  delete next[MID_PLAN_CLARIFY_SESSION_KEY];
  return next;
}

export function attachMidPlanResumeSession(
  sessionContext: Record<string, unknown> | undefined,
  followUpPrompt: string,
  followUpAnswers?: Record<string, string>,
): Record<string, unknown> {
  let next = { ...(sessionContext ?? {}) };
  if (followUpAnswers && Object.keys(followUpAnswers).length > 0) {
    next = recordClarifyAnswerInSession(next, followUpAnswers);
  }
  return {
    ...next,
    _midPlanResumePrompt: followUpPrompt,
  };
}

function probeValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  if (typeof a === 'object' && a != null && typeof b === 'object' && b != null) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

export function assertMidPlanClarifyProbes(): MidPlanClarifyStatus {
  const errors: string[] = [];

  for (const probe of MID_PLAN_CLARIFY_PROBE_SCENARIOS) {
    const state = buildMidPlanClarifyState({
      parentAction: probe.parentAction,
      originalPrompt: probe.originalPrompt,
      steps: probe.steps,
      currentStepIndex: probe.pauseStepIndex,
      sessionContext: {
        _clarifyContext: {
          originalPrompt: probe.originalPrompt,
          originalAction: probe.steps[probe.pauseStepIndex]?.action ?? 'unknown',
          partialParams: probe.steps[probe.pauseStepIndex]?.params ?? {},
          clarifyRound: 0,
          clarifyKind: 'mid_plan_targeted_slots',
        },
      },
      goalDetails:
        probe.parentAction === 'goal_execution'
          ? { goalExecution: true, unifiedPreview: true }
          : undefined,
    });

    const wrapped = wrapCompoundStepClarifyForMidPlan(
      {
        success: false,
        action: probe.steps[probe.pauseStepIndex]?.action ?? 'unknown',
        summary: 'Need more detail',
        details: {
          clarify: true,
          needsClarification: true,
          clarifySource: 'targeted_slots',
        },
      },
      {
        parentAction: probe.parentAction,
        originalPrompt: probe.originalPrompt,
        steps: probe.steps,
        currentStepIndex: probe.pauseStepIndex,
        goalDetails: state.goalDetails,
      },
    );

    if (!wrapped.details.midPlanClarify) {
      errors.push(`${probe.id}: expected midPlanClarify flag`);
    }
    const preserved = wrapped.details.preservedStepActions as string[] | undefined;
    if (!preserved || preserved.length !== probe.steps.length) {
      errors.push(`${probe.id}: expected all plan steps preserved in clarify`);
    }

    const resume = mergeMidPlanClarifyResume({
      state: readMidPlanClarifyState(
        wrapped.details.sessionContext as Record<string, unknown>,
      )!,
      followUpPrompt: probe.followUpPrompt,
      sessionContext: {
        ...(wrapped.details.sessionContext as Record<string, unknown>),
        _clarifyMemory: probe.followUpMemory,
        _clarifyContext: buildMidPlanClarifyContext(state),
      },
    });

    const mergedStep = resume.steps[probe.pauseStepIndex];
    if (
      !probeValuesEqual(
        mergedStep?.params[probe.expectMergedField],
        probe.expectMergedValue,
      )
    ) {
      errors.push(
        `${probe.id}: expected ${probe.expectMergedField}=${JSON.stringify(probe.expectMergedValue)}`,
      );
    }
    const preservedStep = resume.steps[probe.expectPreservedStepIndex];
    if (
      !probeValuesEqual(
        preservedStep?.params[probe.expectPreservedField],
        probe.expectPreservedValue,
      )
    ) {
      errors.push(
        `${probe.id}: preserved step ${probe.expectPreservedStepIndex} lost ${probe.expectPreservedField}`,
      );
    }
    if (!resume.readyToResume) {
      errors.push(`${probe.id}: expected readyToResume`);
    }
  }

  return {
    complete: errors.length === 0,
    errors,
    probesChecked: MID_PLAN_CLARIFY_PROBE_SCENARIOS.length,
  };
}
