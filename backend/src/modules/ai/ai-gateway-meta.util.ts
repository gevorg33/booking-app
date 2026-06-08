import type { AiSurface } from './ai-capability.matrix.js';
import type { AccessTier } from './access-control.matrix.js';
import type { CommandResult } from './command-completion.types.js';
import { mergeClarifyMemoryIntoLearnPayload } from './ai-clarify-answer-reuse.util.js';
import { stampPipelineTrace } from './ai-pipeline-trace.util.js';

export function shouldLearnFromCommandResult(result: CommandResult): boolean {
  return Boolean(
    result.success &&
    result.action &&
    result.action !== 'error' &&
    result.action !== 'unknown',
  );
}

export function buildEntityMemoryLearnPayload(
  result: CommandResult,
): Record<string, unknown> {
  return mergeClarifyMemoryIntoLearnPayload(
    {
      ...(result.details?.params ?? {}),
      employee: result.details?.employee,
      service: result.details?.serviceName,
    },
    result.details?.sessionContext as Record<string, unknown> | undefined,
  );
}

export function buildCustomerEntityMemoryLearnPayload(
  result: CommandResult,
): Record<string, unknown> {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const sessionContext = (details.sessionContext ?? {}) as Record<
    string,
    unknown
  >;
  return mergeClarifyMemoryIntoLearnPayload(
    {
      ...sessionContext,
      service: details.serviceName,
      employee: details.employeeName,
      packageId: details.packageId,
      bookingId: details.bookingId,
    },
    sessionContext,
  );
}

export function buildProviderEntityMemoryLearnPayload(
  result: Record<string, unknown>,
): Record<string, unknown> {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const sessionContext = (details.sessionContext ?? {}) as Record<
    string,
    unknown
  >;
  return mergeClarifyMemoryIntoLearnPayload(
    {
      ...sessionContext,
      employee: details.employee,
      service: details.serviceName,
      customer: details.customerName,
    },
    sessionContext,
  );
}

export function attachGatewayMeta(
  result: CommandResult,
  surface: AiSurface,
  tier: AccessTier,
  traceId?: string,
): CommandResult {
  const tracedPipeline = stampPipelineTrace(
    result.details?.pipelineTrace,
    traceId,
  );

  return {
    ...result,
    details: {
      ...result.details,
      traceId,
      gateway: { surface, tier },
      pipelineTrace: tracedPipeline,
      executionTimeline:
        result.details?.executionTimeline ?? result.details?.workflowSteps,
    },
  };
}
