import { randomUUID } from 'node:crypto';
import {
  redactEmbeddedPhiFromPrompt,
  redactPhiFromValue,
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
};

export function redactCommandTracePrompt(prompt: string): string {
  return redactEmbeddedPhiFromPrompt(prompt);
}

export function redactCommandTraceParams(
  params: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!params || Object.keys(params).length === 0) return null;

  const redacted = redactPhiFromValue(params) as Record<string, unknown>;
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
  if (
    result.details?.needsClarification === true ||
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
  };
}
