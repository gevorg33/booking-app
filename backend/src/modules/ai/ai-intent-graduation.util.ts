import type { CommandResult } from './command-completion.types.js';
import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import { sanitizeParamsForPreview } from './ai-execution-confirm.util.js';
import {
  INTENT_GRADUATION_ACCURACY,
  INTENT_GRADUATION_MIN_SAMPLES,
  PROPOSE_ONLY_UNTIL_GRADUATED,
} from './ai-intent-graduation.fixtures.js';

export {
  INTENT_GRADUATION_ACCURACY,
  INTENT_GRADUATION_MIN_SAMPLES,
  INTENT_GRADUATION_SCENARIOS,
  INTENT_TRAFFIC_BUILD_SCENARIOS,
  PROPOSE_ONLY_UNTIL_GRADUATED,
} from './ai-intent-graduation.fixtures.js';

export interface IntentTrafficMetrics {
  samples: number;
  accurateRate: number;
}

export interface IntentGraduationThresholds {
  minSamples: number;
  minAccuracy: number;
}

export interface IntentGraduationStatus {
  action: string;
  proposeOnly: boolean;
  graduated: boolean;
  samples: number;
  minSamples: number;
  accurateRate: number;
  minAccuracy: number;
}

export interface IntentGraduationExecuteValidation {
  ok: boolean;
  summary: string;
  status: IntentGraduationStatus;
}

/** acc-5.8 — align graduation accuracy bar with ai-e5 confidenceHigh when present. */
export function resolveIntentGraduationThresholds(input?: {
  confidenceHigh?: number;
}): IntentGraduationThresholds {
  const minAccuracy =
    typeof input?.confidenceHigh === 'number' &&
    input.confidenceHigh > 0 &&
    input.confidenceHigh <= 1
      ? input.confidenceHigh
      : INTENT_GRADUATION_ACCURACY;

  return {
    minSamples: INTENT_GRADUATION_MIN_SAMPLES,
    minAccuracy,
  };
}

export function buildIntentTrafficFromTraceAnalytics(
  byIntent: Record<string, { total: number; accurate: number }>,
): Record<string, IntentTrafficMetrics> {
  const index: Record<string, IntentTrafficMetrics> = {};
  for (const [action, stats] of Object.entries(byIntent)) {
    index[action] = {
      samples: stats.total,
      accurateRate: stats.total ? stats.accurate / stats.total : 0,
    };
  }
  return index;
}

export function buildIntentTrafficFromCommandMetrics(
  byIntent: Record<string, { total: number; success: number }>,
): Record<string, IntentTrafficMetrics> {
  const index: Record<string, IntentTrafficMetrics> = {};
  for (const [action, stats] of Object.entries(byIntent)) {
    index[action] = {
      samples: stats.total,
      accurateRate: stats.total ? stats.success / stats.total : 0,
    };
  }
  return index;
}

export function resolveIntentTrafficMetrics(
  intentTraffic: Record<string, IntentTrafficMetrics> | undefined,
  action: string,
): IntentTrafficMetrics | undefined {
  return intentTraffic?.[action];
}

export function isIntentGraduatedForAutoExecute(
  action: string,
  traffic: IntentTrafficMetrics | undefined,
  thresholds = resolveIntentGraduationThresholds(),
): boolean {
  if (!PROPOSE_ONLY_UNTIL_GRADUATED.has(action)) return true;
  if (!traffic) return false;
  return (
    traffic.samples >= thresholds.minSamples &&
    traffic.accurateRate >= thresholds.minAccuracy
  );
}

export function requiresProposeOnlyExecution(
  action: string,
  traffic: IntentTrafficMetrics | undefined,
  thresholds = resolveIntentGraduationThresholds(),
): boolean {
  return (
    PROPOSE_ONLY_UNTIL_GRADUATED.has(action) &&
    !isIntentGraduatedForAutoExecute(action, traffic, thresholds)
  );
}

export function buildIntentGraduationStatus(input: {
  action: string;
  traffic?: IntentTrafficMetrics;
  thresholds?: IntentGraduationThresholds;
}): IntentGraduationStatus {
  const thresholds =
    input.thresholds ?? resolveIntentGraduationThresholds(undefined);
  const traffic = input.traffic;
  const graduated = isIntentGraduatedForAutoExecute(
    input.action,
    traffic,
    thresholds,
  );
  return {
    action: input.action,
    proposeOnly: requiresProposeOnlyExecution(
      input.action,
      traffic,
      thresholds,
    ),
    graduated,
    samples: traffic?.samples ?? 0,
    minSamples: thresholds.minSamples,
    accurateRate: traffic?.accurateRate ?? 0,
    minAccuracy: thresholds.minAccuracy,
  };
}

export function buildProposeOnlySummary(status: IntentGraduationStatus): string {
  if (status.graduated) {
    return `This action graduated to auto-execute (${Math.round(status.accurateRate * 100)}% accurate on ${status.samples} recent commands).`;
  }

  const accuracyPct = Math.round(status.accurateRate * 100);
  const targetPct = Math.round(status.minAccuracy * 100);
  return `This action is in propose-only mode until it meets accuracy targets on real traffic (${status.samples}/${status.minSamples} samples, ${accuracyPct}% vs ${targetPct}% required). Review and approve the plan to execute.`;
}

export function buildProposeOnlyResult(input: {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  reasoning?: string;
  traffic?: IntentTrafficMetrics;
  thresholds?: IntentGraduationThresholds;
  plan?: AgentPlan;
}): CommandResult {
  const status = buildIntentGraduationStatus({
    action: input.action,
    traffic: input.traffic,
    thresholds: input.thresholds,
  });

  return {
    success: true,
    action: input.action,
    summary: buildProposeOnlySummary(status),
    details: {
      requiresApproval: true,
      proposeOnly: true,
      dryRun: true,
      confirmationPrompt: input.prompt,
      interpretedAction: input.action,
      previewParams: sanitizeParamsForPreview(input.params),
      reasoning: input.reasoning,
      graduationStatus: status,
      plan: input.plan,
      pipelineStage: 'plan',
    },
  };
}

export function shouldForcePlanApprovalForIntent(input: {
  action: string;
  traffic?: IntentTrafficMetrics;
  thresholds?: IntentGraduationThresholds;
  autoExecuteRequested?: boolean;
}): boolean {
  if (!input.autoExecuteRequested) return false;
  return requiresProposeOnlyExecution(
    input.action,
    input.traffic,
    input.thresholds,
  );
}

export function validateIntentGraduationAtExecute(input: {
  action: string;
  traffic?: IntentTrafficMetrics;
  thresholds?: IntentGraduationThresholds;
  planApproved?: boolean;
  autoExecutePath?: boolean;
}): IntentGraduationExecuteValidation {
  const status = buildIntentGraduationStatus({
    action: input.action,
    traffic: input.traffic,
    thresholds: input.thresholds,
  });

  if (!status.proposeOnly) {
    return { ok: true, summary: '', status };
  }

  if (input.planApproved || !input.autoExecutePath) {
    return { ok: true, summary: '', status };
  }

  return {
    ok: false,
    summary: buildProposeOnlySummary(status),
    status,
  };
}

export function readIntentTrafficFromContext(
  context: Record<string, unknown> | undefined,
  action: string,
): IntentTrafficMetrics | undefined {
  const index = context?._intentTraffic as
    | Record<string, IntentTrafficMetrics>
    | undefined;
  return resolveIntentTrafficMetrics(index, action);
}

export function resolveGraduationThresholdsFromContext(
  context: Record<string, unknown> | undefined,
): IntentGraduationThresholds {
  return resolveIntentGraduationThresholds({
    confidenceHigh:
      typeof context?._confidenceHigh === 'number'
        ? context._confidenceHigh
        : undefined,
  });
}

/** Disable auto-execute for propose-only intents until the user approves a plan. */
export function resolveGraduatedAutoExecute(input: {
  action: string;
  autoExecute: boolean;
  context?: Record<string, unknown>;
}): boolean {
  if (!input.autoExecute) return false;
  const traffic = readIntentTrafficFromContext(input.context, input.action);
  const thresholds = resolveGraduationThresholdsFromContext(input.context);
  return !requiresProposeOnlyExecution(input.action, traffic, thresholds);
}
