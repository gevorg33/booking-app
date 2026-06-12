import { randomUUID } from 'node:crypto';
import type { AiGatewayExecuteParams } from './ai-gateway.service.js';
import type {
  CommandResult,
  PipelineTrace,
} from './command-completion.types.js';
import type { AiCommandTraceRoutingTier } from './entities/ai-command-trace.entity.js';
import type { IntentCandidateSource } from './command-understanding.types.js';
import type { MisrouteTelemetryPayload } from './ai-misroute-telemetry.util.js';
import type { AiCommandTraceSurface } from './entities/ai-command-trace.entity.js';
import {
  buildAiCommandTraceRow,
  type RecordAiCommandTraceInput,
  resolveCommandTraceOutcome,
} from './ai-command-trace.util.js';
import {
  COMMAND_TRACE_ID_CONTEXT_KEY,
  COMMAND_TRACE_RECORDER_PIPE_MARKER,
} from './ai-command-trace-recorder.fixtures.js';

export {
  COMMAND_TRACE_ID_CONTEXT_KEY,
  COMMAND_TRACE_RECORDER_PIPE_MARKER,
};

export type CommandTraceStampContext = {
  traceId: string;
  pipelineTrace?: PipelineTrace[];
  confidence?: number;
  params?: Record<string, unknown>;
  routingTier?: AiCommandTraceRoutingTier;
  candidateSource?: IntentCandidateSource;
  misrouteTelemetry?: MisrouteTelemetryPayload | null;
};

export type CommandTraceMetadata = {
  traceId?: string;
  pipelineTrace?: PipelineTrace[];
  confidence?: number;
  params?: Record<string, unknown>;
  routingTier?: string;
  candidateSource?: IntentCandidateSource;
  promptNormalized?: string;
  locale?: string;
  misrouteTelemetry?: MisrouteTelemetryPayload;
};

export function resolveCommandTraceId(
  context?: Record<string, unknown>,
): string {
  const fromContext = context?.[COMMAND_TRACE_ID_CONTEXT_KEY];
  return typeof fromContext === 'string' && fromContext.length > 0
    ? fromContext
    : randomUUID();
}

export function extractCommandTraceMetadata(
  result: Pick<CommandResult, 'details'>,
): CommandTraceMetadata {
  const details = (result.details ?? {}) as Record<string, unknown>;
  return {
    traceId: typeof details.traceId === 'string' ? details.traceId : undefined,
    pipelineTrace: Array.isArray(details.pipelineTrace)
      ? (details.pipelineTrace as PipelineTrace[])
      : undefined,
    confidence:
      typeof details.confidence === 'number' ? details.confidence : undefined,
    params:
      (details.partialParams as Record<string, unknown> | undefined) ??
      (details.enrichedParams as Record<string, unknown> | undefined) ??
      (details.previewParams as Record<string, unknown> | undefined) ??
      (details.params as Record<string, unknown> | undefined),
    routingTier:
      typeof details.routingTier === 'string' ? details.routingTier : undefined,
    candidateSource: details.candidateSource as
      | IntentCandidateSource
      | undefined,
    promptNormalized:
      typeof details.promptNormalized === 'string'
        ? details.promptNormalized
        : undefined,
    locale: typeof details.locale === 'string' ? details.locale : undefined,
    misrouteTelemetry: details.misrouteTelemetry as
      | MisrouteTelemetryPayload
      | undefined,
  };
}

export function appendMisrouteTelemetryTrace(
  trace: PipelineTrace[],
  payload: MisrouteTelemetryPayload,
): PipelineTrace[] {
  return [
    ...trace,
    {
      stage: 'telemetry',
      action: payload.rescuedAction,
      at: payload.timestamp,
      detail: [
        'misroute',
        payload.scenarioId,
        payload.misrouted ? 'misrouted' : 'matched',
        payload.semanticAction ? `semantic=${payload.semanticAction}` : null,
        payload.pipelineStage ? `stage=${payload.pipelineStage}` : null,
      ]
        .filter(Boolean)
        .join('; '),
    },
  ];
}

function pipelineTraceIncludesMisroute(trace: PipelineTrace[]): boolean {
  return trace.some(
    (step) => step.stage === 'telemetry' && step.detail?.includes('misroute'),
  );
}

export function finalizeCommandTraceResult(
  result: CommandResult,
  ctx: CommandTraceStampContext,
): CommandResult {
  const misroute = ctx.misrouteTelemetry ?? undefined;
  let pipelineTrace =
    ctx.pipelineTrace ??
    (result.details?.pipelineTrace as PipelineTrace[] | undefined);

  if (misroute && pipelineTrace && !pipelineTraceIncludesMisroute(pipelineTrace)) {
    pipelineTrace = appendMisrouteTelemetryTrace(pipelineTrace, misroute);
  } else if (misroute && !pipelineTrace) {
    pipelineTrace = appendMisrouteTelemetryTrace([], misroute);
  }

  return stampCommandTraceDetails(result, {
    traceId: ctx.traceId,
    pipelineTrace,
    confidence:
      ctx.confidence ??
      (typeof result.details?.confidence === 'number'
        ? result.details.confidence
        : undefined),
    candidateSource: ctx.candidateSource,
    routingTier: ctx.routingTier,
    misrouteTelemetry: misroute,
  });
}

export function stampCommandTraceDetails(
  result: CommandResult,
  metadata: CommandTraceMetadata,
): CommandResult {
  return {
    ...result,
    details: {
      ...result.details,
      traceId: metadata.traceId ?? result.details?.traceId,
      pipelineTrace: metadata.pipelineTrace ?? result.details?.pipelineTrace,
      confidence: metadata.confidence ?? result.details?.confidence,
      routingTier: metadata.routingTier ?? result.details?.routingTier,
      candidateSource:
        metadata.candidateSource ?? result.details?.candidateSource,
      promptNormalized:
        metadata.promptNormalized ?? result.details?.promptNormalized,
      locale: metadata.locale ?? result.details?.locale,
      misrouteTelemetry:
        metadata.misrouteTelemetry ?? result.details?.misrouteTelemetry,
      traceRecorder: COMMAND_TRACE_RECORDER_PIPE_MARKER,
    },
  };
}

export function buildGatewayCommandTraceInput(opts: {
  params: AiGatewayExecuteParams;
  result: CommandResult;
  surface: AiCommandTraceSurface;
  role?: string;
  traceId: string;
  latencyMs?: number;
}): RecordAiCommandTraceInput {
  const metadata = extractCommandTraceMetadata(opts.result);
  const action =
    typeof opts.result.action === 'string' && opts.result.action.length > 0
      ? opts.result.action
      : 'error';

  return {
    businessId: opts.params.businessId,
    surface: opts.surface,
    userId: opts.params.userId,
    role: opts.role,
    promptRaw: opts.params.prompt,
    promptNormalized: metadata.promptNormalized,
    locale: metadata.locale,
    action,
    confidence: metadata.confidence,
    params: metadata.params,
    routingTier: metadata.routingTier as RecordAiCommandTraceInput['routingTier'],
    candidateSource: metadata.candidateSource,
    result: opts.result,
    latencyMs: opts.latencyMs,
    pipelineTrace: metadata.pipelineTrace,
    traceId: metadata.traceId ?? opts.traceId,
  };
}

export function shouldPersistCommandTrace(
  result: Pick<CommandResult, 'action' | 'details'>,
): boolean {
  if (result.details?.tracePersisted === true) return false;
  return true;
}

export function markCommandTracePersisted(
  result: CommandResult,
): CommandResult {
  return {
    ...result,
    details: {
      ...result.details,
      tracePersisted: true,
    },
  };
}

export function resolveTraceActionFromResult(
  result: Pick<CommandResult, 'action' | 'details'>,
): string {
  const misroute = extractCommandTraceMetadata(result).misrouteTelemetry;
  return misroute?.rescuedAction ?? result.action;
}

/** Validates recorder outcome mapping for gateway persistence. */
export function resolvePersistedTraceOutcome(
  result: Pick<CommandResult, 'success' | 'action' | 'details'>,
): ReturnType<typeof resolveCommandTraceOutcome> {
  return resolveCommandTraceOutcome(result);
}

export function buildPersistedCommandTraceRow(
  input: RecordAiCommandTraceInput,
): ReturnType<typeof buildAiCommandTraceRow> {
  return buildAiCommandTraceRow(input);
}
