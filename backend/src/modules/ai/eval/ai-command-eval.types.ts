import type { CommandSurface } from '../ai-command-registry.types.js';
import type { AccessTier } from '../access-control.matrix.js';
import type { ComplexityRoute } from '../command-complexity-router.service.js';
import type { DecompositionSource } from '../intent-decomposition.types.js';

export type AiEvalLocale = 'en' | 'hy' | 'ru' | 'translit';

export interface CompoundStepParamExpectation {
  stepIndex: number;
  paramsPartial?: Record<string, unknown>;
}

export interface AiCommandEvalExpectation {
  /** Expected intent action when classify output is simulated or skipped */
  action?: string;
  /** Subset match on params after heuristic finalize */
  paramsPartial?: Record<string, unknown>;
  /** Deterministic complexity route tier */
  routeTier?: ComplexityRoute['tier'];
  /** Parsed destination time (24h) for reschedule prompts */
  rescheduleTimeSlot?: string;
  /** Parsed source time for reschedule prompts */
  rescheduleFromTimeSlot?: string;
  /** Whether multilingual classifier hint should apply */
  needsMultilingual?: boolean;
  /** Intent rescue should change unknown → this action */
  rescuedAction?: string;
  /** Input action for disambiguation rescue (defaults to unknown). */
  rescueFromAction?: string;
  /** Expected rescueReason when stable. */
  rescueReason?: string;
  /** Use surface-scoped clinic lab booking rescue (i18n-clinic-v2-ai-8). */
  useSurfaceLabBookingRescue?: boolean;
  /** Compound decomposition surface (ai-cmd-0.4). */
  compoundSurface?: CommandSurface;
  /** Exact ordered sub-intent actions from deterministic/golden decomposition. */
  compoundSteps?: string[];
  /** Subset of required sub-intent actions (any order). */
  compoundActionsContains?: string[];
  /** Minimum sub-intent count when order is unstable. */
  compoundMinSteps?: number;
  /** Decomposition should not yield multi-step result. */
  compoundExpectEmpty?: boolean;
  /** Expected decomposition source when stable. */
  compoundSource?: DecompositionSource;
  /** Expected compound recipe id when stable. */
  compoundRecipeId?: string;
  /** Per-step param subset checks after decomposition. */
  compoundStepParams?: CompoundStepParamExpectation[];
  /** HIPAA PHI guard assessment (ai-cmd-compliance-15). */
  phiGuard?: {
    blocked: boolean;
    reason?: 'phi_in_context' | 'phi_in_prompt';
    matchedFields?: string[];
    redactedSubstring?: string;
  };
  clarifyAction?: string;
  /** Expected clarify field names — validation must fail with these fields (acc-2.6). */
  clarifyFields?: string[];
  /** Simulated classifier params before entity resolution (acc-2.6). */
  classifiedParams?: Record<string, unknown>;
  /** How deterministic ambiguity eval derives clarify fields (acc-2.6). */
  ambiguityEvalKind?: 'validation' | 'ambiguous_provider' | 'ambiguous_service';
  /** acc-2.6 corpus category tag. */
  ambiguityCategory?: string;
  /** Security preflight must block prompt (acc-2.7). */
  securityBlocked?: boolean;
  securityBlockReason?:
    | 'injection'
    | 'data_export'
    | 'availability_bypass'
    | 'revenue_access'
    | 'staff_directory';
  /** Preflight vs post-classification enforceAction gate (acc-2.7). */
  securityEvalKind?: 'preflight' | 'enforce_action';
  securityClassifiedAction?: string;
  securityClassifiedParams?: Record<string, unknown>;
  securityAccessTier?: 'owner' | 'manager' | 'staff' | 'client';
  /** n99-1.9 — second-turn clarify follow-up pipeline expectations. */
  clarifyFollowup?: {
    originalPrompt: string;
    followUpPrompt?: string;
    originalAction?: string;
    partialParams?: Record<string, unknown>;
    field?: string;
    shortlist?: string[];
    excludedActions?: string[];
    clarifyCandidates?: Array<{ action: string; label?: string }>;
    expectMergedPrompt?: string;
    expectNormalizedFollowUp?: string;
    expectRestoredAction?: string;
    expectInlineValid?: boolean;
    expectInlineHint?: string;
    expectExecuteImmediately?: boolean;
    expectSomethingElseCount?: number;
    /** n99-1.9 — second-turn clarify follow-up should succeed (merge + validate + execute). */
    expectSecondTurnSuccess?: boolean;
  };
  /** n99-2.9 — completion without clarify (autofill + screen grounding + guardrails). */
  noClarifyCompletion?: {
    action: string;
    paramsPartial?: Record<string, unknown>;
    sessionContext?: Record<string, unknown>;
    screenContext?: Record<string, unknown>;
    entityMemory?: { aliases: Record<string, Record<string, string>> };
    businessDefaults?: { defaultServiceDurationMinutes?: number };
    catalogServices?: Array<{ name: string; durationMinutes?: number }>;
    actionConfidence?: number;
    expectFilled?: Record<string, unknown>;
    expectAction?: string;
    expectBlocked?: boolean;
    expectBlockReason?: string;
    expectProceed?: boolean;
    validationIssues?: Array<{ field: string; message: string }>;
    expectTrimmedFields?: string[];
  };
  /** n99-2.4 — top-K labeled few-shot examples injected into classify appendix. */
  fewShotRetrieval?: {
    expectedAction: string;
    minCount?: number;
    rarePhrasing?: boolean;
  };
  /** n99-2.7 — auto-fill watchdog threshold + execution preview metadata. */
  autofillWatchdog?: {
    autoFillTraceCount?: number;
    autoFillUndoCount?: number;
    autoFillDownvoteCount?: number;
    baseThreshold?: number;
    expectAdjustedThreshold?: number;
    expectReason?: string;
    previewParams?: Record<string, unknown>;
    previewAction?: string;
    taskId?: string;
    expectPreviewFields?: string[];
    expectOneTapUndo?: boolean;
    expectPostExecAssertion?: boolean;
  };
  /** n99-2.8 — ambiguous/destructive must clarify; counts toward n99-1. */
  ambiguousDestructiveClarify?: {
    action: string;
    paramsPartial?: Record<string, unknown>;
    actionConfidence?: number;
    sessionContext?: Record<string, unknown>;
    expectBlocked: boolean;
    expectBlockReason?: string;
    expectClarify?: boolean;
    expectCountsTowardClarifySuccess?: boolean;
  };
}

export type AiEvalCorpusTag =
  | 'golden'
  | 'clarify_followup'
  | 'no_clarify'
  | 'typo'
  | 'adversarial'
  | 'ambiguity'
  | 'harvested'
  | 'semantic_paraphrase';

export type AiEvalDifficulty =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'ambiguity'
  | 'adversarial';

export interface AiCommandEvalCase {
  id: string;
  prompt: string;
  locale?: AiEvalLocale;
  surface?: CommandSurface;
  /** parity-2.4 — expected access tier for gap-closure intents. */
  accessTier?: AccessTier;
  /** acc-2.3 — booking | catalog | schedule | payments | gift | crm | integrations | clinic | compliance */
  domain?: string;
  corpus?: AiEvalCorpusTag;
  difficulty?: AiEvalDifficulty;
  /** acc-3.12 — include prompt in semantic phrasing bank (eval pipeline). */
  semanticParaphrase?: boolean;
  expect: AiCommandEvalExpectation;
  /** When true, case is documented for live LLM eval only (skipped in CI) */
  requiresLlm?: boolean;
}

export interface AiEvalCaseResult {
  id: string;
  passed: boolean;
  errors: string[];
}
