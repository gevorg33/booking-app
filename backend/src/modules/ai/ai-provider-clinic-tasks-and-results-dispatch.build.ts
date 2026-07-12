import type { CommandResult } from './command-completion.types.js';
import {
  handleListBookingLabSummariesLogic,
  type ProviderClinicTasksAndResultsLogicDeps,
} from './ai-provider-clinic-tasks-and-results.logic.js';

export type ProviderClinicTasksAndResultsDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt?: string;
  userId: string;
};

export type ProviderClinicTasksAndResultsLogicDispatchHandler = (
  deps: ProviderClinicTasksAndResultsLogicDeps,
  ctx: ProviderClinicTasksAndResultsDispatchContext,
) => Promise<CommandResult>;

export function buildProviderClinicTasksAndResultsLogicDispatchMap(): ReadonlyMap<
  string,
  ProviderClinicTasksAndResultsLogicDispatchHandler
> {
  const map = new Map<string, ProviderClinicTasksAndResultsLogicDispatchHandler>();

  map.set('list_booking_lab_summaries', async (deps, ctx) =>
    handleListBookingLabSummariesLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      ctx.params,
      ctx.prompt,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiProviderClinicTasksAndResultsService (ai-cmd-ext-0.5). */
export const PROVIDER_CLINIC_TASKS_AND_RESULTS_LOGIC_DISPATCH_MAP =
  buildProviderClinicTasksAndResultsLogicDispatchMap();
