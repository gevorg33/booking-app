import type { CommandResult } from './command-completion.types.js';
import {
  CLINIC_LAB_BOOKING_LOGIC_DISPATCH_MAP,
  type ClinicLabBookingDispatchContext,
  type ClinicLabBookingLogicDispatchHandler,
} from './ai-clinic-lab-booking-dispatch.build.js';
import type { ClinicLabBookingLogicDeps } from './ai-clinic-lab-booking.logic.js';

export function getClinicLabBookingLogicDispatchHandler(
  action: string,
): ClinicLabBookingLogicDispatchHandler | undefined {
  return CLINIC_LAB_BOOKING_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchClinicLabBookingLogicIntent(
  deps: ClinicLabBookingLogicDeps,
  ctx: ClinicLabBookingDispatchContext,
): Promise<CommandResult | null> {
  const handler = CLINIC_LAB_BOOKING_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function clinicLabBookingDispatchMapHas(action: string): boolean {
  return CLINIC_LAB_BOOKING_LOGIC_DISPATCH_MAP.has(action);
}
