/**
 * AI-ROADMAP Task 1 — steal & failure attribution.
 *
 * The pipeline already emits a per-stage `PipelineTrace[]`, but the trace row
 * only persists the FINAL action. That makes the most damaging failure mode —
 * a post-classify stage overwriting a correct action ("a wrong command stolen
 * from a right command") — invisible in telemetry: `source` reads `llm` for
 * 99.8% of rows even when a rescue regex picked the final action.
 *
 * These helpers derive, from the trace the pipeline already produces:
 *   - which action the classifier actually chose,
 *   - whether it survived to execution,
 *   - which stage changed it if it did not.
 *
 * Pure functions, no I/O — so they can also backfill historical rows.
 */
import type { PipelineTrace } from './command-completion.types.js';

/**
 * Stages that can decide/replace the action. `normalize`, `fast_heuristics`,
 * `structural_enrich`, `resolve` and `validate` never choose an action —
 * they only shape the prompt or the params — so a change attributed to them
 * would be misleading.
 */
export const ACTION_DECIDING_STAGES = [
  'classify',
  'confidence_gate',
  'semantic_match',
  'rerank',
  'narrow_reclassify',
  'rescue',
  'self_verify',
] as const;

export type ActionDecidingStage = (typeof ACTION_DECIDING_STAGES)[number];

/**
 * Values a stage writes into `action` that are status markers, not commands.
 * Treating these as actions would report a steal on every skipped stage.
 */
const NON_ACTION_MARKERS = new Set([
  'none',
  'skipped',
  'passthrough',
  'noop',
  'unchanged',
  'suppressed',
  'suppressed_high_confidence',
  '',
]);

function isRealAction(action: string | undefined | null): action is string {
  if (!action) return false;
  return !NON_ACTION_MARKERS.has(action.trim().toLowerCase());
}

/** The action the LLM classifier chose, before any later stage could replace it. */
export function extractClassifiedAction(
  pipelineTrace: PipelineTrace[] | null | undefined,
): string | null {
  if (!pipelineTrace?.length) return null;
  const entry = pipelineTrace.find((e) => e.stage === 'classify');
  return isRealAction(entry?.action) ? entry.action : null;
}

export type ActionAttribution = {
  /** Action chosen by `classify`, or null when the stage never ran. */
  classifiedAction: string | null;
  /** True when the executed action differs from the classified one. */
  changed: boolean;
  /**
   * Stage that last set an action different from the classifier's, or
   * `post_pipeline` when the change happened after the traced stages
   * (e.g. a compound step re-dispatching). Null when nothing changed.
   */
  changedBy: ActionDecidingStage | 'post_pipeline' | null;
};

/**
 * Attribute the final action back to the stage that chose it.
 *
 * Walks the action-deciding stages in trace order and returns the LAST one
 * that produced an action differing from the classifier's — that stage is the
 * one that actually took the decision away.
 */
export function attributeActionChange(
  pipelineTrace: PipelineTrace[] | null | undefined,
  finalAction: string,
): ActionAttribution {
  const classifiedAction = extractClassifiedAction(pipelineTrace);
  if (!classifiedAction) {
    return { classifiedAction: null, changed: false, changedBy: null };
  }
  if (classifiedAction === finalAction) {
    return { classifiedAction, changed: false, changedBy: null };
  }

  // Attribute to the FIRST deciding stage that introduced the action which
  // actually ran — that stage took the decision away; every later stage merely
  // carries it forward. Verified against production traces: a steal shows
  // `rescue: add_services_to_cart` followed by `self_verify:
  // add_services_to_cart`, where self_verify only echoes the new action. Taking
  // the last match would blame the echo and hide the real stealer.
  //
  // Matching on the FINAL action (rather than "any value differing from
  // classify") also means we never have to enumerate the status markers stages
  // write — `skipped`, `none`, `skip_semantic` and any future marker simply
  // never equal a real action, so they can never be blamed.
  let seenClassify = false;
  for (const entry of pipelineTrace ?? []) {
    if (entry.stage === 'classify') {
      seenClassify = true;
      continue;
    }
    if (!seenClassify) continue;
    if (!ACTION_DECIDING_STAGES.includes(entry.stage as ActionDecidingStage)) {
      continue;
    }
    if (entry.action === finalAction) {
      return {
        classifiedAction,
        changed: true,
        changedBy: entry.stage as ActionDecidingStage,
      };
    }
  }

  return { classifiedAction, changed: true, changedBy: 'post_pipeline' };
}

/**
 * Coarse, structured failure buckets.
 *
 * Derived from `details` shape only — deliberately NOT from summary text, so
 * this never becomes another message-regex layer. Anything we cannot classify
 * structurally stays `unclassified`, which is itself a useful signal: a large
 * `unclassified` bucket means handlers need to report failures in a structured
 * way, not that the bucketing is wrong.
 */
export type CommandFailureReason =
  | 'missing_params'
  | 'entity_unresolved'
  | 'not_permitted'
  | 'validation'
  | 'upstream_error'
  | 'compound_step_failed'
  | 'unclassified';

export function deriveFailureReason(result: {
  success: boolean;
  action: string;
  details?: Record<string, unknown>;
}): CommandFailureReason | null {
  if (result.success) return null;
  const d = result.details ?? {};

  if (Array.isArray(d.missing) && d.missing.length > 0) return 'missing_params';
  if (d.clarify === true || d.needsClarification === true)
    return 'missing_params';
  if (typeof d.failedStep === 'string') return 'compound_step_failed';
  if (d.unresolvedEntity != null || d.resolutionFailed === true) {
    return 'entity_unresolved';
  }
  if (d.permissionDenied === true || d.notAllowed === true)
    return 'not_permitted';
  if (d.validationErrors != null || d.invalidParams != null)
    return 'validation';
  if (d.error != null || d.exception != null) return 'upstream_error';

  return 'unclassified';
}
