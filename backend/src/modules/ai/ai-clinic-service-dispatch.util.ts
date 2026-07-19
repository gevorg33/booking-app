import type { CommandResult } from './command-completion.types.js';
import type { AiClinicServiceService } from './ai-clinic-service.service.js';
import {
  CLINIC_SERVICE_DISPATCH_MAP,
  type ClinicServiceDispatchContext,
  type ClinicServiceDispatchHandler,
} from './ai-clinic-service-dispatch.build.js';

export function getClinicServiceDispatchHandler(
  action: string,
): ClinicServiceDispatchHandler | undefined {
  return CLINIC_SERVICE_DISPATCH_MAP.get(action);
}

export async function dispatchClinicServiceIntent(
  service: AiClinicServiceService,
  ctx: ClinicServiceDispatchContext,
): Promise<CommandResult | null> {
  const handler = CLINIC_SERVICE_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(service, ctx);
}

export function clinicServiceDispatchMapHas(action: string): boolean {
  return CLINIC_SERVICE_DISPATCH_MAP.has(action);
}
