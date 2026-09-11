import type { CommandResult } from './command-completion.types.js';
import {
  handleCreateExternalDoctorLogic,
  handleListExternalDoctorsLogic,
  handleUpdateExternalDoctorLogic,
  type ExternalDoctorsLogicDeps,
} from './ai-external-doctors.logic.js';

export type ExternalDoctorsDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  userId?: string;
};

export type ExternalDoctorsLogicDispatchHandler = (
  deps: ExternalDoctorsLogicDeps,
  ctx: ExternalDoctorsDispatchContext,
) => Promise<CommandResult>;

export function buildExternalDoctorsLogicDispatchMap(): ReadonlyMap<
  string,
  ExternalDoctorsLogicDispatchHandler
> {
  const map = new Map<string, ExternalDoctorsLogicDispatchHandler>();

  map.set('create_external_doctor', async (deps, ctx) =>
    handleCreateExternalDoctorLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      ctx.params,
    ),
  );
  map.set('update_external_doctor', async (deps, ctx) =>
    handleUpdateExternalDoctorLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      ctx.params,
    ),
  );
  map.set('list_external_doctors', async (deps, ctx) =>
    handleListExternalDoctorsLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      ctx.params,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiExternalDoctorsService (ai-cmd-ext-0.5). */
export const EXTERNAL_DOCTORS_LOGIC_DISPATCH_MAP =
  buildExternalDoctorsLogicDispatchMap();
