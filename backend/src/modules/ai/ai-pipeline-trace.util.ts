import type { PipelineTrace } from './command-completion.types.js';

/** Gateway injects `_traceId` into session/context for downstream pipeline attribution (acc-1.3). */
export function extractPipelineTraceId(
  context?: Record<string, unknown> | null,
): string | undefined {
  const traceId = context?._traceId;
  return typeof traceId === 'string' && traceId.length > 0 ? traceId : undefined;
}

/** Ensures every pipeline stage carries the same correlation id when present. */
export function stampPipelineTrace(
  trace: PipelineTrace[] | undefined,
  traceId?: string,
): PipelineTrace[] | undefined {
  if (!traceId || !Array.isArray(trace)) return trace;
  return trace.map((stage) =>
    stage.traceId === traceId ? stage : { ...stage, traceId },
  );
}
