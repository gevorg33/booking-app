import type { CommandResult } from './command-completion.types.js';
import type { AiSchedulingService } from './ai-scheduling.service.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';

export type SchedulingDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  prompt: string;
  employees: Employee[];
  services: Service[];
  userId?: string;
};

export type SchedulingDispatchHandler = (
  service: AiSchedulingService,
  ctx: SchedulingDispatchContext,
) => Promise<CommandResult>;

export function buildSchedulingDispatchMap(): ReadonlyMap<
  string,
  SchedulingDispatchHandler
> {
  const map = new Map<string, SchedulingDispatchHandler>();

  map.set('swap_schedules', async (service, ctx) =>
    service.handleSwapSchedules(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.userId,
    ),
  );
  map.set('rebalance_capacity', async (service, ctx) =>
    service.handleRebalanceCapacity(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.services,
      ctx.userId,
    ),
  );
  map.set('holiday_mode', async (service, ctx) =>
    service.handleHolidayMode(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.userId,
    ),
  );
  map.set('onboard_provider_schedule', async (service, ctx) =>
    service.handleOnboardProviderSchedule(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.services,
      ctx.userId,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiSchedulingService (ai-cmd-ext-0.5). */
export const SCHEDULING_DISPATCH_MAP = buildSchedulingDispatchMap();
