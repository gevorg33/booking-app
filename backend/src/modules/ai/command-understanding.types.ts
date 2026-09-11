import type { CommandSurface } from './ai-command-registry.types.js';
import type { ClassifiedIntent } from './ai-command-routing.util.js';
import type {
  PipelineStage,
  PipelineTrace,
} from './command-completion.types.js';
import type {
  PromptNormalizationMethod,
  PromptNormalizationResult,
} from './ai-prompt-normalization.service.js';
import type { ComplexityRoute } from './command-complexity-router.service.js';

/** Provenance of an intent hypothesis in the understand pipeline (pipe-1). */
export type IntentCandidateSource =
  | 'fast_heuristic'
  | 'classifier'
  | 'semantic_match'
  | 'rerank'
  | 'narrow_reclassify'
  | 'rescue'
  | 'self_verify'
  | 'structural_enrich'
  | 'guide_handoff'
  /**
   * The §15 planner, routing rather than observing.
   *
   * e2e-bug.392 — until this existed the planner ran after the response was
   * built and could not affect it, which meant no Phase 8 slice could retire its
   * detectors: deleting them would have removed routing with nothing to replace
   * it. Gated per domain by `AI_PLANNER_EXECUTE_DOMAINS`, unset meaning none.
   */
  | 'planner';

/**
 * Scored intent hypothesis from any understand-stage producer.
 * Fast heuristics, classifier, semantic match, re-rank, rescue, etc. all emit these.
 */
export interface IntentCandidate {
  action: string;
  confidence: number;
  source: IntentCandidateSource;
  /**
   * Ranked above confidence when set — e2e-bug.403.
   *
   * The rerank sorts on `confidence`, which works while every candidate's number
   * means the same thing. It stopped being true when the planner joined: its
   * confidence is an LLM self-report anchored by an example value in a prompt
   * template, and the classifier's is a calibrated score. On the `tour` slice
   * both land on 0.90-0.95, so the winner was decided by that example.
   *
   * Precedence exists for the one case where the answer is not a matter of
   * degree: in a domain whose detectors are retired (§93), the planner is the
   * router. Rescue is locked there, so without this the classifier's answer —
   * the very one rescue used to override — would win by a hundredth of a point.
   *
   * Default 0. Higher wins. Nothing sets it except a retired-domain planner
   * route, and it is deliberately not a confidence boost: inflating a number to
   * win a comparison hides that the comparison was never valid.
   */
  precedence?: number;
  /** Partial params from classifier / rescue (merged into final params). */
  params?: Record<string, unknown>;
  /** Hints from semantic anchors or heuristics (e.g. bookingFirstAvailable). */
  paramHints?: Record<string, unknown>;
  reasoning?: string;
  /** Semantic anchor id when source is semantic_match. */
  anchorId?: string;
  /** Stable rescue reason when source is rescue or semantic_match. */
  rescueReason?: string;
  /** Zero-based rank after re-rank (0 = top). */
  rank?: number;
}

/** Confidence gate band outcome (pipe-1.3.2). */
export type ConfidenceGateDecision =
  | 'skip_semantic'
  | 'escalate_semantic'
  | 'ambiguous_band';

/** Result of evaluating classifier output against low/high confidence bands. */
export interface ConfidenceGateResult {
  action: string;
  confidence: number | undefined;
  shouldEscalateToSemantic: boolean;
  decision: ConfidenceGateDecision;
  lowThreshold: number;
  highThreshold: number;
  /** Human-readable rationale for pipeline trace detail. */
  reason: string;
}

/**
 * Mutable understand-pipeline state after normalize (pipe-1.1.1).
 * Passed to classify, semantic match, and narrow re-classify stages.
 */
export interface PipelineContext {
  /** Raw user prompt before normalization. */
  originalPrompt: string;
  /** Text sent to classify_intent and semantic matcher. */
  normalizedPrompt: string;
  /** HY/RU/translit hint appended to classifier system context. */
  classifierContext: string | null;
  method: PromptNormalizationMethod;
}

/** Terminal status of the understand phase before validate/execute. */
export type PipelineUnderstandStatus =
  | 'resolved'
  | 'clarify'
  | 'blocked'
  | 'unknown';

/**
 * Output of the understand pipeline (normalize → structural_enrich).
 * Handed to validate/execute in AiCommandService (pipe-1.0.4).
 */
export interface PipelineUnderstandResult {
  status: PipelineUnderstandStatus;
  action: string;
  params: Record<string, unknown>;
  reasoning: string;
  confidence: number;
  /** All hypotheses considered, newest source last. */
  candidates: IntentCandidate[];
  /** Ordered stage trace for telemetry (acc-1.3). */
  trace: PipelineTrace[];
  gate: ConfidenceGateResult;
  /** Normalize-stage context threaded through downstream stages. */
  context: PipelineContext;
  /** Normalized prompt metadata from the normalize stage. */
  normalization: PromptNormalizationResult;
  surface: CommandSurface;
  /** Merged complexity route when parallel routing ran. */
  complexityRoute?: ComplexityRoute;
  /** When status is clarify — fields the user must supply. */
  clarifyFields?: string[];
  /** When status is clarify — user-facing summary (pipe-1.6.2). */
  clarifySummary?: string;
  /** When status is clarify — example commands (acc-4.7). */
  clarifySuggestions?: string[];
  /** When status is blocked/unknown — why execution was not attempted. */
  blockReason?: string;
}

/** Understand-phase stages in execution order (pipe-1 target flow). */
export const PIPELINE_UNDERSTAND_STAGE_ORDER = [
  'normalize',
  'fast_heuristics',
  // `planner` is deliberately absent: it is a *conditional* stage, recorded only
  // when `AI_PLANNER_EXECUTE_DOMAINS` names a domain (e2e-bug.392). This list is
  // the flow every request must follow, and asserting an opt-in stage here would
  // make the default configuration fail its own contract.
  'classify',
  'confidence_gate',
  'semantic_match',
  'rerank',
  'narrow_reclassify',
  'rescue',
  'self_verify',
  'structural_enrich',
] as const satisfies readonly PipelineStage[];

/** Post-understand completion stages (resolve → validate → execute). */
export const PIPELINE_COMPLETION_STAGE_ORDER = [
  'resolve',
  'validate',
  'plan',
  'execute',
  'clarify',
  'telemetry',
] as const satisfies readonly PipelineStage[];

/** Input to the understand pipeline (pipe-1.0.2). */
export interface PipelineUnderstandInput {
  businessId: string;
  userId?: string;
  effectivePrompt: string;
  surface: CommandSurface;
  timeZone?: string;
  /** From `AiSettingsService.getSettings().confidence.low` (pipe-1.3.3). */
  confidenceLow: number;
  /** From ai settings `confidence.high`, or session `_confidenceHigh` A/B override. */
  confidenceHigh: number;
  lastAction?: string;
  employees?: Array<{ id: string; name: string }>;
  customers?: Array<{ id: string; name: string }>;
  /** Business locations — e2e-bug.460, lets the staff rescue tell a place from a person. */
  locations?: Array<{ id: string; name: string }>;
  /** Session context for structural enrich (pipe-1.7.1). */
  sessionContext?: Record<string, unknown>;
  /** Skip normalize when caller already normalized (e.g. executeCommand). */
  promptNorm?: PromptNormalizationResult;
  /** Pre-classified intent from parallel route+classify in executeCommand. */
  preclassified?: ClassifiedIntent | null;
  /** Primary LLM classify — receives normalize-stage PipelineContext (pipe-1.1.1). */
  classify?: (context: PipelineContext) => Promise<ClassifiedIntent | null>;
  /** Optional parallel complexity routing (pipe-1.3.1). */
  resolveRoute?: () => Promise<ComplexityRoute>;
  /**
   * Optional narrow re-classify when top-2 candidates are within 0.08 margin (pipe-1.4.7).
   * Receives a surface-valid shortlist (≤10 intent ids) and pipeline context.
   */
  narrowReclassify?: (
    actions: string[],
    context: PipelineContext,
  ) => Promise<ClassifiedIntent | null>;
}

/** Map ClassifiedIntent from LLM classify to a pipeline candidate. */
export function classifiedIntentToCandidate(
  parsed: ClassifiedIntent,
  source: IntentCandidateSource = 'classifier',
): IntentCandidate {
  return {
    action: parsed.action,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    source,
    params: parsed.params ?? {},
    reasoning: parsed.reasoning,
  };
}
