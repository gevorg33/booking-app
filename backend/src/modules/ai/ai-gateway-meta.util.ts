import type { AiSurface } from './ai-capability.matrix.js';
import type { AccessTier } from './access-control.matrix.js';
import type { CommandResult } from './command-completion.types.js';

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
  return {
    ...(result.details?.params ?? {}),
    employee: result.details?.employee,
    service: result.details?.serviceName,
  };
}

export function buildCustomerEntityMemoryLearnPayload(
  result: CommandResult,
): Record<string, unknown> {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const sessionContext = (details.sessionContext ?? {}) as Record<
    string,
    unknown
  >;
  return {
    ...sessionContext,
    service: details.serviceName,
    employee: details.employeeName,
    packageId: details.packageId,
    bookingId: details.bookingId,
  };
}

export function buildProviderEntityMemoryLearnPayload(
  result: Record<string, unknown>,
): Record<string, unknown> {
  const details = (result.details ?? {}) as Record<string, unknown>;
  const sessionContext = (details.sessionContext ?? {}) as Record<
    string,
    unknown
  >;
  return {
    ...sessionContext,
    employee: details.employee,
    service: details.serviceName,
    customer: details.customerName,
  };
}

export function attachGatewayMeta(
  result: CommandResult,
  surface: AiSurface,
  tier: AccessTier,
): CommandResult {
  return {
    ...result,
    details: {
      ...result.details,
      gateway: { surface, tier },
      executionTimeline:
        result.details?.executionTimeline ?? result.details?.workflowSteps,
    },
  };
}
