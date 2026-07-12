import type { CommandResult } from './command-completion.types.js';
import type { Service } from '../service/entities/service.entity.js';
import {
  handleAssignResourceHoursLogic,
  handleBlockResourceUnavailableLogic,
  handleCheckMultiServiceBlockAvailabilityLogic,
  handleCheckPackageLineAvailabilityLogic,
  handleConfigureMultiServiceSchedulingModeLogic,
  handleCreateResourceLogic,
  handleDeactivateResourceLogic,
  handleEarliestSlotAllServicesLogic,
  handleExplainResourceConflictLogic,
  handleExplainWhyNoSlotsLogic,
  handleListResourceConflictsLogic,
  handleListSchedulingResourcesLogic,
  handleMyResourceAssignmentsLogic,
  handleProvidersAvailableLaterDaysLogic,
  handleSetServiceResourceRequirementsLogic,
  handleUpdateResourceLogic,
  type Sprint29ScheduleResourceLogicDeps,
} from './ai-schedule-resources.logic.js';
import { handleExplainMultiServiceSettingsLogic } from './ai-explain-multi-service-settings.logic.js';

export type ScheduleResourcesDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  prompt?: string;
  services: Service[];
  employeeId?: string;
};

export type ScheduleResourcesLogicDispatchHandler = (
  deps: Sprint29ScheduleResourceLogicDeps,
  ctx: ScheduleResourcesDispatchContext,
) => Promise<CommandResult>;

export function buildScheduleResourcesLogicDispatchMap(): ReadonlyMap<
  string,
  ScheduleResourcesLogicDispatchHandler
> {
  const map = new Map<string, ScheduleResourcesLogicDispatchHandler>();

  map.set('list_scheduling_resources', async (deps, ctx) =>
    handleListSchedulingResourcesLogic(deps, ctx.businessId),
  );
  map.set('create_resource', async (deps, ctx) =>
    handleCreateResourceLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('update_resource', async (deps, ctx) =>
    handleUpdateResourceLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('deactivate_resource', async (deps, ctx) =>
    handleDeactivateResourceLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('assign_resource_hours', async (deps, ctx) =>
    handleAssignResourceHoursLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.services,
    ),
  );
  map.set('set_service_resource_requirements', async (deps, ctx) =>
    handleSetServiceResourceRequirementsLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.services,
    ),
  );
  map.set('list_resource_conflicts', async (deps, ctx) =>
    handleListResourceConflictsLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('explain_resource_conflict', async (deps, ctx) =>
    handleExplainResourceConflictLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('explain_multi_service_settings', async (deps, ctx) =>
    handleExplainMultiServiceSettingsLogic(
      deps,
      ctx.businessId,
      ctx.params,
      ctx.prompt,
    ),
  );
  map.set('configure_multi_service_scheduling_mode', async (deps, ctx) =>
    handleConfigureMultiServiceSchedulingModeLogic(
      deps,
      ctx.businessId,
      ctx.params,
    ),
  );
  map.set('my_resource_assignments', async (deps, ctx) =>
    handleMyResourceAssignmentsLogic(deps, ctx.businessId, {
      ...ctx.params,
      sessionEmployeeId: ctx.employeeId,
    }),
  );
  map.set('block_resource_unavailable', async (deps, ctx) =>
    handleBlockResourceUnavailableLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('check_multi_service_block_availability', async (deps, ctx) =>
    handleCheckMultiServiceBlockAvailabilityLogic(
      deps,
      ctx.businessId,
      ctx.params,
    ),
  );
  map.set('check_package_line_availability', async (deps, ctx) =>
    handleCheckPackageLineAvailabilityLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('earliest_slot_all_services', async (deps, ctx) =>
    handleEarliestSlotAllServicesLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('providers_available_later_days', async (deps, ctx) =>
    handleProvidersAvailableLaterDaysLogic(deps, ctx.businessId, ctx.params),
  );
  map.set('explain_why_no_slots', async (deps, ctx) =>
    handleExplainWhyNoSlotsLogic(deps, ctx.businessId, ctx.params),
  );

  return map;
}

/** Registry-driven dispatch table for AiScheduleResourcesService (ai-cmd-ext-0.5). */
export const SCHEDULE_RESOURCES_LOGIC_DISPATCH_MAP =
  buildScheduleResourcesLogicDispatchMap();
