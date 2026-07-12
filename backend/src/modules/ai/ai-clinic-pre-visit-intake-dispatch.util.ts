import type { CommandResult } from './command-completion.types.js';
import {
  CLINIC_PRE_VISIT_INTAKE_LOGIC_DISPATCH_MAP,
  type ClinicPreVisitIntakeDispatchContext,
  type ClinicPreVisitIntakeLogicDispatchHandler,
} from './ai-clinic-pre-visit-intake-dispatch.build.js';
import type { ClinicPreVisitIntakeLogicDeps } from './ai-clinic-pre-visit-intake.logic.js';

export function getClinicPreVisitIntakeLogicDispatchHandler(
  action: string,
): ClinicPreVisitIntakeLogicDispatchHandler | undefined {
  return CLINIC_PRE_VISIT_INTAKE_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchClinicPreVisitIntakeLogicIntent(
  deps: ClinicPreVisitIntakeLogicDeps,
  ctx: ClinicPreVisitIntakeDispatchContext,
): Promise<CommandResult | null> {
  const handler = CLINIC_PRE_VISIT_INTAKE_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function clinicPreVisitIntakeDispatchMapHas(action: string): boolean {
  return CLINIC_PRE_VISIT_INTAKE_LOGIC_DISPATCH_MAP.has(action);
}
