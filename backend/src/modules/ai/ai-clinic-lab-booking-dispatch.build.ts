import type { CommandResult } from './command-completion.types.js';
import {
  handlePushLabBookingToPatientLogic,
  handleStaffBookLabCollectionLogic,
  type ClinicLabBookingLogicDeps,
} from './ai-clinic-lab-booking.logic.js';

export type ClinicLabBookingDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt?: string;
  userId: string;
  confirmed: boolean;
};

export type ClinicLabBookingLogicDispatchHandler = (
  deps: ClinicLabBookingLogicDeps,
  ctx: ClinicLabBookingDispatchContext,
) => Promise<CommandResult>;

export function buildClinicLabBookingLogicDispatchMap(): ReadonlyMap<
  string,
  ClinicLabBookingLogicDispatchHandler
> {
  const map = new Map<string, ClinicLabBookingLogicDispatchHandler>();

  map.set('push_lab_booking_to_patient', async (deps, ctx) =>
    handlePushLabBookingToPatientLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      { ...ctx.params, _prompt: ctx.prompt },
      ctx.prompt,
      ctx.confirmed,
    ),
  );
  map.set('staff_book_lab_collection', async (deps, ctx) =>
    handleStaffBookLabCollectionLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      { ...ctx.params, _prompt: ctx.prompt },
      ctx.prompt,
      ctx.confirmed,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiClinicLabBookingService (ai-cmd-ext-0.5). */
export const CLINIC_LAB_BOOKING_LOGIC_DISPATCH_MAP =
  buildClinicLabBookingLogicDispatchMap();
