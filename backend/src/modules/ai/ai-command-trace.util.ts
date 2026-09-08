import { isClarifyResult } from './ai-clarify.util.js';
import { randomUUID } from 'node:crypto';
import {
  redactEmbeddedPhiFromPrompt,
  redactSecretsFromPrompt,
  redactPhiFromValue,
  redactSecretDetailFields,
} from '../../common/utils/phi-ai-guard.util.js';
import type {
  CommandResult,
  PipelineTrace,
} from './command-completion.types.js';
import type { IntentCandidateSource } from './command-understanding.types.js';
import type {
  AiCommandTraceOutcome,
  AiCommandTraceRoutingTier,
  AiCommandTraceSource,
  AiCommandTraceSurface,
} from './entities/ai-command-trace.entity.js';
import { AI_COMMAND_TRACE_PIPE_MARKER } from './ai-command-trace.fixtures.js';
import {
  attributeActionChange,
  deriveFailureReason,
} from './ai-command-trace-attribution.util.js';
import { buildPlanTraceFields } from './ai-command-plan.trace.js';
import type { PlanOutcome } from './ai-command-planner.service.js';

export { AI_COMMAND_TRACE_PIPE_MARKER };

const INTERNAL_PARAM_PREFIX = '_';

export type RecordAiCommandTraceInput = {
  businessId: string;
  surface: AiCommandTraceSurface;
  userId?: string;
  role?: string;
  promptRaw: string;
  promptNormalized?: string;
  locale?: string;
  action: string;
  confidence?: number;
  params?: Record<string, unknown>;
  routingTier?: AiCommandTraceRoutingTier;
  candidateSource?: IntentCandidateSource;
  source?: AiCommandTraceSource;
  result: Pick<CommandResult, 'success' | 'action' | 'details'> &
    Partial<Pick<CommandResult, 'summary'>>;
  latencyMs?: number;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  tokenCostUsd?: number;
  pipelineTrace?: PipelineTrace[];
  traceId?: string;
  /**
   * AI-ROADMAP Phase 3 — present only when the planner produced this result.
   * Absent on legacy single-action rows, which is how the shadow rollout is
   * measured: `plan_outcome IS NOT NULL` selects planner-handled messages.
   */
  planOutcome?: PlanOutcome;
  /**
   * AI-ROADMAP Phase 1 / §50 — conversation key derived from the replayed
   * history. Optional because it is genuinely absent for anonymous visitors,
   * not because callers may forget it.
   */
  sessionId?: string | null;
  /** User-turn number within that conversation, 1-based. */
  sessionTurn?: number | null;
};

export function redactCommandTracePrompt(prompt: string): string {
  // e2e-bug.464 — secrets as well as PHI. The redaction seam was already here
  // and already correct for PHI; it simply had no credential patterns, so an
  // OpenAI `sk-` key pasted at the completion validator's own invitation was
  // stored verbatim in `prompt_raw`, a column with no retention policy.
  return redactSecretsFromPrompt(redactEmbeddedPhiFromPrompt(prompt));
}

export function redactCommandTraceParams(
  params: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!params || Object.keys(params).length === 0) return null;

  // e2e-bug.464 residue / §222 — PHI redaction alone is not enough here.
  // `redactCommandTracePrompt` has stripped credentials from the prompt text
  // since §170, but the structured params went through `redactPhiFromValue`
  // only, which knows about patients and not about secrets. So a key the user
  // typed was scrubbed from `promptRaw` and then stored verbatim one field
  // over, in `params.apiKey` — the same value, the same row.
  const redacted = redactSecretDetailFields(
    redactPhiFromValue(params) as Record<string, unknown>,
  );
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(redacted)) {
    if (key.startsWith(INTERNAL_PARAM_PREFIX)) continue;
    next[key] = value;
  }
  return Object.keys(next).length > 0 ? next : null;
}

export function resolveCommandTraceOutcome(
  result: Pick<CommandResult, 'success' | 'action' | 'details'>,
): AiCommandTraceOutcome {
  if (result.action === 'security_blocked') return 'security_blocked';
  if (result.details?.requiresExecutionConfirmation === true) return 'approval';
  // e2e-bug.411 — `isClarifyResult`, not a fourth private definition of the
  // same question.
  //
  // This branch used to test `details.needsClarification` alone. Handlers
  // overwhelmingly do not set that key: across `modules/ai` there are **646**
  // occurrences of `clarify: true` in 178 files against **19** of
  // `needsClarification: true`. So a handler that asked the user a question was
  // recorded as having *failed*, and the customer surface's 31.1% failure rate
  // counts an unknown share of questions as defects.
  //
  // `isClarifyResult` already existed for exactly this, and its doc comment
  // names the caller: "exported so the guide fallback and **the trace writer**
  // can both branch on one definition instead of each re-deriving it from a
  // different flag". The trace writer was the one re-deriving it.
  if (
    isClarifyResult(result) ||
    result.action === 'clarify' ||
    result.action === 'unknown'
  ) {
    return 'clarified';
  }
  if (result.success) return 'executed';
  return 'failed';
}

export function resolveCommandTraceSource(
  candidateSource?: IntentCandidateSource,
  explicit?: AiCommandTraceSource,
): AiCommandTraceSource {
  if (explicit) return explicit;
  if (candidateSource === 'fast_heuristic') return 'deterministic';
  return 'llm';
}

export function buildAiCommandTraceRow(
  input: RecordAiCommandTraceInput,
): Omit<
  import('./entities/ai-command-trace.entity.js').AiCommandTrace,
  'id' | 'createdAt'
> {
  const traceId = input.traceId ?? randomUUID();
  const promptNormalized = input.promptNormalized ?? input.promptRaw;
  const outcome = resolveCommandTraceOutcome(input.result);
  // AI-ROADMAP Task 1 — derive steal attribution from the trace the pipeline
  // already emits, so no extra plumbing is needed at the call sites.
  const attribution = attributeActionChange(
    input.pipelineTrace ?? null,
    input.action,
  );

  return {
    traceId,
    businessId: input.businessId,
    surface: input.surface,
    userId: input.userId ?? null,
    role: input.role ?? null,
    promptRaw: redactCommandTracePrompt(input.promptRaw),
    promptNormalized: redactCommandTracePrompt(promptNormalized),
    locale: input.locale ?? null,
    action: input.action,
    confidence: typeof input.confidence === 'number' ? input.confidence : null,
    params: redactCommandTraceParams(input.params),
    routingTier: input.routingTier ?? null,
    source: resolveCommandTraceSource(input.candidateSource, input.source),
    outcome,
    latencyMs: input.latencyMs ?? null,
    model: input.model ?? null,
    promptTokens: input.promptTokens ?? null,
    completionTokens: input.completionTokens ?? null,
    tokenCostUsd: input.tokenCostUsd ?? null,
    pipelineTrace: input.pipelineTrace ?? null,
    classifiedAction: attribution.classifiedAction,
    actionChangedBy: attribution.changedBy,
    failureReason: deriveFailureReason(input.result),
    // Only for non-executed outcomes: successes are self-explanatory and
    // storing every summary would bloat the table for no diagnostic value.
    resultSummary:
      outcome === 'executed' || !input.result.summary
        ? null
        : redactCommandTracePrompt(input.result.summary),
    ...buildPlanTraceFields(input.planOutcome),
    // §50. `?? null` rather than omitted: the column is nullable and an
    // anonymous visitor's null is meaningful data, not a missing value.
    sessionId: input.sessionId ?? null,
    sessionTurn: input.sessionTurn ?? null,
  };
}
