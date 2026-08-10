import type { CommandResult } from './command-completion.types.js';
import {
  handleAssignPreVisitIntakeToBookingLogic,
  handleStaffSubmitIntakeAnswersLogic,
  type ClinicPreVisitIntakeLogicDeps,
} from './ai-clinic-pre-visit-intake.logic.js';

export type ClinicPreVisitIntakeDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  userId: string;
};

export type ClinicPreVisitIntakeLogicDispatchHandler = (
  deps: ClinicPreVisitIntakeLogicDeps,
  ctx: ClinicPreVisitIntakeDispatchContext,
) => Promise<CommandResult>;

export function buildClinicPreVisitIntakeLogicDispatchMap(): ReadonlyMap<
  string,
  ClinicPreVisitIntakeLogicDispatchHandler
> {
  const map = new Map<string, ClinicPreVisitIntakeLogicDispatchHandler>();

  map.set('assign_pre_visit_intake_to_booking', async (deps, ctx) =>
    handleAssignPreVisitIntakeToBookingLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      ctx.params,
    ),
  );
  map.set('staff_submit_intake_answers', async (deps, ctx) =>
    handleStaffSubmitIntakeAnswersLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      ctx.params,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiClinicPreVisitIntakeService (ai-cmd-ext-0.5). */
export const CLINIC_PRE_VISIT_INTAKE_LOGIC_DISPATCH_MAP =
  buildClinicPreVisitIntakeLogicDispatchMap();
