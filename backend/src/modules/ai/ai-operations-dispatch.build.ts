import type { CommandResult } from './command-completion.types.js';
import type { AiOperationsService } from './ai-operations.service.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';

export type OperationsDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  prompt: string;
  employees: Employee[];
  services: Service[];
  timeZone: string;
  userId?: string;
};

export type OperationsDispatchHandler = (
  service: AiOperationsService,
  ctx: OperationsDispatchContext,
) => Promise<CommandResult>;

export function buildOperationsDispatchMap(): ReadonlyMap<
  string,
  OperationsDispatchHandler
> {
  const map = new Map<string, OperationsDispatchHandler>();

  map.set('sick_day_replan', async (service, ctx) =>
    service.handleSickDayReplan(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.timeZone,
      ctx.userId,
    ),
  );
  map.set('import_services_from_menu', async (service, ctx) =>
    service.handleImportServicesFromMenu(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.userId,
    ),
  );
  map.set('update_service_prices', async (service, ctx) =>
    service.handleUpdateServicePrices(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.services,
      ctx.userId,
    ),
  );
  map.set('staff_service_matrix', async (service, ctx) =>
    service.handleStaffServiceMatrix(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.services,
      ctx.userId,
    ),
  );
  map.set('check_schedule_compliance', async (service, ctx) =>
    service.handleCheckScheduleCompliance(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
    ),
  );
  map.set('revenue_forecast', async (service, ctx) =>
    service.handleRevenueForecast(ctx.businessId, ctx.prompt, ctx.params),
  );
  map.set('create_employee', async (service, ctx) =>
    service.handleCreateEmployee(
      ctx.businessId,
      ctx.params,
      ctx.prompt,
      ctx.userId,
    ),
  );
  map.set('update_employee', async (service, ctx) =>
    service.handleUpdateEmployee(
      ctx.businessId,
      ctx.params,
      ctx.prompt,
      ctx.userId,
    ),
  );
  map.set('update_team_member_role', async (service, ctx) =>
    service.handleUpdateTeamMemberRole(ctx.businessId, ctx.params, ctx.userId),
  );
  map.set('invite_staff_member', async (service, ctx) =>
    service.handleInviteStaffMember(
      ctx.businessId,
      ctx.params,
      ctx.prompt,
      ctx.userId,
    ),
  );
  map.set('deactivate_employee', async (service, ctx) =>
    service.handleDeactivateEmployee(
      ctx.businessId,
      ctx.params,
      ctx.prompt,
      ctx.userId,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiOperationsService (ai-cmd-ext-0.5). */
export const OPERATIONS_DISPATCH_MAP = buildOperationsDispatchMap();
